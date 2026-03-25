import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  getDmUnreadCount,
  markConversationRead,
  sendDm,
  getConversations,
  getConversationWithUser,
} from '../api/dm.api.js';

const router = Router();

router.get('/unread-count', verifyJWT, getDmUnreadCount);

router.patch('/:username/read', verifyJWT, markConversationRead);

/**
 * @openapi
 * /api/dm:
 *   post:
 *     summary: Send a direct message
 *     tags: [DirectMessages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient_username, content]
 *             properties:
 *               recipient_username: { type: string }
 *               content: { type: string, maxLength: 500 }
 *     responses:
 *       201:
 *         description: Message sent
 *       404:
 *         description: Recipient not found
 */
router.post('/', verifyJWT, sendDm);

/**
 * @openapi
 * /api/dm:
 *   get:
 *     summary: List conversations (latest message per thread)
 *     tags: [DirectMessages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation list
 */
router.get('/', verifyJWT, getConversations);

/**
 * @openapi
 * /api/dm/{username}:
 *   get:
 *     summary: Get conversation with a specific user
 *     tags: [DirectMessages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated messages in conversation
 */
router.get('/:username', verifyJWT, getConversationWithUser);

export default router;
