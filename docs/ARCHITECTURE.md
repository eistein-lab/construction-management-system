# Architecture

Status: PROPOSED. Stack fixed by your instruction §23: Next.js + TypeScript + React + Tailwind + shadcn/ui, PostgreSQL + Prisma, Auth.js/NextAuth, Vercel, GitHub.

## Application Architecture

Single Next.js app (App Router), server components for read-heavy pages (dashboard, reports), client components only where interaction requires it (forms, PR/PO builders). API surface via Next.js Route Handlers acting as the sole write path — no direct client-to-database access, ever, even from server components doing mutations (mutations always go through the service/domain layer below, not raw Prisma calls scattered in route handlers).

```
UI (React/shadcn) → Route Handlers (API) → Domain/Service Layer → Prisma → PostgreSQL
                                              ↑
                                   Calculation Layer (shared, pure functions)
```

## Domain/Service Layer

One service module per bounded context (`ppic`, `qsFormula`, `procurement`, `financial`, `progress`, `stock`, `reporting`, `import`, `notification`). Route handlers are thin — parse/validate input, call a service function, return its result. All authorization checks (role/scope per [USER_ROLES.md](USER_ROLES.md)) happen inside the service layer, not just hidden in the UI, so there is exactly one place that can approve a PR and it always checks role.

## Calculation Layer

The variance formula ([BUSINESS_RULES.md](BUSINESS_RULES.md)), the deviation formulas ([REPORTING_LOGIC.md](REPORTING_LOGIC.md)), the Purchase/Paid/Debt ladder ([FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md)), and the progress/stock rollups are implemented as **pure, unit-tested functions** in a shared module (e.g. `lib/calculations/`), imported by every consumer (PR service, PO service, dashboard service, report exports). *"UI components must not independently calculate financial/business KPIs."* No component computes a percentage or a variance inline — every number rendered is either stored or comes from a calculation-layer function. The CEO deviation thresholds (`>10%`, `≥5%`) are hardcoded constants inside this layer, not read from `ConfigThreshold` — see [DECISIONS.md](DECISIONS.md) D-008.

## Data Access

Prisma as the only ORM/query layer. Aggregations that would otherwise be N+1 (e.g. `StockBalance` per project) are done as single indexed queries (`groupBy`/raw SQL views where Prisma's query builder isn't sufficient), not computed by fetching all rows into the app and summing in JS — ties to the Performance section below.

## Authentication & Authorization

- **AuthN**: Auth.js (NextAuth) with the Credentials provider (email/password against `User.passwordHash`) — this is an internal company tool with no self-signup; users are provisioned by ADMIN. NEEDS_CONFIRMATION only if SSO (Google Workspace, Microsoft) is actually wanted instead — flagged [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-19, default assumption is credentials-based.
- **AuthZ**: role stored on the session (via NextAuth JWT callback), checked server-side in the service layer per the [USER_ROLES.md](USER_ROLES.md) matrix. Project-level scoping (`ProjectAssignment`) is checked alongside role for non-CEO/ADMIN users. Middleware provides a first-pass route guard (redirect unauthenticated users), but the authoritative check is always in the service layer — never trust middleware alone for data-level authorization.

## File Storage

Needed for: SPV progress evidence photos, Surat Jalan scans/attachments, import source files. Vercel deployment implies files cannot sit on local disk. Provider is `NEEDS_CONFIRMATION` — candidates: Vercel Blob (simplest, same-platform) or S3-compatible storage. See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-10. Default assumption for planning: Vercel Blob, given it requires no extra account/infra setup and the stack is already committed to Vercel.

## Import Architecture

See [IMPORT_LOGIC.md](IMPORT_LOGIC.md) for the PARSE→NORMALIZE→VALIDATE→PREVIEW→COMMIT pipeline. Implementation note: parsing happens server-side (route handler receiving the uploaded file), never in the browser, so validation logic isn't duplicated client/server and large files don't block the UI thread. Bulk inserts at COMMIT use batched `createMany` (or multi-row SQL), never a loop of per-row `create` calls — directly required by your Performance principle (§22: "not one database call per imported row").

## Reporting Architecture

Dashboard aggregates are computed server-side (server components fetching through the reporting service, which itself calls the calculation layer over data fetched via efficient, indexed, pre-aggregated queries) and streamed to the client already computed — the client never re-derives a KPI from raw rows.

## Deployment Architecture

- GitHub repository (to be created — this working directory is not yet a git repo; see [RISKS.md](RISKS.md) R-01) → Vercel (connected for auto-deploy on push to `main`, preview deployments on PRs/branches).
- PostgreSQL: a managed instance reachable from Vercel (e.g. Vercel Postgres, Neon, Supabase, or Railway) — provider not yet chosen, `NEEDS_CONFIRMATION` (Q-20), needed before Day 1 so migrations have somewhere to run.
- Prisma Migrate for schema changes, applied as part of the deployment pipeline (never manual schema edits against production).
- Environment variables (DB connection string, NextAuth secret, file storage credentials) managed via Vercel project settings, never committed to the repo.

## Performance Principle (per instruction §22)

- Every list view is server-side paginated and filtered (no "fetch all PRs and filter in the browser").
- Every FK relationship that's queried in aggregate has a database index (Prisma schema-level `@@index`).
- Import commits are batched, not per-row.
- Dashboard KPIs are computed via aggregate queries (`SUM`/`groupBy` at the database), not by loading full row sets into application memory.
- No calculation is duplicated per-component; the calculation layer's outputs are computed once per request and passed down.
