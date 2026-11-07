import { z } from 'zod';

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a YYYY-MM-DD date')
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), 'Invalid calendar date');

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be 120 characters or fewer'),
  scheduledDate: dateSchema,
  targetMinutes: z
    .number({ invalid_type_error: 'Target minutes must be a number' })
    .int('Target minutes must be a whole number')
    .min(1, 'Target minutes must be at least 1')
    .max(1440, 'Target minutes must be at most 1440 (24h)'),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120, 'Title must be 120 characters or fewer'),
    scheduledDate: dateSchema,
    targetMinutes: z.number().int().min(1).max(1440),
    status: z.enum(['PENDING', 'COMPLETED']),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
