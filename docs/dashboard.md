# Dashboard — Feature Specification

> Route: `/user/dashboard` | Scope: MVP | Status: Planned

## 1. Overview

The dashboard is the primary workspace for daily productivity. It lets the authenticated user plan tasks for a day, allocate target study time to each task, track actual study time with a server-backed timer, and see immediate progress toward the daily ideal.

It is the only place where time tracking happens. `/user/progress` is read-only reporting.

## 2. Goals

- Plan what to study today and how long each task should take.
- Start / pause / resume / stop a timer without losing time on reload.
- See at a glance: planned vs. actual vs. remaining time per task and for the whole day.
- Manage tasks (create, edit, delete, complete) with minimal friction.

## 3. Route & Access

- **Path:** `/user/dashboard` (protected route group `(protected)/user`)
- **Auth:** Requires valid Auth.js session; unauthenticated users redirect to `/login`.
- **Layout:** Shared `user/layout.tsx` provides sidebar/top-nav, user info, and sign-out.
- **Data isolation:** Every query is scoped by `userId` from the session — never from client input.

## 4. Feature Breakdown

### 4.1 Daily Context Header

- Current date display (formatted in user's timezone, `User.timezone`).
- Date picker / day navigator (prev, next, today) to view other days' task plans.
- Daily summary strip:
  - Total planned time (sum of `Task.targetMinutes` for selected date)
  - Total studied time (sum of overlapped `StudyInterval` durations for that day)
  - Remaining time
  - Completion % (capped at 100% for ring, uncapped numeric for overtime visibility)

### 4.2 Task Management (CRUD)

| Action | Details |
|---|---|
| **Create** | Dialog with `title`, `scheduledDate` (defaults to selected day), `targetMinutes`. Validation via Zod in `packages/core`. |
| **Read / List** | Filtered by `scheduledDate` and `userId`. Sorted by `createdAt` or manual order. |
| **Update** | Edit title, date, target minutes. Also mark as `PENDING ↔ COMPLETED`. |
| **Delete** | Confirm dialog, hard delete scoped by `userId`. Cancels active session if it belongs to deleted task. |
| **Validation** | Title: 1–120 chars, non-empty. `targetMinutes`: integer, 1–1440, required. `scheduledDate`: valid ISO date, not far future (configurable). |

- Optimistic UI with rollback on API failure.
- Empty state: illustration + "Create your first task for today".
- Loading state: skeleton list.
- Error state: inline retry for fetch failures.

### 4.3 Time Allocation

- Each task card shows:
  - Title and status badge
  - Target duration (e.g., `60 min`)
  - Actual duration (live-updating when its session is active/paused)
  - Remaining / overtime badge (`−15 min left` / `+10 min over`)
  - Progress bar or mini-ring per task
- Target time is the "ideal graph" baseline for MVP — no separate template yet.

### 4.4 Study Timer

#### Single active session constraint
- Only one `ACTIVE` or `PAUSED` `StudySession` per user enforced by DB partial unique index and service-layer check.
- Starting a new timer while one is active returns `409 Conflict` with active session info.

#### Controls per task
- **Start** — `POST /api/sessions` with `taskId`. Creates `StudySession` (status `ACTIVE`) + first `StudyInterval` (open `endedAt = null`).
- **Pause** — `POST /api/sessions/[sessionId]/pause`. Closes current interval (`endedAt = now`).
- **Resume** — `POST /api/sessions/[sessionId]/resume`. Opens new interval.
- **Stop** — `POST /api/sessions/[sessionId]/stop`. Closes interval and marks session `COMPLETED`.

#### Client behavior
- Local tick every 1s for display; sync with `/api/sessions/active` on mount and every 30s.
- Active session restoration: on page reload, `GET /api/sessions/active` reconstructs elapsed time from server `startedAt` + intervals.
- Debounce / disable buttons while request in flight; handle `409`, `404`, `401`.
- Cross-device: if another device started a session, dashboard shows that session's task as active.

#### Duration calculation
- Server is source of truth: `sum(interval.endedAt ?? now — interval.startedAt)`.
- Handles midnight crossover via day-overlap clipping in report logic (shared with `/user/progress`).

### 4.5 Active Timer Card (Shared)

- Prominent card/panel when a session is active or paused:
  - Task title
  - Elapsed time (HH:MM:SS)
  - State label: `Studying` / `Paused`
  - Pause / Resume / Stop actions
- Collapses when no active session.

### 4.6 Task List Item States

Each row reflects timer + task status:

- `Idle` — no session for this task, show Start
- `Active` — this task is the active session, show Pause / Stop, highlight
- `Paused` — this task is paused, show Resume / Stop
- `Blocked` — another task is active, Start disabled with tooltip
- `Completed` — task marked done, timer disabled, shows final actual time

### 4.7 Navigation & Shell

- App shell from `user/layout.tsx`: logo, Dashboard / Progress tabs, user email, sign-out.
- Mobile: bottom tab bar or collapsible sidebar.
- Breadcrumbs not needed for MVP.

## 5. UI Components (apps/web/src/components/)

- `components/tasks/TaskList.tsx` — list + empty/loading/error
- `components/tasks/TaskCard.tsx` — per-task display + actions
- `components/tasks/TaskDialog.tsx` — create/edit form (React Hook Form + Zod)
- `components/tasks/DeleteConfirm.tsx`
- `components/timer/ActiveTimerCard.tsx`
- `components/timer/TimerControls.tsx`
- `components/progress/DailySummaryStrip.tsx` — reused summary logic from `packages/core/progress.ts`
- `navigation/UserNav.tsx`

Generic primitives (Button, Dialog, Input, Badge, Progress, Skeleton) come from `packages/ui`.

## 6. Data & API Dependencies

### Models (via `packages/db`)
- `Task { id, userId, title, scheduledDate, targetMinutes, status, createdAt, updatedAt }`
- `StudySession { id, userId, taskId, status, startedAt, endedAt }`
- `StudyInterval { id, sessionId, startedAt, endedAt }`

### Endpoints consumed
- `GET /api/tasks?date=YYYY-MM-DD`
- `POST /api/tasks`
- `PATCH /api/tasks/[taskId]`
- `DELETE /api/tasks/[taskId]`
- `GET /api/sessions/active`
- `POST /api/sessions`
- `POST /api/sessions/[sessionId]/pause`
- `POST /api/sessions/[sessionId]/resume`
- `POST /api/sessions/[sessionId]/stop`

All inputs validated with Zod schemas in `packages/core/schemas`.

## 7. Validation & Error Handling

- Client: Zod + React Hook Form inline errors.
- Server: re-validate, check ownership (`task.userId === session.user.id`), return typed error envelope.
- Timer race conditions: idempotent pause/resume/stop — second call returns current state, not error.
- Network failure during tick: UI keeps local count, reconciles on next successful sync.
- Auth expiry mid-action: redirect to `/login` with preserved return URL.

## 8. States to Design

- Loading (initial fetch, mutation pending)
- Empty (no tasks for day)
- Error (fetch failed, mutation failed)
- Active / Paused / Blocked / Completed (per task)
- Offline (optional MVP stretch: queue stop action)

## 9. Non-Functional Requirements

- **Responsiveness:** Usable at 360px–1280px; charts/summaries stack on mobile.
- **Accessibility:** Keyboard-navigable dialogs, ARIA for timer live region, color not sole indicator for remaining/overtime.
- **Performance:** No polling faster than 30s; local tick only.
- **Timezones:** Store UTC, render in `User.timezone`; day boundaries use user's local midnight.

## 10. Out of Scope for Dashboard MVP

- Recurring tasks / templates (ideal routine builder)
- Manual time entry / editing intervals
- Pomodoro mode
- Task categories, priorities, tags
- Drag-to-reorder
- Streaks / gamification
- Daily report export

## 11. Acceptance Criteria (Dashboard)

- [ ] Authenticated user sees only their tasks for the selected date.
- [ ] User can create a task with title, date, and target minutes.
- [ ] User can edit title/date/target and mark task completed.
- [ ] User can delete a task (with confirmation).
- [ ] User can start a timer for a task; only one timer runs at a time.
- [ ] Pause / resume preserves elapsed time correctly.
- [ ] Stop finalizes session; actual time appears on task card.
- [ ] Reloading the page restores the active/paused timer.
- [ ] Daily summary totals match progress report calculations.
- [ ] All validation errors are shown inline; no unhandled API errors.
- [ ] No console errors on happy path.

## 12. Related Docs (Planned)

- `docs/architecture.md` — monorepo, DB, auth, API conventions
- `docs/implementation.md` — phased build plan
- `docs/progress.md` — progress report page spec (next)
