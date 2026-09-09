# User Roles & Permissions

Status: PROPOSED. Entities referenced here are defined in [DATA_MODEL.md](DATA_MODEL.md). Approval routing revised per your confirmed decisions — Finance now approves the core procurement chain, QS validates Progress and Stock weekly/biweekly, and Addendum requires dual CEO+Finance approval. **Role corrected 2026-09-09**: "PPIC" was never a role — see [DECISIONS.md](DECISIONS.md) D-012. The role is **PM (Project Manager)**; "PPIC" remains the name of the baseline/budgeting process itself (see [PPIC_LOGIC.md](PPIC_LOGIC.md)).

## Roles

| Role | Who | Scope |
|---|---|---|
| CEO | Owner/executive | All projects, read-heavy, approver on Baseline/Kickoff, co-approver over the purchasing ceiling, co-approver on Addendum |
| FINANCE | Finance manager | **Approves PR, PO, and Payment; records Invoice; sets the purchasing ceiling (with CEO); co-approves Addendum** |
| PM | Project Manager | Owns the planning baseline (drafts/submits it — working with QS, who prices it via formulas), submits Sub-Phase kickoff requests, addenda; **approves SPV Progress Submissions** |
| PURCHASING | Procurement staff | Creates/submits PR and PO (no longer the approver — see Approval Structure below); supplier management |
| ACCOUNTING | Accountant | Expense recognition, imports, reconciliation |
| LOGISTIC | Warehouse/site logistics | Stock movements, Surat Jalan, delivery receiving, **weekly/biweekly physical stock count reporting** |
| SPV | Site Supervisor | Progress submission at Work level |
| QS | Quantity Surveyor | Pricing library, formulas, formula application to Works; **weekly/biweekly Progress Validation and Stock Validation** |
| ADMIN | System administrator | User provisioning, non-financial system config — added role, not in your original list (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-01) |

All permissions below are enforced **server-side**, never trusted from client state.

## Approval Structure (confirmed — see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Approval Structure for the same table with rationale)

| Action | Approver | Escalation |
|---|---|---|
| PPIC Baseline (project-wide plan) | CEO | — |
| Project Kickoff (one-time, unlocks Sub-Phase kickoff requests) | CEO | — |
| Sub-Phase Kickoff (per Sub-Phase, unlocks PR for that Sub-Phase) | CEO | — *(see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-F on whether Finance co-signs)* |
| Purchase Request | FINANCE | + CEO if over purchasing ceiling |
| Purchase Order | FINANCE | + CEO if over purchasing ceiling |
| Invoice | FINANCE (records; reference only, no approval gate) | — |
| Payment | FINANCE | + CEO if over purchasing ceiling |
| Progress (submission) | PM (Project Manager) | — |
| Progress Validation | QS, weekly/biweekly | — |
| Stock (report) | LOGISTIC (creates the report) | — |
| Stock Validation | QS, weekly/biweekly | — |
| Addendum | **CEO + FINANCE (dual, both required)** | — |

## Permission Matrix

Legend: V=View, C=Create, E=Edit, S=Submit, A=Approve, R=Reject, VAL=Validate (QS periodic validation), X=Export, CFG=Configure. A blank cell = no access.

### PPIC Baseline & Kickoff

| Module | CEO | FINANCE | PM | PURCHASING | ACCOUNTING | LOGISTIC | SPV | QS | ADMIN |
|---|---|---|---|---|---|---|---|---|---|
| Project / SubPhase / Work | V | V | V,C,E | V | V | V | V (assigned) | V | V |
| PlanningBaseline (draft) | V | V | V,C,E,S | V | V | | | V | V |
| Baseline Approval | V,A,R | V | V,S | V | V | | | V | |
| Project Kickoff (one-time) | V,A,R | V | V,S | V | V | | | V | |
| Sub-Phase Kickoff (per Sub-Phase) | V,A,R | V | V,C,S | V | V | | | V | |
| BaselineAddendum | V,A,R | V,A,R | V,C,S | V | V | | | V | |

### QS Formula

| Module | CEO | FINANCE | PM | PURCHASING | ACCOUNTING | LOGISTIC | SPV | QS | ADMIN |
|---|---|---|---|---|---|---|---|---|---|
| PricingLibraryItem | V | V | V | V | V | | | V,C,E,CFG | V,CFG |
| Formula / FormulaLine | V | | V | | | | | V,C,E | |
| FormulaApplication | V | | V | | | | | V,C,S | |

### Procurement

