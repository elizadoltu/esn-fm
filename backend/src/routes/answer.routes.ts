import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  postAnswer,
  getArchivedAnswers,
  archiveAnswer,
  getAnswersByUsername,
  deleteAnswer,
  toggleLike,
} from '../api/answer.api.js';

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
router.post('/', verifyJWT, postAnswer);

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
router.get('/me/archived', verifyJWT, getArchivedAnswers);

router.patch('/:id/archive', verifyJWT, archiveAnswer);

router.get('/:username', getAnswersByUsername);

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
router.delete('/:id', verifyJWT, deleteAnswer);

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
router.post('/:id/like', verifyJWT, toggleLike);

export default router;
