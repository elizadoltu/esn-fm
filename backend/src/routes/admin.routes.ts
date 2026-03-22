import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { verifyAdmin, verifyAdminOnly } from '../middleware/adminAuth.js';

const router = Router();

router.use(verifyJWT);
router.use(verifyAdmin);

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     summary: Platform metrics overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats object
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, questions, answers, reports] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')::int AS today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS this_week
        FROM users`),
      pool.query(`SELECT COUNT(*)::int AS total FROM questions`),
      pool.query(`SELECT COUNT(*)::int AS total FROM answers`),
      pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*)::int AS total FROM reports`),
    ]);

    res.json({
      users: users.rows[0],
      questions: questions.rows[0].total,
      answers: answers.rows[0].total,
      reports: reports.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: User directory with search and filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, moderator, admin] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated user directory
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string | undefined;
    const role = req.query.role as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (q) {
      conditions.push(`(u.username ILIKE $${idx} OR u.display_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${q}%`);
      idx++;
    }
    if (role) {
      conditions.push(`u.role = $${idx}`);
      values.push(role);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT
           u.id, u.username, u.display_name, u.email, u.avatar_url,
           u.role, u.is_private, u.created_at,
           COUNT(a.id)::int AS answer_count
         FROM users u
         LEFT JOIN answers a ON a.author_id = u.id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, values),
    ]);

    res.json({ users: rows.rows, total: countRow.rows[0].total, limit, offset });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [user, moderator, admin] }
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch('/users/:id', verifyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role`,
      [role, req.params.id]
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
 * /api/admin/reports:
 *   get:
 *     summary: Content moderation queue
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, actioned] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated reports queue
 */
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT
         r.id, r.content_type, r.content_id, r.reason, r.status, r.created_at,
         reporter.username AS reporter_username,
         reviewer.username AS reviewer_username
       FROM reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users reviewer ON reviewer.id = r.reviewer_id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    res.json({ reports: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/reports/{id}:
 *   patch:
 *     summary: Action a report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [reviewed, actioned] }
 *     responses:
 *       200:
 *         description: Report updated
 */
router.patch('/reports/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status || !['reviewed', 'actioned'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const result = await pool.query(
      `UPDATE reports
       SET status = $1, reviewer_id = $2, reviewed_at = NOW()
       WHERE id = $3
       RETURNING id, status`,
      [status, req.user!.id, req.params.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
