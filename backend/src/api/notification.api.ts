import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const unreadOnly = req.query.unread_only === 'true';
    const result = await pool.query(
      `SELECT
         n.id, n.type, n.reference_id, n.is_read, n.created_at,
         u.id AS actor_id, u.username AS actor_username,
         u.display_name AS actor_display_name, u.avatar_url AS actor_avatar_url
       FROM notifications n
       LEFT JOIN users u ON u.id = n.actor_id
       WHERE n.recipient_id = $1
         AND n.type != 'moderation_alert'
         ${unreadOnly ? 'AND n.is_read = FALSE' : ''}
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user!.id]
    );

    const notifications = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      reference_id: row.reference_id,
      is_read: row.is_read,
      created_at: row.created_at,
      actor: row.actor_id
        ? {
            id: row.actor_id,
            username: row.actor_username,
            display_name: row.actor_display_name,
            avatar_url: row.actor_avatar_url,
          }
        : null,
    }));

    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE AND type != 'moderation_alert'`,
      [req.user!.id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function markOneRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2`,
      [req.params.id, req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await pool.query(`DELETE FROM notifications WHERE id = $1 AND recipient_id = $2`, [
      req.params.id,
      req.user!.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
