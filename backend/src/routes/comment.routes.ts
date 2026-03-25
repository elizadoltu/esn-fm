import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  postComment,
  getComments,
  toggleCommentLike,
  deleteComment,
} from '../api/comment.api.js';

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
router.post('/', verifyJWT, postComment);

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
router.get('/:answerId', getComments);

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
router.post('/:id/like', verifyJWT, toggleCommentLike);

router.delete('/:id', verifyJWT, deleteComment);

export default router;
