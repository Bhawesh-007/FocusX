'use client';

import { Badge, Button } from '@focus/ui';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDaysStr, formatDateLabel } from '@/lib/dates';

interface DateNavProps {
  date: string;
  today: string;
  timezone: string;
  onChange: (date: string) => void;
}

export function DateNav({ date, today, timezone, onChange }: DateNavProps) {
  const isToday = date === today;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 p-2.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(addDaysStr(date, -1))}
          aria-label="Previous day"
          className="rounded-full"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(addDaysStr(date, 1))}
          aria-label="Next day"
          className="rounded-full"
        >
          <ChevronRight aria-hidden />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Button variant="outline" size="sm" onClick={() => onChange(today)} disabled={isToday} className="rounded-full">
          Today
        </Button>
      </div>
      <p className="flex items-center gap-2 px-2 text-sm font-medium" aria-live="polite">
        <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
        {formatDateLabel(date, timezone)}
        {isToday ? (
          <Badge variant="secondary" className="font-medium">
            Today
          </Badge>
        ) : null}
      </p>
    </div>
  );
}
