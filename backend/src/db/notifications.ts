import { pool } from './pool.js';
import { sendSSE } from '../lib/sse.js';
import { sendPushToUser } from '../lib/webpush.js';

export type NotificationType =
  | 'new_question'
  | 'new_like'
  | 'new_comment'
  | 'new_reply'
  | 'new_follower'
  | 'new_answer'
  | 'new_dm'
  | 'follow_request'
  | 'moderation_alert'
  | 'question_of_day';

const pushBody: Record<NotificationType, string> = {
  new_question: 'You have a new question',
  new_like: 'Someone liked your answer',
  new_comment: 'Someone commented on your answer',
  new_reply: 'Someone replied to your comment',
  new_follower: 'Someone started following you',
  new_answer: 'Someone answered your question',
  new_dm: 'You have a new message',
  follow_request: 'Someone wants to follow you',
  moderation_alert: 'New report received — review required',
  question_of_day: "Today's question is live — what's your answer?",
};

const pushUrl: Record<NotificationType, string> = {
  new_question: '/inbox',
  new_like: '/notifications',
  new_comment: '/notifications',
  new_reply: '/notifications',
  new_follower: '/notifications',
  new_answer: '/notifications',
  new_dm: '/messages',
  follow_request: '/notifications',
  moderation_alert: '/admin/moderation',
  question_of_day: '/home',
};

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  referenceId: string,
  actorId: string | null
): Promise<void> {
  if (actorId && actorId === recipientId) return;

  await pool.query(
    `INSERT INTO notifications (recipient_id, type, reference_id, actor_id)
     VALUES ($1, $2, $3, $4)`,
    [recipientId, type, referenceId, actorId]
  );

  sendSSE(recipientId, 'notification', { type, referenceId, actorId });

  // Fire-and-forget — don't block the response
  sendPushToUser(recipientId, {
    title: 'ESN FM',
    body: pushBody[type],
    url: pushUrl[type],
  }).catch(() => {});
}

/**
 * Notify all admin and moderator accounts of a new report.
 * Creates an in-app moderation_alert notification for each and fires SSE + push.
 */
export async function createModerationAlerts(reportId: string): Promise<void> {
  const admins = await pool.query(
    `SELECT id FROM users WHERE role IN ('admin', 'moderator') AND (is_deleted = FALSE OR is_deleted IS NULL)`
  );

  await Promise.all(
    admins.rows.map((a: { id: string }) =>
      pool
        .query(
          `INSERT INTO notifications (recipient_id, type, reference_id, actor_id)
           VALUES ($1, 'moderation_alert', $2, NULL)`,
          [a.id, reportId]
        )
        .then(() => {
          sendSSE(a.id, 'notification', {
            type: 'moderation_alert',
            referenceId: reportId,
            actorId: null,
          });
          sendPushToUser(a.id, {
            title: 'ESN FM — New Report',
            body: pushBody.moderation_alert,
            url: pushUrl.moderation_alert,
          }).catch(() => {});
        })
    )
  );
}
