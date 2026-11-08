'use client';

import { Button } from '@focus/ui';
import { formatClock } from '@focus/core';
import { Pause, Play, Square } from 'lucide-react';
import { TimerControls } from './TimerControls';

interface ActiveTimerCardProps {
  taskTitle: string;
  status: 'ACTIVE' | 'PAUSED';
  elapsedMs: number;
  pending: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ActiveTimerCard({
  taskTitle,
  status,
  elapsedMs,
  pending,
  onPause,
  onResume,
  onStop,
}: ActiveTimerCardProps) {
  const active = status === 'ACTIVE';

  return (
    <section
      aria-label="Active study timer"
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.14] via-card to-card p-5 shadow-sm sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              {active ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              ) : null}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  active ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {active ? 'Focusing now' : 'Timer paused'}
              <span className="sr-only">{`, status ${status === 'ACTIVE' ? 'studying' : 'paused'}`}</span>
            </span>
          </div>
          <p className="truncate text-sm font-medium">{taskTitle}</p>
          <p
            className="font-mono text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl"
            aria-live="off"
            role="timer"
          >
            {formatClock(elapsedMs)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {active ? (
            <Button variant="outline" onClick={onPause} disabled={pending} aria-label="Pause timer">
              <Pause aria-hidden />
              Pause
            </Button>
          ) : (
            <Button onClick={onResume} disabled={pending} aria-label="Resume timer">
              <Play aria-hidden />
              Resume
            </Button>
          )}
          <Button variant="destructive" onClick={onStop} disabled={pending} aria-label="Stop and finish timer">
            <Square aria-hidden />
            Stop
          </Button>
        </div>
      </div>
    </section>
  );
}

export { TimerControls };
