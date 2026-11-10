import { auth } from '@/server/auth';
import { dailyQuerySchema } from '@focus/core';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { getDailyProgress } from '@/server/services/progress-service';
import { todayInTz } from '@/lib/dates';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const url = new URL(request.url);
    const query = dailyQuerySchema.safeParse({ date: url.searchParams.get('date') ?? undefined });
    if (!query.success) throw Errors.validation(query.error.issues[0]?.message ?? 'Invalid date.');

    const date = query.data.date ?? todayInTz(session.user.timezone);
    const data = await getDailyProgress(session.user.id, date, session.user.timezone);
    return ok(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
