import 'server-only';
import { prisma } from '@focus/db';
import {
  type CreateTaskInput,
  type TaskDTO,
  type UpdateTaskInput,
  sumIntervalsInRangeMs,
} from '@focus/core';
import { dayRangeUtc, dbDateToStr, strToDbDate } from '@/lib/dates';
import { Errors } from '../errors';

async function toDTO(
  task: {
    id: string;
    title: string;
    scheduledDate: Date;
    targetMinutes: number;
    status: 'PENDING' | 'COMPLETED';
    createdAt: Date;
    updatedAt: Date;
    sessions: Array<{ intervals: Array<{ startedAt: Date; endedAt: Date | null }> }>;
  },
  dayRange: { start: Date; end: Date },
): Promise<TaskDTO> {
  const now = new Date();
  const intervals = task.sessions.flatMap((s) => s.intervals);
  const actualMs = sumIntervalsInRangeMs(intervals, dayRange, now);
  return {
    id: task.id,
    title: task.title,
    scheduledDate: dbDateToStr(task.scheduledDate),
    targetMinutes: task.targetMinutes,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    actualMs,
  };
}

/** All of the user's tasks for a calendar day, with actual time clipped to that day. */
export async function listTasksForDay(userId: string, dateStr: string, timezone: string): Promise<TaskDTO[]> {
  const dayRange = dayRangeUtc(dateStr, timezone);
  const tasks = await prisma.task.findMany({
    where: { userId, scheduledDate: strToDbDate(dateStr) },
    orderBy: { createdAt: 'asc' },
    include: { sessions: { include: { intervals: true } } },
  });
  return Promise.all(tasks.map((t) => toDTO(t, dayRange)));
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskDTO> {
  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      scheduledDate: strToDbDate(input.scheduledDate),
      targetMinutes: input.targetMinutes,
    },
  });
  return {
    id: task.id,
    title: task.title,
    scheduledDate: dbDateToStr(task.scheduledDate),
    targetMinutes: task.targetMinutes,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    actualMs: 0,
  };
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskDTO> {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) throw Errors.notFound('Task');

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.scheduledDate !== undefined ? { scheduledDate: strToDbDate(input.scheduledDate) } : {}),
      ...(input.targetMinutes !== undefined ? { targetMinutes: input.targetMinutes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });

  // If the task was just completed, finalize any running session on it.
  if (input.status === 'COMPLETED') {
    const active = await prisma.studySession.findFirst({
      where: { taskId, userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (active) {
      const now = new Date();
      await prisma.$transaction([
        prisma.studyInterval.updateMany({
          where: { sessionId: active.id, endedAt: null },
          data: { endedAt: now },
        }),
        prisma.studySession.update({
          where: { id: active.id },
          data: { status: 'COMPLETED', endedAt: now },
        }),
      ]);
    }
  }

  return {
    id: task.id,
    title: task.title,
    scheduledDate: dbDateToStr(task.scheduledDate),
    targetMinutes: task.targetMinutes,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    actualMs: 0,
  };
}

/** Hard delete. Per spec: cancels the task's active session first (cascades sessions/intervals). */
export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) throw Errors.notFound('Task');

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const active = await tx.studySession.findFirst({
      where: { taskId, userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (active) {
      await tx.studyInterval.updateMany({
        where: { sessionId: active.id, endedAt: null },
        data: { endedAt: now },
      });
      await tx.studySession.update({
        where: { id: active.id },
        data: { status: 'COMPLETED', endedAt: now },
      });
    }
    await tx.task.delete({ where: { id: taskId } });
  });
}
