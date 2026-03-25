import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { submitReport } from '../api/report.api.js';

const router = Router();

/**
 * @openapi
 * /api/reports:
 *   post:
 *     summary: Submit a report on content
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content_type, content_id, reason]
 *             properties:
 *               content_type: { type: string, enum: [question, answer, comment, user] }
 *               content_id: { type: string, format: uuid }
 *               reason: { type: string, enum: [spam, harassment, hate_speech, inappropriate, other] }
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post('/', verifyJWT, submitReport);

export default router;
