import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/feed:
 *   get:
 *     summary: Home feed — answered Q&As from users you follow
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated home feed items
 */
router.get('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT
         q.id            AS question_id,
         q.content       AS question,
         q.sender_name,
         q.created_at    AS asked_at,
         a.id            AS answer_id,
         a.content       AS answer,
         a.created_at    AS answered_at,
         COUNT(DISTINCT l.user_id)::int AS likes,
         BOOL_OR(l.user_id = $1)       AS liked_by_me,
         COUNT(DISTINCT c.id)::int     AS comment_count,
         u.username      AS author_username,
         u.display_name  AS author_display_name,
         u.avatar_url    AS author_avatar_url
       FROM follows f
       JOIN answers a ON a.author_id = f.following_id
       JOIN questions q ON q.id = a.question_id
       JOIN users u ON u.id = a.author_id
       LEFT JOIN likes l ON l.answer_id = a.id
       LEFT JOIN comments c ON c.answer_id = a.id AND c.is_deleted = FALSE
       WHERE f.follower_id = $1
         AND q.show_in_feed = TRUE
       GROUP BY q.id, q.content, q.sender_name, q.created_at,
                a.id, a.content, a.created_at,
                u.username, u.display_name, u.avatar_url
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ items: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
});

export default router;
