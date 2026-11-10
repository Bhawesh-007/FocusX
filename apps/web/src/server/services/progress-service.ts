import 'server-only';
import { MINUTE_MS } from '@focus/core';
import type { DailyProgressResponse, WeeklyProgressResponse } from '@focus/core';
import { addDaysStr } from '@/lib/dates';
import { listTasksForDay } from './task-service';

/**
 * GET /api/progress/daily — planned vs actual for a single day.
 * Reuses listTasksForDay so actualMs is clipped to the correct local day
 * (timezone + midnight crossover handled in one place).
 */
export async function getDailyProgress(
  userId: string,
  dateStr: string,
  timezone: string,
): Promise<DailyProgressResponse> {
  const tasks = await listTasksForDay(userId, dateStr, timezone);
  return { date: dateStr, tasks };
}

/**
 * GET /api/progress/weekly — the 7 days ending at endDate.
 * Aggregates each day's planned minutes and studied minutes.
 */
export async function getWeeklyProgress(
  userId: string,
  endDateStr: string,
  timezone: string,
): Promise<WeeklyProgressResponse> {
  const days = await Promise.all(
    Array.from({ length: 7 }, async (_, idx) => {
      const date = addDaysStr(endDateStr, idx - 6);
      const tasks = await listTasksForDay(userId, date, timezone);
      const plannedMinutes = tasks.reduce((sum, t) => sum + t.targetMinutes, 0);
      const studiedMinutes = Math.round(tasks.reduce((sum, t) => sum + t.actualMs, 0) / MINUTE_MS);
      return { date, plannedMinutes, studiedMinutes };
    }),
  );
  return { endDate: endDateStr, days };
}
