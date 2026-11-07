export const TASK_STATUSES = ['PENDING', 'COMPLETED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Client-facing task shape (dates as YYYY-MM-DD strings). */
export interface TaskDTO {
  id: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  targetMinutes: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  /** Actual studied ms on this task, clipped to the requested day. */
  actualMs: number;
}

export interface TaskWithActualInput {
  id: string;
  title: string;
  scheduledDate: Date;
  targetMinutes: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  /** Flattened intervals across this task's sessions (UTC Dates, endedAt null = open). */
  intervals: Array<{ startedAt: Date; endedAt: Date | null }>;
}
