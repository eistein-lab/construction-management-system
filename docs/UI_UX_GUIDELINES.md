# UI/UX Guidelines

Status: PROPOSED, revised per your confirmed direction. **Visual reference confirmed 2026-09-09** — see §Confirmed Visual Reference below; see [DECISIONS.md](DECISIONS.md) D-015.

## Direction

Minimalist, clean, functional, fast, **easy to scan**. This is a working tool used daily by people who need an answer quickly, not a showcase. Speed and usability are prioritized over visual richness in every tradeoff.

## Restraint (confirmed, explicit)

- **Avoid excessive colors** — a small, restrained set used only to communicate status/importance (see Color below), never decoratively.
- **Avoid complicated visual effects, decorative UI, gradients, glassmorphism, and animations.** No motion for its own sake; a transition exists only if it communicates state (e.g. a loading spinner), never as polish.
- **Avoid excessive cards.** Don't wrap every piece of data in its own card/panel by default — use plain rows, tables, and grouped sections where a card adds a border without adding meaning. Reserve cards for genuinely distinct, scannable summary blocks (e.g. a handful of top-level KPI tiles), not as the default container for everything.
- **Avoid excessive whitespace.** This is an information-dense operational tool — pack tables and summary views tightly enough that a user can see many rows/figures at once without excessive scrolling, while keeping enough spacing that columns and rows stay legible. Density over air.

If visual polish conflicts with business functionality or speed, functionality and speed win — no exceptions.

## Navigation & Wayfinding

Added after Day 2 feedback: the first two days' pages worked but felt disconnected — no way back, no sense of "where am I," a feature (Planning Baseline) reachable only via a button buried in page content. Minimalism is about removing decoration, not removing orientation. Every page below a top-level list (e.g. anything under `/projects/[id]/*`) follows this pattern, implemented **once per resource type in a shared layout**, never duplicated per page:

- **Back link**: a `←` arrow plus the parent list's name (e.g. "← Projects") above the page title, linking to the parent list.
- **Identity header**: the resource's name + code + status badge, shown once in the shared layout so every nested page carries the same unambiguous context instead of each page re-declaring — or forgetting — it.
- **Section tabs ("submenu")**: once a resource has multiple modules (a project's Overview and Planning Baseline today; QS Formulas, Procurement, Progress, and Stock as later days add them), a plain underlined-tab row exposes all of them, so any module is one click away from any other, never hunted for inside page content. Active tab = solid underline + full-contrast text; inactive = muted text, no underline, no pill/background fill, no icons on the tabs themselves — text-only, consistent with the flat aesthetic.
- **Icons**: lucide-react (already a dependency via shadcn) is fine for navigational clarity — a back arrow, a chevron — never as decoration, and never doubled up with a text affordance that already says the same thing.

Reference implementation: `src/app/projects/[id]/layout.tsx` (back link + identity header + `ProjectSubNav`) and `src/components/project-sub-nav.tsx` (the tabs). This is the template for every future day that adds a project module — extend the existing layout's tabs, don't invent a new navigation pattern per feature. See [DECISIONS.md](DECISIONS.md) D-011.

## Surfaces

- Neutral, light backgrounds (off-white/light gray page background, white content surfaces).
- Minimal borders instead of heavy shadows or elevated cards; flat, not layered.
- Compact information blocks (stat tiles, KPI rows) over large decorative hero sections.

## Color — Semantic, Not Decorative

A small, restrained palette, used only to highlight meaning:

| Color | Meaning |
|---|---|
| Green | Success / within baseline / approved / validated within threshold |
| Amber/Yellow | Warning (variance approaching ceiling, deviation approaching threshold, validation overdue) |
| Red | Danger (over ceiling, deviation warning triggered — Deviation 1 or 2, rejected, stock discrepancy flagged) |
| Blue | Informational / neutral status |
| Neutral gray | Default/no-status state — most of the UI, most of the time |

This palette is the single source of truth for status color app-wide — CEO deviation warnings ([REPORTING_LOGIC.md](REPORTING_LOGIC.md)), PR/PO ceiling flags, and stock/progress validation badges all reuse these same tokens, never inventing per-page color choices.

**Implemented (Day 3)**: `--success`/`--warning` CSS tokens in `src/app/globals.css` (light + dark variants) and matching `Badge` `variant="success"`/`variant="warning"` — used for APPROVED/Active (success) and SUBMITTED/flagged-for-review (warning) states. `destructive` (red, already existed) and default/secondary/outline (neutral) cover the rest — no separate "blue/informational" token exists yet; use `outline` until a real informational-badge need arises, don't invent a new color token for it speculatively.

## Typography — Used Intentionally to Define Importance

- **Bold**: key numbers (KPI values, totals — e.g. Debt Value, Deviation %), page/section headings.
- **Semibold**: status labels, table column headers, key field labels.
- **Regular**: supporting/secondary text, descriptions.
- **Italic**: sparingly, only for contextual notes (e.g. "unvalidated — provisional", "as of {date}") — never for primary content.
- Font color reinforces hierarchy (muted gray for secondary/metadata text, full-contrast for primary figures, semantic color per the table above for status).

## Tables — Practical, Not Decorative

- **Sticky/frozen headers** on long lists, and **frozen first column(s)** where a table is wide enough to scroll horizontally (e.g. a stock report with many location columns) — a user must always be able to tell which row/column they're looking at.
- Server-side pagination and filtering for anything beyond a small fixed list (ties to [ARCHITECTURE.md](ARCHITECTURE.md) §Performance).
- **Clear status/number formatting**: consistent thousands separators, right-aligned numeric columns, currency figures always labeled (Rp), percentages always shown with sign for deviations (+12.0%, −5.0%), status values as short colored badges/labels (not paragraphs), dates in one consistent format app-wide.
- Sortable columns for financial/date fields.

## Charts

Simple charts only (bar, line, simple donut for %) — no 3D, no unnecessary chart types, no chart where a table or a single number would answer the question faster.

## Component Library

shadcn/ui on Tailwind CSS — gives the flat, restrained-shadow, clean-table baseline for free; customize the color tokens above and reduce shadcn's default spacing/elevation to match the density and restraint direction rather than adding to it.

## Confirmed Visual Reference

You shared a working interactive mockup (Bali Blueprint) and confirmed you like its font, minimalism, and color use. Concretely adopted from it:

- **Palette**: exact hex values for success/warning (green `#15803d`/warning amber `#d97706` light, `#6fcf97`/`#f0c883` dark) now back the `Badge` `success`/`warning` variants — see [DECISIONS.md](DECISIONS.md) D-015.
- **Font**: Geist/Geist Mono — already what Next.js's own default template gave us in Day 1, so no change was needed.
- **Density and flatness**: the mockup's tight tables, plain borders (no heavy shadows), and pill-style status badges all confirm the restraint direction above rather than contradicting it.

Its exact component patterns (e.g. inline-editable table cells, dashed-border "addendum" blocks) are a style reference to draw from as relevant features get built (Addendum lands Day 4, PR/PO editing lands Days 5–6) — not a pixel-for-pixel spec to replicate. We build with our existing shadcn/Tailwind components, which already produce a comparable look.
