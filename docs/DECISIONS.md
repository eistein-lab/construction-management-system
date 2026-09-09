# Decisions & Assumptions Log

Status: LIVE — append-only going forward; never edit a past entry's substance, add a superseding entry instead. This is the log required by your instruction: *"When a business rule changes: update documentation, update implementation, update tests, record the decision."*

Format: **Decisions (D-xxx)** are choices made where the requirements were silent and a choice had to be made to keep planning moving, but are cheap enough to reverse without re-deriving the whole spec. **Assumptions (A-xxx)** are narrower modeling choices baked into the data model/docs that other docs depend on structurally.

## Decisions

**D-001 — Phase 0 documentation-first process.**
Adopted per your explicit instruction.

**D-002 — Currency: IDR, single currency, no FX handling.**
No currency requirement was stated; Indonesian context inferred. Reversible.

**D-003 — Single-tenant, single-company deployment.**
No multi-company/multi-tenant requirement was stated.

**D-004 — Sequencing note for Day 10/11.**
Calculation 1 (Day 10) technically depends on validated progress data, which itself depends on `Work.progressPercent` (Day 11) plus QS's weekly/biweekly validation. Plan proceeds with your given day order and flags the dependency; will be resolved in practice via seeded data for Day 10's demo. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

**D-005 — PR:PO cardinality is confirmed 1:N, superseding the earlier consolidation assumption (A-03, now superseded).**
Your correction confirmed: `Project → PurchaseRequest → 1:N PurchaseOrder`, one PO belongs to exactly one PR, a PO can never combine items from multiple PRs. The earlier `A-03` assumption (many-to-many consolidation across PRs into one PO) is superseded and no longer applies. Affects [DATA_MODEL.md](DATA_MODEL.md) §4, [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md), [BUSINESS_RULES.md](BUSINESS_RULES.md) (this also structurally resolves what was open question Q-05 on PO-stage variance scope).

**D-006 — Payment attaches to PurchaseOrder directly, with no item-level allocation; Invoice becomes a reference-only document.**
Confirmed: Payment can precede Invoice and/or Delivery; Invoice does not require Delivery; Payment requires neither Invoice nor Delivery. A Payment is a single amount against a PO ("Rp500,000 paid against PO"), never split across PO items. `Invoice.status` (UNPAID/PARTIALLY_PAID/PAID) is removed — the authoritative "how much is owed" figure is the PO-level `Debt Value = Purchase Value − Paid Value`, independent of Invoice existence. Affects [DATA_MODEL.md](DATA_MODEL.md) §4, [FINANCIAL_LOGIC.md](FINANCIAL_LOGIC.md), [PROCUREMENT_LOGIC.md](PROCUREMENT_LOGIC.md). This also resolves the earlier Q-08 (can Invoice exist without a PO, for pure prepayment) — that use case no longer needs a PO-less Invoice, since Payment itself doesn't require any Invoice at all; `Invoice.poId` is simply always required now.

**D-007 — Approval structure confirmed: Finance approves the procurement chain; QS validates Progress and Stock weekly/biweekly; Addendum is dual-approved.**
Full table in [BUSINESS_RULES.md](BUSINESS_RULES.md) §Approval Structure and [USER_ROLES.md](USER_ROLES.md). Key change from the original Phase 0 draft: PR/PO approval moves from PURCHASING to FINANCE (PURCHASING remains the creator/submitter, a deliberate segregation of duties); CEO co-approval is now explicitly tied to the purchasing ceiling being exceeded, not a blanket "over some limit" placeholder. New periodic validation roles: QS validates SPV-submitted, PPIC-approved Progress and LOGISTIC-reported Stock counts, weekly/biweekly, and CEO-level figures always read the QS-validated numbers.

**D-008 — CEO deviation thresholds (Deviation 1 `>10%`, Deviation 2 `≥5%`) are fixed constants, not admin-configurable.**
Per your explicit "do not change these thresholds," these values are hardcoded in the calculation layer rather than stored as an editable `ConfigThreshold`, removing any risk of accidental or unauthorized drift. Affects [REPORTING_LOGIC.md](REPORTING_LOGIC.md), [DATA_MODEL.md](DATA_MODEL.md) §8.

