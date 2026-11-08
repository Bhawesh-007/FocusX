import { auth } from '@/server/auth';
import { startSessionSchema } from '@focus/core';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { startSession } from '@/server/services/session-service';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const body = await request.json().catch(() => null);
    const parsed = startSessionSchema.safeParse(body);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0]?.message ?? 'Invalid request.');

    const active = await startSession(session.user.id, parsed.data.taskId, session.user.timezone);
    return ok(active, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
