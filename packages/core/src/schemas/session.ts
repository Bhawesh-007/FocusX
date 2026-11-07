import { z } from 'zod';

export const idSchema = z.string().min(1, 'Invalid id');

export const startSessionSchema = z.object({
  taskId: idSchema,
});

export const sessionActionSchema = z.object({
  sessionId: idSchema,
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type SessionActionInput = z.infer<typeof sessionActionSchema>;
