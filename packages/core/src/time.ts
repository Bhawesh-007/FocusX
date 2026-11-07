export interface Interval {
  startedAt: Date;
  endedAt: Date | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/** Duration of a single interval; open intervals use `now`. */
export function intervalDurationMs(interval: Interval, now: Date = new Date()): number {
  const end = interval.endedAt ?? now;
  return Math.max(0, end.getTime() - interval.startedAt.getTime());
}

/** Total duration across intervals; open intervals use `now`. */
export function sumIntervalsMs(intervals: Interval[], now: Date = new Date()): number {
  return intervals.reduce((sum, i) => sum + intervalDurationMs(i, now), 0);
}

/** Overlap of one interval with [range.start, range.end); open intervals use `now`. */
export function clipIntervalToRangeMs(interval: Interval, range: DateRange, now: Date = new Date()): number {
  const start = Math.max(interval.startedAt.getTime(), range.start.getTime());
  const end = Math.min((interval.endedAt ?? now).getTime(), range.end.getTime());
  return Math.max(0, end - start);
}

/** Total overlap of intervals with [range.start, range.end). */
export function sumIntervalsInRangeMs(intervals: Interval[], range: DateRange, now: Date = new Date()): number {
  return intervals.reduce((sum, i) => sum + clipIntervalToRangeMs(i, range, now), 0);
}

/** Pad a 2-digit number for clock display. */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** ms -> "HH:MM:SS" (hours unbounded, e.g. 25:10:00 for 25h). */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** minutes -> compact label: "1h 30m", "45m", "0m". */
export function formatMinutesLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  if (rest === 0) return `${h}h`;
  return `${h}h ${rest}m`;
}

/** signed ms delta -> "-15m left" / "+10m over" style label (unit granularity). */
export function formatDeltaLabel(ms: number): string {
  const minutes = Math.round(Math.abs(ms) / 60000);
  const label = formatMinutesLabel(minutes);
  return ms < 0 ? `-${label}` : `+${label}`;
}
