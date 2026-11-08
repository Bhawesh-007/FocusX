import 'server-only';
import { prisma } from '@focus/db';
import { type ActiveSessionDTO, sumIntervalsMs } from '@focus/core';
import { todayInTz, dbDateToStr } from '@/lib/dates';
import { Errors } from '../errors';

type SessionWithRelations = {
  id: string;
  taskId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startedAt: Date;
  endedAt: Date | null;
  task: {
    id: string;
    title: string;
    scheduledDate: Date;
    targetMinutes: number;
    status: 'PENDING' | 'COMPLETED';
  };
  intervals: Array<{ startedAt: Date; endedAt: Date | null }>;
};

function toActiveDTO(session: SessionWithRelations, now: Date): ActiveSessionDTO {
  return {
    session: {
      id: session.id,
      taskId: session.taskId,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    },
    task: {
      id: session.task.id,
      title: session.task.title,
      scheduledDate: dbDateToStr(session.task.scheduledDate),
      targetMinutes: session.task.targetMinutes,
      status: session.task.status,
    },
    elapsedMs: sumIntervalsMs(session.intervals, now),
    serverNow: now.toISOString(),
  };
}

async function findActive(userId: string): Promise<SessionWithRelations | null> {
  return prisma.studySession.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    include: { task: true, intervals: true },
  });
}

async function findById(userId: string, sessionId: string): Promise<SessionWithRelations | null> {
  return prisma.studySession.findFirst({
    where: { id: sessionId, userId },
    include: { task: true, intervals: true },
  });
}

/** GET /api/sessions/active — restores timer state after reload / cross-device. */
export async function getActiveSession(userId: string): Promise<ActiveSessionDTO | null> {
  const session = await findActive(userId);
  if (!session) return null;
  return toActiveDTO(session, new Date());
}

/** POST /api/sessions — start a session for a task. 409 if one is already running. */
export async function startSession(userId: string, taskId: string, timezone: string): Promise<ActiveSessionDTO> {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw Errors.notFound('Task');
  if (task.status === 'COMPLETED') throw Errors.taskCompleted();

  // Timers only start on today's tasks (in the user's timezone).
  if (dbDateToStr(task.scheduledDate) !== todayInTz(timezone)) throw Errors.taskNotToday();

  const existing = await findActive(userId);
  if (existing) throw Errors.sessionActive(toActiveDTO(existing, new Date()));

  try {
    const session = await prisma.studySession.create({
      data: {
        userId,
        taskId,
        status: 'ACTIVE',
        intervals: { create: { startedAt: new Date() } },
      },
      include: { task: true, intervals: true },
    });
    return toActiveDTO(session, new Date());
  } catch (err) {
    // Partial unique index lost the race: another device started first.
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      const winner = await findActive(userId);
      if (winner) throw Errors.sessionActive(toActiveDTO(winner, new Date()));
    }
    throw err;
  }
}

/** POST /api/sessions/[sessionId]/pause — closes the open interval. Idempotent. */
export async function pauseSession(userId: string, sessionId: string): Promise<ActiveSessionDTO> {
  const session = await findById(userId, sessionId);
  if (!session) throw Errors.notFound('Session');

  if (session.status === 'ACTIVE') {
    const now = new Date();
    await prisma.$transaction([
      prisma.studyInterval.updateMany({ where: { sessionId, endedAt: null }, data: { endedAt: now } }),
      prisma.studySession.update({ where: { id: sessionId }, data: { status: 'PAUSED' } }),
    ]);
  }

  const updated = await findById(userId, sessionId);
  if (!updated) throw Errors.notFound('Session');
  return toActiveDTO(updated, new Date());
}

/** POST /api/sessions/[sessionId]/resume — opens a new interval. Idempotent. */
export async function resumeSession(userId: string, sessionId: string): Promise<ActiveSessionDTO> {
  const session = await findById(userId, sessionId);
  if (!session) throw Errors.notFound('Session');

  if (session.status === 'COMPLETED') throw Errors.sessionCompleted();

  if (session.status === 'PAUSED') {
    await prisma.$transaction([
      prisma.studyInterval.create({ data: { sessionId, startedAt: new Date() } }),
      prisma.studySession.update({ where: { id: sessionId }, data: { status: 'ACTIVE' } }),
    ]);
  }

  const updated = await findById(userId, sessionId);
  if (!updated) throw Errors.notFound('Session');
  return toActiveDTO(updated, new Date());
}

/** POST /api/sessions/[sessionId]/stop — closes interval, marks session COMPLETED. Idempotent. */
export async function stopSession(userId: string, sessionId: string): Promise<ActiveSessionDTO> {
  const session = await findById(userId, sessionId);
  if (!session) throw Errors.notFound('Session');

  if (session.status !== 'COMPLETED') {
    const now = new Date();
    await prisma.$transaction([
      prisma.studyInterval.updateMany({ where: { sessionId, endedAt: null }, data: { endedAt: now } }),
      prisma.studySession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endedAt: now },
      }),
    ]);
  }

  const updated = await findById(userId, sessionId);
  if (!updated) throw Errors.notFound('Session');
  return toActiveDTO(updated, new Date());
}
