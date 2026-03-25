import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { verifyAdmin, verifyAdminOnly } from '../middleware/adminAuth.js';
import { sendEmail, buildAccountDeletionEmailHtml, buildReportActionEmailHtml } from '../lib/email/index.js';

const router = Router();

router.use(verifyJWT);
router.use(verifyAdmin);

// ── Helper: write audit log ───────────────────────────────────────────────────

async function writeAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, targetType, targetId, JSON.stringify(metadata)]
  );
}

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
      conditions.push(
        `(u.username ILIKE $${idx} OR u.display_name ILIKE $${idx} OR u.email ILIKE $${idx})`
      );
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
router.patch(
  '/users/:id',
  verifyAdminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
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

      await writeAuditLog(req.user!.id, 'update_role', 'user', req.params.id, { role });

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Permanently delete a user account and notify them by email
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string, enum: [spam, harassment, policy_violation, other] }
 *               message: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  verifyAdminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason, message } = req.body as { reason?: string; message?: string };
      const validReasons = ['spam', 'harassment', 'policy_violation', 'other'];
      if (!reason || !validReasons.includes(reason)) {
        res.status(400).json({ error: 'Invalid reason. Must be one of: ' + validReasons.join(', ') });
        return;
      }

      // Fetch user before deletion for email + audit
      const userResult = await pool.query(
        `SELECT id, email, display_name FROM users WHERE id = $1`,
        [req.params.id]
      );
      const user = userResult.rows[0];
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Prevent self-deletion
      if (user.id === req.user!.id) {
        res.status(400).json({ error: 'You cannot delete your own account via this endpoint' });
        return;
      }

      // Write audit log before deleting (FK would cascade)
      await writeAuditLog(req.user!.id, 'delete_user', 'user', user.id, {
        email: user.email,
        reason,
        message: message ?? null,
      });

      // Permanently delete — cascades to questions/follows/notifications etc.
      // Answers survive with author_id SET NULL (see migration 005)
      await pool.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);

      // Send notification email (fire-and-forget — don't block the response)
      const html = buildAccountDeletionEmailHtml(user.display_name, reason, message);
      sendEmail(
        user.email,
        '[ESN FM] Your account has been removed',
        html
      ).catch(() => {});

      res.json({ deleted: true, userId: user.id });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/admin/questions:
 *   get:
 *     summary: All questions with real sender identity revealed (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: anonymous_only
 *         schema: { type: boolean }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated questions with sender identity
 */
router.get('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anonymousOnly = req.query.anonymous_only === 'true';
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const where = anonymousOnly ? 'WHERE q.is_anonymous = TRUE' : '';

    const result = await pool.query(
      `SELECT
         q.id, q.content, q.is_answered, q.is_anonymous, q.created_at,
         -- Recipient
         r.id AS recipient_id, r.username AS recipient_username, r.display_name AS recipient_display_name,
         -- Real sender (may be null for truly anonymous / unauthenticated)
         s.id AS sender_id, s.username AS sender_username, s.display_name AS sender_display_name, s.email AS sender_email,
         -- Fallback sender_name (non-anonymous named questions)
         q.sender_name
       FROM questions q
       JOIN users r ON r.id = q.recipient_id
       LEFT JOIN users s ON s.id = q.sender_id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Log access to anonymous sender data in audit trail
    await writeAuditLog(req.user!.id, 'view_anonymous_senders', 'question', null, {
      anonymous_only: anonymousOnly,
      limit,
      offset,
    });

    const questions = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      is_answered: row.is_answered,
      is_anonymous: row.is_anonymous,
      created_at: row.created_at,
      sender_name: row.sender_name,
      recipient: {
        id: row.recipient_id,
        username: row.recipient_username,
        display_name: row.recipient_display_name,
      },
      real_sender: row.sender_id
        ? {
            id: row.sender_id,
            username: row.sender_username,
            display_name: row.sender_display_name,
            email: row.sender_email,
          }
        : null,
    }));

    res.json({ questions, limit, offset });
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
         r.id, r.content_type, r.content_id, r.reason, r.status, r.message, r.created_at,
         reporter.username AS reporter_username,
         reviewer.username AS reviewer_username,
         CASE r.content_type
           WHEN 'user'    THEN (SELECT u.username FROM users u WHERE u.id = r.content_id)
           WHEN 'answer'  THEN (SELECT u.username FROM answers a JOIN users u ON u.id = a.author_id WHERE a.id = r.content_id)
           WHEN 'question'THEN (SELECT u.username FROM questions q JOIN users u ON u.id = q.recipient_id WHERE q.id = r.content_id)
           WHEN 'comment' THEN (SELECT u.username FROM comments c JOIN answers a ON a.id = c.answer_id JOIN users u ON u.id = a.author_id WHERE c.id = r.content_id)
         END AS content_owner_username
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
    const { status, action_type, action_message } = req.body as {
      status?: string;
      action_type?: string;
      action_message?: string;
    };

    if (!status || !['reviewed', 'actioned'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const validActionTypes = ['warning', 'content_removed', 'account_suspended', 'other'];
    if (status === 'actioned' && action_type && !validActionTypes.includes(action_type)) {
      res.status(400).json({ error: 'Invalid action_type' });
      return;
    }

    // Fetch the full report before updating so we have content_type, content_id, reason
    const reportResult = await pool.query(
      `SELECT id, content_type, content_id, reason FROM reports WHERE id = $1`,
      [req.params.id]
    );
    const report = reportResult.rows[0];
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE reports
       SET status = $1, reviewer_id = $2, reviewed_at = NOW(),
           action_type = COALESCE($3, action_type),
           action_message = COALESCE($4, action_message)
       WHERE id = $5
       RETURNING id, status`,
      [status, req.user!.id, action_type ?? null, action_message ?? null, req.params.id]
    );

    await writeAuditLog(req.user!.id, 'action_report', 'report', req.params.id, {
      status,
      action_type: action_type ?? null,
    });

    // Send email to content owner only when actioning (not when marking reviewed)
    if (status === 'actioned' && action_type) {
      // Resolve content owner email based on content_type
      const ownerQuery: Record<string, string> = {
        user:     `SELECT u.display_name, u.email FROM users u WHERE u.id = $1`,
        answer:   `SELECT u.display_name, u.email FROM answers a JOIN users u ON u.id = a.author_id WHERE a.id = $1`,
        question: `SELECT u.display_name, u.email FROM questions q JOIN users u ON u.id = q.recipient_id WHERE q.id = $1`,
        comment:  `SELECT u.display_name, u.email FROM comments c JOIN answers a ON a.id = c.answer_id JOIN users u ON u.id = a.author_id WHERE c.id = $1`,
      };

      const ownerSql = ownerQuery[report.content_type as string];
      if (ownerSql) {
        const ownerResult = await pool.query(ownerSql, [report.content_id]);
        const owner = ownerResult.rows[0];
        if (owner) {
          const html = buildReportActionEmailHtml(
            owner.display_name,
            report.content_type,
            report.reason,
            action_type,
            action_message ?? undefined
          );
          sendEmail(
            owner.email,
            '[ESN FM] A moderation action has been taken on your content',
            html
          ).catch(() => {});
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     summary: Admin audit log viewer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get('/audit-logs', verifyAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT
         al.id, al.action, al.target_type, al.target_id, al.metadata, al.created_at,
         u.username AS admin_username, u.display_name AS admin_display_name
       FROM audit_logs al
       JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ logs: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/moderation-alerts:
 *   get:
 *     summary: Moderation alert notifications for the current admin/mod
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of moderation alert notifications
 */
router.get('/moderation-alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT
         n.id, n.reference_id, n.is_read, n.created_at,
         r.content_type, r.reason, r.status AS report_status, r.content_id,
         reporter.username AS reporter_username
       FROM notifications n
       LEFT JOIN reports r ON r.id = n.reference_id
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       WHERE n.recipient_id = $1 AND n.type = 'moderation_alert'
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/moderation-alerts/unread-count:
 *   get:
 *     summary: Unread moderation alert count for current admin/mod
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Returns { count: number }"
 */
router.get('/moderation-alerts/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE recipient_id = $1 AND type = 'moderation_alert' AND is_read = FALSE`,
      [req.user!.id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/moderation-alerts/read-all:
 *   patch:
 *     summary: Mark all moderation alerts as read
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.patch('/moderation-alerts/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE recipient_id = $1 AND type = 'moderation_alert' AND is_read = FALSE`,
      [req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/moderation-alerts/{id}/read:
 *   patch:
 *     summary: Mark a single moderation alert as read
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.patch('/moderation-alerts/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND recipient_id = $2 AND type = 'moderation_alert'`,
      [req.params.id, req.user!.id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/preferences:
 *   patch:
 *     summary: Update admin notification preferences
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moderation_email_digest: { type: boolean }
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.patch('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moderation_email_digest } = req.body as { moderation_email_digest?: boolean };
    if (typeof moderation_email_digest !== 'boolean') {
      res.status(400).json({ error: 'moderation_email_digest must be a boolean' });
      return;
    }
    await pool.query(
      `UPDATE users SET moderation_email_digest = $1 WHERE id = $2`,
      [moderation_email_digest, req.user!.id]
    );
    res.json({ ok: true, moderation_email_digest });
  } catch (err) {
    next(err);
  }
});

export default router;
