import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  bio: z.string().max(200).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  allow_anonymous_questions: z.boolean().optional(),
  is_private: z.boolean().optional(),
});
