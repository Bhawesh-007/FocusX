# Project Structure

> Stack: Turborepo + pnpm + Next.js (App Router) + TypeScript + Prisma + PostgreSQL

## 1. Overview

`focus` is a pnpm-workspace monorepo managed by Turborepo. One Next.js application (`apps/web`) consumes shared packages for domain logic, database access, UI primitives, and tooling config.

**Goals of this structure:**
- Keep feature code in `apps/web`, shared pure logic in `packages/core`.
- Isolate Prisma in `packages/db` so schema and client have a single source of truth.
- Reuse UI primitives via `packages/ui` without leaking feature logic.
- Enforce consistent TS/lint config via `packages/*-config`.

## 2. Root Layout

```
focus/
├── apps/
│   └── web/                  # Next.js application (routes, API, feature components)
├── packages/
│   ├── core/                 # Shared schemas, types, pure domain logic
│   ├── db/                   # Prisma schema, client, migrations, seed
│   ├── ui/                   # Reusable UI primitives (shadcn-based)
│   ├── typescript-config/    # Shared tsconfig presets
│   └── eslint-config/        # Shared ESLint presets
├── docs/
│   ├── dashboard.md
│   ├── project-structure.md  # this file
│   ├── architecture.md       # planned
│   ├── implementation.md     # planned
│   └── progress.md           # planned
├── .env.example
├── package.json              # root scripts + devDependencies
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## 3. Workspace Config

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json` (MVP pipeline)

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^build"] },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false }
  }
}
```

### `package.json` (root)

- `dev` → `turbo run dev`
- `build` → `turbo run build`
- `lint` → `turbo run lint`
- `typecheck` → `turbo run typecheck`

## 4. `apps/web` — Next.js Application

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (protected)/
│   │   │   └── user/
│   │   │       ├── layout.tsx          # auth guard + nav shell
│   │   │       ├── dashboard/page.tsx
│   │   │       └── progress/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts            # GET list, POST create
│   │   │   │   └── [taskId]/route.ts   # PATCH, DELETE
│   │   │   ├── sessions/
│   │   │   │   ├── route.ts            # POST start
│   │   │   │   ├── active/route.ts     # GET active session
│   │   │   │   └── [sessionId]/
│   │   │   │       ├── pause/route.ts
│   │   │   │       ├── resume/route.ts
│   │   │   │       └── stop/route.ts
│   │   │   └── progress/
│   │   │       ├── daily/route.ts
│   │   │       └── weekly/route.ts
│   │   ├── layout.tsx                  # root layout, providers
│   │   └── page.tsx                    # redirects to /login or /user/dashboard
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── tasks/{TaskList,TaskCard,TaskDialog,DeleteConfirm}.tsx
│   │   ├── timer/{ActiveTimerCard,TimerControls}.tsx
│   │   ├── progress/{DailyBarChart,WeeklyTrendChart,SummaryCards}.tsx
│   │   └── navigation/UserNav.tsx
│   ├── server/
│   │   ├── auth.ts                     # Auth.js config, callbacks
│   │   ├── services/
│   │   │   ├── task-service.ts
│   │   │   ├── session-service.ts
│   │   │   └── progress-service.ts
│   │   └── repositories/               # thin Prisma wrappers (optional)
│   └── lib/
│       ├── api.ts                      # fetch helpers, error envelope
│       ├── dates.ts                    # timezone & day-boundary utils
│       └── utils.ts                    # cn(), formatters
├── tests/                              # Vitest + Playwright
├── next.config.ts
├── tailwind.config.ts
├── components.json                     # shadcn
└── package.json
```

**Conventions:**
- Route groups `(auth)` and `(protected)` keep auth layout separate from app shell.
- API handlers validate with Zod from `packages/core`, check `getServerSession`, scope by `userId`.
- `server/services/*` hold business logic; route handlers stay thin.
- `lib/dates.ts` is the only place that converts between UTC storage and user-local display.

## 5. `packages/core` — Domain Logic

