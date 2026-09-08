# Daily Progress Log

Status: LIVE. One entry per implementation day, per [CLAUDE.md](../CLAUDE.md) §Daily Workflow.

## Day 1 — Foundation

- **Date**: 2026-09-08
- **Scope**: Next.js/TS/Tailwind/shadcn scaffold, Prisma schema for Identity & Access + Project Structure ([DATA_MODEL.md](DATA_MODEL.md) §1–2), NextAuth (Auth.js v5) credentials auth, server-side role-based route guards, seed script, Project/SubPhase/Work CRUD.
- **Status**: **COMPLETE**. Deployed, migrated, seeded, and manually verified end-to-end in production.
- **Database changes**: Initial migration `20260908101644_init` applied to Supabase Postgres (User, Role/ProjectStatus enums, ProjectAssignment, Project, SubPhase, Work). Seeded 9 demo users (one per role).
- **Business logic implemented**: Role enum matches [USER_ROLES.md](USER_ROLES.md) exactly (9 roles). Project/SubPhase/Work create+edit restricted to PPIC; no delete anywhere (matches the permission matrix — no role has Delete on these entities, consistent with [BUSINESS_RULES.md](BUSINESS_RULES.md) §Historical Integrity). Visibility: only SPV is `ProjectAssignment`-scoped, every other role sees all projects — see the D-010 bug below.
- **Bugs found and fixed during manual QA** (all before this report, all deployed):
  1. **Project visibility over-scoping.** Implemented as "CEO/ADMIN see everything, everyone else needs an assignment," but [USER_ROLES.md](USER_ROLES.md)'s own matrix only marks SPV as assignment-scoped. Caught immediately when a PPIC user couldn't see a project they'd just created (the write had succeeded — verified directly against the database — only the read was wrong). Fixed in `src/lib/auth-guard.ts`; logged as [DECISIONS.md](DECISIONS.md) D-010; the `OPEN_QUESTIONS.md` entry that caused the wrong default has been removed as resolved.
  2. **Unencoded special characters in the DB password** broke connection-string parsing (a bare `#` starts a URL fragment). Fixed by percent-encoding.
  3. **Supabase's direct-connection host is IPv6-only**, unreachable from this environment — switched to the session pooler connection string (also required for Prisma Migrate, since the transaction pooler doesn't support prepared statements).
  4. **Stale UI copy and a cosmetic Select bug**: the team-assignment section's help text still described the old (wrong) scoping after bug #1 was fixed; separately, the assign-user dropdown displayed the selected user's raw UUID instead of their name (Base UI's `SelectValue`, unlike Radix's, doesn't infer a label from `SelectItem` children — needs an explicit lookup). Both fixed and verified live.
- **Tests**: `npm run lint` — clean. `npm run build` — succeeds. No automated suite yet (none required before later days per [TEST_MATRIX.md](TEST_MATRIX.md)). Manual verification performed directly on the live production URL (see checklist below — all steps passed).
- **Commits** (all pushed to `main`):
  - `e4c5104` — foundation scaffold, auth, role guards, project structure CRUD
  - `26d8a91` — initial migration applied, `.env.local` loading for Prisma CLI
  - `d3663a8` — project visibility fix (D-010) + `.vercelignore`
  - `ade427f` — stale copy + Select display fix
- **Deployment**: **LIVE** at **https://construction-management-system-beta.vercel.app**. GitHub: `eistein-lab/construction-management-system`. Vercel project: `blueprint-7066/construction-management-system`. GitHub↔Vercel auto-deploy-on-push is not yet connected (the CLI-driven connection attempt failed — it needs the Vercel GitHub App authorized interactively from the dashboard); every deploy so far has been a manual `vercel deploy --prod`. Not a blocker, just a carry-forward convenience item.
- **Known issues / carry-forward**:
  - Next.js 16 renamed `middleware.ts` → `proxy.ts` (file and export name) — implemented as `src/proxy.ts`. Future days must use this convention.
  - Prisma 7 requires an explicit driver adapter (`@prisma/adapter-pg`) on `PrismaClient` and moved connection URLs out of `schema.prisma` into `prisma7.config.ts` — every future `PrismaClient` construction must go through `src/lib/prisma.ts`, never instantiate its own.
  - `npm audit` shows 4 high-severity advisories, all in `prisma` CLI's own dev-tooling dependencies (`deepmerge-ts`, `mysql2`) — unreachable in our Postgres-only runtime, not fixed to avoid a breaking downgrade.
  - GitHub↔Vercel auto-deploy not connected (see Deployment above) — future days will need a manual `vercel deploy --prod` at the end, or you can connect it once from the Vercel dashboard.
  - Two seed projects ("Villa Sunrise" / PRJ-001, "Test Project" / PRJ-002) exist in the production database from manual QA. Left in place as a working example; there's no delete UI (by design), so removing them later means either Prisma Studio or a raw query.
- **Approval status**: awaiting your review before Day 2 begins.
