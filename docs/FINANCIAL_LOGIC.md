# Financial Logic

Status: PROPOSED. Entities in [DATA_MODEL.md](DATA_MODEL.md). Revised per your confirmed decisions on Payment/Invoice/Delivery independence and the Purchase/Paid/Debt structure — this replaces the earlier "six financial states" model.

## Purchase / Paid / Debt (the core financial ladder)

Confirmed structure, computed **per PurchaseOrder** (and summable to project level):

```
A = Purchase Value   = SUM(POItem.totalValue) for the PO
B = Paid Value        = SUM(Payment.amount) for the PO   (no item-level allocation — see below)
C = Debt Value         = A − B
```

Worked example (from your instructions): Purchase Value = Rp100,000,000; Paid Value = Rp60,000,000 → Debt Value = Rp40,000,000.

This ladder is always computable for any PO regardless of whether an Invoice has been recorded or any delivery has occurred — it depends only on the PO's own items and its Payments. It is the figure used to compare financial position against physical position (see [STOCK_LOGIC.md](STOCK_LOGIC.md) and [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md)).

## No Item-Level Payment Allocation

**Confirmed: a Payment is recorded as a single amount against a PO, never allocated to specific PO items.** "Rp500,000 paid against PO PO-0142" is a complete, valid Payment record — the system never asks which line items that money corresponds to, and never attempts to compute a per-item paid/debt breakdown. `Debt Value` is a whole-PO figure only. Do not build (or infer) item-level payment tracking anywhere, including in reports.

## Payment / Invoice / Delivery Independence

Three business events, fully independent of each other and of their relative order:

- **Payment can happen before Invoice.** A `Payment` may be recorded against a PO with zero `Invoice` rows yet existing for it.
- **Payment can happen before Delivery.** A `Payment` may be recorded against a PO with zero `DeliveryReceipt` rows yet existing for it.
- **Invoice does not require Delivery.** An `Invoice` can be recorded against a PO regardless of delivery status.
- **Payment does not require Invoice or Delivery.** No validation, formula, or UI state anywhere in the system may assume `invoiceDate ≤ paymentDate`, `deliveryDate ≤ paymentDate`, or any ordering between these three. `Payment.invoiceId` is nullable and, when set, is a reconciliation convenience only — never a precondition for saving the Payment.

This governs both threads described in [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md):

```
FINANCIAL THREAD:   PR → PO → Payment (directly against the PO)         [Invoice is a reference document alongside this, not a gate in the chain]
PHYSICAL THREAD:    PO → Surat Jalan → Delivery → Stock
```

## Invoice's Role (reference only)

`Invoice` still exists as a supporting/reference record — what the supplier has billed, for reconciliation and audit — but it carries **no payment-status field of its own** (no UNPAID/PARTIALLY_PAID/PAID). The authoritative "how much is owed" figure is always `Debt Value (C)` computed from the PO's Payments directly, independent of whether or how many Invoices exist. Recorded by **FINANCE**.

## What the CEO Dashboard Shows (financial figures, per project)

| Figure | Source | Meaning |
|---|---|---|
| **BASELINE** | `PlanningLine` + `BaselineAddendum` (approved) | What was planned/allowed to be spent |
| **PURCHASE VALUE (A)** | `SUM(PurchaseOrder.purchaseValue)` | What has been ordered (formerly "COMMITTED"/"PO") |
| **PAID VALUE (B)** | `SUM(PurchaseOrder.paidValue)` | What has actually been paid to suppliers |
| **DEBT VALUE (C)** | `SUM(PurchaseOrder.debtValue)` = A − B | Outstanding supplier obligation |
| **INVOICED** | `SUM(Invoice.amount)` | What suppliers have billed — informational/reconciliation only, never gates anything |
| **EXPENSED** | `SUM(AccountingExpenseEntry.amount)` | What accounting has formally recognized as project expense — the figure used as "Expense %" in CEO deviation (see [REPORTING_LOGIC.md](REPORTING_LOGIC.md)) |

`PAID` and `EXPENSED` remain deliberately distinct: a payment can be made (cash out) before accounting formally recognizes/allocates it as an expense against a project (timing differences, advances, retentions). Never substitute `PAID` for `EXPENSED` in reporting — this is an explicit financial-safety constraint.

## Connecting Accounting Expense to Projects

`AccountingExpenseEntry.projectId` is required. Where the entry originates from an import (see [IMPORT_LOGIC.md](IMPORT_LOGIC.md)), project matching happens during the NORMALIZE/VALIDATE step using a project-code mapping; unmatched rows are held for manual assignment before COMMIT, never auto-assigned to a guessed project. Where an entry is matched to a specific `Invoice`/`PO` (`matchedInvoiceId`/`matchedPOId`), that link is informational/traceability only — EXPENSED remains an independently editable figure because accounting timing (accruals, cost allocation) can legitimately diverge from procurement documents.

## Tax / PPN

Not addressed in the source requirements. Indonesian B2B invoices typically carry PPN (VAT). Whether `Invoice.amount` (and `POItem.unitPrice`, which drives Purchase Value) is gross (incl. tax) or net is `NEEDS_CONFIRMATION` — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md). Not blocking for early-day scope; must be resolved before Invoice/Payment implementation.

## Currency

Assumed single currency, IDR, no FX. See [DECISIONS.md](DECISIONS.md) D-002.
