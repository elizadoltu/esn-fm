import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get your notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread_only
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
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
});

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Returns { count: number }"
 */
router.get('/unread-count', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE AND type != 'moderation_alert'`,
      [req.user!.id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.patch('/read-all', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.patch('/:id/read', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2`,
      [req.params.id, req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(`DELETE FROM notifications WHERE id = $1 AND recipient_id = $2`, [
      req.params.id,
      req.user!.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
