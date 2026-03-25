import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { reportSchema } from '../validators/report.validator.js';
import { createModerationAlerts } from '../db/notifications.js';
import {
  sendEmail,
  buildModerationEmailHtml,
  type ModerationReportInfo,
} from '../lib/email/index.js';

const router = Router();


/**
 * @openapi
 * /api/reports:
 *   post:
 *     summary: Submit a report on content
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content_type, content_id, reason]
 *             properties:
 *               content_type: { type: string, enum: [question, answer, comment, user] }
 *               content_id: { type: string, format: uuid }
 *               reason: { type: string, enum: [spam, harassment, hate_speech, inappropriate, other] }
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = reportSchema.parse(req.body);

    const reportResult = await pool.query(
      `INSERT INTO reports (reporter_id, content_type, content_id, reason, message)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [req.user!.id, data.content_type, data.content_id, data.reason, data.message ?? null]
    );

    const reportId: string | undefined = reportResult.rows[0]?.id;

    if (reportId) {
      // ── In-app moderation alerts (fire-and-forget) ───────────────────────
      createModerationAlerts(reportId).catch(() => {});

      // ── Email notifications (fire-and-forget) ────────────────────────────
      triggerModerationEmails(reportId, data, data.message).catch(() => {});
    }

    res.status(201).json({ reported: true, id: reportId });
  } catch (err) {
    next(err);
  }
});

async function triggerModerationEmails(
  reportId: string,
  data: { content_type: string; content_id: string; reason: string },
  reporterMessage?: string
): Promise<void> {
  // ── 5-min batch dedup ────────────────────────────────────────────────────
  const batchResult = await pool.query(
    `INSERT INTO moderation_email_batches (content_id, last_sent_at, batch_count)
     VALUES ($1, NOW(), 1)
     ON CONFLICT (content_id) DO UPDATE
       SET batch_count = moderation_email_batches.batch_count + 1
     RETURNING batch_count, last_sent_at,
       (NOW() - (moderation_email_batches.last_sent_at - INTERVAL '1 second' * 0)) > INTERVAL '5 minutes' AS window_expired`,
    [data.content_id]
  );

  const batch = batchResult.rows[0];
  // If this is not the first report AND the window has NOT expired, skip email
  if (batch.batch_count > 1 && !batch.window_expired) {
    return;
  }

  // Update last_sent_at when we actually send
  await pool.query(
    `UPDATE moderation_email_batches SET last_sent_at = NOW() WHERE content_id = $1`,
    [data.content_id]
  );

  // ── Fetch reporter username ───────────────────────────────────────────────
  const reporterResult = await pool.query(
    `SELECT u.username FROM reports r JOIN users u ON u.id = r.reporter_id WHERE r.id = $1`,
    [reportId]
  );
  const reporterUsername: string = reporterResult.rows[0]?.username ?? 'unknown';

  // ── Fetch content excerpt ─────────────────────────────────────────────────
  let contentExcerpt = '';
  try {
    if (data.content_type === 'question') {
      const r = await pool.query(`SELECT content FROM questions WHERE id = $1`, [data.content_id]);
      contentExcerpt = r.rows[0]?.content ?? '';
    } else if (data.content_type === 'answer') {
      const r = await pool.query(`SELECT content FROM answers WHERE id = $1`, [data.content_id]);
      contentExcerpt = r.rows[0]?.content ?? '';
    } else if (data.content_type === 'comment') {
      const r = await pool.query(`SELECT content FROM comments WHERE id = $1`, [data.content_id]);
      contentExcerpt = r.rows[0]?.content ?? '';
    } else if (data.content_type === 'user') {
      const r = await pool.query(`SELECT display_name, username FROM users WHERE id = $1`, [data.content_id]);
      contentExcerpt = r.rows[0] ? `${r.rows[0].display_name} (@${r.rows[0].username})` : '';
    }
  } catch {
    // Don't fail email sending if excerpt lookup fails
  }

  const reportInfo: ModerationReportInfo = {
    reportId,
    contentType: data.content_type,
    contentId: data.content_id,
    reason: data.reason,
    reporterUsername,
    contentExcerpt,
    batchCount: batch.batch_count,
    reporterMessage,
  };

  // ── Send to non-digest admin/mod accounts ────────────────────────────────
  const admins = await pool.query(
    `SELECT email FROM users
     WHERE role IN ('admin', 'moderator')
       AND (is_deleted = FALSE OR is_deleted IS NULL)
       AND moderation_email_digest = FALSE`
  );

  const adminDashboardUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const html = buildModerationEmailHtml(reportInfo, adminDashboardUrl);
  const subjectExcerpt = contentExcerpt.slice(0, 60) + (contentExcerpt.length > 60 ? '…' : '');
  const subject = `[ESN FM] New report received — ${data.content_type}: ${subjectExcerpt || data.content_id}`;

  await Promise.all(
    admins.rows.map((a: { email: string }) => sendEmail(a.email, subject, html).catch(() => {}))
  );
}

export default router;
