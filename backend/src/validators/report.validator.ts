import { z } from 'zod';

export const reportSchema = z.object({
  content_type: z.enum(['question', 'answer', 'comment', 'user']),
  content_id: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'hate_speech', 'inappropriate', 'other']),
  message: z.string().max(500).optional(),
});
