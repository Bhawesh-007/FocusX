'use client';

import { Progress } from '@focus/ui';
import {
  computeDailySummary,
  formatClock,
  formatMinutesLabel,
  MINUTE_MS,
} from '@focus/core';
import { CheckCircle2, Clock3, Hourglass, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SummaryStripProps {
  date: string;
  tasks: Array<{ targetMinutes: number; actualMs: number }>;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint: string;
  mono?: boolean;
  tone?: 'default' | 'warning';
}

function StatCard({ icon: Icon, label, value, hint, mono, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p
        className={`mt-3 text-xl font-semibold tracking-tight tabular-nums ${
          mono ? 'font-mono' : ''
        } ${tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : ''}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SummaryStrip({ date, tasks }: SummaryStripProps) {
  const summary = computeDailySummary({
    date,
    tasks: tasks.map((t) => ({ targetMinutes: t.targetMinutes, actualMs: t.actualMs })),
  });
  const isOvertime = summary.remainingMs < 0;

  return (
    <section aria-label="Daily summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Target}
        label="Planned"
        value={summary.plannedMinutes === 0 ? '—' : formatMinutesLabel(summary.plannedMinutes)}
        hint="target time"
      />
      <StatCard
        icon={Clock3}
        label="Studied"
        value={summary.studiedMs === 0 ? '—' : formatClock(summary.studiedMs)}
        hint="tracked so far"
        mono
      />
      <StatCard
        icon={Hourglass}
        label="Remaining"
        value={
          summary.plannedMinutes === 0
            ? '—'
            : isOvertime
              ? `+${formatMinutesLabel(summary.overtimeMs / MINUTE_MS)}`
              : formatMinutesLabel(summary.remainingMs / MINUTE_MS)
        }
        hint={isOvertime ? 'over target' : 'left to study'}
        tone={isOvertime ? 'warning' : 'default'}
      />

      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-xs font-medium text-muted-foreground">Completion</p>
          </div>
          <p
            className="text-sm font-semibold tabular-nums"
            aria-label={`Day completion ${summary.completionPct} percent`}
          >
            {summary.completionPct}%
            {summary.overtimeMs > 0 ? '+' : ''}
          </p>
        </div>
        <Progress
          value={summary.completionPct}
          aria-hidden
          className="mt-3 h-2"
          indicatorClassName={isOvertime ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-sky-400'}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {isOvertime ? 'past the planned target' : 'of the planned target'}
        </p>
      </div>
    </section>
  );
}
