# Procurement Workflow

Status: PROPOSED. Entities in [DATA_MODEL.md](DATA_MODEL.md). Shared variance math in [BUSINESS_RULES.md](BUSINESS_RULES.md). Approval routing revised per your confirmed decisions — see [USER_ROLES.md](USER_ROLES.md) §Approval Structure.

## Two Independent Threads

Per your instructions, this is the most important structural rule in procurement: **Payment, Invoice, and Delivery are three separate, independently-timed business events**, never modeled as one forced sequence. See [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md) §Payment / Invoice / Delivery Independence for the full statement.

```
FINANCIAL THREAD:   PR → PO → Payment (directly against the PO; Invoice is a reference document alongside, not a gate)
PHYSICAL THREAD:    PO → Surat Jalan → Delivery → Stock
```

Both threads start from the same `PurchaseOrder`, but neither blocks the other, and within the financial thread, Invoice and Payment are not sequenced relative to each other either.

## PR → PO: Confirmed Structure

```
Project → PurchaseRequest → 1:N PurchaseOrder
```

- A `PurchaseRequest` is always project-specific and may contain many `PRItem`s.
- One PR may generate **multiple** POs (e.g. different items go to different suppliers, or a large PR is split for delivery-scheduling reasons).
- **One PO belongs to exactly one PR.** A PO can never combine items originating from two different PRs.
- This supersedes the earlier "PR/PO consolidation" assumption — see [DECISIONS.md](DECISIONS.md) D-005.

## PR Lifecycle

```
DRAFT → SUBMITTED → APPROVED / REJECTED → (CLOSED once fully converted to PO)
```

1. Requester (PM or PURCHASING — see [USER_ROLES.md](USER_ROLES.md)) creates a `PurchaseRequest` with one or more `PRItem`s, each referencing a `Work` and optionally a specific `PlanningLine`. **Requires the PRItem's Work's SubPhase to have an APPROVED `SubPhaseKickoff`** (see [PPIC_LOGIC.md](PPIC_LOGIC.md) §Sub-Phase Kickoff, Day 4) — otherwise creation is rejected.
2. On `SUBMIT`, the shared variance function ([BUSINESS_RULES.md](BUSINESS_RULES.md)) runs and freezes a `varianceSnapshot` on the PR.
3. **FINANCE** `APPROVE`s or `REJECT`s. **CEO** co-approves only when the PR's value/variance exceeds the configured purchasing ceiling percentage (see [BUSINESS_RULES.md](BUSINESS_RULES.md) §Purchasing Ceiling).
4. An `APPROVED` PR is available to be drawn into one or more POs, always its own — never merged with another PR's items into the same PO. It moves to `CLOSED` once its items are fully allocated to POs (partial allocation keeps it `APPROVED` with a "partially converted" indicator).

## PO Lifecycle

```
DRAFT → ISSUED → PARTIALLY_RECEIVED → COMPLETED
                → CANCELLED (only from DRAFT or ISSUED with no receipts yet)
```

1. PURCHASING creates a `PurchaseOrder` against a `Supplier`, drawing items **from exactly one approved PR** (`PurchaseOrder.prId` is set once and never changes; items not on that PR cannot be added — see [DATA_MODEL.md](DATA_MODEL.md) §4).
2. Variance is re-checked at PO stage using the same shared function ([BUSINESS_RULES.md](BUSINESS_RULES.md)) — since a PO now always traces to exactly one PR, this variance check is unambiguously against that PR's already-approved allocation (this resolves the earlier open question on PO-stage variance scope).
3. **FINANCE** `APPROVE`s the PO (or, operationally, PURCHASING issues it once Finance has signed off — see [USER_ROLES.md](USER_ROLES.md) for exact create/approve split). **CEO** co-approves only when over the purchasing ceiling.
4. `ISSUED` is the point the PO becomes a real commitment (drives `purchaseValue` in the Purchase/Paid/Debt ladder — see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md)).
5. Status advances to `PARTIALLY_RECEIVED`/`COMPLETED` automatically based on `DeliveryReceipt` totals vs. `POItem` quantities — this is a read of the physical thread, not a manual field.

## Invoice (reference document)

**FINANCE** records an `Invoice` against a `PO` whenever the supplier bills — regardless of delivery status, and regardless of whether any Payment has already been made. Invoice carries no payment-status field; see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md) §Invoice's Role. `Invoice.poId` is required — Payment no longer needs an Invoice to exist at all (a pure-prepayment scenario is simply a `Payment` against the PO with zero Invoices recorded), which resolves the earlier open question about PO-less invoices for prepayment: that use case is now handled by Payment directly, so Invoice is always tied to a PO.

## Payment

**FINANCE** records a `Payment`: a single amount against a `PurchaseOrder`, with no item-level allocation (see [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md)). Timing relative to Invoice and Delivery is unconstrained. **CEO** co-approves only when the payment (or the PO's cumulative paid value) exceeds the purchasing ceiling.

## Surat Jalan Validation

On `SuratJalan` entry against a `PO`, the system checks (producing a `discrepancyType` on the relevant `DeliveryReceiptItem` when it fails):

| Check | Failure → |
|---|---|
| PO exists and is `ISSUED`/`PARTIALLY_RECEIVED` | `WRONG_PO` |
| Supplier on SJ matches PO's supplier | `WRONG_SUPPLIER` |
| SJ number not already recorded for this supplier | `DUPLICATE_SJ` |
| Every SJ item maps to a `POItem` on this PO | `UNEXPECTED_ITEM` |
| Delivered qty ≤ (POItem qty − already-received qty) | over → `OVER_DELIVERY`, under (partial, not zero) → `UNDER_DELIVERY` (informational, not blocking) |

`OVER_DELIVERY` and mismatches other than simple partial delivery block the receipt from auto-confirming and require **LOGISTIC** (or PURCHASING) to resolve before stock is posted. Partial/complete delivery without discrepancy posts directly to `StockMovement`, feeding the "Delivered" dimension in [STOCK_LOGIC.md](STOCK_LOGIC.md).

## Independence Restated

No code path may require a `DeliveryReceipt` to exist before a `Payment` can be saved; no code path may require a `Payment` or `Invoice` to exist before a `SuratJalan`/`DeliveryReceipt` can be saved; no code path may require an `Invoice` to exist before a `Payment` can be saved. The financial and physical threads are validated and reported on independently; the only shared anchor is the `PurchaseOrder`.
