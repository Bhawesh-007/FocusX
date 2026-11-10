import { auth } from '@/server/auth';
import { weeklyQuerySchema } from '@focus/core';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { getWeeklyProgress } from '@/server/services/progress-service';
import { todayInTz } from '@/lib/dates';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const url = new URL(request.url);
    const query = weeklyQuerySchema.safeParse({ endDate: url.searchParams.get('endDate') ?? undefined });
    if (!query.success) throw Errors.validation(query.error.issues[0]?.message ?? 'Invalid date.');

    const endDate = query.data.endDate ?? todayInTz(session.user.timezone);
    const data = await getWeeklyProgress(session.user.id, endDate, session.user.timezone);
    return ok(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
