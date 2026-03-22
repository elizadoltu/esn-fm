import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { postAnswerSchema } from '../validators/answer.validator.js';
import { createNotification } from '../db/notifications.js';

const router = Router();

/**
 * @openapi
 * /api/answers:
 *   post:
 *     summary: Answer a question (makes it public)
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question_id, content]
 *             properties:
 *               question_id: { type: string, format: uuid }
 *               content: { type: string, maxLength: 500 }
 *     responses:
 *       201:
 *         description: Answer posted
 *       403:
 *         description: Not your question
 *       404:
 *         description: Question not found
 */
router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = postAnswerSchema.parse(req.body);

    const qResult = await pool.query(
      `SELECT recipient_id, sender_id FROM questions WHERE id = $1 AND is_answered = FALSE`,
      [data.question_id]
    );

    const question = qResult.rows[0];
    if (!question) {
      res.status(404).json({ error: 'Question not found or already answered' });
      return;
    }

    if (question.recipient_id !== req.user!.id) {
      res.status(403).json({ error: 'Not your question' });
      return;
    }

    await pool.query('BEGIN');
    const aResult = await pool.query(
      `INSERT INTO answers (question_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, question_id, author_id, content, created_at`,
      [data.question_id, req.user!.id, data.content]
    );
    await pool.query(`UPDATE questions SET is_answered = TRUE WHERE id = $1`, [data.question_id]);
    await pool.query('COMMIT');

    // Notify the question sender (if they exist — anonymous senders have no account)
    if (question.sender_id) {
      await createNotification(question.sender_id, 'new_answer', aResult.rows[0].id, req.user!.id);
    }

    res.status(201).json(aResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    next(err);
  }
});

/**
 * @openapi
 * /api/answers/{username}:
 *   get:
 *     summary: Public Q&A feed for a user (paginated)
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated feed items
 *       404:
 *         description: User not found
 */
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const userResult = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!userResult.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    // Optionally get the viewer's id for liked_by_me
    let viewerId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string };
        viewerId = payload.id;
      } catch {
        // anonymous viewer
      }
    }

    const result = await pool.query(
      `SELECT
         q.id            AS question_id,
         q.content       AS question,
         q.sender_name,
         q.created_at    AS asked_at,
         a.id            AS answer_id,
         a.content       AS answer,
         a.created_at    AS answered_at,
         COUNT(DISTINCT l.user_id)::int   AS likes,
         BOOL_OR(l.user_id = $3)          AS liked_by_me,
         COUNT(DISTINCT c.id)::int        AS comment_count
       FROM questions q
       JOIN answers a ON a.question_id = q.id
       LEFT JOIN likes l ON l.answer_id = a.id
       LEFT JOIN comments c ON c.answer_id = a.id AND c.is_deleted = FALSE
       WHERE q.recipient_id = $1
       GROUP BY q.id, q.content, q.sender_name, q.created_at,
                a.id, a.content, a.created_at
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $4`,
      [userId, limit, viewerId, offset]
    );

    res.json({ items: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/answers/{id}:
 *   delete:
 *     summary: Delete your own answer
 *     tags: [Answers]
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
    const result = await pool.query(
      `DELETE FROM answers WHERE id = $1 AND author_id = $2 RETURNING id`,
      [req.params.id, req.user!.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Answer not found or not yours' });
      return;
    }

    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/answers/{id}/like:
 *   post:
 *     summary: Toggle like on an answer
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: "Returns { liked: boolean }"
 */
router.post('/:id/like', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await pool.query(`SELECT 1 FROM likes WHERE user_id = $1 AND answer_id = $2`, [
      req.user!.id,
      req.params.id,
    ]);

    if (existing.rows[0]) {
      await pool.query(`DELETE FROM likes WHERE user_id = $1 AND answer_id = $2`, [
        req.user!.id,
        req.params.id,
      ]);
      res.json({ liked: false });
    } else {
      await pool.query(`INSERT INTO likes (user_id, answer_id) VALUES ($1, $2)`, [
        req.user!.id,
        req.params.id,
      ]);

      // Notify answer author
      const answerResult = await pool.query(`SELECT author_id FROM answers WHERE id = $1`, [req.params.id]);
      if (answerResult.rows[0]) {
        await createNotification(answerResult.rows[0].author_id, 'new_like', req.params.id, req.user!.id);
      }

      res.json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
