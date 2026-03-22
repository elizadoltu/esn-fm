import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/follows/{username}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Now following
 *       404:
 *         description: User not found
 */
router.post('/:username', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await pool.query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user!.id, target.rows[0].id]
    );

    res.json({ following: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/follows/{username}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unfollowed
 *       404:
 *         description: User not found
 */
router.delete('/:username', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, [
      req.user!.id,
      target.rows[0].id,
    ]);

    res.json({ following: false });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/follows/{username}/followers:
 *   get:
 *     summary: List followers of a user
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Followers list
 *       404:
 *         description: User not found
 */
router.get('/:username/followers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [target.rows[0].id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/follows/{username}/following:
 *   get:
 *     summary: List users that a user is following
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Following list
 *       404:
 *         description: User not found
 */
router.get('/:username/following', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [target.rows[0].id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
