# Tasks: Event End Date Display

**Input**: Design documents from `/specs/007-event-end-date/`  
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Implementation — User Story 1 (Priority: P1) 🎯 MVP

**Goal**: Display event end date in the event details summary card with smart date range formatting

**Independent Test**: Navigate to any event details page → verify the Calendar row in the summary card shows a date range (same-day or multi-day format) instead of just the start date

### Implementation

- [x] T001 [P] [US1] Create date range formatting utility in `frontend/src/lib/formatDateRange.ts` — export `formatDateRange(startAt?: string, endAt?: string): string` that returns "TBA" if no startAt, single date if no endAt, same-day time range (e.g., "Mar 24, 2026 · 6:00 PM – 10:00 PM") for same-day events, or date range (e.g., "Mar 24 – Mar 26, 2026") for multi-day events
- [x] T002 [US1] Update event summary card in `frontend/src/pages/EventDetailsPage.tsx` — import `formatDateRange` and replace the inline `toLocaleDateString` call in the Calendar summary item (line ~139) with `formatDateRange(data.startAt, data.endAt)`

**Checkpoint**: Event details page shows end date. Feature is complete and testable.

---

## Phase 2: Polish & Validation

**Purpose**: Verify no regressions

- [x] T003 Run TypeScript compilation check (`cd frontend && npx tsc --noEmit`) and fix any type errors
- [x] T004 [P] Run lint check (`npm run lint --workspace frontend`) and fix any lint errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies — can start immediately
- **Phase 2**: Depends on Phase 1 completion

### Within Phase 1

- T001 and T002 are marked [P] / sequential: T001 creates the utility, T002 imports it
- T001 should be done first, then T002

### Parallel Opportunities

- T003 and T004 can run in parallel after Phase 1