**D-009 — Purchasing ceiling is a percentage, configurable only by CEO or FINANCE.**
Confirmed. Not a flat Rupiah amount, not tiered, not ADMIN-configurable. Exact value and the escalation/blocking behavior once exceeded remain `NEEDS_CONFIRMATION` — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md). Affects [BUSINESS_RULES.md](BUSINESS_RULES.md) §Purchasing Ceiling.

**D-010 — Project/SubPhase/Work visibility: only SPV is `ProjectAssignment`-scoped; every other role sees all projects.**
Found and fixed during Day 1 manual testing: [USER_ROLES.md](USER_ROLES.md)'s permission matrix already specified this precisely (only SPV's cell reads "V (assigned)"; every other role's is plain "V"), but a since-removed [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) entry (former Q-02) mistakenly treated it as unresolved and defaulted the Day 1 implementation to scoping every role. Manual QA caught it immediately (a PPIC user couldn't see a project they'd just created). Corrected in `src/lib/auth-guard.ts`'s `hasGlobalProjectVisibility` — now `role !== "SPV"` instead of an allow-list of just CEO/ADMIN. Lesson: when an `OPEN_QUESTIONS.md` entry and a specific documented table disagree, the specific table wins — it should have been cross-checked against the matrix before writing the "default assumption," not treated as independently open.

**D-011 — Navigation & Wayfinding pattern: back link + identity header + section tabs, once per resource type in a shared layout.**
After Day 2, you flagged the UI as "too plain" and specifically asked for a back arrow and a submenu. Rather than a one-off fix, this is now the standing pattern for every resource with sub-pages (currently just Project, via `src/app/projects/[id]/layout.tsx`): a `←` back link to the parent list, the resource's identity (name/code/status) shown once, and a plain text-tab row for its modules — implemented in the shared layout so every current and future nested page inherits it automatically rather than each page re-declaring its own header/nav. Full spec in [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) §Navigation & Wayfinding. This is a refinement of the restraint direction, not a reversal of it — no cards, colors, gradients, or decoration were added; the visual language (flat, semantic color only, minimal borders) is unchanged, only orientation/wayfinding was addressed. Any future day adding a new project module (QS Formula, Procurement, Progress, Stock, ...) should add a tab to `ProjectSubNav`, not invent a new navigation pattern.

**D-012 — "PPIC" was never a role; the role is PM (Project Manager). Confirmed 2026-09-09.**
You corrected this directly: PPIC — Production Planning and Inventory Control — is the name of your prior Excel-based baseline/budgeting process, not a person or role. The person who owns planning is the **Project Manager (PM)**, working with **QS**. Every code and doc reference to the `PPIC` role has been renamed to `PM` — the `Role` enum, all service-layer role checks, the seed script (`ppic@demo.local` → `pm@demo.local`), and every permission table. **`PPIC_LOGIC.md` keeps its filename and title** — per your own framing, "PPIC" correctly names the baseline/budgeting *process* that doc describes, so renaming the file would have been wrong; only the *role* was renamed. Data migration: `Role` enum value added (`PM`) in one migration, existing `User`/`ProjectAssignment` rows updated from `PPIC`→`PM` in a data-fix step, then the old `PPIC` value removed from the enum in a second migration (`20260909094914_add_pm_role_temp` + `20260909095500_remove_ppic_role`) — no data loss, no downtime, since this predates any real (non-seed) users.

