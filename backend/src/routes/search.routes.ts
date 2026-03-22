import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

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
    const result = await pool.query(
      `SELECT
         q.id AS question_id, q.content AS question,
         a.id AS answer_id, a.content AS answer, a.created_at AS answered_at,
         COUNT(l.user_id)::int AS likes,
         u.username AS author_username, u.display_name AS author_display_name,
         u.avatar_url AS author_avatar_url
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       JOIN users u ON u.id = a.author_id
       LEFT JOIN likes l ON l.answer_id = a.id
       WHERE q.show_in_feed = TRUE
         AND u.is_private = FALSE
         AND a.created_at > NOW() - INTERVAL '7 days'
       GROUP BY q.id, q.content, a.id, a.content, a.created_at,
                u.username, u.display_name, u.avatar_url
       ORDER BY likes DESC, a.created_at DESC
       LIMIT 20`
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
