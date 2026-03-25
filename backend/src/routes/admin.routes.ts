import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { verifyAdmin, verifyAdminOnly } from '../middleware/adminAuth.js';
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getQuestions,
  getReports,
  actionReport,
  getAuditLogs,
  getModerationAlerts,
  getModerationAlertsUnreadCount,
  markAllModerationAlertsRead,
  markOneModerationAlertRead,
  updatePreferences,
  getDailyQuestions,
  createDailyQuestion,
  publishDailyQuestion,
  archiveDailyQuestion,
} from '../api/admin.api.js';

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
router.get('/stats', getStats);

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
router.get('/users', getUsers);

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
router.patch('/users/:id', verifyAdminOnly, updateUserRole);

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
router.delete('/users/:id', verifyAdminOnly, deleteUser);

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
router.get('/questions', getQuestions);

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
router.get('/reports', getReports);

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
router.patch('/reports/:id', actionReport);

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
router.get('/audit-logs', verifyAdminOnly, getAuditLogs);

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
router.get('/moderation-alerts', getModerationAlerts);

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
router.get('/moderation-alerts/unread-count', getModerationAlertsUnreadCount);

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
router.patch('/moderation-alerts/read-all', markAllModerationAlertsRead);

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
router.patch('/moderation-alerts/:id/read', markOneModerationAlertRead);

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
router.patch('/preferences', updatePreferences);

// ── Question of the Day (admin) ──────────────��────────────────────────────────

router.get('/daily-questions', getDailyQuestions);

router.post('/daily-questions', createDailyQuestion);

router.patch('/daily-questions/:id/publish', publishDailyQuestion);

router.patch('/daily-questions/:id/archive', archiveDailyQuestion);

export default router;