**D-013 — Kickoff is two-tiered: one project-level event, plus a repeatable per-Sub-Phase kickoff that actually unlocks spending.**
You clarified that approval/kickoff happens *per Sub-Phase* — a real project mobilizes Foundation before Column & Beam, not all sub-phases simultaneously. Rather than replace the already-designed project-level `Kickoff` (which locks the baseline — a real, distinct action worth keeping), a new `SubPhaseKickoff` entity is added beneath it: project `Kickoff` (CEO, one-time) unlocks the *ability* to request Sub-Phase kickoff at all; `SubPhaseKickoff` (PM requests per Sub-Phase with planned dates, CEO approves/rejects) is what actually unlocks `PurchaseRequest` creation for that Sub-Phase's Works. Full design in [PPIC_LOGIC.md](PPIC_LOGIC.md) §Sub-Phase Kickoff and [DATA_MODEL.md](DATA_MODEL.md). Not built yet — this corrects the *design* ahead of Day 4, which hadn't started. `NEEDS_CONFIRMATION`: whether Sub-Phase Kickoff approval is CEO alone (kept, matching the existing project-Kickoff pattern) or CEO+Finance (an interactive mockup you shared uses `FINANCE_LIKE` for this) — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-F.

**D-014 — Company name confirmed: Bali Blueprint.**
Resolves the earlier assumption (former Q-21) — confirmed via your shared mockup (`ceo@baliblueprint.com`, page titled "Bali Blueprint — Interactive Mockup").

**D-015 — Visual reference adopted: your shared interactive mockup is now the confirmed UI/UX reference.**
You shared a working mockup and said you like its font, minimalism, and color use. Its semantic status-color palette (green=success/approved, amber=warning/flagged, red=danger, neutral grays, all with real light+dark variants) has been adopted into the app's actual theme (`src/app/globals.css` `--success`/`--warning` tokens, new `Badge` "success"/"warning" variants) — filling a real gap, since Days 1–2 had only black/gray/red badges despite [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) already calling for a fuller semantic palette. The mockup's font (Geist/Geist Mono) already matched what Next.js's default template gave us in Day 1 — no change needed there. Its exact component patterns (pill badges, dashed-border addendum blocks, inline-editable table cells) are a style reference, not a literal spec to copy pixel-for-pixel — implemented using our existing shadcn/Tailwind component system, which already produces a comparable flat, minimal look.

## Assumptions

**A-01 — Pricing Library CONFIGURE split between QS and ADMIN.**
QS updates day-to-day prices; ADMIN owns non-financial system config. Unaffected by today's revision.

**A-02 — ADMIN is a system role separate from the 8 business roles you listed.**
Unaffected by today's revision; still tracked as [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-01.

**A-03 — SUPERSEDED by D-005.** *(Previously: PR/PO consolidation is many-to-many at the item level. This no longer applies — see D-005.)*

**A-04 — Notifications are in-app only for the 14-day MVP; no email/WhatsApp delivery.**
Unaffected by today's revision.

**A-05 — `USAGE` stock movements ("Used" material) are recorded explicitly by LOGISTIC, not auto-inferred from ProgressSubmission.**
Your confirmed decisions establish that progress is never calculated from material consumption, but don't explicitly state the reverse (whether consumption is inferred from progress). Kept as an assumption: explicit LOGISTIC recording, since QS Formulas represent a materials *plan*, not an actual *consumption* record, and auto-inference risks a silently-wrong stock figure. Affects [STOCK_LOGIC.md](STOCK_LOGIC.md). Still tracked as open in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

**A-06 — `STOCK_VARIANCE_THRESHOLD_PCT` is settable by CEO/FINANCE/ADMIN/QS.**
Not explicitly assigned in your confirmed decisions (unlike the purchasing ceiling, which is explicitly CEO/FINANCE only). Kept broad pending confirmation. Affects [USER_ROLES.md](USER_ROLES.md), [DATA_MODEL.md](DATA_MODEL.md) §8.

**A-07 — Addendum dual-approval sequencing: either CEO or FINANCE may approve first, in any order.**
Not specified. Affects [BUSINESS_RULES.md](BUSINESS_RULES.md) §Approval & Rejection. Still tracked as open in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

## How to Use This Log

Before changing any rule that traces back to an entry here, re-read the entry's reasoning — if it no longer holds, add a new entry marking the old one superseded rather than silently changing behavior.
