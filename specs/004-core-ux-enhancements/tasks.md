# Tasks: Core UX Enhancements

**Input**: Design documents from `/specs/004-core-ux-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. US2–US5 (search & filtering) share backend infrastructure in the Foundational phase.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and repository-level changes needed by multiple user stories.

- [X] T001 Add `'booking_cancelled'` to NotificationType union in backend/src/domain/types.ts
- [X] T002 [P] Add `decrementDiscountUsage(discountCodeId: string)` function using `MAX(0, used_count - 1)` in backend/src/repositories/discountRepository.ts
- [X] T003 [P] Add optional `reason` parameter (default `'event_cancelled'`) to `createRefundRequest` in backend/src/repositories/refundRepository.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend search/filter infrastructure shared by US2, US3, US4, and US5. MUST be complete before those user stories' frontend work begins.

**⚠️ CRITICAL**: US2–US5 frontend work depends on this phase.

- [X] T004 Add `listFilteredEvents(filters, page, pageSize)` and `countFilteredEvents(filters)` functions with dynamic WHERE clause construction (text LIKE, dateFrom, dateTo, minPrice/maxPrice via EXISTS subquery on ticket_tiers, includePast toggle) in backend/src/repositories/eventRepository.ts
- [X] T005 Add `listOrganizerEvents(organizerId, page, pageSize)` and `countOrganizerEvents(organizerId)` functions with LEFT JOIN ticket_tiers for totalCapacity/totalSold aggregates in backend/src/repositories/eventRepository.ts
- [X] T006 Update `browseEvents` to accept filter parameters (search, dateFrom, dateTo, minPrice, maxPrice, includePast) and return `{ items, total, page, pageSize }` using `listFilteredEvents`/`countFilteredEvents` in backend/src/services/eventService.ts
- [X] T007 Update `getEventDetails` to allow cancelled events (remove `status !== 'published'` rejection, include `cancellationReason` in response) in backend/src/services/eventService.ts
- [X] T008 Update `GET /events` route to parse and pass search/filter query params (search, dateFrom, dateTo, minPrice, maxPrice, includePast) with Zod validation in backend/src/api/routes/eventRoutes.ts

**Checkpoint**: Backend search/filter endpoints functional (testable via curl). `GET /events?search=...&dateFrom=...&maxPrice=...&includePast=true` returns filtered, paginated results with total count.

---

## Phase 3: User Story 1 — Attendee Cancels a Booking (Priority: P1) 🎯 MVP

**Goal**: Attendee can cancel a confirmed booking from My Bookings. System restores inventory, creates refund, decrements discount usage, promotes waitlist, and sends notification.

**Independent Test**: Register, purchase tickets, navigate to My Bookings, click Cancel, confirm in dialog. Verify booking status → cancelled, tier inventory restored, refund created, notification sent.

### Implementation for User Story 1

- [X] T009 [US1] Add `getBookingWithDetails(bookingId, userId)` function that JOINs bookings+events+ticket_tiers and returns booking with eventTitle, tierName, eventStartAt, eventStatus in backend/src/repositories/bookingRepository.ts
- [X] T010 [US1] Add `cancelBookingAtomically(bookingId, quantity, ticketTierId, totalPaidMinor, discountCodeId, paymentReference)` function using `withTransaction` to update booking status, restore tier sold_quantity, create refund with reason `'user_cancelled'`, and decrement discount usage (if applicable) in backend/src/repositories/bookingRepository.ts
- [X] T011 [US1] Add `cancelBooking(userId, bookingId)` function in backend/src/services/bookingService.ts that validates ownership, checks booking is confirmed, rejects if event is cancelled or started, calls `cancelBookingAtomically`, then fire-and-forget: calls `promoteWaitlistForTier` and creates `booking_cancelled` notification
- [X] T012 [US1] Add `POST /:id/cancel` route with requireAuth middleware calling `cancelBooking` and returning `{ bookingId, status, refundId, refundAmountMinor }` in backend/src/api/routes/bookingRoutes.ts
- [X] T013 [P] [US1] Add `cancelBooking(bookingId: string)` API client function in frontend/src/services/attendeeApi.ts
- [X] T014 [US1] Add cancel button (only for confirmed bookings), confirmation dialog (ActionConfirmDialog), and cancellation success toast to frontend/src/pages/MyBookingsPage.tsx

**Checkpoint**: Booking cancellation fully functional end-to-end. US1 acceptance scenarios 1–5 verifiable.

---

## Phase 4: User Story 2 — Attendee Searches for Events (Priority: P1) 🎯 MVP

**Goal**: Attendee can search events by keyword on the Events page with debounced input and empty state.

**Independent Test**: Navigate to Events page, type a keyword, verify filtered results appear. Clear search, verify all events return. Default view shows upcoming events only.

### Implementation for User Story 2

- [X] T015 [P] [US2] Update `listEvents` in frontend/src/services/attendeeApi.ts to accept optional filter params (search, dateFrom, dateTo, minPrice, maxPrice, includePast) and pass as query string, and update `EventListResult` to include `total` field
- [X] T016 [US2] Create EventSearchFilters component with search input (text field with Search icon), "Include past events" toggle checkbox, and "Clear all" button in frontend/src/components/app/EventSearchFilters.tsx
- [X] T017 [US2] Integrate EventSearchFilters into EventListPage with debounced search state (300ms), page reset on filter change, updated empty state message for filtered results, and pagination using total count in frontend/src/pages/EventListPage.tsx

**Checkpoint**: Text search functional with debounce and empty state. Default view shows upcoming events only with toggle for past events. US2 acceptance scenarios 1–5 verifiable.

---

## Phase 5: User Story 3 — Date Range Filter (Priority: P2)

**Goal**: Attendee can filter events by start date range (from, to, or both).

**Independent Test**: Select a date range on the Events page, verify only events within that range appear.

### Implementation for User Story 3

- [X] T018 [US3] Add "From" and "To" date inputs (HTML date input type) to EventSearchFilters component and pass dateFrom/dateTo via onChange callbacks in frontend/src/components/app/EventSearchFilters.tsx
- [X] T019 [US3] Wire dateFrom/dateTo state from EventSearchFilters into the listEvents API call and page reset logic in frontend/src/pages/EventListPage.tsx

**Checkpoint**: Date range filtering works in combination with text search. US3 acceptance scenarios 1–4 verifiable.

---

## Phase 6: User Story 4 — Price Range Filter (Priority: P2)

**Goal**: Attendee can filter events by ticket price range (min, max, or both). Users enter whole dollar amounts.

**Independent Test**: Enter a max price on the Events page, verify only events with at least one tier at or below that price are shown.

### Implementation for User Story 4

- [X] T020 [US4] Add "Min Price" and "Max Price" number inputs (with $ prefix label) to EventSearchFilters that convert dollar amounts to minor units (×100) before passing via callbacks in frontend/src/components/app/EventSearchFilters.tsx
- [X] T021 [US4] Wire minPrice/maxPrice state from EventSearchFilters into the listEvents API call and page reset logic in frontend/src/pages/EventListPage.tsx

**Checkpoint**: Price filtering works in combination with text search and date filters. US4 acceptance scenarios 1–4 verifiable.

---

## Phase 7: User Story 5 — Combined Search and Filters (Priority: P2)

**Goal**: All filters compose additively. Active filters can be individually cleared. Pagination reflects filtered total.

**Independent Test**: Apply search + date + price filters simultaneously, verify only matching events shown. Clear one filter, verify results expand.

### Implementation for User Story 5

- [X] T022 [US5] Add active filter indicator badges (showing count of active filters) and individual clear buttons for each filter type in frontend/src/components/app/EventSearchFilters.tsx
- [X] T023 [US5] Verify pagination total count updates correctly when filters change, and "Clear all filters" resets all state in frontend/src/pages/EventListPage.tsx

**Checkpoint**: All filter combinations work correctly with pagination. US5 acceptance scenarios 1–4 verifiable.

---

## Phase 8: User Story 6 — Organizer Views Their Own Events (Priority: P2)

**Goal**: Organizer sees a paginated list of their events with status badges and sales summary on the dashboard.

**Independent Test**: Log in as organizer, navigate to Dashboard, verify event list with title, date, venue, status, and tickets sold/capacity.

### Implementation for User Story 6

- [X] T024 [US6] Add `listOrganizerEvents(userId)` function in backend/src/services/organizerEventService.ts that checks organizer/admin role and calls `listOrganizerEvents`/`countOrganizerEvents` from repository
- [X] T025 [US6] Add `GET /events/mine` route with requireAuth and requireRole(['organizer', 'admin']) middleware in backend/src/api/routes/eventRoutes.ts (moved from organizerEventRoutes to avoid route collision with /:eventId)
- [X] T026 [P] [US6] Add `listOrganizerEvents(page?, pageSize?)` API function and `OrganizerEventItem` type in frontend/src/services/organizerApi.ts
- [X] T027 [US6] Add "My Events" section with paginated table/list (title, date, venue, status badge, sold/capacity) and empty state to frontend/src/pages/OrganizerDashboardPage.tsx

**Checkpoint**: Organizer event list functional. US6 acceptance scenarios 1–4 verifiable.

---

## Phase 9: User Story 7 — Improved My Bookings Page (Priority: P3)

**Goal**: My Bookings page displays richer booking details sorted by status (confirmed first).

**Independent Test**: Log in with mixed-status bookings, verify confirmed bookings appear first with full details (event date, venue, tier, quantity, amount, status badge).

### Implementation for User Story 7

- [X] T028 [US7] Update the GET /bookings query inline in bookingRoutes.ts to sort by `CASE status WHEN 'confirmed' THEN 1 WHEN 'pending' THEN 2 WHEN 'cancelled' THEN 3 WHEN 'refunded' THEN 4 ELSE 5 END, created_at DESC` in backend/src/api/routes/bookingRoutes.ts
- [X] T029 [US7] Enhance booking cards in MyBookingsPage to display event date, venue name, tier name, quantity, formatted amount paid, and prominent status badge with color variants in frontend/src/pages/MyBookingsPage.tsx

**Checkpoint**: My Bookings page shows richer, sorted booking cards. US7 acceptance scenarios 1–3 verifiable.

---

## Phase 10: User Story 8 — Cancelled Event Display (Priority: P3)

**Goal**: Cancelled events show a cancellation banner with reason instead of 404. Booking/waitlist actions are hidden.

**Independent Test**: Cancel an event, navigate to its URL. Verify cancellation banner is shown, event details are visible, and booking actions are hidden.

### Implementation for User Story 8

- [X] T030 [US8] Update EventDetailsPage to handle cancelled events: show a prominent "Event Cancelled" Alert banner with cancellation reason, hide "Book Now" buttons and WaitlistPanel for cancelled events in frontend/src/pages/EventDetailsPage.tsx

**Checkpoint**: Cancelled events display correctly instead of 404. US8 acceptance scenarios 1–3 verifiable.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Validation, dependency hygiene, and end-to-end verification across all stories.

- [X] T031 [P] Run dependency cycle detection (npm run lint:cycles) and verify no circular imports introduced
- [X] T032 Run quickstart.md verification steps 1–10 for end-to-end validation of booking cancellation, event search/filter, organizer events, and cancelled event display

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 for notification type) — **BLOCKS US2–US5 frontend work**
- **US1 (Phase 3)**: Depends on Setup (T001, T002, T003) — independent of Foundational
- **US2 (Phase 4)**: Depends on Foundational (T004–T008) — needs backend filter endpoints
- **US3 (Phase 5)**: Depends on US2 (extends EventSearchFilters component)
- **US4 (Phase 6)**: Depends on US2 (extends EventSearchFilters component), can parallel with US3
- **US5 (Phase 7)**: Depends on US3 + US4 (verifies all filters compose)
- **US6 (Phase 8)**: Depends on Foundational (T005) — independent of US1–US5
- **US7 (Phase 9)**: Depends on US1 (cancel button integration) — can start backend sort independently
- **US8 (Phase 10)**: Depends on Foundational (T007) — independent of US1–US7
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — only needs Setup phase
- **US2 (P1)**: Independent — only needs Foundational phase
- **US3 (P2)**: Extends US2 frontend component (EventSearchFilters)
- **US4 (P2)**: Extends US2 frontend component (EventSearchFilters), parallel with US3
- **US5 (P2)**: Integration story — needs US2 + US3 + US4
- **US6 (P2)**: Fully independent of all other stories
- **US7 (P3)**: Needs US1 for cancel button, but backend sort is independent
- **US8 (P3)**: Independent — only needs Foundational T007

### Within Each User Story

- Repository before service (when applicable)
- Service before route
- Route before API client
- API client before frontend page/component

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can all run in parallel (different files)
- **Phase 2**: T004 and T005 modify same file (eventRepository) — sequential. T006, T007 modify same file (eventService) — sequential. T008 is independent.
- **Phase 3 vs Phase 2**: US1 (Phase 3) can start in parallel with Foundational (Phase 2) since they touch different files
- **Phase 3**: T009, T010 are sequential (same file). T013 can run in parallel with T009–T012 (frontend vs backend)
- **Phase 5 and Phase 6**: US3 and US4 can run in parallel (they extend EventSearchFilters independently)
- **Phase 8 vs others**: US6 can run in parallel with US3/US4/US5 (completely different files)
- **Phase 10**: US8 can run in parallel with US6 and US7 (different pages)

---

## Parallel Example: After Setup Phase

```text
# US1 (booking cancellation) and Foundational (search/filter) can run in parallel:

