'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Skeleton } from '@focus/ui';
import { BarChart3, Sparkles, TriangleAlert } from 'lucide-react';
import { todayInTz } from '@/lib/dates';
import { apiFetch, ApiClientError } from '@/lib/api';
import type { DailyProgressResponse, WeeklyProgressResponse } from '@focus/core';
import { DateNav } from '@/components/dashboard/DateNav';
import { SummaryCards } from './SummaryCards';
import { DailyBarChart } from './DailyBarChart';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { TaskBreakdownTable } from './TaskBreakdownTable';

interface ProgressClientProps {
  timezone: string;
}

export function ProgressClient({ timezone }: ProgressClientProps) {
  const today = todayInTz(timezone);
  const [date, setDate] = useState(today);
  const [daily, setDaily] = useState<DailyProgressResponse | null>(null);
  const [weekly, setWeekly] = useState<WeeklyProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (day: string) => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, weeklyRes] = await Promise.all([
        apiFetch<DailyProgressResponse>(`/api/progress/daily?date=${day}`),
        apiFetch<WeeklyProgressResponse>(`/api/progress/weekly?endDate=${day}`),
      ]);
      setDaily(dailyRes);
      setWeekly(weeklyRes);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load progress.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            Your numbers
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">Progress</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
            Compare the time you planned against the time you actually studied.
          </p>
        </div>
      </section>

      <DateNav date={date} today={today} timezone={timezone} onChange={setDate} />

      {error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center">
          <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-destructive">Couldn&apos;t load your progress</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(date)}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : daily ? (
            <SummaryCards date={date} tasks={daily.tasks} />
          ) : null}

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[21rem] rounded-2xl" />
              <Skeleton className="h-[21rem] rounded-2xl" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <DailyBarChart tasks={daily?.tasks ?? []} />
              <WeeklyTrendChart data={weekly?.days ?? []} />
            </div>
          )}

          {loading ? (
            <Skeleton className="h-44 rounded-2xl" />
          ) : daily ? (
            <TaskBreakdownTable tasks={daily.tasks} />
          ) : null}
        </>
      )}
    </div>
  );
}
