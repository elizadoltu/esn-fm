import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get your own full profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Own profile with private fields
 */
router.get('/me', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.email, u.username, u.display_name, u.bio, u.avatar_url,
         u.cover_image_url, u.location, u.website,
         u.allow_anonymous_questions, u.is_private, u.role, u.created_at,
         COUNT(DISTINCT f1.follower_id) FILTER (WHERE f1.status = 'accepted')::int AS follower_count,
         COUNT(DISTINCT f2.following_id) FILTER (WHERE f2.status = 'accepted')::int AS following_count,
         COUNT(DISTINCT a.id)::int            AS answer_count
       FROM users u
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id  = u.id
       LEFT JOIN answers a  ON a.author_id     = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user!.id]
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
 *         description: Public profile with follower/following/answer counts and is_following
 *       404:
 *         description: User not found
 */
router.get('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT id, username, display_name, bio, avatar_url, is_private,
              (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id AND status = 'accepted') AS follower_count
       FROM users u
       WHERE id != $1
       ORDER BY follower_count DESC, created_at ASC
       LIMIT 100`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/suggestions', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT
         u.id, u.username, u.display_name, u.avatar_url, u.is_private,
         COUNT(DISTINCT my_f.following_id)::int AS mutual_followers
       FROM users u
       JOIN follows their_f ON their_f.follower_id = u.id AND their_f.status = 'accepted'
       JOIN follows my_f ON my_f.follower_id = $1
         AND my_f.following_id = their_f.following_id
         AND my_f.status = 'accepted'
       WHERE u.id != $1
         AND NOT EXISTS (
           SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id
         )
       GROUP BY u.id, u.username, u.display_name, u.avatar_url, u.is_private
       ORDER BY mutual_followers DESC
       LIMIT 10`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Optionally identify viewer from JWT for is_following
    let viewerId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string };
        viewerId = payload.id;
      } catch {
        // anonymous
      }
    }

    const result = await pool.query(
      `SELECT
         u.id, u.username, u.display_name, u.bio, u.avatar_url,
         u.cover_image_url, u.location, u.website,
         u.allow_anonymous_questions, u.is_private, u.role, u.created_at,
         COUNT(DISTINCT f1.follower_id) FILTER (WHERE f1.status = 'accepted')::int AS follower_count,
         COUNT(DISTINCT f2.following_id) FILTER (WHERE f2.status = 'accepted')::int AS following_count,
         COUNT(DISTINCT a.id)::int            AS answer_count,
         COALESCE(
           (SELECT status FROM follows WHERE following_id = u.id AND follower_id = $2 LIMIT 1),
           'none'
         ) AS follow_status
       FROM users u
       LEFT JOIN follows f1 ON f1.following_id = u.id
       LEFT JOIN follows f2 ON f2.follower_id  = u.id
       LEFT JOIN answers a  ON a.author_id     = u.id
       WHERE u.username = $1
       GROUP BY u.id`,
      [req.params.username, viewerId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      ...row,
      is_following: row.follow_status === 'accepted',
      is_pending: row.follow_status === 'pending',
    });
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
 *               cover_image_url: { type: string }
 *               location: { type: string }
 *               website: { type: string }
 *               allow_anonymous_questions: { type: boolean }
 *               is_private: { type: boolean }
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
       RETURNING id, username, display_name, bio, avatar_url, cover_image_url,
                 location, website, allow_anonymous_questions, is_private, role`,
      [req.user!.id, ...values]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/users/me:
 *   delete:
 *     summary: Deactivate (soft-delete) your account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete('/me', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      `UPDATE users SET
         is_deleted = TRUE,
         deleted_at = NOW(),
         display_name = 'Deleted User',
         bio = '',
         avatar_url = NULL,
         cover_image_url = NULL,
         location = NULL,
         website = NULL,
         email = 'deleted_' || id || '@deleted.invalid'
       WHERE id = $1`,
      [req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
