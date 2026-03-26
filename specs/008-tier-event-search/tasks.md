# Tasks: Search Event by Name for Tier Management

**Input**: Design documents from `/specs/008-tier-event-search/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks grouped by user story. US2 (backend) is a prerequisite for US1 (frontend) since the frontend picker depends on the backend search API.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: User Story 2 — Backend Search Support (Priority: P1) 🎯 MVP

**Goal**: Extend `GET /events/mine` with an optional `search` query parameter that filters organizer events by title (case-insensitive LIKE match)

**Independent Test**: Call `GET /api/events/mine?search=concert` with organizer JWT → only matching events returned. Call without `search` → all events returned (backward compatible).

### Implementation

- [X] T001 [P] [US2] Add optional `search` parameter to `listOrganizerEvents` in `backend/src/repositories/eventRepository.ts` — when `search` is provided, append `AND (e.title LIKE ? OR e.description LIKE ?)` with `%search%` params to the WHERE clause (same pattern as `buildFilterClauses`)
- [X] T002 [P] [US2] Add optional `search` parameter to `countOrganizerEvents` in `backend/src/repositories/eventRepository.ts` — when `search` is provided, append the same `AND (e.title LIKE ? OR e.description LIKE ?)` condition to the COUNT query
- [X] T003 [US2] Add optional `search` parameter to `listOrganizerEventsForUser` in `backend/src/services/organizerEventService.ts` — pass `search` through to both `listOrganizerEvents` and `countOrganizerEvents`
- [X] T004 [US2] Update `GET /mine` route handler in `backend/src/api/routes/eventRoutes.ts` — add a Zod query schema (like `browseQuerySchema`) with optional `search` string, parse `req.query`, and pass `search` to `listOrganizerEventsForUser`

**Checkpoint**: Backend API now supports `?search=` on `GET /events/mine`. Existing behavior preserved when param is omitted.

---

## Phase 2: User Story 1 — Search & Select Event in Tier Management Panel (Priority: P1)

**Goal**: Replace the raw UUID input in the Tier Management panel with a search-by-name dropdown that lets organizers find and select events to manage tiers

**Independent Test**: Open Organizer Dashboard → Tier Management panel → type partial event name → see matching dropdown → select event → tiers load for editing

### Implementation

- [X] T005 [US1] Add optional `search` parameter to `listOrganizerEvents` function in `frontend/src/services/organizerApi.ts` — append `&search=encodeURIComponent(search)` to the query string when provided
- [X] T006 [US1] Replace UUID input with search-and-select in `frontend/src/components/TierManagementPanel.tsx` — remove the "Event ID" `<Input>` + "Load" `<Button>`, add a search `<Input>` with `<Search>` icon and clear `<X>` button, add 300ms debounce (`useState` + `useEffect` + `setTimeout` pattern from `EventListPage.tsx`), add dropdown state (`searchResults`, `showDropdown`, `searchLoading`), call `listOrganizerEvents(1, 5, debouncedSearch)` on debounced value change
- [X] T007 [US1] Implement search results dropdown in `frontend/src/components/TierManagementPanel.tsx` — render an absolute-positioned dropdown below the search input showing matching events with title, formatted date (`toLocaleDateString`), and status `<Badge>`, show "No events found" empty state, show loading spinner while fetching, show recent events on empty-focus (up to 5)
- [X] T008 [US1] Implement event selection and clear in `frontend/src/components/TierManagementPanel.tsx` — on dropdown item click: set `eventId` to selected event ID, call existing `getOrganizerEventDetails(id)` to load tiers, close dropdown and show selected event title in the search field; on clear button click: reset `eventId`, `eventTitle`, `tiers`, and `loaded` state, reopen search mode

**Checkpoint**: Organizer can search events by name, select from dropdown, and manage tiers — no UUID copy-paste needed.

---

## Phase 3: Polish & Validation

**Purpose**: Verify no regressions across both frontend and backend

- [X] T009 Run TypeScript compilation check for backend (`cd backend && npx tsc --noEmit`) and fix any type errors
- [X] T010 [P] Run TypeScript compilation check for frontend (`cd frontend && npx tsc --noEmit`) and fix any type errors
- [X] T011 [P] Run lint check for backend (`npm run lint --workspace backend`) and fix any lint errors
- [X] T012 [P] Run lint check for frontend (`npm run lint --workspace frontend`) and fix any lint errors
- [X] T013 Run circular dependency check (`npm run lint:cycles`) and fix any new cycles

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US2 Backend)**: No dependencies — can start immediately
- **Phase 2 (US1 Frontend)**: Depends on Phase 1 completion (frontend calls the backend search API)
- **Phase 3 (Validation)**: Depends on Phases 1 and 2 completion

### Within Phase 1

- T001 and T002 can run in parallel (different functions in same file)
- T003 depends on T001 + T002 (service imports from repository)
- T004 depends on T003 (route calls service)

### Within Phase 2

- T005 must be done first (API client function needed by component)
- T006, T007, T008 are sequential within TierManagementPanel.tsx (each builds on the previous state/UI)

### Parallel Opportunities

- T009 and T010 can run in parallel (different workspaces)
- T011 and T012 can run in parallel (different workspaces)

### Implementation Strategy

- **MVP**: Phase 1 + Phase 2 (T001–T008) — delivers the complete feature
- **Full Delivery**: + Phase 3 (T009–T013) — validates quality across both apps
