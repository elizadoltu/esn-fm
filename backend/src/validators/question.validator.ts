import { z } from 'zod';

export const sendQuestionSchema = z.object({
  recipient_username: z.string().min(1),
  content: z.string().min(1).max(300),
  sender_name: z.string().max(60).optional(),
  show_in_feed: z.boolean().optional(),
  is_anonymous: z.boolean().optional(),
});
