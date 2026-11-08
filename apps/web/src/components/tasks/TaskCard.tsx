'use client';

import { Badge, Button, Progress } from '@focus/ui';
import { computeTaskProgress, formatClock, formatDeltaLabel, formatMinutesLabel } from '@focus/core';
import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';
import { TimerControls } from '@/components/timer/TimerControls';
import type { TaskDTO } from '@focus/core';

export type TaskTimerState = 'idle' | 'active' | 'paused' | 'blocked' | 'completed';

interface TaskCardProps {
  task: TaskDTO;
  /** Live elapsed for this task when its session is active/paused. */
  liveElapsedMs: number | null;
  timerState: TaskTimerState;
  pendingAction: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

export function TaskCard({
  task,
  liveElapsedMs,
  timerState,
  pendingAction,
  onStart,
  onPause,
  onResume,
  onStop,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskCardProps) {
  const actualMs = liveElapsedMs ?? task.actualMs;
  const progress = computeTaskProgress({ ...task, actualMs });
  const isOvertime = progress.remainingMs < 0;
  const completed = task.status === 'COMPLETED';

  return (
    <li
      className={`group rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md ${
        timerState === 'active'
          ? 'border-primary/60 shadow-md shadow-primary/10'
          : timerState === 'paused'
            ? 'border-dashed border-primary/50'
            : completed
              ? 'border-border/60 bg-card/60'
              : 'border-border/70 hover:border-primary/30'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleComplete}
              disabled={pendingAction || timerState === 'active' || timerState === 'paused'}
              aria-label={completed ? 'Mark task as pending' : 'Mark task as completed'}
              aria-pressed={completed}
              className="rounded-full text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
              ) : (
                <Circle className="h-5 w-5" aria-hidden />
              )}
            </button>
            <h3
              className={`text-sm font-medium leading-tight ${
                completed ? 'text-muted-foreground line-through' : ''
              }`}
            >
              {task.title}
            </h3>
            {completed ? <Badge variant="success">Completed</Badge> : null}
            {timerState === 'active' ? <Badge>Studying</Badge> : null}
            {timerState === 'paused' ? <Badge variant="warning">Paused</Badge> : null}
            {timerState === 'blocked' ? <Badge variant="secondary">Blocked</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Target: {formatMinutesLabel(task.targetMinutes)}</span>
            <span className="font-mono tabular-nums" aria-live={timerState === 'active' ? 'off' : undefined}>
              Actual: {formatClock(actualMs)}
            </span>
            <span
              className={
                isOvertime
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : 'font-medium text-emerald-600 dark:text-emerald-400'
              }
            >
              {isOvertime
                ? `${formatDeltaLabel(-progress.overtimeMs)} over`
                : `${formatDeltaLabel(progress.remainingMs)} left`}
            </span>
          </div>

          <Progress
            value={progress.completionPct}
            aria-label={`Progress: ${progress.completionPct}% of target`}
            className="h-1.5"
            indicatorClassName={
              isOvertime ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-sky-400'
            }
          />
        </div>

        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          {timerState === 'completed' ? (
            <span className="text-xs text-muted-foreground" title="Timer disabled for completed tasks">
              Final: {formatClock(actualMs)}
            </span>
          ) : (
            <TimerControls
              status={timerState === 'blocked' ? 'idle' : (timerState as 'idle' | 'active' | 'paused')}
              disabled={timerState === 'blocked'}
              pending={pendingAction}
              onStart={onStart}
              onPause={onPause}
              onResume={onResume}
              onStop={onStop}
            />
          )}
          <div className="flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${task.title}`}>
              <Pencil aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label={`Delete ${task.title}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
