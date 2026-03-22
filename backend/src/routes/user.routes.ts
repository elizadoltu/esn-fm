import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Returns a list of users.
 */
router.get('/', (req: Request, res: Response) => {
  res.json([{ id: 1, name: 'Raul' }]);
});

export default router;
