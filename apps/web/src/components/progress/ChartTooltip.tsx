'use client';

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

/** Shared Recharts tooltip styled to match the app's card surfaces. */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined ? (
        <p className="mb-1.5 font-semibold text-popover-foreground">{label}</p>
      ) : null}
      {payload.map((entry) => (
        <div key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color ?? entry.fill ?? '#94a3b8' }}
            aria-hidden
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums text-popover-foreground">{entry.value}m</span>
        </div>
      ))}
    </div>
  );
}
