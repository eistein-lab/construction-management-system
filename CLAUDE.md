# Construction Management System

> Framework-specific agent rules (auto-managed by `next dev`/build tooling) live in [AGENTS.md](AGENTS.md) — read that too before touching Next.js APIs, since this project's Next.js version may differ from training data.

## Status

**DAY 1 — FOUNDATION IN PROGRESS.** Phase 0 documentation is approved (see `/docs`). Implementation proceeds one day at a time per [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md); each day stops for explicit approval before the next begins. Progress is logged in `docs/DAILY_PROGRESS.md`.

## What This Is

An internal construction project-management system covering planning (PPIC baseline + QS formula pricing), kickoff approval, procurement (PR→PO→Invoice→Payment), accounting expense tracking, site progress, logistics/stock, delivery (Surat Jalan), and a CEO dashboard with expense-vs-progress deviation warnings. Full detail: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).

## Documentation Is the Source of Truth

Before touching any business logic, read the relevant doc below. When a business rule changes, update the doc, the implementation, and the tests together, and record the change in [docs/DECISIONS.md](docs/DECISIONS.md) — code and docs must never silently diverge.

| Doc | Covers |
|---|---|
| [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) | What/why, MVP scope, boundaries |
| [docs/USER_ROLES.md](docs/USER_ROLES.md) | Roles, permission matrix |
| [docs/WORKFLOWS.md](docs/WORKFLOWS.md) | End-to-end process flows |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Entities, fields, relationships — canonical entity names |
| [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) | Shared variance methodology, purchasing limits, config effective-dating, approval rules |
| [docs/FINANCIAL_LOGIC.md](docs/FINANCIAL_LOGIC.md) | Purchase/Paid/Debt ladder (A/B/C), Baseline/Invoiced/Expensed, Payment-Invoice-Delivery independence |
| [docs/PROCUREMENT_LOGIC.md](docs/PROCUREMENT_LOGIC.md) | PR→1:N PO→Payment (direct, no Invoice gate) and PO→Surat Jalan→Delivery→Stock as separate threads |
| [docs/PPIC_LOGIC.md](docs/PPIC_LOGIC.md) | Baseline hierarchy, versioning, addenda (CEO+FINANCE dual approval) |
| [docs/QS_FORMULA_LOGIC.md](docs/QS_FORMULA_LOGIC.md) | Pricing library, formulas, formula application |
| [docs/PROGRESS_LOGIC.md](docs/PROGRESS_LOGIC.md) | SPV progress submission, PPIC approval, QS weekly/biweekly validation |
| [docs/STOCK_LOGIC.md](docs/STOCK_LOGIC.md) | Purchased/Delivered/Used/Expected Remaining Stock, valuation (has a blocking NEEDS_CONFIRMATION) |
| [docs/STOCK_RECONCILIATION.md](docs/STOCK_RECONCILIATION.md) | Expected vs. Physical stock, QS weekly/biweekly validation, discrepancy flagging (never auto-labeled) |
| [docs/REPORTING_LOGIC.md](docs/REPORTING_LOGIC.md) | CEO dashboard, both deviation formulas (fixed thresholds, not configurable) |
| [docs/IMPORT_LOGIC.md](docs/IMPORT_LOGIC.md) | PARSE→NORMALIZE→VALIDATE→PREVIEW→COMMIT import pipeline |
| [docs/NOTIFICATION_LOGIC.md](docs/NOTIFICATION_LOGIC.md) | Event→notification map, reminders |
| [docs/UI_UX_GUIDELINES.md](docs/UI_UX_GUIDELINES.md) | Visual direction, semantic color, typography |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | App/data/auth/calculation-layer/deployment architecture, performance rules |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | 14-day plan |
| [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md) | Required test cases per day |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decision/assumption log |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Genuine unresolved questions, blocking and non-blocking |
| [docs/RISKS.md](docs/RISKS.md) | Known risks and mitigations |

## Non-Negotiable Rules (carried from the governing instruction)

1. **Payment, Invoice, and Delivery are three independent business events.** Never build or accept a code path that requires any one of them before another, in either direction. See [docs/FINANCIAL_LOGIC.md](docs/FINANCIAL_LOGIC.md) §Payment / Invoice / Delivery Independence.
2. **One variance formula, one deviation formula, used everywhere.** PR, PO, dashboard, and reports all call the same calculation-layer function — never reimplement inline. See [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §Calculation Layer.
3. **The original approved baseline is never overwritten.** Post-kickoff changes are always additive (`BaselineAddendum`, requiring dual CEO+FINANCE approval), never in-place edits. See [docs/PPIC_LOGIC.md](docs/PPIC_LOGIC.md).
4. **A PurchaseOrder belongs to exactly one PurchaseRequest, never more than one.** `Project → PR → 1:N PO`. See [docs/PROCUREMENT_LOGIC.md](docs/PROCUREMENT_LOGIC.md).
5. **No item-level payment allocation.** A Payment is a single amount against a PO. Debt Value (`Purchase Value − Paid Value`) is a whole-PO figure only. Never build per-item paid/debt tracking. See [docs/FINANCIAL_LOGIC.md](docs/FINANCIAL_LOGIC.md).
6. **Financial position and physical position are never merged.** Purchase/Paid/Debt (money) and Purchased/Delivered/Used/Stock (material) are separate ladders, only ever compared side by side. See [docs/STOCK_LOGIC.md](docs/STOCK_LOGIC.md).
7. **CEO-level figures use validated numbers, not raw reports.** Progress % and Stock % on the CEO dashboard always read the latest QS weekly/biweekly validation, never the raw PPIC-approved progress or raw Logistic stock count directly. See [docs/PROGRESS_LOGIC.md](docs/PROGRESS_LOGIC.md), [docs/STOCK_RECONCILIATION.md](docs/STOCK_RECONCILIATION.md).
8. **A flagged stock discrepancy is never auto-labeled as theft or any specific cause.** Status stays neutral ("flagged for investigation"); cause is recorded only after human investigation. See [docs/STOCK_RECONCILIATION.md](docs/STOCK_RECONCILIATION.md).
9. **The CEO deviation thresholds (`>10%`, `≥5%`) are fixed constants, never changed and never admin-configurable.** See [docs/REPORTING_LOGIC.md](docs/REPORTING_LOGIC.md), [docs/DECISIONS.md](docs/DECISIONS.md) D-008.
10. **Never invent a financial formula.** If something is genuinely unclear (see [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md)), mark it `NEEDS_CONFIRMATION`, build around it, and keep moving on unblocked work.
11. **UI components never calculate KPIs.** All financial/business numbers come from the calculation layer, not from component-local math.

## Tech Stack (fixed)

Next.js + TypeScript + React + Tailwind + shadcn/ui · PostgreSQL + Prisma · Auth.js/NextAuth · Vercel · GitHub. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Daily Workflow (Day 1 onward, after Phase 0 approval)

`INSPECT → READ DOCS → IMPLEMENT → TEST → FIX → COMMIT → PUSH → DEPLOY → VERIFY → REPORT → STOP` — one day at a time, each requiring explicit approval before the next begins. Progress is logged in `docs/DAILY_PROGRESS.md`.
