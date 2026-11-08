import { auth } from '@/server/auth';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { getActiveSession } from '@/server/services/session-service';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const active = await getActiveSession(session.user.id);
    return ok(active); // null when no active/paused session
  } catch (err) {
    return handleRouteError(err);
  }
}
