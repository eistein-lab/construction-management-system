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
- **Approval status**: approved by user 2026-09-08.

## Day 2 — PPIC Planning Baseline

- **Date**: 2026-09-08
- **Scope**: `PlanningBaseline`/`PlanningLine` tables, baseline DRAFT→SUBMITTED→APPROVED lifecycle UI/API, versioning + supersede-on-approval, CEO approve/reject, `AuditLog`.
- **Status**: **COMPLETE**. Deployed, migrated, and manually verified end-to-end in production (full create→submit→reject→resubmit→approve→revise cycle).
- **Database changes**: Migration `20260908104604_planning_baseline` applied — `PlanningBaseline`, `PlanningLine`, `AuditLog` tables, `BaselineStatus`/`PlanningLineSource` enums. Money fields (`unitPrice`, `totalValue`) are `Decimal(18,0)` (whole Rupiah), not `Int`, since project budgets can exceed Int's ~2.1B ceiling (docs/DECISIONS.md D-002).
- **Business logic implemented**: Lines only addable/removable while baseline is DRAFT. Submitting requires ≥1 line. Only CEO approves/rejects (docs/USER_ROLES.md — Addendum will be CEO+FINANCE dual-approval in a later day, this is not that). Rejecting requires a non-empty reason, returns baseline to DRAFT, reason displayed to PPIC. Approving a revision supersedes the project's prior APPROVED version in the same DB transaction. Every submit/approve/reject writes an `AuditLog` row. Refactored the Day 1 "can this user see this project" check into `src/lib/services/access.ts` so every future service reuses one implementation (the D-010 lesson).
- **Tests**: `npm run lint` / `npm run build` — clean. No automated suite yet. Full manual QA on live production: created baseline v1 → added a line (Work/item/qty/price) → submitted → CEO rejected with reason → PPIC saw the reason and resubmitted → CEO approved → verified line-editing controls disappear once APPROVED → started a v2 revision → confirmed v1 stays intact, shows "superseded by a later version", and remains in version history. Also queried the database directly to confirm the line write and all 4 audit log rows (SUBMIT/REJECT/SUBMIT/APPROVE) with correct actor/timestamp.
- **Commit**: `c9596ea` (pushed to `main`).
- **Deployment**: Redeployed to **https://construction-management-system-beta.vercel.app** (still manual `vercel deploy --prod`; GitHub↔Vercel auto-deploy still not connected — carried forward from Day 1).
- **Known issues / carry-forward**:
  - shadcn's Button (Base UI-based, not Radix) doesn't support `asChild` — use the `render` prop instead, e.g. `<Button render={<Link href="..." />}>`. Found while linking to the new baseline page from the project detail page.
  - **The Work `<Select>` on the add-line form was flaky in manual testing when there was only one Work option**: the first open/selection sometimes didn't commit (the dropdown's option rendered detached from its normal position on first open), requiring a second interaction or a keyboard `Enter` before it stuck. Once committed, it behaved correctly on every subsequent use, and the exact same component pattern worked cleanly on Day 1 with a 9-option dropdown. Documenting rather than deep-diving into Base UI's positioning internals under Day 2's time budget — no line was ever created with wrong/missing data (the underlying value was always correct once "selected" state genuinely committed; the failure mode was submission doing nothing, never bad data). Worth re-checking once a project has multiple Works to see if this was specific to the single-option case.
  - Villa Sunrise (PRJ-001) now has an approved baseline v1 (Rp222,925,000, 1 line: K225 concrete mix) and a v2 DRAFT revision in progress from manual QA — both real, intentional test artifacts, safe to leave or clean up via Prisma Studio.
