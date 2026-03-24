# Tasks: QA Test Scenarios

**Input**: Design documents from `/specs/005-qa-test-scenarios/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Organization**: Tasks are grouped by user story. Since this feature IS tests, every task produces test files. Tests are the primary deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- All file paths are relative to repository root

---

## Phase 1: Setup (Test Infrastructure)

**Purpose**: Install dependencies, configure Jest, create test helpers

- [X] T001 Install supertest and @types/supertest as devDependencies in backend/package.json
- [X] T002 Create Jest ESM configuration in backend/jest.config.ts per research R-001
- [X] T003 Create test database setup with in-memory SQLite and schema bootstrap in backend/tests/setup.ts
- [X] T004 [P] Create JWT token helper for test authentication in backend/tests/helpers/auth.ts
- [X] T005 [P] Create database seed helpers (seedUser, seedEvent, seedTier, seedDiscount, seedBooking, seedWaitlistEntry, clearAllTables) in backend/tests/helpers/db.ts

---

## Phase 2: Foundational (Validate Test Infrastructure)

**Purpose**: Verify test runner works end-to-end before writing real tests

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create smoke test that verifies in-memory DB, schema loading, app creation, and supertest request in backend/tests/integration/smoke.test.ts
- [X] T007 Verify `npm run test --workspace backend` runs and passes with the smoke test

**Checkpoint**: Test infrastructure confirmed working — user story implementation can begin

---

## Phase 3: User Story 1 — State Transition Diagrams (Priority: P1) MVP

**Goal**: Executable tests that validate every valid and invalid state transition for all 6 stateful entities

**Independent Test**: Run `npx jest --testPathPattern="state-transitions"` — all transition tests pass, covering every status value and transition documented in the spec diagrams

### Implementation

- [X] T008 [P] [US1] Create booking state transition tests (new→confirmed, confirmed→cancelled via user, confirmed→cancelled via event cancel, INVALID cancelled→confirmed, INVALID cancelled→cancelled, INVALID cancel-when-started, INVALID cancel-when-event-cancelled) in backend/tests/state-transitions/booking.transitions.test.ts
- [X] T009 [P] [US1] Create event state transition tests (new→published, published→cancelled, INVALID cancelled→cancelled no-op, INVALID cancelled→published) in backend/tests/state-transitions/event.transitions.test.ts
- [X] T010 [P] [US1] Create ticket tier state transition tests (new→active, active→inactive via deactivate with zero sales, INVALID deactivate with sold tickets, inactive→active via syncEventTiers, INVALID deactivate last tier) in backend/tests/state-transitions/tier.transitions.test.ts
- [X] T011 [P] [US1] Create waitlist entry state transition tests (new→queued, queued→notified via promotion, notified→expired via timer, INVALID skip when requestedQuantity exceeds available) in backend/tests/state-transitions/waitlist.transitions.test.ts
- [X] T012 [P] [US1] Create refund state transition tests (new→requested on user cancel, new→requested on event cancel, verify refund links booking and payment reference) in backend/tests/state-transitions/refund.transitions.test.ts
- [X] T013 [P] [US1] Create organizer approval state transition tests (none→pending, pending→approved, pending→rejected, INVALID non-approved organizer creates event) in backend/tests/state-transitions/organizer.transitions.test.ts

**Checkpoint**: All 6 entity lifecycle diagrams have corresponding passing tests — every valid transition works and every invalid transition is rejected

---

## Phase 4: User Story 2 — Invalid Purchase Attempt Testing (Priority: P1)

**Goal**: Every guard clause in the booking purchase flow has a test verifying correct error response and unchanged system state

**Independent Test**: Run `npx jest --testPathPattern="integration/booking.routes"` — all 12+ purchase scenarios pass with correct HTTP status codes and error messages

### Implementation

- [X] T014 [US2] Create ticket purchase integration tests covering: successful single-tier purchase (201), successful purchase with percentage discount, successful purchase with fixed discount, in backend/tests/integration/booking.routes.test.ts
- [X] T015 [US2] Add invalid purchase tests to booking.routes.test.ts: sold-out tier (409), more tickets than available (409), zero quantity (400), negative quantity (400), non-UUID tier ID (400), non-existent event (404), cancelled event (404)
- [X] T016 [US2] Add discount validation tests to booking.routes.test.ts: multiple discount codes (400), exhausted discount code (400), expired discount code (400), wrong-event discount (400), wrong-tier discount (400), future validFrom discount (400)
- [X] T017 [US2] Add auth tests to booking.routes.test.ts: unauthenticated purchase (401), verify soldQuantity unchanged after each failed purchase, verify usedCount unchanged after each rejected discount

**Checkpoint**: Every invalid purchase scenario from spec US2 has a passing test that asserts HTTP status, error message, and side-effect absence

---

## Phase 5: User Story 3 — Concurrency Scenario Testing (Priority: P2)

**Goal**: 6 concurrency scenarios validated with correct outcomes under parallel load

**Independent Test**: Run `npx jest --testPathPattern="concurrency"` — all 6 race condition tests pass with correct invariants (no overselling, no negative inventory, no duplicate positions)

### Implementation

- [X] T018 [P] [US3] Create CS-001 last-ticket race test (5 concurrent purchases for 1 remaining ticket, exactly 1 succeeds, soldQuantity correct) in backend/tests/concurrency/last-ticket-race.test.ts
- [X] T019 [P] [US3] Create CS-002 cancel-then-rebook race test (concurrent cancel + purchase, soldQuantity never negative, consistent final state) in backend/tests/concurrency/cancel-rebook-race.test.ts
- [X] T020 [P] [US3] Create CS-003 discount code exhaustion race test (2 concurrent bookings with last-use discount, usedCount never exceeds maxUses) in backend/tests/concurrency/discount-exhaustion.test.ts
- [X] T021 [P] [US3] Create CS-004 waitlist position assignment race test (5 concurrent waitlist joins, unique sequential positions) in backend/tests/concurrency/waitlist-position.test.ts
- [X] T022 [P] [US3] Create CS-005 event cancellation during purchase race test (concurrent cancel event + book ticket, no orphan confirmed bookings for cancelled event) in backend/tests/concurrency/event-cancel-purchase.test.ts
- [X] T023 [P] [US3] Create CS-006 waitlist promotion during cancellation cascade test (event cancel with bookings + waitlist, no promotions for cancelled event) in backend/tests/concurrency/cascade-promotion.test.ts

**Checkpoint**: All 6 concurrency scenarios pass — system invariants (inventory, discount usage, waitlist positions) are correct under parallel load

---

## Phase 6: User Story 4 — Gherkin-Style Acceptance Tests (Priority: P2)

**Goal**: End-to-end Gherkin acceptance tests for 5 feature areas: booking cancellation, waitlist management, tier management, event cancellation, and booking list

**Independent Test**: Run `npx jest --testPathPattern="integration"` — all acceptance tests pass covering happy-path and error flows

### Implementation

- [X] T024 [P] [US4] Create booking cancellation acceptance tests (successful cancel with refund, cancel triggers waitlist promotion, cancel already-cancelled 409, cancel for started event 400, cancel for cancelled event 400, cancel another user's booking 404) in backend/tests/integration/booking-cancel.routes.test.ts
- [X] T025 [P] [US4] Create waitlist management acceptance tests (join waitlist for sold-out tier, promotion on cancellation, skip entry needing more tickets, reservation expiry) in backend/tests/integration/waitlist.routes.test.ts
- [X] T026 [P] [US4] Create event tier management acceptance tests (create event with multiple tiers, add tier to existing event, update tier price, deactivate tier with zero sales, INVALID deactivate with sold tickets, INVALID reduce capacity below sold count, INVALID manage cancelled event tiers) in backend/tests/integration/event-tier.routes.test.ts
- [X] T027 [P] [US4] Create event cancellation acceptance tests (cancel with bookings creates refunds and notifications, cancel already-cancelled is no-op, non-owner gets 403, admin can cancel any event) in backend/tests/integration/event-cancel.routes.test.ts

**Checkpoint**: All Gherkin acceptance scenarios from spec are implemented as passing integration tests

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Ensure all tests pass together, validate coverage, update scripts

- [X] T028 Run full test suite (`npm run test --workspace backend`) and fix any failures or flaky tests
- [X] T029 [P] Update backend/package.json test scripts to add category-specific test commands (test:unit, test:integration, test:concurrency, test:transitions)
- [X] T030 Run quickstart.md validation — confirm all documented commands work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 State Transitions (Phase 3)**: Depends on Phase 2 — can start immediately after
- **US2 Invalid Purchases (Phase 4)**: Depends on Phase 2 — can run in parallel with Phase 3
- **US3 Concurrency (Phase 5)**: Depends on Phase 2 — can run in parallel with Phases 3-4
- **US4 Gherkin Acceptance (Phase 6)**: Depends on Phase 2 — can run in parallel with Phases 3-5
- **Polish (Phase 7)**: Depends on all user story phases being complete

### User Story Independence

- **US1 (State Transitions)**: Tests entity lifecycles via direct service/repo calls. No dependency on other stories.
- **US2 (Invalid Purchases)**: Tests booking API error paths via supertest. No dependency on other stories.
- **US3 (Concurrency)**: Tests parallel request behavior via supertest. No dependency on other stories.
- **US4 (Gherkin Acceptance)**: Tests end-to-end flows via supertest. No dependency on other stories.

### Within Each User Story

- All test files within a story marked [P] can be written in parallel
- All tests depend on setup.ts and helpers (Phase 1-2)

### Parallel Execution Examples

**Maximum parallelism** (4 tracks after Phase 2):
- Track A: T008, T009, T010, T011, T012, T013 (US1 — all [P])
- Track B: T014, T015, T016, T017 (US2 — sequential within file)
- Track C: T018, T019, T020, T021, T022, T023 (US3 — all [P])
- Track D: T024, T025, T026, T027 (US4 — all [P])

### Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + Phase 3 (US1 State Transitions) — delivers the foundation all other QA work depends on
- **Core Coverage**: + Phase 4 (US2 Invalid Purchases) — covers the highest-risk revenue path
- **Full Delivery**: + Phase 5 (US3) + Phase 6 (US4) + Phase 7 — complete QA test suite
