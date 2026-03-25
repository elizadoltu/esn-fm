import { Router } from 'express';
import { search, getTrending } from '../api/search.api.js';

const router = Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Search users and answered Q&As
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [users, answers, all], default: all }
 *     responses:
 *       200:
 *         description: Search results with users and/or answers
 */
router.get('/', search);

/**
 * @openapi
 * /api/search/trending:
 *   get:
 *     summary: Trending answered Q&As (most liked in last 24 hours)
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Trending feed items
 */
router.get('/trending', getTrending);

export default router;
