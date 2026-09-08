# Open Questions

Status: LIVE. Only genuine unresolved questions remain below — everything your latest corrections settled has been moved into [DECISIONS.md](DECISIONS.md) (D-005 through D-009) and removed from this list. For every item: **Question**, **Recommended default**, **Blocks Priority 1?**

## Resolved by your latest corrections (no longer open)

- PO-stage variance scope → resolved structurally by the confirmed 1 PR : N PO rule (D-005).
- Can an Invoice exist without a PO (prepayment case) → moot; Payment no longer needs any Invoice at all (D-006).
- Project-level progress weighting → confirmed as QS/approved-budget-value weighted (see [PROGRESS_LOGIC.md](PROGRESS_LOGIC.md)).
- Purchasing limit mechanism (flat/percentage/tiered, who configures it) → confirmed: percentage, CEO/FINANCE only (D-009). The narrower question of exact escalation *behavior* remains open below.

## Remaining — checked against your minimum list

**Q-A — Initial physical stock variance threshold %.**
Question: what % variance between Expected Stock and Physical Stock should trigger `FLAGGED_FOR_INVESTIGATION` in [STOCK_RECONCILIATION.md](STOCK_RECONCILIATION.md)?
Recommended default: 2% (a common materiality starting point for periodic inventory counts; easy to tighten/loosen later since it's a `ConfigThreshold`).
Blocks Priority 1? **No.** Stock reconciliation is a Priority 2 item; it blocks the Day 12 flagging feature specifically, not Priority 1 delivery.

**Q-B — Exact stock valuation methodology for the CEO calculation.**
Question: how does a stock quantity become a Rupiah value for the Stock % term in Deviation 2 — PO unit price (and which costing convention: FIFO/weighted-average/last-price), rolling weighted-average cost, or baseline/planning price? See the three candidates laid out in [STOCK_LOGIC.md](STOCK_LOGIC.md) §Valuation Methodology.
Recommended default: PO unit price at last-delivery (simplest, ties directly to the confirmed Purchase Value ladder).
Blocks Priority 1? **No.** Deviation 1 (Expense vs. Progress) ships without it. It blocks only Deviation 2 (Priority 2) and the Day 12 exit criteria.

**Q-C — Exact purchasing escalation/blocking matrix when the ceiling is exceeded.**
Question: once a PR/PO/Payment crosses `PURCHASING_CEILING_PCT`, does it hard-block until CEO co-signs, show a warning CEO can override after the fact, or use a multi-tier structure (a second, higher ceiling with stricter handling)?
Recommended default: hard block — the PR/PO/Payment cannot reach `APPROVED` status until CEO co-approval is recorded, no silent override path.
Blocks Priority 1? **Partially.** PR/PO/Payment themselves are Priority 1; the ceiling/escalation feature specifically is Priority 2. Priority 1 can ship using the recommended default and be adjusted later without a data-model change (the mechanism — configurable %, shared variance function — doesn't change either way).

**Q-D — Exact Addendum approval sequence.**
Question: must FINANCE review before CEO (or vice versa), or may either approve first in any order? What happens if one rejects after the other has already approved?
Recommended default: either may approve first, in any order (see [DECISIONS.md](DECISIONS.md) A-07); a rejection from either party at any point sets the addendum to `REJECTED` regardless of the other's prior approval.
Blocks Priority 1? **No.** Baseline/Kickoff (Priority 1) don't depend on Addendum sequencing; ships with the default for Day 4 and can be refined later.

## Other Non-Blocking Open Items (carried forward, unaffected by today's corrections)

**Q-01 — Does CEO double as ADMIN, or is ADMIN a separate role?**
Recommended default: separate role. Blocks Priority 1? No.

~~Q-02 — non-SPV project scoping~~ — **RESOLVED**, see [DECISIONS.md](DECISIONS.md) D-010: only SPV is `ProjectAssignment`-scoped, per the permission matrix's own "V (assigned)" annotation which applies to no other role.

**Q-03 — Does PlanningBaseline approval require QS/PPIC co-sign in addition to CEO, or is CEO sole approver?**
Recommended default: CEO sole approver (matches your confirmed table: "PPIC Baseline → CEO", singular). Blocks Priority 1? No — treated as resolved-enough to build; flag if wrong.

**Q-04 — Do Work names/sequence (non-financial metadata) also lock at Kickoff?**
Recommended default: no, only financial/quantity data locks. Blocks Priority 1? No.

**Q-07 — Is strict segregation of duties required (same person never submits and approves the same item)?**
Recommended default: not enforced for MVP beyond the role-level separation already confirmed (e.g. PURCHASING creates, FINANCE approves). Blocks Priority 1? No.

**Q-09 — Tax (PPN) handling on invoices / PO amounts.**
Recommended default: `amount` fields are a single gross figure, no separate tax field, flagged as a known gap. Blocks Priority 1? No — but should resolve before Invoice/Payment work.

**Q-10 — File storage provider (evidence photos, Surat Jalan scans, import files).**
Recommended default: Vercel Blob. Blocks Priority 1? No, but blocks Day 1 setup choices.

**Q-12 — Is stock "Used" tracked as an explicit LOGISTIC-recorded movement, or inferred from progress?**
Recommended default: explicit LOGISTIC recording (see [DECISIONS.md](DECISIONS.md) A-05). Blocks Priority 1? No — Priority 2 (stock).

**Q-14 — Deviation threshold comparison: unrounded or display-rounded values?**
Recommended default: unrounded (a true 10.04% warns even though it displays "10.0%"). Blocks Priority 1? No.

**Q-15 — Import file format (no sample provided).**
Recommended default: build against an assumed `.xlsx`/`.csv` shape, iterate once a real file is seen. Blocks Priority 1? Yes, in the narrow sense that it blocks accurate Day 8 import mapping — but the PARSE→NORMALIZE→VALIDATE→PREVIEW→COMMIT pipeline itself is buildable now.

**Q-16 — Import cadence and source system.**
Recommended default: monthly/batch, format may vary — mapping template is reusable if it changes. Blocks Priority 1? No.

**Q-17 — Stale-approval reminder threshold (days).**
Recommended default: 3 business days. Blocks Priority 1? No — Priority 3.

**Q-18 — Visual references for UI.**
Recommended default: proceed with [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) as the spec. Blocks Priority 1? No.

**Q-19 — Authentication: credentials vs. SSO?**
Recommended default: credentials-based (NextAuth Credentials provider). Blocks Priority 1? No, but blocks Day 1 setup.

**Q-20 — PostgreSQL hosting provider.**
Recommended default: Vercel Postgres or Neon (both simple to connect from Vercel). Blocks Priority 1? Yes — blocks Day 1 (nowhere for migrations to run without it).

**Q-21 — Company name for branding.**
Recommended default: proceed with "Bali Blueprint" (from your email domain) until corrected. Blocks Priority 1? No.

**Q-22 — Do field roles (SPV, LOGISTIC) need offline capability?**
Recommended default: responsive web only, connectivity assumed. Blocks Priority 1? No, but materially changes architecture if wrong — flagging early.

**Q-E — `STOCK_VARIANCE_THRESHOLD_PCT` configuration ownership.**
Question: your instructions explicitly named CEO+FINANCE as owners of the purchasing ceiling, but didn't say who owns the stock variance threshold.
Recommended default: CEO/FINANCE/ADMIN/QS (see [DECISIONS.md](DECISIONS.md) A-06). Blocks Priority 1? No — Priority 2.
