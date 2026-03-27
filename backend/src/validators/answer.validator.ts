import { z } from 'zod';

export const postAnswerSchema = z
  .object({
    question_id: z.string().uuid(),
    content: z.string().max(1000),
    image_url: z.string().url().nullable().optional(),
  })
  .refine((data) => data.content.trim().length > 0 || !!data.image_url, {
    message: "Answer must have text or an image",
    path: ["content"],
  });
