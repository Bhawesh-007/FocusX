'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { WeeklyDayProgress } from '@focus/core';
import { ChartTooltip } from './ChartTooltip';

const PLANNED_COLOR = '#94a3b8';
const ACTUAL_COLOR = '#3b82f6';

interface WeeklyTrendChartProps {
  data: WeeklyDayProgress[];
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="h-0.5 w-4 rounded-full"
        style={{ background: color, ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` } : {}) }}
        aria-hidden
      />
      {label}
    </span>
  );
}

function shortLabel(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** 7-day planned vs actual trend (minutes per day). */
export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const points = useMemo(
    () =>
      data.map((d) => ({
        label: shortLabel(d.date),
        planned: d.plannedMinutes,
        actual: d.studiedMinutes,
      })),
    [data],
  );

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">7-day trend</h3>
          <p className="text-xs text-muted-foreground">Planned vs. actual, per day (minutes)</p>
        </div>
        <div className="flex items-center gap-3">
          <LegendDot color={PLANNED_COLOR} label="Planned" dashed />
          <LegendDot color={ACTUAL_COLOR} label="Actual" />
        </div>
      </div>

      <table className="sr-only">
        <caption>Planned vs actual study minutes over the last seven days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Planned minutes</th>
            <th>Actual minutes</th>
          </tr>
        </thead>
        <tbody>
          {points.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.planned}</td>
              <td>{row.actual}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="h-64 text-muted-foreground"
        role="img"
        aria-label="Line chart of planned versus actual study time over the last seven days"
      >
        {points.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="actualArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={ACTUAL_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.2)" />
              <XAxis
                dataKey="label"
                interval="preserveStartEnd"
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
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.4)' }} />
              <Area
                type="monotone"
                dataKey="planned"
                name="Planned"
                stroke={PLANNED_COLOR}
                strokeDasharray="5 5"
                fill="transparent"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={ACTUAL_COLOR}
                fill="url(#actualArea)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
