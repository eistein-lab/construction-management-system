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

**Q-03 — Does PlanningBaseline approval require QS/PM co-sign in addition to CEO, or is CEO sole approver?**
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

~~Q-21 — Company name for branding~~ — **RESOLVED**, confirmed "Bali Blueprint" via your shared mockup. See [DECISIONS.md](DECISIONS.md) D-014.

**Q-22 — Do field roles (SPV, LOGISTIC) need offline capability?**
Recommended default: responsive web only, connectivity assumed. Blocks Priority 1? No, but materially changes architecture if wrong — flagging early.

**Q-E — `STOCK_VARIANCE_THRESHOLD_PCT` configuration ownership.**
Question: your instructions explicitly named CEO+FINANCE as owners of the purchasing ceiling, but didn't say who owns the stock variance threshold.
Recommended default: CEO/FINANCE/ADMIN/QS (see [DECISIONS.md](DECISIONS.md) A-06). Blocks Priority 1? No — Priority 2.

**Q-F — Sub-Phase Kickoff approver: CEO alone, or CEO+Finance?**
Question: your correction confirmed Kickoff happens per Sub-Phase (see [DECISIONS.md](DECISIONS.md) D-013), but didn't state who approves it. Kept as CEO alone, matching the existing project-level Kickoff pattern you already confirmed ("Kickoff → CEO", singular) — but the interactive mockup you shared uses `FINANCE_LIKE` (CEO or Finance) for this action.
Recommended default: CEO alone (consistency with the already-confirmed project Kickoff row). Blocks Priority 1? No — Day 4 is Priority 1, but ships correctly either way; only the approver role differs, not the mechanism.

**Q-G — Does the mockup's broader Finance-approval scope (Progress and Baseline approved by `FINANCE_LIKE` = CEO or Finance, not just PM/CEO alone) supersede your earlier, explicit approval-structure confirmation, or was that mockup an earlier draft?**
Question: the mockup you shared (built "before," per your message) has `canApproveBaseline` and `canApproveProgress` both requiring `FINANCE_LIKE` (CEO or Finance Manager) — but your Day-0 corrections explicitly confirmed "PPIC Baseline → CEO" (sole) and "Progress → Project Manager" (sole approver), and Day 2 already shipped Baseline approval as CEO-only. Rather than silently override an already-confirmed, already-shipped rule based on an older mockup, both are kept as previously confirmed.
Recommended default: keep current rules (Baseline: CEO alone; Progress: PM alone) — the mockup is treated as a visual/hierarchy reference, not a supersede of your explicit Day-0 approval corrections. Blocks Priority 1? No — flagging only so you can explicitly say if you actually want Finance added to either approval, since Day 2 (Baseline) is already live and Day 11 (Progress) is not yet built.