# Stream A — Booking Cancellation (US1):
T009: bookingRepository.ts (getBookingWithDetails)     ─┐
T010: bookingRepository.ts (cancelBookingAtomically)    │ sequential
T011: bookingService.ts (cancelBooking)                 │ (same/dependent files)
T012: bookingRoutes.ts (POST /:id/cancel)              ─┘
T013: attendeeApi.ts (cancelBooking)                    } parallel with backend
T014: MyBookingsPage.tsx (cancel UI)                    } sequential after T013

# Stream B — Search/Filter Backend (Foundational):
T004: eventRepository.ts (listFilteredEvents)          ─┐
T005: eventRepository.ts (listOrganizerEvents)          │ sequential (same file)
T006: eventService.ts (browseEvents filter params)      │
T007: eventService.ts (allow cancelled events)          │
T008: eventRoutes.ts (query params)                    ─┘
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (types, discount decrement, refund reason)
2. Complete Phase 2: Foundational (search/filter backend)
3. Complete Phase 3: US1 (Booking cancellation — full stack)
4. Complete Phase 4: US2 (Event search — full stack)
5. **STOP and VALIDATE**: Both P1 stories complete — test end-to-end
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Backend ready for all stories
2. Add US1 → Booking cancellation functional (P1 MVP!)
3. Add US2 → Event text search functional (P1 complete!)
4. Add US3 + US4 → Date and price filters (P2 filters)
5. Add US5 → Combined filter verification (P2 complete)
6. Add US6 → Organizer event list (P2 dashboard)
7. Add US7 → Enhanced bookings page (P3 polish)
8. Add US8 → Cancelled event display (P3 polish)
9. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within the same phase
- [Story] label maps task to specific user story for traceability
- US2–US5 share the same backend filter infrastructure (Foundational phase)
- US3 and US4 extend the same frontend component (EventSearchFilters) — can be parallelized since they add different input types
- Fire-and-forget pattern: notification and waitlist promotion happen OUTSIDE transactions, wrapped in try/catch
- No new database tables or columns — all changes use existing schema
- Price inputs display in dollars ($), convert to minor units (cents × 100) before API calls
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
