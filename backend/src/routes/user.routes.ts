import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

/**
 * @openapi
 * /api/users/{username}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public profile
 *       404:
 *         description: User not found
 */
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, bio, avatar_url, allow_anonymous_questions, created_at
       FROM users WHERE username = $1`,
      [req.params.username],
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Update own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name: { type: string }
 *               bio: { type: string }
 *               avatar_url: { type: string }
 *               allow_anonymous_questions: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated profile
 *       400:
 *         description: No fields to update
 */
router.patch('/me', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const fields = Object.entries(data).filter(([, v]) => v !== undefined);

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const setClause = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) => v);

    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1
       RETURNING id, username, display_name, bio, avatar_url, allow_anonymous_questions`,
      [req.user!.id, ...values],
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
