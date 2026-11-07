import type { DailySummary, DailySummaryInput, TaskProgress } from './types/progress';
import type { TaskDTO } from './types/task';

export const MINUTE_MS = 60_000;

/** Per-task progress: target vs actual, remaining/overtime, completion %. */
export function computeTaskProgress(task: Pick<TaskDTO, 'id' | 'targetMinutes' | 'actualMs'>): TaskProgress {
  const targetMs = task.targetMinutes * MINUTE_MS;
  const actualMs = task.actualMs;
  const remainingMs = targetMs - actualMs;
  const completionPct = targetMs === 0 ? 0 : Math.min(100, Math.round((actualMs / targetMs) * 100));
  const overtimeMs = Math.max(0, actualMs - targetMs);
  return { taskId: task.id, targetMs, actualMs, remainingMs, completionPct, overtimeMs };
}

/** Daily totals across the day's tasks. Identical logic is reused by the progress page. */
export function computeDailySummary(input: DailySummaryInput): DailySummary {
  const plannedMinutes = input.tasks.reduce((sum, t) => sum + t.targetMinutes, 0);
  const plannedMs = plannedMinutes * MINUTE_MS;
  const studiedMs = input.tasks.reduce((sum, t) => sum + t.actualMs, 0);
  const remainingMs = plannedMs - studiedMs;
  const completionPct = plannedMs === 0 ? 0 : Math.min(100, Math.round((studiedMs / plannedMs) * 100));
  const overtimeMs = Math.max(0, studiedMs - plannedMs);
  return { date: input.date, plannedMinutes, studiedMs, remainingMs, completionPct, overtimeMs };
}
