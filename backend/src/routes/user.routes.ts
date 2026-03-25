import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  getMe,
  listUsers,
  getSuggestions,
  getProfile,
  updateProfile,
  deleteMe,
} from '../api/user.api.js';

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
router.get('/me', verifyJWT, getMe);

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
router.get('/', verifyJWT, listUsers);

router.get('/suggestions', verifyJWT, getSuggestions);

router.get('/:username', getProfile);

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
router.patch('/me', verifyJWT, updateProfile);

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
router.delete('/me', verifyJWT, deleteMe);

export default router;
