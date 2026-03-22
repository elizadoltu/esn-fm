import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { reportSchema } from '../validators/report.validator.js';

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
router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = reportSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO reports (reporter_id, content_type, content_id, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [req.user!.id, data.content_type, data.content_id, data.reason]
    );

    res.status(201).json({ reported: true, id: result.rows[0]?.id });
  } catch (err) {
    next(err);
  }
});

export default router;
