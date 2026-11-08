'use client';

import { Button, Skeleton } from '@focus/ui';
import { ListTodo, Plus, RefreshCw } from 'lucide-react';
import { TaskCard, type TaskTimerState } from './TaskCard';
import type { ActiveSessionDTO, TaskDTO } from '@focus/core';

interface TaskListProps {
  tasks: TaskDTO[];
  loading: boolean;
  error: string | null;
  activeSession: ActiveSessionDTO | null;
  liveElapsedMs: number | null;
  pendingTaskId: string | null;
  onCreate: () => void;
  onRetry: () => void;
  onStart: (taskId: string) => void;
  onPause: (sessionId: string) => void;
  onResume: (sessionId: string) => void;
  onStop: (sessionId: string) => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onToggleComplete: (task: TaskDTO) => void;
}

export function TaskList({
  tasks,
  loading,
  error,
  activeSession,
  liveElapsedMs,
  pendingTaskId,
  onCreate,
  onRetry,
  onStart,
  onPause,
  onResume,
  onStop,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskListProps) {
  if (loading) {
    return (
      <ul className="space-y-3" aria-label="Loading tasks" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="rounded-xl border border-border/70 bg-card/80 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-3 h-1.5 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-card/80 p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10" aria-hidden>
          <RefreshCw className="h-6 w-6 text-destructive" />
        </div>
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Retry
        </Button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-10 text-center shadow-sm backdrop-blur-sm">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          aria-hidden
        >
          <ListTodo className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No tasks for this day</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Add your first task, set a target, and start a focus timer to make the day count.
        </p>
        <Button size="sm" className="mt-5" onClick={onCreate}>
          <Plus aria-hidden />
          New task
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Tasks for the selected day">
      {tasks.map((task) => {
        const isThisTaskActive = activeSession?.session.taskId === task.id;
        let timerState: TaskTimerState = 'idle';
        if (task.status === 'COMPLETED') timerState = 'completed';
        else if (isThisTaskActive && activeSession?.session.status === 'ACTIVE') timerState = 'active';
        else if (isThisTaskActive && activeSession?.session.status === 'PAUSED') timerState = 'paused';
        else if (activeSession) timerState = 'blocked';

        return (
          <TaskCard
            key={task.id}
            task={task}
            liveElapsedMs={isThisTaskActive ? liveElapsedMs : null}
            timerState={timerState}
            pendingAction={pendingTaskId === task.id}
            onStart={() => onStart(task.id)}
            onPause={() => activeSession && onPause(activeSession.session.id)}
            onResume={() => activeSession && onResume(activeSession.session.id)}
            onStop={() => activeSession && onStop(activeSession.session.id)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
            onToggleComplete={() => onToggleComplete(task)}
          />
        );
      })}
    </ul>
  );
}
