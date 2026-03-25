import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { sendQuestion, getInbox, archiveQuestion, deleteQuestion } from '../api/question.api.js';

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
router.post('/', sendQuestion);

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
router.get('/inbox', verifyJWT, getInbox);

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
router.patch('/:id/archive', verifyJWT, archiveQuestion);

router.delete('/:id', verifyJWT, deleteQuestion);

export default router;
