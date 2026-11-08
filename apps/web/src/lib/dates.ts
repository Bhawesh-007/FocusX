/**
 * Timezone & day-boundary utils.
 * The ONLY place that converts between UTC storage and user-local display.
 */

/** Offset (ms) of `tz` at the given instant. Positive when tz is ahead of UTC. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - date.getTime();
}

/** Today's calendar date in the user's timezone, as YYYY-MM-DD. */
export function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** UTC instant of local midnight for the given YYYY-MM-DD in `tz` (DST-safe, two-pass). */
export function localMidnightUtc(dateStr: string, timeZone: string): Date {
  let guess = new Date(`${dateStr}T00:00:00Z`);
  for (let i = 0; i < 2; i++) {
    const offset = tzOffsetMs(guess, timeZone);
    guess = new Date(guess.getTime() - offset);
  }
  return guess;
}

/** UTC [start, end) range covering the local calendar day `dateStr` in `tz`. */
export function dayRangeUtc(dateStr: string, timeZone: string): { start: Date; end: Date } {
  const start = localMidnightUtc(dateStr, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Shift a YYYY-MM-DD date by n days (calendar arithmetic, timezone-independent). */
export function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Human label, e.g. "Sat, Nov 7, 2026". */
export function formatDateLabel(dateStr: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateStr}T12:00:00Z`));
}

/** Convert a Prisma `@db.Date` value (UTC midnight) to YYYY-MM-DD. */
export function dbDateToStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Convert YYYY-MM-DD to the Date Prisma expects for a `@db.Date` column. */
export function strToDbDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}
