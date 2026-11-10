import { z } from 'zod';

const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid timezone');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or fewer'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(254, 'Email must be 254 characters or fewer'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be 72 characters or fewer'),
  timezone: timezoneSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
