# Product Specification

Status: PROPOSED. This is the top-level "what and why" — detailed logic lives in the linked docs.

## What This Application Is

An internal construction-management system for Bali Blueprint (assumption from account domain — confirm company name for branding, see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-21) covering the full project lifecycle from planning through procurement, progress, stock, and executive financial oversight. It replaces (assumption) spreadsheet-based tracking with one system of record shared across Planning (PPIC/QS), Purchasing, Finance, Accounting, Logistics, Site Supervision, and the CEO.

## Who Uses It

Eight functional roles plus one system-administration role. Full detail in [USER_ROLES.md](USER_ROLES.md): CEO, FINANCE, PPIC, PURCHASING, ACCOUNTING, LOGISTIC, SPV, QS, ADMIN.

## Core Value Proposition

1. **One baseline, one source of truth.** A project's approved plan (PPIC baseline, built with QS formula pricing) is locked at kickoff and never silently overwritten — every later change is a traceable addendum.
2. **Procurement stays inside the plan, visibly.** Every Purchase Request and Purchase Order is checked against the same baseline-allowance/variance math, so overspending against the plan is caught at request time, not discovered at month-end.
3. **Financial reality vs. physical reality, side by side.** Accounting expense, payments, stock on hand, and physical site progress are tracked as distinct, independently-sourced numbers — never inferred from each other — so the CEO dashboard can show a true "are we spending faster than we're building" signal (the deviation logic in [REPORTING_LOGIC.md](REPORTING_LOGIC.md)) instead of a single misleading "% spent" figure.
4. **Payment, Invoice, and Delivery are three independent events.** The system does not force suppliers to be paid only after delivery, or only after an invoice is recorded — a real constraint in construction procurement (deposits, staged prepayments) that most simple systems get wrong. Financial position (Purchase Value / Paid Value / Debt Value) and physical position (Purchased / Delivered / Used / Stock) are tracked as two separate ladders, compared side by side, never merged.

## MVP Scope (Priority Tiers, per your instruction §5)

**Priority 1 — Critical Core**: PPIC baseline, QS formula, kickoff approval, PR, PR→PO→Invoice, accounting expense data, CEO dashboard, expense-vs-progress comparison.

**Priority 2 — Control & Operation**: SPV progress, logistic stock, CEO deviation detection, variance warnings, purchasing limitations, Surat Jalan/delivery validation.

**Priority 3 — Communication**: notifications, reminders, cross-role workflow notifications.

Priority 1 is protected in the day-by-day plan — see [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md); if any day slips, Priority 3 scope is what gets cut first, never Priority 1.

## What This Is Not (MVP boundaries)

- Not a general accounting system — `AccountingExpenseEntry` reads from/reconciles with accounting data, it does not replace a GL.
- Not multi-currency, not multi-company/multi-tenant (single internal org — see [DECISIONS.md](DECISIONS.md) D-002, D-003).
- No native mobile app for MVP — responsive web only (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-22 if field usage on site actually requires offline capability, which responsive web alone won't provide).
- No email/push notification delivery for MVP — in-app only (see [NOTIFICATION_LOGIC.md](NOTIFICATION_LOGIC.md)).

## End-to-End Flow

See [WORKFLOWS.md](WORKFLOWS.md) for the full diagram; summarized:

```
Project → SubPhase → Work → PPIC Baseline (priced via QS Formula) → Baseline Approval → Kickoff
   → Purchase Request → Variance Check → Purchase Order → Invoice → Payment (independent of delivery)
   → [separately] PO → Surat Jalan → Delivery → Stock
   → [separately] Work → SPV Progress → Progress Approval → Project Progress
   → All of the above → CEO Dashboard → Expense vs Progress (+Stock) Deviation → Warnings → Purchasing Control
   → Workflow Events → Notifications → Reminders
```
