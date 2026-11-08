# Progress — Feature Specification

> Route: `/user/progress` | Scope: MVP | Status: Planned

## 1. Overview

The progress page is the read-only analytics view for the user. It answers: "How much did I plan to study versus how much did I actually study, and how does that compare to my ideal?" It is derived entirely from `Task` (planned) and `StudyInterval` (actual) data — no manual logging.

It complements `dashboard.md` (where time is captured) by visualizing the same data for a single day and for a 7-day trend.

## 2. Goals

- Show daily planned vs. actual study time per task and in total.
- Show weekly trend of planned vs. actual time and completion.
- Compare actual progress against the ideal baseline (MVP: sum of `Task.targetMinutes` per day).
- Make it easy to spot under-study, over-study, and missed tasks at a glance.
- Allow date navigation without re-entering data.

## 3. Route & Access

- **Path:** `/user/progress` (protected group `(protected)/user`, sibling to `/user/dashboard`)
- **Auth:** Requires valid Auth.js session; unauthenticated → `/login`.
- **Layout:** Reuses `user/layout.tsx` shell (same nav, user info, sign-out as dashboard).
- **Data isolation:** All queries scoped by `session.user.id`; `date`/`endDate` query params are validated with Zod and interpreted in `User.timezone`.

## 4. Feature Breakdown

### 4.1 Date Controls

- Date picker + prev/next day buttons + "Today" shortcut.
- Weekly view anchored by `endDate` (defaults to today); shows last 7 local days inclusive.
- URL-synced query state: `?date=YYYY-MM-DD` for daily, `?endDate=YYYY-MM-DD` for weekly, so refresh and share work.
- Changing the date triggers parallel fetches to daily + weekly endpoints with skeleton states.

### 4.2 Summary Cards (Daily)

Four cards at the top of the daily section:

| Card | Formula |
|---|---|
| **Planned** | `Σ Task.targetMinutes × 60` for selected date |
| **Studied** | `Σ overlap(StudyInterval, local day)` per day (see §6) |
| **Completion** | `studied / planned × 100` — ring capped at 100%, numeric shows 120% if over |
| **Tasks Done** | `count(Task.status = COMPLETED)` / `count(Task)` for that date |

- All durations formatted as `Hh Mm` (e.g., `2h 15m`) with `HH:MM:SS` on hover.
- Overtime surfaced as `+15m over` badge; remaining as `−30m left`.
- Empty day: planned = 0 → cards show `0h` and completion `—` with helper text.

### 4.3 Daily Charts — Per-Task Comparison

- **Chart type:** Grouped vertical bar chart (Recharts `BarChart`).
- **X-axis:** Task titles (truncated, full on tooltip).
- **Y-axis:** Minutes.
- **Series:**
  - `Planned` — `targetMinutes` per task (ideal baseline, muted color).
  - `Actual` — clipped interval overlap for that task/day (accent color).
- **Behavior:**
  - One group per task; tasks with no time still show a planned bar + 0 actual.
  - Tooltip: `Task — Planned 60m / Actual 42m (70%)`.
  - Bar for `actual > planned` extends beyond `planned` with distinct hatch/opacity to signal overtime.
  - Responsive: horizontal scroll or `BarChart layout="vertical"` under 640px.
  - Accessible: pattern/opacity not color alone; `aria-label` and data table fallback (`<table>` hidden visually, available to screen readers).

### 4.4 Weekly Trend — Planned vs. Actual

- **Chart type:** Line or area chart (Recharts `AreaChart` / `LineChart`) with 7 points (Mon–Sun or last-7-days; MVP: last 7 days ending at `endDate`).
- **X-axis:** Local date (`MM/DD` or weekday short).
- **Y-axis:** Minutes per day.
- **Series:**
  - `Planned` — dashed line (ideal).
  - `Actual` — solid line with dots.
- **Extras:**
  - Shaded gap between lines to emphasize deficit/surplus.
  - `ReferenceLine` at 100% if a percentage view is toggled (stretch: toggle between minutes and %).
  - Click a day point → updates the daily section's `date` (deep link to `?date=...`).

### 4.5 Task-Level Breakdown Table (Daily)

Below the bar chart, a table/list:

- Columns: Task | Planned | Actual | Remaining/Over | Status | Completion bar
- Row states match `dashboard.md` §4.6 but read-only here.
- Sorted by `createdAt`; future: sort by completion %.

### 4.6 Ideal vs. Actual Semantics (MVP)

- **Ideal (MVP):** Derived, not separately authored — `ideal = Σ targetMinutes` for that day's tasks.
- UI labels say "Planned (ideal)" to set correct expectation.
- Placeholder for post-MVP "Ideal Routine Template" — a reusable weekly template that would replace per-day tasks as the ideal source. The progress charts already consume an `idealMinutes` field, so switching source is non-breaking.

## 5. UI Components (apps/web/src/components/)

- `components/progress/SummaryCards.tsx` — 4-card grid + overtime logic
- `components/progress/DailyBarChart.tsx` — grouped bars, overtime style, empty state
- `components/progress/WeeklyTrendChart.tsx` — 7-day line/area, click-through
- `components/progress/TaskBreakdownTable.tsx`
- `components/progress/DateNavigator.tsx` — shared with dashboard's date controls
- `components/progress/ProgressPageClient.tsx` — orchestrates fetches, URL state, skeletons

Primitives (Card, ChartContainer, Tooltip, Skeleton, Table) from `packages/ui` + `recharts`.

