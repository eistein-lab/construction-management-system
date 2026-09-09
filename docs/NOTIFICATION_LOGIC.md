# Notification & Reminder Logic

Status: PROPOSED. Entities in [DATA_MODEL.md](DATA_MODEL.md) §9. Event map updated for the confirmed approval structure (Finance approves the procurement chain, QS validates weekly/biweekly, Addendum is dual-approved).

## Trigger Model

`Notification` is generated server-side as a side effect of state changes — never client-triggered. Every workflow transition that hands responsibility to another role produces a notification to that role (or specific user), matching the approval chains in [USER_ROLES.md](USER_ROLES.md) and [BUSINESS_RULES.md](BUSINESS_RULES.md) §Approval Structure.

## Event → Notification Map

| Event | Notified | Type |
|---|---|---|
| PlanningBaseline SUBMITTED | CEO | Approval needed |
| PlanningBaseline APPROVED/REJECTED | PM (submitter) | Decision |
| SubPhaseKickoff REQUESTED | CEO | Approval needed |
| SubPhaseKickoff APPROVED/REJECTED | PM (requester) | Decision |
| BaselineAddendum SUBMITTED | CEO, FINANCE (both) | Approval needed |
| BaselineAddendum — one of CEO/FINANCE approves, other still pending | The other pending approver | Reminder |
| BaselineAddendum APPROVED (both signed) / REJECTED (either) | PM (submitter) | Decision |
| PurchaseRequest SUBMITTED | FINANCE | Approval needed |
| PurchaseRequest over purchasing ceiling | CEO (in addition to FINANCE) | Approval needed |
| PurchaseRequest APPROVED/REJECTED | Requester | Decision |
| PurchaseOrder SUBMITTED (drawn from an approved PR) | FINANCE | Approval needed |
| PurchaseOrder over purchasing ceiling | CEO (in addition to FINANCE) | Approval needed |
| PurchaseOrder ISSUED | LOGISTIC | Informational |
| Invoice recorded | — (reference document, no approval workflow) | — |
| Payment SUBMITTED | FINANCE | Approval needed |
| Payment over purchasing ceiling | CEO (in addition to FINANCE) | Approval needed |
| SuratJalan DISCREPANCY | PURCHASING, LOGISTIC | Exception |
| ProgressSubmission SUBMITTED | PM | Approval needed |
| ProgressSubmission REJECTED | SPV (submitter) | Decision |
| ProgressValidation due (weekly/biweekly period elapsed) | QS | Action needed |
| ProgressValidation FLAGGED (validated ≠ reported, material difference) | PM | Informational |
| PhysicalStockCount due (weekly/biweekly period elapsed) | LOGISTIC | Action needed |
| StockValidation FLAGGED_FOR_INVESTIGATION | LOGISTIC, CEO | Exception |
| ImportBatch VALIDATE completed with errors | ACCOUNTING | Exception |
| CEO Deviation crosses warning threshold (Calc 1 or 2) | CEO | Warning |

## Reminders (time-based, not event-based)

- A `SUBMITTED` item pending approval for longer than a configured number of days (`ConfigThreshold`) triggers a repeat reminder to the approver — exact stale-threshold in days is `NEEDS_CONFIRMATION` (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)); default assumption for planning purposes is 3 business days.
- `ProgressValidation`/`StockValidation` reminders fire if QS has not validated within the configured weekly/biweekly window (exact cadence — weekly vs. biweekly, and for which item types — is set per your instruction but the precise day-of-week/cutoff mechanics are an implementation default, not user-specified; flagged as a minor open item, non-blocking).
- Deviation warnings (Calculation 1/2 crossing threshold) generate a notification once per crossing event, not repeatedly every time the dashboard is viewed — re-notification only if the deviation clears and re-crosses the threshold.

## Delivery Channel

In-app only for MVP (`Notification` read via the dashboard/bell icon). Email/WhatsApp delivery is out of scope for the 14-day MVP — see [DECISIONS.md](DECISIONS.md) A-04.
