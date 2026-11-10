'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { TaskDTO } from '@focus/core';
import { ChartTooltip } from './ChartTooltip';

const PLANNED_COLOR = '#94a3b8';
const ACTUAL_COLOR = '#3b82f6';
const OVERTIME_COLOR = '#f59e0b';

interface DailyBarChartProps {
  tasks: TaskDTO[];
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

/** Grouped bar chart: planned (target) vs actual minutes, per task. */
export function DailyBarChart({ tasks }: DailyBarChartProps) {
  const data = useMemo(
    () =>
      tasks.map((t) => ({
        name: t.title,
        planned: t.targetMinutes,
        actual: Math.round(t.actualMs / 60_000),
      })),
    [tasks],
  );

  if (tasks.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm font-medium">No tasks for this day</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Create a task on the dashboard to see planned vs. actual study time here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Daily comparison</h3>
          <p className="text-xs text-muted-foreground">Planned vs. actual, per task (minutes)</p>
        </div>
        <div className="flex items-center gap-3">
          <LegendDot color={PLANNED_COLOR} label="Planned" />
          <LegendDot color={ACTUAL_COLOR} label="Actual" />
        </div>
      </div>

      {/* Accessible data-table fallback for screen readers. */}
      <table className="sr-only">
        <caption>Planned vs actual study minutes per task</caption>
        <thead>
          <tr>
            <th>Task</th>
            <th>Planned minutes</th>
            <th>Actual minutes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.planned}</td>
              <td>{row.actual}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="h-64 text-muted-foreground" role="img" aria-label="Bar chart of planned versus actual study time per task">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="name"
              interval={0}
              tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `${v}m`}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
            <Bar dataKey="planned" name="Planned" fill={PLANNED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={30}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.actual > entry.planned ? OVERTIME_COLOR : ACTUAL_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
