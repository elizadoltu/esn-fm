import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getMainFeed, getFollowingFeed } from '../api/feed.api.js';

const router = Router();

/**
 * @openapi
 * /api/feed:
 *   get:
 *     summary: Home feed — answered Q&As from users you follow
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated home feed items
 */
router.get('/main', verifyJWT, getMainFeed);

router.get('/', verifyJWT, getFollowingFeed);

export default router;
