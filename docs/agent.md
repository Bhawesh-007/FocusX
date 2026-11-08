# Agent Guidelines

## Scope
- Only perform frontend work by default.
- Frontend scope: `apps/web/src/components/**`, `apps/web/src/app/**` (UI/pages), `packages/ui/**`, styling (Tailwind), client logic, and static assets.
- Do not modify backend, database, or infra unless explicitly requested.

## Ask Before Acting
Whenever a task requires any of the following, **stop and ask the user for confirmation** before proceeding:

- Installing, updating, or removing any package/dependency (`pnpm add`, `npm install`, etc.)
- Configuring or touching the database (`packages/db/**`, `prisma/schema.prisma`, migrations, `seed.ts`, `DATABASE_URL`, Prisma Client generation)
- Backend/API changes (`apps/web/src/app/api/**`, `apps/web/src/server/**`, `packages/core/**` if it affects server logic, auth config `auth.ts`)
- Environment variables, secrets, or deployment config (`.env*`, `turbo.json` pipeline changes, `pnpm-workspace.yaml`)

## Do Not Assume Backend Behavior
- **Never assume how the backend should function.** Do not infer API contracts, auth flows, database schema, validation rules, or business logic from frontend needs alone.
- **Always ask the user about backend intent first** before proposing or implementing any backend decision — including endpoint design, data models, status enums, error shapes, and timezone handling.
- **Do not take key backend decisions autonomously.** For any decision that affects persistence, security, or cross-feature consistency, present options and trade-offs, recommend one, and wait for explicit user approval.
- If frontend work is blocked by an undefined backend detail, add a `TODO(backend-clarification):` comment describing the open question and surface it to the user instead of choosing a default.

## Strict Task Boundaries
- Never do anything extra that the user did not explicitly specify.
- Only edit/create files directly related to the routes the user has specified for the current task.
- Do not refactor unrelated routes, shared layouts, or components outside the specified route scope unless the user explicitly includes them.
- Do not add features, polish, or "nice-to-have" improvements beyond the task description. If something seems useful but was not requested, propose it and wait for approval.

## Workflow
1. Implement the frontend change strictly within the specified route(s) using existing dependencies and mock/fixture data if backend is not ready.
2. If blocked by missing package or backend/database setup, describe what is needed, why, and the exact command/config proposed, then wait for user approval.
3. Never auto-install or auto-configure; prefer `TODO` comments referencing required backend/package work.
4. After finishing, list which files/routes were touched and confirm no out-of-scope files were modified.

## Examples
- Need `framer-motion` for animation → ask first.
- Need new Prisma model/column → ask first.
- Need new API endpoint for UI data → propose contract and ask first.
