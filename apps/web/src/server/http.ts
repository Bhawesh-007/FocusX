import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ServiceError } from './errors';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(code: string, message: string, status: number, meta?: unknown) {
  return NextResponse.json({ error: { code, message, ...(meta ? { meta } : {}) } }, { status });
}

/** Map thrown errors (ServiceError, ZodError, unknown) to the error envelope. */
export function handleRouteError(err: unknown) {
  if (err instanceof ServiceError) {
    return fail(err.code, err.message, err.status, err.meta);
  }
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? 'Invalid request.';
    return fail('VALIDATION', message, 400);
  }
  console.error('[api] unhandled error:', err);
  return fail('INTERNAL', 'Something went wrong.', 500);
}
