import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { sendQuestionSchema } from '../validators/question.validator.js';
import { createNotification } from '../db/notifications.js';

export async function sendQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const isAnonymous = data.is_anonymous ?? !senderId;

    const result = await pool.query(
      `INSERT INTO questions (recipient_id, sender_id, sender_name, content, show_in_feed, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, recipient_id, sender_id, sender_name, content, is_answered, show_in_feed, is_anonymous, created_at`,
      [recipient.id, senderId, data.sender_name ?? null, data.content, showInFeed, isAnonymous]
    );

    // Only reveal the actor when the sender explicitly chose not to be anonymous
    await createNotification(recipient.id, 'new_question', result.rows[0].id, isAnonymous ? null : senderId);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
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
}

export async function archiveQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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
}

export async function deleteQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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
}
