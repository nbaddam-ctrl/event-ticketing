# Tasks: Navigation, Logout & Checkout Pricing Fixes

**Input**: Design documents from `/specs/002-fix-nav-pricing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- **Backend**: `backend/src/` (no changes required for this feature)
- **Contexts**: `frontend/src/contexts/`
- **Pages**: `frontend/src/pages/`
- **Services**: `frontend/src/services/`
- **App components**: `frontend/src/components/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new contexts directory needed for AuthContext

- [X] T001 Create contexts directory at frontend/src/contexts/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the AuthContext provider that both US1 (navigation/logout) and US2 (checkout pricing via auth-protected route) depend on. This context is the single shared foundation that all user stories consume.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create AuthContext with AuthProvider, useAuth hook, typed AuthContextValue interface (user, login, logout) in frontend/src/contexts/AuthContext.tsx
- [X] T003 Add logout() helper function to clear token and user from localStorage in frontend/src/services/authSession.ts
- [X] T004 Wrap app with AuthProvider in frontend/src/main.tsx

**Checkpoint**: Foundation ready — AuthContext provides reactive auth state. User story implementation can now begin.

---

## Phase 3: User Story 1 — Functional Logout and Auth-Aware Navigation (Priority: P1) 🎯 MVP

**Goal**: Add a "Log Out" button to the navigation bar and make navigation reactively update on login/logout without full page reload.

**Independent Test**: Log in as any user, confirm navigation shows email and role links, click "Log Out", confirm navigation immediately reverts to unauthenticated state, confirm protected routes redirect to /auth.

### Implementation for User Story 1

- [X] T005 [US1] Refactor Navigation to consume useAuth() context for reactive user state and add "Log Out" button (desktop and mobile) in frontend/src/components/app/Navigation.tsx
- [X] T006 [US1] Refactor AuthPage to use useAuth().login() after successful authentication and replace window.location.assign with useNavigate in frontend/src/pages/AuthPage.tsx
- [X] T007 [US1] Update RequireAuth and RequireRole guards to consume useAuth() context instead of direct localStorage reads in frontend/src/app/router.tsx

**Checkpoint**: User Story 1 is fully functional. Users can log in, see reactive navigation updates, log out, and be redirected from protected routes.

---

## Phase 4: User Story 2 — Accurate Ticket Pricing on Checkout Page (Priority: P1) 🎯 MVP

**Goal**: Fetch real tier pricing on the checkout page and display correct per-ticket price, subtotal, discount, and total.

**Independent Test**: Navigate to event details, click "Book Now" on any tier, confirm checkout shows correct price, change quantity and confirm subtotal updates, apply discount and confirm total adjusts.

### Implementation for User Story 2

- [X] T008 [US2] Add useEffect to fetch event details via getEventDetails(eventId) on mount, extract matching tier by tierId, and store tierName + unitPriceMinor in component state with loading/error handling in frontend/src/pages/CheckoutPage.tsx
- [X] T009 [US2] Compute subtotalMinor (unitPriceMinor × quantity) and totalMinor (max(0, subtotal − discount)) reactively, pass correct values to OrderSummary in frontend/src/pages/CheckoutPage.tsx
- [X] T010 [US2] Add loading skeleton and error state UI for when event details are being fetched or tier is not found in frontend/src/pages/CheckoutPage.tsx
- [X] T011 [US2] Clamp quantity input to minimum of 1 to prevent zero or negative quantities in frontend/src/pages/CheckoutPage.tsx

**Checkpoint**: User Story 2 is fully functional. Checkout displays real prices, computes totals correctly, handles loading/error states.

---

## Phase 5: User Story 3 — Console Error Resolution and Robustness (Priority: P2)

**Goal**: Eliminate all console errors and warnings across standard user flows.

**Independent Test**: Open browser console, perform full journey (browse → details → login → checkout → organizer → admin → logout), confirm zero console errors or warnings.

### Implementation for User Story 3

- [X] T012 [P] [US3] Replace window.location.assign('/') with useNavigate('/') in ConfirmationBanner onAction callbacks in frontend/src/pages/CheckoutPage.tsx
- [X] T013 [P] [US3] Replace window.location.assign('/') with useNavigate('/') in ConfirmationBanner onAction callback in frontend/src/pages/AuthPage.tsx
- [X] T014 [US3] Run full user journey in browser and fix any remaining console errors or React warnings discovered at runtime

**Checkpoint**: All three user stories are independently functional. Zero console errors across all flows.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and final validation across all stories

- [X] T015 Run dependency cycle check (npm run lint:cycles) and fix any circular imports introduced by AuthContext
- [X] T016 Run full lint pass (npm run lint) and resolve all TypeScript and ESLint violations
- [X] T017 Run frontend build verification (npm run build --workspace frontend) and confirm clean production build
- [X] T018 Execute quickstart.md verification checklist (US1 nav/logout, US2 pricing, US3 console errors) across all pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on US1 and US2 being complete (fixes console errors that arise from their integration)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Phase 2. No dependencies on other stories. **Recommended MVP scope** (with US2).
- **User Story 2 (P1)**: Independent after Phase 2. Can run in parallel with US1. Also **recommended MVP scope**.
- **User Story 3 (P2)**: Depends on US1 + US2 being implemented first (console errors are caused by the pre-fix code; once US1/US2 are done, this is a cleanup pass).

### Within Each User Story

- Service/context changes before component changes
- Component changes before page changes
- Core logic before polish/edge cases

### Parallel Opportunities

**Phase 2**: T002 and T003 can run in parallel (different files). T004 depends on T002.
**Phase 3 (US1)**: T005 and T006 can run in parallel after Phase 2 (different files). T007 can run in parallel with T005/T006.
**Phase 4 (US2)**: T008 must come first (fetches pricing data). T009, T010, T011 depend on T008 but touch the same file, so sequential within the file.
**Phase 5 (US3)**: T012 and T013 can run in parallel (different files). T014 depends on all prior tasks.
**Cross-story**: US1 and US2 can be worked on simultaneously by different developers once Phase 2 completes.

---

## Parallel Example: Phase 2 (Foundational)

```text
# These can run in parallel (different files):
T002: Create AuthContext in frontend/src/contexts/AuthContext.tsx
T003: Add logout() to frontend/src/services/authSession.ts

# Then sequentially:
T004: Wrap app with AuthProvider in frontend/src/main.tsx (depends on T002)
```

---

## Parallel Example: User Story 1

```text
# After Phase 2 is complete, these can run in parallel (different files):
T005: Refactor Navigation.tsx to use AuthContext + logout button
T006: Refactor AuthPage.tsx to use AuthContext login + useNavigate
T007: Update router.tsx guards to use AuthContext
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (AuthContext — blocks all stories)
3. Complete Phase 3: User Story 1 (logout + reactive nav)
4. Complete Phase 4: User Story 2 (checkout pricing)
5. **STOP and VALIDATE**: Test both stories independently using quickstart.md
6. Deploy/demo if ready

### Full Delivery

1. Complete MVP (above)
2. Complete Phase 5: User Story 3 (console error cleanup pass)
3. Complete Phase 6: Polish & quality gates
4. Final validation with quickstart.md checklist
