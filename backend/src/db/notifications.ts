import { pool } from './pool.js';

export type NotificationType =
  | 'new_question'
  | 'new_like'
  | 'new_comment'
  | 'new_reply'
  | 'new_follower'
  | 'new_answer'
  | 'new_dm'
  | 'follow_request';

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
}
