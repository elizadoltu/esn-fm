import { z } from 'zod';

export const sendQuestionSchema = z.object({
  recipient_username: z.string().min(1),
  content: z.string().min(1).max(500),
  sender_name: z.string().max(60).optional(),
});
