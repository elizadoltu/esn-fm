import { z } from 'zod';

export const sendDmSchema = z.object({
  recipient_username: z.string().min(1),
  content: z.string().min(1).max(500),
});
