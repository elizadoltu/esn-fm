import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  deleteNotification,
} from '../api/notification.api.js';

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
router.get('/', verifyJWT, getNotifications);

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
router.get('/unread-count', verifyJWT, getUnreadCount);

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
router.patch('/read-all', verifyJWT, markAllRead);

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
router.patch('/:id/read', verifyJWT, markOneRead);

router.delete('/:id', verifyJWT, deleteNotification);

export default router;
