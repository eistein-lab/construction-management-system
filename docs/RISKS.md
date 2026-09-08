# Risks

Status: LIVE — reviewed and updated at least at the end of each implementation day.

**R-01 — No git repository or GitHub remote exists yet.**
The working directory is currently empty and not a git repo. Your instruction §31 requires every implementation day to end with a git commit, GitHub push, and Vercel deployment with a real live URL. This must be set up (repo init, GitHub remote, Vercel project connection) before Day 1 can satisfy its own deployment requirement. Not a blocker for Phase 0 documentation, but flagged now so it isn't discovered mid-Day-1. *Mitigation*: set up as the first sub-step of Day 1, before any feature code.

**R-02 — Financially load-bearing NEEDS_CONFIRMATION items could stall Priority 2 delivery if not answered promptly.**
Specifically Q-B (stock valuation) blocks Deviation 2 and Q-C (exact purchasing escalation matrix) affects real CEO-routing behavior beyond the recommended default. *Mitigation*: both modules are architected so the surrounding functionality (stock movements, PR/PO variance display, the ceiling mechanism itself) ships independently of the unresolved number/formula, per [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — only the specific dependent feature is blocked, not the whole day. Neither is a Priority 1 blocker following your latest confirmed decisions — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

**R-03 — Centralized calculation discipline is a process risk, not just a code risk.**
Your instruction is explicit that variance/deviation logic must never be reimplemented per module. The risk isn't the first implementation — it's a future day (or a future person) adding a "quick" inline percentage calculation directly in a dashboard component under time pressure. *Mitigation*: the calculation layer ([ARCHITECTURE.md](ARCHITECTURE.md)) is structured so importing it is easier than reimplementing it, and the test matrix includes an explicit regression test asserting PR and PO variance share one code path.

**R-04 — Single-engineer, 14-day timeline against a genuinely broad Priority-1+2 scope.**
Baseline/QS/Kickoff/PR/PO/Invoice/Payment/Expense/Dashboard/Deviation/Progress/Stock/Delivery is a large surface for 12 effective build days (Days 1–12) before Notifications and UAT. *Mitigation*: Priority 1 is protected per [PRODUCT_SPEC.md](PRODUCT_SPEC.md); if slippage happens, Day 13 (notifications) is the designated buffer to compress or cut, and this will be reported transparently in the daily report rather than silently descoping Priority 1/2 items.

**R-05 — Import data quality is unverified.**
Without a sample accounting export (Q-15), the NORMALIZE/VALIDATE logic in [IMPORT_LOGIC.md](IMPORT_LOGIC.md) is built against an assumed shape. Real data may reveal edge cases (merged cells, inconsistent project codes, multi-currency rows) not anticipated here. *Mitigation*: PREVIEW-before-COMMIT design means bad imports are caught before they touch `AccountingExpenseEntry`, even if the mapping needs iteration once a real file is seen.

**R-06 — Evidence/attachment file storage costs and limits are unconfirmed (Q-10).**
Photo evidence from SPV progress and Surat Jalan scans, over the life of many projects, can accumulate significant storage volume. *Mitigation*: not a Day 1–14 blocker (photos are small in MVP volume), but worth revisiting storage provider/cost once real usage volume is known.
