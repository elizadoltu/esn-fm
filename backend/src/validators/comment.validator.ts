import { z } from 'zod';

export const postCommentSchema = z
  .object({
    answer_id: z.string().uuid(),
    content: z.string().max(200).optional().default(''),
    parent_comment_id: z.string().uuid().optional(),
    image_url: z.string().url().nullable().optional(),
  })
  .refine((d) => d.content.trim().length > 0 || !!d.image_url, {
    message: 'Comment must have text or an image',
  });
