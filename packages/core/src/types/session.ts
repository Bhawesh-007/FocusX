export const SESSION_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface SessionDTO {
  id: string;
  taskId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
}

/** Response of GET /api/sessions/active and the 409 body of POST /api/sessions. */
export interface ActiveSessionDTO {
  session: SessionDTO;
  task: {
    id: string;
    title: string;
    scheduledDate: string; // YYYY-MM-DD
    targetMinutes: number;
    status: 'PENDING' | 'COMPLETED';
  };
  /** Elapsed ms as computed on the server at `serverNow`. */
  elapsedMs: number;
  /** Server clock, ISO string — lets the client tick without clock-skew drift. */
  serverNow: string;
}