```
packages/core/
├── src/
│   ├── schemas/
│   │   ├── task.ts          # createTaskSchema, updateTaskSchema
│   │   ├── session.ts       # start/pause/resume/stop schemas
│   │   └── progress.ts      # query schemas for daily/weekly
│   ├── types/
│   │   ├── task.ts
│   │   ├── session.ts
│   │   └── progress.ts
│   ├── progress.ts          # pure calculations (planned/actual/remaining/completion)
│   ├── time.ts              # interval overlap, duration formatting
│   └── index.ts             # barrel exports
└── package.json
```

- No dependency on Next.js, Prisma, or `packages/db` / `packages/ui`.
- Unit-tested with Vitest; imported by both `apps/web` server and client where needed.

## 6. `packages/db` — Persistence

```
packages/db/
├── prisma/
│   ├── schema.prisma        # User, Task, StudySession, StudyInterval
│   ├── migrations/
│   └── seed.ts              # dev user + sample tasks
├── src/
│   └── index.ts             # re-exports PrismaClient singleton
└── package.json
```

- Single `PrismaClient` instance shared by `apps/web`.
- Migrations run via `pnpm --filter @focus/db db:migrate`.
- Seed creates one user (`test@focus.local` / bcrypt hash) for MVP login.

## 7. `packages/ui` — Design System

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   └── progress.tsx
│   ├── lib/utils.ts
│   └── index.ts
└── package.json
```

- Generic, feature-agnostic primitives only.
- Built on Tailwind + shadcn/ui + Radix.
- Feature components (TaskCard, TimerControls) live in `apps/web`, not here.

## 8. `packages/typescript-config` & `packages/eslint-config`

```
packages/typescript-config/
├── base.json        # strict, bundler resolution, path aliases
├── nextjs.json      # extends base + Next.js specifics
└── package.json

packages/eslint-config/
├── base.js
├── nextjs.js
└── package.json
```

- `apps/web` extends `nextjs` configs; `packages/*` extend `base`.
- Ensures one place to update strictness, import rules, and plugins.

## 9. Dependency Graph

```
apps/web  →  packages/core
apps/web  →  packages/db
apps/web  →  packages/ui
apps/web  →  packages/typescript-config (dev)
apps/web  →  packages/eslint-config (dev)

packages/core  →  (no app/package deps; only zod, date-fns)
packages/db    →  (prisma, @prisma/client)
packages/ui    →  (tailwind, radix, class-variance-authority)
```

No cycles. `packages/*` never import from `apps/*`.

## 10. Environment

### `.env.example`

```
DATABASE_URL="postgresql://user:pass@localhost:5432/focus?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-32-chars"
```

- `apps/web` reads env via `process.env` (validated at boot with Zod if desired).
- `packages/db` uses `DATABASE_URL` from root env.

## 11. Path Aliases (apps/web `tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@focus/core": ["../../packages/core/src"],
      "@focus/db": ["../../packages/db/src"],
      "@focus/ui": ["../../packages/ui/src"]
    }
  }
}
```

Prefer `@/*` for app-local imports and `@focus/*` for cross-package imports.

## 12. Conventions

- **Naming:** kebab-case files, PascalCase components, `*-service.ts` for services.
- **API:** REST under `/api/*`, Zod validation, typed `{ data, error }` envelope.
- **DB:** UTC timestamps, `userId` FK on every user-owned row, partial unique index for single active session.
- **Styling:** Tailwind only; no CSS modules in MVP.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`) — enforced by lint-staged if added later.

## 13. What This Structure Defers

- `apps/api` separate service (keep Next.js API routes for MVP)
- `packages/auth` extraction (keep Auth.js in `apps/web/server/auth.ts` until second app needs it)
- Turborepo remote caching (enable after CI is set up)

## 14. Related Docs

- `docs/dashboard.md` — dashboard feature spec
- `docs/architecture.md` — system, auth, data flow (planned)
- `docs/implementation.md` — phased build plan (planned)
- `docs/progress.md` — progress page spec (planned)
