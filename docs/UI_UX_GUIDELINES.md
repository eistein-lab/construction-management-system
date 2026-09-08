# UI/UX Guidelines

Status: PROPOSED, revised per your confirmed direction. No visual reference files exist in this repository — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

## Direction

Minimalist, clean, functional, fast, **easy to scan**. This is a working tool used daily by people who need an answer quickly, not a showcase. Speed and usability are prioritized over visual richness in every tradeoff.

## Restraint (confirmed, explicit)

- **Avoid excessive colors** — a small, restrained set used only to communicate status/importance (see Color below), never decoratively.
- **Avoid complicated visual effects, decorative UI, gradients, glassmorphism, and animations.** No motion for its own sake; a transition exists only if it communicates state (e.g. a loading spinner), never as polish.
- **Avoid excessive cards.** Don't wrap every piece of data in its own card/panel by default — use plain rows, tables, and grouped sections where a card adds a border without adding meaning. Reserve cards for genuinely distinct, scannable summary blocks (e.g. a handful of top-level KPI tiles), not as the default container for everything.
- **Avoid excessive whitespace.** This is an information-dense operational tool — pack tables and summary views tightly enough that a user can see many rows/figures at once without excessive scrolling, while keeping enough spacing that columns and rows stay legible. Density over air.

If visual polish conflicts with business functionality or speed, functionality and speed win — no exceptions.

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

## Open Item

No mood-board/reference screenshots were supplied in this repository. If you have specific reference apps/screens in mind, share them before Day 1 UI work begins.
