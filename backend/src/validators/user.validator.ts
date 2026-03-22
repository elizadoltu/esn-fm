import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  allow_anonymous_questions: z.boolean().optional(),
});
