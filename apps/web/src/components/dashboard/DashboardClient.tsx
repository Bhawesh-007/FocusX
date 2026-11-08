'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@focus/ui';
import { Plus, Sparkles } from 'lucide-react';
import type { ActiveSessionDTO, TaskDTO } from '@focus/core';
import { apiFetch, ApiClientError } from '@/lib/api';
import { todayInTz } from '@/lib/dates';
import { DateNav } from '@/components/dashboard/DateNav';
import { SummaryStrip } from '@/components/dashboard/SummaryStrip';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { DeleteConfirm } from '@/components/tasks/DeleteConfirm';
import { ActiveTimerCard } from '@/components/timer/ActiveTimerCard';

interface DashboardClientProps {
  timezone: string;
}

type TasksResponse = { date: string; tasks: TaskDTO[] };
type FormValues = { title: string; scheduledDate: string; targetMinutes: number };

export function DashboardClient({ timezone }: DashboardClientProps) {
  const today = useMemo(() => todayInTz(timezone), [timezone]);
  const [date, setDate] = useState(today);

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [active, setActive] = useState<ActiveSessionDTO | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const [timerPending, setTimerPending] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskDTO | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  // Anchor for the local 1s tick: server elapsed at the moment we received it.
  const anchorRef = useRef<{ elapsedMs: number; at: number } | null>(null);

  const applyActive = useCallback((data: ActiveSessionDTO | null) => {
    setActive(data);
    if (data) {
      const skew = Math.max(0, Date.now() - new Date(data.serverNow).getTime());
      const elapsed = data.session.status === 'ACTIVE' ? data.elapsedMs + skew : data.elapsedMs;
      anchorRef.current = { elapsedMs: elapsed, at: Date.now() };
      setLiveElapsedMs(elapsed);
    } else {
      anchorRef.current = null;
      setLiveElapsedMs(0);
    }
  }, []);

  const loadTasks = useCallback(
    async (day: string) => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const data = await apiFetch<TasksResponse>(`/api/tasks?date=${day}`);
        setTasks(data.tasks);
      } catch (err) {
        setTasksError(err instanceof ApiClientError ? err.message : 'Failed to load tasks.');
      } finally {
        setTasksLoading(false);
      }
    },
    [],
  );

  const loadActive = useCallback(async () => {
    try {
      const data = await apiFetch<ActiveSessionDTO | null>('/api/sessions/active');
      applyActive(data);
    } catch {
      // Active session restore is best-effort; local state stays as-is.
    }
  }, [applyActive]);

  // Initial load when the selected day changes.
  useEffect(() => {
    loadTasks(date);
  }, [date, loadTasks]);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  // Local 1s tick (display only; server stays the source of truth).
  useEffect(() => {
    if (!active || active.session.status !== 'ACTIVE') return;
    const id = window.setInterval(() => {
      const anchor = anchorRef.current;
      if (anchor) setLiveElapsedMs(anchor.elapsedMs + (Date.now() - anchor.at));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  // 30s reconciliation with the server.
  useEffect(() => {
    const id = window.setInterval(() => {
      loadActive();
      if (!tasksLoading) loadTasks(date);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [loadActive, loadTasks, date, tasksLoading]);

  const runTimerAction = useCallback(
    async (fn: () => Promise<ActiveSessionDTO>, taskId?: string) => {
      setTimerPending(true);
      if (taskId) setPendingTaskId(taskId);
      try {
        applyActive(await fn());
        await loadTasks(date);
        setToastError(null);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 409) {
          // Another session is running (possibly started elsewhere): adopt it.
          await loadActive();
          await loadTasks(date);
          if (err.code === 'TASK_NOT_TODAY') setToastError(err.message);
        } else {
          setToastError(err instanceof ApiClientError ? err.message : 'Timer action failed.');
        }
      } finally {
        setTimerPending(false);
        setPendingTaskId(null);
      }
    },
    [applyActive, loadActive, loadTasks, date],
  );

  const startTimer = (taskId: string) =>
    runTimerAction(() => apiFetch<ActiveSessionDTO>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }), taskId);

  const pauseTimer = (sessionId: string) =>
    runTimerAction(() => apiFetch<ActiveSessionDTO>(`/api/sessions/${sessionId}/pause`, { method: 'POST' }));

  const resumeTimer = (sessionId: string) =>
    runTimerAction(() => apiFetch<ActiveSessionDTO>(`/api/sessions/${sessionId}/resume`, { method: 'POST' }));

  const stopTimer = (sessionId: string) =>
    runTimerAction(() => apiFetch<ActiveSessionDTO>(`/api/sessions/${sessionId}/stop`, { method: 'POST' }));

  const submitTask = async (values: FormValues) => {
    try {
      if (editingTask) {
        // Optimistic edit with rollback on failure.
        const previous = tasks;
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...values, updatedAt: new Date().toISOString() } : t)),
        );
        try {
          await apiFetch<TaskDTO>(`/api/tasks/${editingTask.id}`, {
            method: 'PATCH',
            body: JSON.stringify(values),
          });
        } catch {
          setTasks(previous);
          throw new Error('rollback');
        }
      } else {
        await apiFetch<TaskDTO>('/api/tasks', { method: 'POST', body: JSON.stringify(values) });
      }
      setToastError(null);
      await loadTasks(values.scheduledDate);
      if (values.scheduledDate !== date) setDate(values.scheduledDate);
    } catch (err) {
      if (!(err instanceof Error && err.message === 'rollback')) {
        setToastError(err instanceof ApiClientError ? err.message : 'Failed to save task.');
      }
    }
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    setDeletePending(true);
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id)); // optimistic
    try {
      await apiFetch<{ deleted: true }>(`/api/tasks/${deletingTask.id}`, { method: 'DELETE' });
      if (active?.session.taskId === deletingTask.id) applyActive(null);
      setDeletingTask(null);
      setToastError(null);
    } catch (err) {
      setTasks(previous); // rollback
      setToastError(err instanceof ApiClientError ? err.message : 'Failed to delete task.');
    } finally {
      setDeletePending(false);
    }
  };

  const toggleComplete = async (task: TaskDTO) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const previous = tasks;
    setPendingTaskId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))); // optimistic
    try {
      await apiFetch<TaskDTO>(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (nextStatus === 'COMPLETED' && active?.session.taskId === task.id) {
        await loadActive();
      }
      setToastError(null);
    } catch (err) {
      setTasks(previous); // rollback
      setToastError(err instanceof ApiClientError ? err.message : 'Failed to update task.');
    } finally {
      setPendingTaskId(null);
    }
  };

  // Actual time for the active task comes from the live tick, not the snapshot.
  const tasksForSummary = tasks.map((t) =>
    active?.session.taskId === t.id ? { ...t, actualMs: liveElapsedMs } : t,
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Make today count
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Plan your day, start a focus timer, and let the small blocks add up.
            </p>
          </div>
          <Button
            size="lg"
            className="shadow-sm shadow-primary/25"
            onClick={() => {
              setEditingTask(null);
              setDialogOpen(true);
            }}
          >
            <Plus aria-hidden />
            New task
          </Button>
        </div>
      </section>

      {active ? (
        <ActiveTimerCard
          taskTitle={active.task.title}
          status={active.session.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE'}
          elapsedMs={liveElapsedMs}
          pending={timerPending}
          onPause={() => pauseTimer(active.session.id)}
          onResume={() => resumeTimer(active.session.id)}
          onStop={() => stopTimer(active.session.id)}
        />
      ) : null}

      <DateNav date={date} today={today} timezone={timezone} onChange={setDate} />

      <SummaryStrip date={date} tasks={tasksForSummary} />

      {toastError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm"
        >
          {toastError}
        </p>
      ) : null}

      <div className="flex items-end justify-between gap-3 pt-1">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {tasksLoading ? 'Loading your plan…' : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} for this day`}
          </p>
        </div>
      </div>

      <TaskList
        tasks={tasksForSummary}
        loading={tasksLoading}
        error={tasksError}
        activeSession={active}
        liveElapsedMs={liveElapsedMs}
        pendingTaskId={pendingTaskId ?? (timerPending ? active?.session.taskId ?? null : null)}
        onCreate={() => {
          setEditingTask(null);
          setDialogOpen(true);
        }}
        onRetry={() => loadTasks(date)}
        onStart={startTimer}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onStop={stopTimer}
        onEdit={(task) => {
          setEditingTask(task);
          setDialogOpen(true);
        }}
        onDelete={(task) => setDeletingTask(task)}
        onToggleComplete={toggleComplete}
      />

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultDate={date}
        onSubmit={submitTask}
      />

      <DeleteConfirm
        task={deletingTask}
        pending={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}
