# SPV Progress Logic

Status: PROPOSED. Entities in [DATA_MODEL.md](DATA_MODEL.md). Revised to add the QS validation layer per your confirmed approval structure.

## Who Submits, At What Level

**SPV** (Site Supervisor) submits progress at the **Work** level — the same node the baseline and QS formulas attach to. An SPV only sees/submits for Works on projects they're assigned to (`ProjectAssignment`).

## Progress Is Physical Completion Only

**Confirmed: progress is based on physical Work completion. Progress is never calculated from material consumption.** These are two independent measurements tracked by entirely separate mechanisms — `ProgressSubmission` (physical, SPV-reported) vs. `StockMovement`/"Used" (material, LOGISTIC-recorded, see [STOCK_LOGIC.md](STOCK_LOGIC.md)). Neither is derived from the other in either direction.

## What Is Recorded

`ProgressSubmission`: `workId`, `submittedById`, `submissionDate`, `completedQtyCumulative` (the running total completed for that Work as of this date — not an incremental delta, to avoid drift from missed submissions), `evidenceFiles[]` (photos, required), `status`.

`Work.progressPercent` (CALCULATED, pre-validation) = `latest APPROVED ProgressSubmission.completedQtyCumulative / Baseline Allowance quantity for that Work × 100` (Baseline Allowance per [BUSINESS_RULES.md](BUSINESS_RULES.md), i.e. including approved addenda).

## Approval: Project Manager (PM)

Confirmed: **"Progress → Project Manager."** A `SUBMITTED` `ProgressSubmission` does not move `Work.progressPercent` until **PM** (the Project Manager role) sets it `APPROVED`. `REJECTED` submissions are kept (never deleted) with the rejection reason, visible to the SPV, and do not count.

## Validation: QS, Weekly/Biweekly

Confirmed: **"Progress Validation → QS weekly/biweekly."** On that cadence, **QS** reviews the PM-approved progress for each Work and produces a `ProgressValidation` record: `reportedProgressPercent` (snapshot of `Work.progressPercent` as of the period) and `validatedProgressPercent` (QS's confirmed/official figure — defaults to reported, may be adjusted after review).

**CEO-level calculations (including the Progress % term in both deviation formulas) always read the latest `validatedProgressPercent`**, not the raw PM-approved running total directly — mirroring the same reported-vs-validated pattern used for stock (see [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md)). Before the first validation of a period, the PM-approved figure is used provisionally, clearly labeled "unvalidated" on the dashboard.

## Project-Level Progress Rollup

Confirmed: **"Overall Project Progress is weighted by QS / approved budget value."** `Project.progressPercent` (CALCULATED) = value-weighted average of each Work's latest **validated** `progressPercent`, weighted by that Work's Baseline Allowance value (original approved baseline + approved addenda — the "approved budget value"). This closes the earlier open question on weighting methodology.

## Historical Corrections

A completed submission is never edited in place. A correction is a new `ProgressCorrection` row (`originalSubmissionId`, `previousQty`, `correctedQty`, `reason`) that itself requires PM approval before it affects `Work.progressPercent` (and flows into the next QS validation cycle). The original submission stays visible in history exactly as originally submitted.

## Evidence

`evidenceFiles[]` — photo (and optionally short note) attached per submission. Required for `APPROVED` status; PM can reject a submission for insufficient evidence using the standard rejection-reason flow. Storage mechanism is an architecture decision — see [ARCHITECTURE.md](ARCHITECTURE.md) §File Storage.
