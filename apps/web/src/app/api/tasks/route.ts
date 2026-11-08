import { auth } from '@/server/auth';
import { createTaskSchema, dailyQuerySchema } from '@focus/core';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { createTask, listTasksForDay } from '@/server/services/task-service';
import { todayInTz } from '@/lib/dates';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const url = new URL(request.url);
    const query = dailyQuerySchema.safeParse({ date: url.searchParams.get('date') ?? undefined });
    if (!query.success) throw Errors.validation(query.error.issues[0]?.message ?? 'Invalid date.');

    const date = query.data.date ?? todayInTz(session.user.timezone);
    const tasks = await listTasksForDay(session.user.id, date, session.user.timezone);
    return ok({ date, tasks });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const body = await request.json().catch(() => null);
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0]?.message ?? 'Invalid task.');
    const defaultDate = todayInTz(session.user.timezone);

    const task = await createTask(session.user.id, {
      ...parsed.data,
      scheduledDate: parsed.data.scheduledDate ?? defaultDate,
    });
    return ok(task, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
