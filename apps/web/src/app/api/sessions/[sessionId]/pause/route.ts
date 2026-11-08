import { auth } from '@/server/auth';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { pauseSession } from '@/server/services/session-service';

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const { sessionId } = await params;
    const result = await pauseSession(session.user.id, sessionId);
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