## 6. Data & Calculations

### 6.1 Sources (via `packages/db`)

- `Task { id, userId, title, scheduledDate, targetMinutes, status }`
- `StudySession { id, userId, taskId, status }`
- `StudyInterval { id, sessionId, startedAt, endedAt }` — `endedAt = null` means "now" (running timer)

### 6.2 Endpoints Consumed

- `GET /api/progress/daily?date=YYYY-MM-DD` → `{ date, timezone, totals: { plannedSec, actualSec, remainingSec, overtimeSec, completionPct, tasksTotal, tasksCompleted }, tasks: [{ taskId, title, plannedSec, actualSec, status }] }`
- `GET /api/progress/weekly?endDate=YYYY-MM-DD` → `{ endDate, days: [{ date, plannedSec, actualSec, completionPct } × 7] }`

Both reuse `packages/core/progress.ts` pure functions so dashboard summary and progress report can never diverge.

### 6.3 Core Formulas (`packages/core`)

```
plannedSec   = task.targetMinutes * 60
actualSec    = Σ max(0, min(interval.endedAt ?? now, dayEnd) - max(interval.startedAt, dayStart))
remainingSec = max(plannedSec - actualSec, 0)
overtimeSec  = max(actualSec - plannedSec, 0)
completionPct= plannedSec === 0 ? null : (actualSec / plannedSec) * 100
day bounds   = [localMidnight, localMidnight + 24h) in User.timezone, converted to UTC for DB query
```

- Midnight crossover handled by overlap clipping, not by assigning a session to a single day.
- All timestamps stored UTC; conversion only in `lib/dates.ts`.

## 7. Validation & Error Handling

- Query params validated with Zod (`date` must be `YYYY-MM-DD`, not NaN, within reasonable window).
- Invalid date → 400 with typed error envelope; UI falls back to today and shows toast.
- Auth failure → redirect to `/login?callbackUrl=/user/progress`.
- Empty data → friendly empty states, not blank charts (see §8).
- Fetch failure → inline retry button per section (daily vs weekly fail independently).

## 8. States to Design

- **Loading:** Skeleton cards + chart skeletons (animated pulses, not spinners).
- **Empty (no tasks for day):** Illustration + "No tasks planned for this day — create one on the dashboard" + CTA link.
- **Empty (tasks but no study yet):** Bars show planned only; weekly actual line at 0; helper text "Start a timer on the dashboard to see progress."
- **Error:** Per-section error card with Retry.
- **Overtime:** Visual distinction (hatch/opacity + badge) + tooltip note.
- **Single-task day:** Bar chart still renders single group (no collapse).

## 9. Non-Functional Requirements

- **Responsiveness:** 360px–1280px; cards 1→2→4 columns; charts use `ResponsiveContainer`.
- **Accessibility:** Keyboard-navigable date controls, chart `aria-label` + data table alternative, color + pattern for planned/actual, live region for summary updates.
- **Performance:** No polling; fetch on `date`/`endDate` change only. Weekly fetch is 7-day aggregate in one query (single Prisma `groupBy`/raw query per endpoint).
- **Consistency:** Reuse `progress.ts` from `packages/core`; never duplicate completion math in components.

## 10. Out of Scope for Progress MVP

- Custom ideal routine / weekly template builder (post-MVP)
- Manual time corrections
- Export to CSV/PDF
- Streaks, badges, goals, notifications
- Pomodoro-specific reports
- Per-hour heatmap / calendar view
- Comparison across users

## 11. Acceptance Criteria (Progress)

- [ ] Authenticated user sees only their own data; unauthenticated redirects to `/login`.
- [ ] Daily summary cards show correct planned, studied, remaining, and completion for selected date.
- [ ] Bar chart groups planned vs. actual per task; overtime is visibly distinct.
- [ ] Weekly chart shows 7 days of planned vs. actual with correct local-day boundaries.
- [ ] Clicking a weekly point updates the daily view.
- [ ] Midnight-crossing sessions are attributed to the correct local days.
- [ ] Empty, loading, and error states render without console errors.
- [ ] Totals match dashboard's daily summary for the same date.
- [ ] Charts are keyboard and screen-reader accessible (table fallback + labels).

## 12. Docs Inventory

What lives in `/docs` and what is planned:

| File | Purpose | Status |
|---|---|---|
| `dashboard.md` | Feature spec for `/user/dashboard` — tasks, time allocation, timer, states, APIs | Done |
| `project-structure.md` | Turborepo + pnpm layout, `apps/web` and `packages/*` responsibilities, dependency graph, conventions | Done |
| `progress.md` | This file — spec for `/user/progress` charts, summaries, calculations, and states | Done (this file) |
| `architecture.md` | System architecture: auth (Auth.js), DB schema & constraints, API conventions, timezone strategy, timer state machine, data flow | Planned |
| `implementation.md` | Phased build plan: scaffold → auth → tasks → timer → progress → polish, with tasks and acceptance gates | Planned |
| `agent.md` | Working agreement: frontend-only default, ask-before-touching DB/backend/deps | Done |

**Planned docs (next):**
- `architecture.md` will be the technical reference for anyone implementing the routes and services.
- `implementation.md` will be the step-by-step execution checklist derived from `architecture.md`.

Related code locations referenced by these docs: `apps/web/src/app/(protected)/user/**`, `apps/web/src/server/**`, `packages/core/**`, `packages/db/prisma/schema.prisma`.
