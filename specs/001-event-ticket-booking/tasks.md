# Tasks: Event Ticket Booking Web App

**Input**: Design documents from `/specs/001-event-ticket-booking/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are intentionally omitted because the specification does not explicitly request a TDD/test-first task track.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize frontend/backend workspaces and baseline project tooling.

- [X] T001 Initialize backend Node.js workspace in backend/package.json
- [X] T002 Initialize frontend React + TypeScript workspace in frontend/package.json
- [X] T003 [P] Configure backend TypeScript compiler settings in backend/tsconfig.json
- [X] T004 [P] Configure frontend TypeScript compiler settings in frontend/tsconfig.json
- [X] T005 [P] Configure backend linting and cycle rules in backend/.eslintrc.cjs
- [X] T006 [P] Configure frontend linting and cycle rules in frontend/.eslintrc.cjs
- [X] T007 [P] Add root scripts for lint/test/dev orchestration in package.json
- [X] T008 [P] Add environment template for backend JWT/SQLite config in backend/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared backend foundations required before any story implementation.

**⚠️ CRITICAL**: No user story tasks should start before this phase completes.

- [X] T009 Create SQLite schema for users/events/tiers/bookings/waitlist/refunds in backend/src/db/schema.sql
- [X] T010 Implement SQLite connection and transaction helper in backend/src/db/client.ts
- [X] T011 [P] Define shared API error model and codes in backend/src/api/errors.ts
- [X] T012 [P] Implement request validation utilities using Zod in backend/src/api/validation.ts
- [X] T013 [P] Implement JWT issue/verify utilities in backend/src/auth/jwt.ts
- [X] T014 [P] Implement auth middleware (401/403 handling) in backend/src/api/middleware/auth.ts
- [X] T015 [P] Define backend domain types mapped from data model in backend/src/domain/types.ts
- [X] T016 [P] Add API client base and auth token handling in frontend/src/services/apiClient.ts
- [X] T017 Wire Express app, middleware, and route registration in backend/src/app.ts
- [X] T018 Add dependency-cycle CI check script in scripts/check-cycles.mjs

**Checkpoint**: Foundation complete; user stories can now proceed.

---

## Phase 3: User Story 1 - Browse and Purchase Tickets (Priority: P1) 🎯 MVP

**Goal**: Allow attendees to browse events, view details, login/register, and purchase tickets without overselling.

**Independent Test**: A user can register/login, browse events, view tier availability, and complete a valid purchase; insufficient inventory rejects the full request.

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement auth routes for register/login in backend/src/api/routes/authRoutes.ts
- [X] T020 [P] [US1] Implement event read repository methods in backend/src/repositories/eventRepository.ts
- [X] T021 [P] [US1] Implement booking repository with atomic inventory update in backend/src/repositories/bookingRepository.ts
- [X] T022 [US1] Implement browse/detail event service in backend/src/services/eventService.ts
- [X] T023 [US1] Implement purchase service with oversell rejection logic in backend/src/services/bookingService.ts
- [X] T024 [US1] Add browse/detail event REST endpoints in backend/src/api/routes/eventRoutes.ts
- [X] T025 [US1] Add create booking endpoint returning 201/409 semantics in backend/src/api/routes/bookingRoutes.ts
- [X] T026 [P] [US1] Build attendee event listing page in frontend/src/pages/EventListPage.tsx
- [X] T027 [P] [US1] Build event details + tier selection page in frontend/src/pages/EventDetailsPage.tsx
- [X] T028 [P] [US1] Build auth page for register/login in frontend/src/pages/AuthPage.tsx
- [X] T029 [US1] Build checkout flow and booking submission UI in frontend/src/pages/CheckoutPage.tsx
- [X] T030 [US1] Add attendee API service methods for auth/events/bookings in frontend/src/services/attendeeApi.ts

**Checkpoint**: User Story 1 is independently functional and demo-ready (MVP).

---

## Phase 4: User Story 2 - Manage Events as Organizer (Priority: P2)

**Goal**: Allow organizer role request/approval-based event creation, ticket limit management, event cancellation, and full refunds.

**Independent Test**: An approved organizer creates an event with tiers, sells tickets, cancels event, and affected bookings move through refund lifecycle.

### Implementation for User Story 2

- [X] T031 [P] [US2] Implement organizer approval repository operations in backend/src/repositories/organizerRepository.ts
- [X] T032 [P] [US2] Implement refund repository operations in backend/src/repositories/refundRepository.ts
- [X] T033 [US2] Implement organizer role request and approval service in backend/src/services/organizerService.ts
- [X] T034 [US2] Implement event creation and cancellation/refund orchestration service in backend/src/services/organizerEventService.ts
- [X] T035 [US2] Add organizer request endpoint in backend/src/api/routes/organizerRoutes.ts
- [X] T036 [US2] Add organizer event create/cancel endpoints in backend/src/api/routes/organizerEventRoutes.ts
- [X] T037 [P] [US2] Build organizer event management page in frontend/src/pages/OrganizerDashboardPage.tsx
- [X] T038 [P] [US2] Build organizer event creation form with tier limits in frontend/src/components/OrganizerEventForm.tsx
- [X] T039 [US2] Build event cancellation and refund-status UI in frontend/src/components/EventCancellationPanel.tsx
- [X] T040 [US2] Add organizer API service methods in frontend/src/services/organizerApi.ts
- [X] T057 [US2] Implement admin organizer-approval decision service in backend/src/services/adminOrganizerService.ts
- [X] T058 [US2] Add admin organizer decision endpoint in backend/src/api/routes/adminOrganizerRoutes.ts
- [X] T059 [US2] Build admin organizer request decision page in frontend/src/pages/AdminOrganizerRequestsPage.tsx

**Checkpoint**: User Stories 1 and 2 both operate independently.

---

## Phase 5: User Story 3 - Waitlist and Discounted Booking (Priority: P3)

**Goal**: Support waitlist enrollment/promotion with 30-minute hold and single-code discount application during checkout.

**Independent Test**: Sold-out users join waitlist, become notified when capacity opens, then purchase within hold window with one valid discount code.

### Implementation for User Story 3

- [X] T041 [P] [US3] Implement discount code repository and usage tracking in backend/src/repositories/discountRepository.ts
- [X] T042 [P] [US3] Implement waitlist repository with FIFO and hold expiration fields in backend/src/repositories/waitlistRepository.ts
- [X] T043 [US3] Implement discount validation and pricing service in backend/src/services/discountService.ts
- [X] T044 [US3] Implement waitlist promotion and 30-minute hold service in backend/src/services/waitlistService.ts
- [X] T045 [US3] Add waitlist join endpoint in backend/src/api/routes/waitlistRoutes.ts
- [X] T046 [US3] Add discount validation endpoint in backend/src/api/routes/discountRoutes.ts
- [X] T047 [US3] Integrate one-code checkout rule in backend/src/services/bookingService.ts
- [X] T048 [P] [US3] Build waitlist enrollment and status UI in frontend/src/components/WaitlistPanel.tsx
- [X] T049 [P] [US3] Build discount-code input and validation UI in frontend/src/components/DiscountCodeInput.tsx
- [X] T050 [US3] Add waitlist/discount API service methods in frontend/src/services/checkoutApi.ts

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize cross-story quality and release readiness.

- [X] T051 [P] Sync request/response schemas with implementation in specs/001-event-ticket-booking/contracts/openapi.yaml
- [X] T052 [P] Update operational setup/run steps in specs/001-event-ticket-booking/quickstart.md
- [X] T053 [P] Document feature delivery and architecture notes in docs/event-ticket-booking.md
- [X] T054 Add production error logging and correlation metadata in backend/src/api/middleware/errorHandler.ts
- [X] T055 Add frontend route guards for auth/role-protected views in frontend/src/app/router.tsx
- [X] T056 Run end-to-end quickstart validation checklist in specs/001-event-ticket-booking/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; starts immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all stories.
- **User Stories (Phase 3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of all required user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other stories.
- **US2 (P2)**: Starts after Foundational; can run in parallel with US1 but typically follows MVP.
- **US3 (P3)**: Starts after Foundational; can run in parallel with US2 when team capacity allows.

### Within Each User Story

- Repositories/models before services.
- Services before route handlers.
- Backend endpoints before frontend integration.
- Story UI integration after API/service behavior is available.

### Dependency Graph (Story Order)

- Foundation → US1 → US2 → US3
- Foundation → US1 → US3 (parallel option when staffed)

---

## Parallel Execution Examples

### User Story 1

- T019, T020, T021 can run in parallel.
- T026, T027, T028 can run in parallel.

### User Story 2

- T031 and T032 can run in parallel.
- T037 and T038 can run in parallel.

### User Story 3

- T041 and T042 can run in parallel.
- T048 and T049 can run in parallel.

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) fully.
3. Validate US1 independently before adding organizer/waitlist complexity.

### Incremental Delivery

1. Ship MVP purchase flow (US1).
2. Add organizer management and cancellation/refunds (US2).
3. Add waitlist + discount enhancements (US3).
4. Execute cross-cutting polish and release checks.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Developer A drives backend services/routes while Developer B builds frontend UI for active story.
3. Once US1 stabilizes, split US2 and US3 across team members while sharing contract updates.

---

## Notes

- [P] tasks indicate file-level parallelism with minimal merge conflict risk.
- Story labels preserve traceability from task to requirement and acceptance scenarios.
- All tasks use explicit file paths and are execution-ready for implementation agents.
