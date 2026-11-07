import { z } from 'zod';
import { dateSchema } from './task';

export const dailyQuerySchema = z.object({
  date: dateSchema.optional(),
});

export const weeklyQuerySchema = z.object({
  // ISO week start date, YYYY-MM-DD
  startDate: dateSchema.optional(),
});

export type DailyQuery = z.infer<typeof dailyQuerySchema>;
export type WeeklyQuery = z.infer<typeof weeklyQuerySchema>;
