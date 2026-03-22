import { z } from 'zod';

export const postCommentSchema = z.object({
  answer_id: z.string().uuid(),
  content: z.string().min(1).max(200),
  parent_comment_id: z.string().uuid().optional(),
});
