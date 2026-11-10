import type { TaskDTO } from './task';

export interface TaskProgress {
  taskId: string;
  targetMs: number;
  actualMs: number;
  /** targetMs - actualMs. Negative when over target. */
  remainingMs: number;
  /** Capped at 100 for bars/rings. */
  completionPct: number;
  overtimeMs: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  plannedMinutes: number;
  studiedMs: number;
  remainingMs: number;
  /** Capped at 100 for the ring; use overtimeMs for overtime visibility. */
  completionPct: number;
  overtimeMs: number;
}

export interface DailySummaryInput {
  date: string;
  tasks: Pick<TaskDTO, 'targetMinutes' | 'actualMs'>[];
}

/** GET /api/progress/daily response. */
export interface DailyProgressResponse {
  date: string; // YYYY-MM-DD
  tasks: TaskDTO[];
}

/** One day in the weekly trend. */
export interface WeeklyDayProgress {
  date: string; // YYYY-MM-DD
  plannedMinutes: number;
  studiedMinutes: number;
}

/** GET /api/progress/weekly response. */
export interface WeeklyProgressResponse {
  endDate: string; // YYYY-MM-DD
  days: WeeklyDayProgress[];
}
