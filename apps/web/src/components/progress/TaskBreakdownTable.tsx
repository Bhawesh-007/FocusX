'use client';

import { Progress } from '@focus/ui';
import { computeTaskProgress, formatMinutesLabel, MINUTE_MS } from '@focus/core';
import type { TaskDTO } from '@focus/core';
import { ListChecks } from 'lucide-react';

interface TaskBreakdownTableProps {
  tasks: TaskDTO[];
}

/** Read-only per-task breakdown: planned, actual, remaining/over, status, completion. */
export function TaskBreakdownTable({ tasks }: TaskBreakdownTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-sm text-muted-foreground">
        <ListChecks className="h-5 w-5 shrink-0 text-muted-foreground/60" aria-hidden />
        No tasks to break down for this day.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="text-sm font-semibold">Task breakdown</h3>
        <p className="text-xs text-muted-foreground">How each task performed against its target</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Planned</th>
              <th className="px-4 py-3 font-medium">Actual</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const p = computeTaskProgress({ id: task.id, targetMinutes: task.targetMinutes, actualMs: task.actualMs });
              const over = p.overtimeMs > 0;
              return (
                <tr key={task.id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {formatMinutesLabel(task.targetMinutes)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {formatMinutesLabel(Math.round(task.actualMs / MINUTE_MS))}
                  </td>
                  <td className="px-4 py-3">
                    {over ? (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        +{formatMinutesLabel(Math.round(p.overtimeMs / MINUTE_MS))} over
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatMinutesLabel(Math.round(p.remainingMs / MINUTE_MS))} left
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {task.status === 'COMPLETED' ? 'Done' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={p.completionPct}
                        aria-label={`${task.title} completion ${p.completionPct}%`}
                        className="h-1.5 w-20"
                        indicatorClassName={over ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-sky-400'}
                      />
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                        {p.completionPct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
