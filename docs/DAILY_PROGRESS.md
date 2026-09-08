# Daily Progress Log

Status: LIVE. One entry per implementation day, per [CLAUDE.md](../CLAUDE.md) §Daily Workflow.

## Day 1 — Foundation

- **Date**: 2026-09-08
- **Scope**: Next.js/TS/Tailwind/shadcn scaffold, Prisma schema for Identity & Access + Project Structure ([DATA_MODEL.md](DATA_MODEL.md) §1–2), NextAuth (Auth.js v5) credentials auth, server-side role-based route guards, seed script, Project/SubPhase/Work CRUD.
- **Status**: **PARTIALLY COMPLETE** — all application code written, locally validated (lint + build + schema validate all pass); blocked on live deployment (GitHub push, Vercel deploy, Supabase migration/seed/runtime verification) pending credentials requested from the user.
- **Database changes**: Initial `prisma/schema.prisma` written (User, Role enum, ProjectAssignment, Project, SubPhase, Work). No migration has been applied yet — no live Postgres connection available (Docker Desktop present locally but not startable in this environment; Supabase connection string not yet provided).
- **Business logic implemented**: Role enum matches [USER_ROLES.md](USER_ROLES.md) exactly (9 roles). `ProjectAssignment` scoping: CEO/ADMIN see all projects, everyone else sees only assigned projects (Q-02 default assumption). Project/SubPhase/Work create+edit restricted to PPIC per the permission matrix; no delete anywhere, matching [BUSINESS_RULES.md](BUSINESS_RULES.md) §Historical Integrity (the matrix grants no Delete permission to any role for these entities). No `NEEDS_CONFIRMATION` items block Day 1 scope.
- **Notable implementation finding**: this environment's Next.js (16.3.4), Prisma (7.10.0), and shadcn/ui versions are all newer than training-data knowledge and contain breaking changes not yet reflected in defaults — see "Known issues / carry-forward" below. Confirmed against the framework's own bundled docs (`node_modules/next/dist/docs`, `AGENTS.md`) and Prisma's auto-installed agent skill references before writing code.
- **Tests**: `npm run lint` — clean. `npm run build` — succeeds (compiles, type-checks, generates all routes as dynamic). No automated test suite exists yet (none required until Day 1+ per [TEST_MATRIX.md](TEST_MATRIX.md); Day 1's matrix rows — auth/role-guard checks — are written as manual test steps below since there's no live DB yet to run them against).
- **Commit**: not yet created — pending final review pass once a live DB is available to smoke-test against, per your "run tests" instruction.
- **Deployment**: **BLOCKED**. Needs, from the user: (1) a GitHub repo URL to push to, (2) a Vercel token, (3) a Supabase Postgres connection string. See the Day 1 completion report for exact instructions.
- **Known issues / carry-forward**:
  - Next.js 16 renamed `middleware.ts` → `proxy.ts` (file and export name) — implemented as `src/proxy.ts`, not `middleware.ts`. Future days must use this convention too.
  - Prisma 7 removed connection URLs from `schema.prisma` entirely (moved to `prisma7.config.ts` for CLI use) and now **requires an explicit driver adapter** on `PrismaClient` — implemented via `@prisma/adapter-pg`. Any future direct `new PrismaClient()` call anywhere in the codebase must go through `src/lib/prisma.ts`, never construct its own client.
  - Prisma 7's `prisma` CLI package carries transitive `deepmerge-ts`/`mysql2` high-severity advisories (`npm audit`) — both are dev-tooling paths unrelated to our Postgres-only runtime, not fixed here to avoid downgrading to a breaking older Prisma version over an unreachable vulnerability; revisit if Prisma ships a patched 7.x.
  - shadcn/ui's `Select` component is now built on `@base-ui/react` rather than Radix — functionally equivalent for our usage (native `name`/`required` props on the root), noted here only because it's a dependency-shape change from what's commonly documented.
- **Approval status**: awaiting your review of this Day 1 report before Day 2 begins (per your instruction, Day 2 does not start regardless).
