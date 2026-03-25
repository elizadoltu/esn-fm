import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';

const router = Router();

// 15-minute in-memory cache for trending — avoids recomputing on every page load
const TRENDING_TTL_MS = 15 * 60 * 1000;
let trendingCache: { rows: unknown[]; fetchedAt: number } | null = null;

async function fetchTrending(): Promise<unknown[]> {
  const result = await pool.query(
    `SELECT
       q.id AS question_id, q.content AS question,
       a.id AS answer_id, a.content AS answer,
       a.image_url AS answer_image_url, a.created_at AS answered_at,
       COUNT(DISTINCT l.user_id)::int AS likes,
       COUNT(DISTINCT c.id)::int      AS comment_count,
       u.username AS author_username, u.display_name AS author_display_name,
       u.avatar_url AS author_avatar_url
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     JOIN users u ON u.id = a.author_id
     LEFT JOIN likes l ON l.answer_id = a.id
     LEFT JOIN comments c ON c.answer_id = a.id AND c.is_deleted = FALSE
     WHERE q.show_in_feed = TRUE
       AND u.is_private = FALSE
       AND a.is_archived = FALSE
     GROUP BY q.id, q.content, a.id, a.content, a.image_url, a.created_at,
              u.username, u.display_name, u.avatar_url
     ORDER BY (
       COUNT(DISTINCT l.user_id) * 2 +
       COUNT(DISTINCT c.id) * 3 -
       EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 3600.0 * 0.5
     ) DESC, a.created_at DESC
     LIMIT 20`
  );
  trendingCache = { rows: result.rows, fetchedAt: Date.now() };
  return result.rows;
}

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Search users and answered Q&As
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [users, answers, all], default: all }
 *     responses:
 *       200:
 *         description: Search results with users and/or answers
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q || q.length < 1) {
      res.json({ users: [], answers: [] });
      return;
    }

    const type = (req.query.type as string) || 'all';
    const term = `%${q}%`;

    const users =
      type === 'answers'
        ? []
        : (
            await pool.query(
              `SELECT id, username, display_name, avatar_url, bio, is_private
               FROM users
               WHERE (username ILIKE $1 OR display_name ILIKE $1)
               ORDER BY
                 CASE WHEN username ILIKE $2 THEN 0 ELSE 1 END,
                 username
               LIMIT 10`,
              [term, `${q}%`]
            )
          ).rows;

    const answers =
      type === 'users'
        ? []
        : (
            await pool.query(
              `SELECT
                 q.id AS question_id, q.content AS question,
                 a.id AS answer_id, a.content AS answer, a.created_at AS answered_at,
                 COUNT(l.user_id)::int AS likes,
                 u.username AS author_username, u.display_name AS author_display_name,
                 u.avatar_url AS author_avatar_url
               FROM questions q
               JOIN answers a ON a.question_id = q.id
               JOIN users u ON u.id = a.author_id
               LEFT JOIN likes l ON l.answer_id = a.id
               WHERE (q.content ILIKE $1 OR a.content ILIKE $1)
                 AND q.show_in_feed = TRUE
                 AND u.is_private = FALSE
                 AND a.is_archived = FALSE
               GROUP BY q.id, q.content, a.id, a.content, a.created_at,
                        u.username, u.display_name, u.avatar_url
               ORDER BY a.created_at DESC
               LIMIT 10`,
              [term]
            )
          ).rows;

    res.json({ users, answers });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/search/trending:
 *   get:
 *     summary: Trending answered Q&As (most liked in last 24 hours)
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Trending feed items
 */
router.get('/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = Date.now();
    const rows =
      trendingCache && now - trendingCache.fetchedAt < TRENDING_TTL_MS
        ? trendingCache.rows
        : await fetchTrending();

    // Resolve optional viewer so liked_by_me is accurate
    let viewerId: string | null = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as { sub: string };
        viewerId = payload.sub;
      } catch {
        // Invalid/expired token — treat as anonymous
      }
    }

    const typedRows = rows as Record<string, unknown>[];
    if (!viewerId || typedRows.length === 0) {
      res.json(typedRows.map((r) => ({ ...r, liked_by_me: false })));
      return;
    }

    const answerIds = typedRows.map((r) => r.answer_id);
    const liked = await pool.query(
      `SELECT answer_id FROM likes WHERE user_id = $1 AND answer_id = ANY($2::uuid[])`,
      [viewerId, answerIds]
    );
    const likedSet = new Set(liked.rows.map((r: { answer_id: string }) => r.answer_id));

    res.json(
      typedRows.map((r) => ({
        ...r,
        liked_by_me: likedSet.has(r.answer_id as string),
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
