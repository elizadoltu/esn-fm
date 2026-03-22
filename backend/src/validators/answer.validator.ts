import { z } from 'zod';

export const postAnswerSchema = z.object({
  question_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
});