| Module | CEO | FINANCE | PM | PURCHASING | ACCOUNTING | LOGISTIC | SPV | QS | ADMIN |
|---|---|---|---|---|---|---|---|---|---|
| PurchaseRequest | V,A(over ceiling) | V,C,E,A,R | V,C,S | V,C,E,S | V | | | V | |
| PurchaseOrder | V,A(over ceiling) | V,C,E,A,R | V | V,C,E,S | V | | | | |
| Supplier | V | V | V | V,C,E | V | | | | V,CFG |
| Invoice | V | V,C,E | V | V | V,C,E | | | | |
| Payment | V,A(over ceiling) | V,C,S,A | V | V | V | | | | |

### Delivery & Stock

| Module | CEO | FINANCE | PM | PURCHASING | ACCOUNTING | LOGISTIC | SPV | QS | ADMIN |
|---|---|---|---|---|---|---|---|---|---|
| SuratJalan | V | | V | V | | V,C,E | | | |
| DeliveryReceipt | V | | V | V | | V,C,S | | | |
| StockBalance / StockMovement | V | | V | V | V | V,C,E,X | | V | |
| PhysicalStockCount | V | | V | | | V,C,S | | V | |
| StockValidation | V | | V | | | V | | V,C,VAL | |

### Progress

| Module | CEO | FINANCE | PM | PURCHASING | ACCOUNTING | LOGISTIC | SPV | QS | ADMIN |
|---|---|---|---|---|---|---|---|---|---|
| ProgressSubmission | V | | V,A,R | | | | V,C,S (own assigned Works) | V | |
| ProgressCorrection | V | | V,A,R | | | | V,C,S | | |
| ProgressValidation | V | | V | | | | | V,C,VAL | |

### Accounting & Reporting

| Module | CEO | FINANCE | PM | PURCHASING | ACCOUNTING | LOGISTIC | SPV | QS | ADMIN |
|---|---|---|---|---|---|---|---|---|---|
| AccountingExpenseEntry | V,X | V | V | | V,C,E | | | | |
| ImportBatch | V | V | | | V,C,S(commit),X | | | | |
| CEO Dashboard | V,X | V (own scope) | V (own projects) | V (own scope) | V (own scope) | V (own scope) | | V (own scope) | V |
| ConfigThreshold — `PURCHASING_CEILING_PCT` | V,CFG | V,CFG | V | V | V | V | | V | V |
| ConfigThreshold — `STOCK_VARIANCE_THRESHOLD_PCT` | V,CFG | V,CFG | V | | V | V | | V,CFG | V,CFG |
| Notifications | V | V | V | V | V | V | V | V | V |

## Notes

- **"A(over ceiling)"** = CEO co-approval is required only when a PR/PO/Payment exceeds the configured `PURCHASING_CEILING_PCT`; below it, FINANCE approves alone. This does not remove FINANCE's approval — CEO's is additive.
- **Segregation of duties**: PURCHASING creates and submits PR/PO but no longer approves them (moved to FINANCE) — a deliberate financial control now that the approval structure is confirmed, distinct from the earlier open question about self-submit/self-approve segregation elsewhere in the system (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).
- **Purchasing ceiling CONFIGURE is confirmed to CEO and FINANCE only** — not ADMIN, per your explicit instruction. `STOCK_VARIANCE_THRESHOLD_PCT` ownership was not explicitly assigned by you; CEO/FINANCE/ADMIN/QS access shown above is an assumption pending confirmation (see [DECISIONS.md](DECISIONS.md)).
- **Resolved during Day 1 implementation testing**: only SPV is scoped by `ProjectAssignment` (matches the "V (assigned)" annotation above — every other role's plain "V" means unscoped, global view). Fixed and logged as [DECISIONS.md](DECISIONS.md) D-010.
- **Role correction (2026-09-09)**: "PPIC" is not a role. The person who owns planning is **PM (Project Manager)**, working with **QS**. See [DECISIONS.md](DECISIONS.md) D-012.
- **Sub-Phase Kickoff (2026-09-09)**: Kickoff is granted per Sub-Phase, not once for the whole project — PM requests it (with planned start/end dates) once the project-wide Baseline is approved; CEO approves/rejects. Only an **APPROVED** Sub-Phase Kickoff unlocks Purchase Requests against Works in that Sub-Phase. See [DECISIONS.md](DECISIONS.md) D-013, [PPIC_LOGIC.md](PPIC_LOGIC.md) §Sub-Phase Kickoff.
- QS holds CONFIGURE on PricingLibraryItem (day-to-day price updates) in addition to its new weekly/biweekly VAL (Validate) responsibility on Progress and Stock.
- Reject (R) always requires a reason field, stored on the entity and surfaced in Notifications to the submitter.
