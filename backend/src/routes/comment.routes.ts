import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { postCommentSchema } from '../validators/comment.validator.js';
import { createNotification } from '../db/notifications.js';

const router = Router();

/**
 * @openapi
 * /api/comments:
 *   post:
 *     summary: Post a comment on an answer
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answer_id, content]
 *             properties:
 *               answer_id: { type: string, format: uuid }
 *               content: { type: string, maxLength: 200 }
 *               parent_comment_id: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Comment posted
 *       404:
 *         description: Answer not found
 */
router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = postCommentSchema.parse(req.body);

    const answerResult = await pool.query(
      `SELECT a.id, a.author_id, q.recipient_id
       FROM answers a JOIN questions q ON q.id = a.question_id
       WHERE a.id = $1`,
      [data.answer_id]
    );

    if (!answerResult.rows[0]) {
      res.status(404).json({ error: 'Answer not found' });
      return;
    }

    const answer = answerResult.rows[0];

    if (data.parent_comment_id) {
      const parentResult = await pool.query(
        `SELECT id, author_id FROM comments WHERE id = $1 AND answer_id = $2 AND is_deleted = FALSE`,
        [data.parent_comment_id, data.answer_id]
      );
      if (!parentResult.rows[0]) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO comments (answer_id, author_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, answer_id, author_id, parent_comment_id, content, created_at`,
      [data.answer_id, req.user!.id, data.parent_comment_id ?? null, data.content]
    );

    const comment = result.rows[0];

    // Notify answer author (if different from commenter)
    if (answer.author_id !== req.user!.id) {
      await createNotification(answer.author_id, 'new_comment', comment.id, req.user!.id);
    }

    // If it's a reply, also notify parent comment author
    if (data.parent_comment_id) {
      const parentAuthor = await pool.query(`SELECT author_id FROM comments WHERE id = $1`, [
        data.parent_comment_id,
      ]);
      if (parentAuthor.rows[0] && parentAuthor.rows[0].author_id !== req.user!.id) {
        await createNotification(
          parentAuthor.rows[0].author_id,
          'new_reply',
          comment.id,
          req.user!.id
        );
      }
    }

    // Attach author info to response
    const userResult = await pool.query(
      `SELECT username, display_name, avatar_url FROM users WHERE id = $1`,
      [req.user!.id]
    );

    res.status(201).json({ ...comment, author: userResult.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/comments/{answerId}:
 *   get:
 *     summary: Get comments for an answer
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of comments with replies
 */
router.get('/:answerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id, c.answer_id, c.parent_comment_id, c.content, c.is_deleted, c.created_at,
         u.id AS author_id, u.username AS author_username,
         u.display_name AS author_display_name, u.avatar_url AS author_avatar_url
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.answer_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.answerId]
    );

    // Build nested structure: top-level comments with replies array
    const topLevel: Record<string, unknown>[] = [];
    const byId: Record<string, Record<string, unknown>> = {};

    for (const row of result.rows) {
      const comment = {
        id: row.id,
        answer_id: row.answer_id,
        parent_comment_id: row.parent_comment_id,
        content: row.is_deleted ? '[deleted]' : row.content,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        author: {
          id: row.author_id,
          username: row.is_deleted ? null : row.author_username,
          display_name: row.is_deleted ? null : row.author_display_name,
          avatar_url: row.is_deleted ? null : row.author_avatar_url,
        },
        replies: [] as Record<string, unknown>[],
      };
      byId[row.id] = comment;
      if (!row.parent_comment_id) {
        topLevel.push(comment);
      }
    }

    // Attach replies to parents
    for (const row of result.rows) {
      if (row.parent_comment_id && byId[row.parent_comment_id]) {
        (byId[row.parent_comment_id].replies as Record<string, unknown>[]).push(byId[row.id]);
      }
    }

    res.json(topLevel);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete your own comment (soft delete)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found or not yours
 */
router.delete('/:id', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Allow comment author or the answer's owner to delete
    const result = await pool.query(
      `UPDATE comments SET is_deleted = TRUE
       WHERE id = $1
         AND (author_id = $2 OR answer_id IN (
           SELECT id FROM answers WHERE author_id = $2
         ))
         AND is_deleted = FALSE
       RETURNING id`,
      [req.params.id, req.user!.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Comment not found or not yours' });
      return;
    }

    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
