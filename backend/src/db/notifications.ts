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
  | 'follow_request';

const pushBody: Record<NotificationType, string> = {
  new_question: 'You have a new question',
  new_like: 'Someone liked your answer',
  new_comment: 'Someone commented on your answer',
  new_reply: 'Someone replied to your comment',
  new_follower: 'Someone started following you',
  new_answer: 'Someone answered your question',
  new_dm: 'You have a new message',
  follow_request: 'Someone wants to follow you',
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
