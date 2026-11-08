'use client';

import { Button } from '@focus/ui';
import { Play, Pause, Square } from 'lucide-react';

interface TimerControlsProps {
  status: 'idle' | 'active' | 'paused';
  disabled?: boolean;
  disabledReason?: string;
  pending?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  size?: 'sm' | 'default';
}

export function TimerControls({
  status,
  disabled,
  disabledReason,
  pending,
  onStart,
  onPause,
  onResume,
  onStop,
  size = 'sm',
}: TimerControlsProps) {
  const blocked = status === 'idle' && disabled;

  if (status === 'active') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size={size} onClick={onPause} disabled={pending} aria-label="Pause timer">
          <Pause aria-hidden />
          Pause
        </Button>
        <Button variant="destructive" size={size} onClick={onStop} disabled={pending} aria-label="Stop timer">
          <Square aria-hidden />
          Stop
        </Button>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="flex items-center gap-2">
        <Button size={size} onClick={onResume} disabled={pending} aria-label="Resume timer">
          <Play aria-hidden />
          Resume
        </Button>
        <Button variant="destructive" size={size} onClick={onStop} disabled={pending} aria-label="Stop timer">
          <Square aria-hidden />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <Button
      size={size}
      onClick={onStart}
      disabled={disabled || pending}
      aria-label={blocked ? 'Start timer (blocked: another task is running)' : 'Start timer'}
      title={blocked ? (disabledReason ?? 'Another task is already being tracked') : undefined}
    >
      <Play aria-hidden />
      Start
    </Button>
  );
}
