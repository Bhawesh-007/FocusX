/** Typed service-layer error, mapped to the API error envelope by route handlers. */
export class ServiceError extends Error {
  code: string;
  status: number;
  /** Optional payload, e.g. the active session info on 409. */
  meta?: unknown;

  constructor(code: string, message: string, status: number, meta?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.meta = meta;
  }
}

export const Errors = {
  unauthorized: () => new ServiceError('UNAUTHORIZED', 'You must be signed in.', 401),
  validation: (message: string) => new ServiceError('VALIDATION', message, 400),
  notFound: (what = 'Resource') => new ServiceError('NOT_FOUND', `${what} not found.`, 404),
  sessionActive: (meta: unknown) =>
    new ServiceError('SESSION_ACTIVE', 'Another study session is already running.', 409, meta),
  taskCompleted: () => new ServiceError('TASK_COMPLETED', 'This task is already completed.', 409),
  taskNotToday: () =>
    new ServiceError('TASK_NOT_TODAY', 'Timers can only be started for tasks scheduled today.', 409),
  sessionCompleted: () => new ServiceError('SESSION_COMPLETED', 'This session is already completed.', 409),
  emailInUse: () =>
    new ServiceError('EMAIL_IN_USE', 'An account with this email already exists.', 409),
};
