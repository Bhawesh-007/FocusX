import { prisma } from '@focus/db';
import type { Task, StudySession, StudyInterval } from '@focus/db';

/** Thin Prisma wrappers for Task queries, scoped by userId. */

export function findTasksForDate(userId: string, scheduledDate: Date) {
  return prisma.task.findMany({
    where: { userId, scheduledDate },
    orderBy: [{ createdAt: 'asc' }],
    include: {
      sessions: {
        where: { status: { not: 'COMPLETED' } },
        select: { id: true },
      },
    },
  });
}

export function findTaskById(userId: string, taskId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

export function findTaskWithIntervals(userId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      sessions: {
        include: { intervals: true },
      },
    },
  });
}

export type TaskWithSessions = Task & {
  sessions: (StudySession & { intervals: StudyInterval[] })[];
};
