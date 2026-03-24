import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { sendQuestionSchema } from '../validators/question.validator.js';
import { createNotification } from '../db/notifications.js';

const router = Router();

/**
 * @openapi
 * /api/questions:
 *   post:
 *     summary: Send a question to a user
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient_username, content]
 *             properties:
 *               recipient_username: { type: string }
 *               content: { type: string, maxLength: 300 }
 *               sender_name: { type: string, maxLength: 60 }
 *               show_in_feed: { type: boolean }
 *     responses:
 *       201:
 *         description: Question sent
 *       403:
 *         description: Recipient does not accept anonymous questions
 *       404:
 *         description: Recipient not found
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sendQuestionSchema.parse(req.body);

    // Optionally identify sender from JWT if provided
    let senderId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string };
        senderId = payload.id;
      } catch {
        // unauthenticated — anonymous question
      }
    }

    const recipientResult = await pool.query(
      `SELECT id, allow_anonymous_questions FROM users WHERE username = $1`,
      [data.recipient_username]
    );

    const recipient = recipientResult.rows[0];
    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    // Anonymous = no sender_id attached
    if (!senderId && !recipient.allow_anonymous_questions) {
      res.status(403).json({ error: 'This user does not accept anonymous questions' });
      return;
    }

    // Anonymous questions always appear in the feed; logged-in senders can opt out
    const showInFeed = data.show_in_feed ?? true;

    const result = await pool.query(
      `INSERT INTO questions (recipient_id, sender_id, sender_name, content, show_in_feed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, recipient_id, sender_id, sender_name, content, is_answered, show_in_feed, created_at`,
      [recipient.id, senderId, data.sender_name ?? null, data.content, showInFeed]
    );

    // Never expose who asked — always use null actor so the sender stays anonymous
    await createNotification(recipient.id, 'new_question', result.rows[0].id, null);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/questions/inbox:
 *   get:
 *     summary: Get your unanswered questions
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unanswered questions
 *       401:
 *         description: Unauthorized
 */
router.get('/inbox', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, sender_id, sender_name, content, is_answered, show_in_feed, created_at
       FROM questions
       WHERE recipient_id = $1 AND is_answered = FALSE AND is_archived = FALSE
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete an unanswered question from inbox
 *     tags: [Questions]
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
router.patch('/:id/archive', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `UPDATE questions
       SET is_archived = NOT is_archived,
           archived_at = CASE WHEN is_archived = FALSE THEN NOW() ELSE NULL END
       WHERE id = $1 AND recipient_id = $2
       RETURNING id, is_archived, archived_at`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Question not found or not yours' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `DELETE FROM questions
       WHERE id = $1 AND recipient_id = $2
       RETURNING id`,
      [req.params.id, req.user!.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Question not found or not yours' });
      return;
    }

    res.json({ deleted: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
