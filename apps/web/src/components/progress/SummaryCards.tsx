'use client';

import { Progress } from '@focus/ui';
import {
  computeDailySummary,
  formatClock,
  formatMinutesLabel,
} from '@focus/core';
import { CheckCircle2, Clock3, ListChecks, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TaskDTO } from '@focus/core';

interface SummaryCardsProps {
  date: string;
  tasks: TaskDTO[];
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint: string;
  mono?: boolean;
  tone?: 'default' | 'warning' | 'success';
  children?: React.ReactNode;
}

function StatCard({ icon: Icon, label, value, hint, mono, tone = 'default', children }: StatCardProps) {
  const toneClass =
    tone === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'success'
        ? 'text-emerald-600 dark:text-emerald-400'
        : '';
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-3 text-xl font-semibold tracking-tight tabular-nums ${mono ? 'font-mono' : ''} ${toneClass}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}

/** Four daily summary cards: Planned, Studied, Completion, Tasks Done. */
export function SummaryCards({ date, tasks }: SummaryCardsProps) {
  const summary = computeDailySummary({
    date,
    tasks: tasks.map((t) => ({ targetMinutes: t.targetMinutes, actualMs: t.actualMs })),
  });
  const isOvertime = summary.overtimeMs > 0;
  const tasksDone = tasks.filter((t) => t.status === 'COMPLETED').length;
  const hasPlan = summary.plannedMinutes > 0;

  return (
    <section aria-label="Daily summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Target}
        label="Planned"
        value={hasPlan ? formatMinutesLabel(summary.plannedMinutes) : '—'}
        hint="target time"
      />
      <StatCard
        icon={Clock3}
        label="Studied"
        value={summary.studiedMs > 0 ? formatClock(summary.studiedMs) : '—'}
        hint="tracked time"
        mono
      />
      <StatCard
        icon={CheckCircle2}
        label="Completion"
        value={hasPlan ? `${summary.completionPct}%${isOvertime ? '+' : ''}` : '—'}
        hint={isOvertime ? 'past the planned target' : 'of the planned target'}
        tone={isOvertime ? 'warning' : 'default'}
      >
        <Progress
          value={hasPlan ? summary.completionPct : 0}
          aria-hidden
          className="mt-3 h-2"
          indicatorClassName={isOvertime ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-sky-400'}
        />
      </StatCard>
      <StatCard
        icon={ListChecks}
        label="Tasks Done"
        value={`${tasksDone}/${tasks.length}`}
        hint="completed today"
        tone={tasks.length > 0 && tasksDone === tasks.length ? 'success' : 'default'}
      />
    </section>
  );
}
