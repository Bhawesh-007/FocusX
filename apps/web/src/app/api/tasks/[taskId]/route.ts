import { auth } from '@/server/auth';
import { updateTaskSchema } from '@focus/core';
import { handleRouteError, ok } from '@/server/http';
import { Errors } from '@/server/errors';
import { deleteTask, updateTask } from '@/server/services/task-service';

type Params = { params: Promise<{ taskId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const { taskId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0]?.message ?? 'Invalid update.');

    const task = await updateTask(session.user.id, taskId, parsed.data);
    return ok(task);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw Errors.unauthorized();

    const { taskId } = await params;
    await deleteTask(session.user.id, taskId);
    return ok({ deleted: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
