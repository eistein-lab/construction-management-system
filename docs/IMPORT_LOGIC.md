# Import Logic

Status: PROPOSED — pipeline architecture only. Exact file format/columns are `NEEDS_CONFIRMATION` (no sample file provided yet — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q-15). Entities in [DATA_MODEL.md](DATA_MODEL.md) §7.

## Scope

Primary use case named in your instructions: importing **accounting expense data** into `AccountingExpenseEntry`. The same pipeline shape should be reused for any future import (supplier lists, pricing library bulk updates) rather than building a one-off importer per data type.

## Pipeline

```
PARSE → NORMALIZE → VALIDATE → PREVIEW → COMMIT
```

1. **PARSE**: read the uploaded file (format TBD — likely `.xlsx`/`.csv` given accounting export conventions) into raw rows, stored verbatim as `ImportRow.rawDataJson`. No interpretation yet.
2. **NORMALIZE**: map source columns to system fields per `ImportBatch.mappingConfigJson` (a saved column-mapping template so the same accounting export format doesn't need remapping every month). Produces `ImportRow.normalizedDataJson`. Includes: project-code → `projectId` lookup, category mapping, date parsing, amount parsing (handling thousands separators / Indonesian number formatting).
3. **VALIDATE**: per-row checks — required fields present, project code resolves to a known `Project`, amount is numeric, date is valid and within a sane range. Sets `ImportRow.matchStatus` to `MATCHED` (resolves cleanly), `NEW` (valid but references e.g. a category not seen before — still importable, flagged for review), or `ERROR` (fails validation, excluded from commit, reason shown).
4. **PREVIEW**: user sees a summary (total rows, matched/new/error counts) and a row-level table before anything is written to `AccountingExpenseEntry`. Nothing is committed at this stage — fully inspectable and abortable.
5. **COMMIT**: only `MATCHED`/`NEW` rows (user-confirmed) are written as `AccountingExpenseEntry` rows, each linked back to `importBatchId` and its source `ImportRow` for traceability. `ERROR` rows are never committed; the batch can be re-uploaded after fixing the source file.

## Duplicate / Update Behavior

- **Unique identifier**: the import must have a stable per-row key so re-importing the same export (e.g. a corrected month-end file) doesn't create duplicates. Candidate key: `(source system's transaction ID)` if the accounting export includes one; otherwise a composite of `(projectId, category, amount, expenseDate)` — weaker, since two genuinely distinct entries could collide. This is `NEEDS_CONFIRMATION` pending a real sample file (see OPEN_QUESTIONS Q-15).
- **On duplicate key match during COMMIT**: default behavior is **update-in-place is not allowed silently** — a re-imported row matching an existing `AccountingExpenseEntry`'s key is flagged in PREVIEW as "already imported" and skipped by default, with an explicit "re-import and overwrite" opt-in per row (logged to `AuditLog` as an update, not a silent overwrite). This preserves the financial-safety principle (§34) that nothing overwrites financial data invisibly.
- **Idempotency**: re-running COMMIT on the same `ImportBatch` twice (e.g. accidental double-click) is a no-op the second time — `ImportBatch.status` moves to `COMMITTED` and further commit attempts on that batch are rejected.

## Unmatched Data

Rows with `matchStatus = ERROR` or an unresolved project-code lookup are never guessed at automatically. They surface in PREVIEW with the specific failure reason and must be either fixed in the source file and re-uploaded, or (for project-code mapping specifically) resolved via a manual mapping step before COMMIT — never auto-assigned to a best-guess project.

## What's Still Open

- Exact source file format and column layout — Q-15.
- Whether imports are monthly/batch or need to support incremental/daily feeds — Q-16.
- Whether the accounting system this exports from is known/fixed (affects how much mapping flexibility the UI needs) — Q-16.
