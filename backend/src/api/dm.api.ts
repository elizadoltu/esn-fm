import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { sendDmSchema } from '../validators/dm.validator.js';
import { sendSSE } from '../lib/sse.js';
import { sendPushToUser } from '../lib/webpush.js';

export async function getDmUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM direct_messages WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    next(err);
  }
}

export async function markConversationRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const other = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!other.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await pool.query(
      `UPDATE direct_messages SET is_read = TRUE WHERE recipient_id = $1 AND sender_id = $2 AND is_read = FALSE`,
      [req.user!.id, other.rows[0].id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function sendDm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = sendDmSchema.parse(req.body);

    const recipientResult = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      data.recipient_username,
    ]);
    if (!recipientResult.rows[0]) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    const recipientId = recipientResult.rows[0].id;
    if (recipientId === req.user!.id) {
      res.status(400).json({ error: 'Cannot message yourself' });
      return;
    }

    // Check if blocked
    const blocked = await pool.query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [req.user!.id, recipientId]
    );
    if (blocked.rows[0]) {
      res.status(403).json({ error: 'Cannot send message' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO direct_messages (sender_id, recipient_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
      [req.user!.id, recipientId, data.content]
    );

    sendSSE(recipientId, 'dm', { from: req.user!.username });
    sendPushToUser(recipientId, {
      title: 'ESN FM',
      body: `New message from ${req.user!.username}`,
      url: `/messages/${req.user!.username}`,
    }).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (
         LEAST(dm.sender_id, dm.recipient_id),
         GREATEST(dm.sender_id, dm.recipient_id)
       )
         dm.id, dm.sender_id, dm.recipient_id, dm.content, dm.is_read, dm.created_at,
         other.id AS other_user_id, other.username AS other_username,
         other.display_name AS other_display_name, other.avatar_url AS other_avatar_url,
         (SELECT COUNT(*)::int FROM direct_messages unread
          WHERE unread.recipient_id = $1 AND unread.is_read = FALSE
            AND (
              (unread.sender_id = dm.sender_id AND unread.recipient_id = dm.recipient_id)
              OR (unread.sender_id = dm.recipient_id AND unread.recipient_id = dm.sender_id)
            )
         ) AS unread_count
       FROM direct_messages dm
       JOIN users other ON other.id = CASE
         WHEN dm.sender_id = $1 THEN dm.recipient_id
         ELSE dm.sender_id
       END
       WHERE dm.sender_id = $1 OR dm.recipient_id = $1
       ORDER BY
         LEAST(dm.sender_id, dm.recipient_id),
         GREATEST(dm.sender_id, dm.recipient_id),
         dm.created_at DESC`,
      [req.user!.id]
    );

    const conversations = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      is_read: row.is_read,
      created_at: row.created_at,
      is_mine: row.sender_id === req.user!.id,
      unread_count: row.unread_count,
      other_user: {
        id: row.other_user_id,
        username: row.other_username,
        display_name: row.other_display_name,
        avatar_url: row.other_avatar_url,
      },
    }));

    // Sort by latest message
    conversations.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

export async function getConversationWithUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const otherResult = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!otherResult.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const otherId = otherResult.rows[0].id;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;

    const messages = await pool.query(
      `SELECT id, sender_id, recipient_id, content, is_read, created_at
       FROM direct_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user!.id, otherId, limit, offset]
    );

    // Mark received messages as read
    await pool.query(
      `UPDATE direct_messages SET is_read = TRUE
       WHERE sender_id = $2 AND recipient_id = $1 AND is_read = FALSE`,
      [req.user!.id, otherId]
    );

    res.json({ messages: messages.rows.reverse(), limit, offset });
  } catch (err) {
    next(err);
  }
}
