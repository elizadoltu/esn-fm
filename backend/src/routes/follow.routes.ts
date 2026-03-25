import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  getFollowRequests,
  approveFollowRequest,
  declineFollowRequest,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../api/follow.api.js';

const router = Router();

/**
 * @openapi
 * /api/follows/requests:
 *   get:
 *     summary: List pending follow requests for the current user
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requesters
 */
router.get('/requests', verifyJWT, getFollowRequests);

/**
 * @openapi
 * /api/follows/requests/{username}/approve:
 *   patch:
 *     summary: Approve a pending follow request from a user
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/requests/:username/approve', verifyJWT, approveFollowRequest);

/**
 * @openapi
 * /api/follows/requests/{username}/decline:
 *   delete:
 *     summary: Decline a pending follow request from a user
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/requests/:username/decline', verifyJWT, declineFollowRequest);

/**
 * @openapi
 * /api/follows/{username}:
 *   post:
 *     summary: Follow a user (pending if private)
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:username', verifyJWT, followUser);

/**
 * @openapi
 * /api/follows/{username}:
 *   delete:
 *     summary: Unfollow or cancel a follow request
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:username', verifyJWT, unfollowUser);

/**
 * @openapi
 * /api/follows/{username}/followers:
 *   get:
 *     summary: List accepted followers of a user
 *     tags: [Follows]
 */
router.get('/:username/followers', getFollowers);

/**
 * @openapi
 * /api/follows/{username}/following:
 *   get:
 *     summary: List users that a user is following (accepted only)
 *     tags: [Follows]
 */
router.get('/:username/following', getFollowing);

export default router;
