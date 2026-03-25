import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { blockUser, unblockUser, getBlockedUsers } from '../api/block.api.js';

const router = Router();

/**
 * @openapi
 * /api/blocks/{username}:
 *   post:
 *     summary: Block a user
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User blocked
 */
router.post('/:username', verifyJWT, blockUser);

/**
 * @openapi
 * /api/blocks/{username}:
 *   delete:
 *     summary: Unblock a user
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User unblocked
 */
router.delete('/:username', verifyJWT, unblockUser);

/**
 * @openapi
 * /api/blocks:
 *   get:
 *     summary: List your blocked users
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked users
 */
router.get('/', verifyJWT, getBlockedUsers);

export default router;
