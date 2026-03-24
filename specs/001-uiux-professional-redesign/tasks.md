# Tasks: Comprehensive Professional UI/UX Refresh

**Input**: Design documents from `/specs/001-uiux-professional-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/ui-ux-contract.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- **Backend**: `backend/src/` (no changes required for this feature)
- **Design system**: `frontend/src/components/ui/`
- **Composed components**: `frontend/src/components/app/`
- **Pages**: `frontend/src/pages/`
- **Services**: `frontend/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install design-system dependencies, configure Tailwind CSS and shadcn, establish path aliases and token foundations

- [x] T001 Install Tailwind CSS, PostCSS, Autoprefixer, and shadcn design-system dependencies (tailwindcss-animate, class-variance-authority, clsx, tailwind-merge, lucide-react) in frontend/package.json
- [x] T002 Initialize Tailwind CSS configuration with content paths for frontend/src/**/*.{ts,tsx} in frontend/tailwind.config.ts
- [x] T003 Initialize shadcn with base configuration and component aliases in frontend (npx shadcn@latest init), producing frontend/components.json
- [x] T004 Configure TypeScript path aliases for @/components, @/lib, @/pages, @/services in frontend/tsconfig.json and frontend/vite.config.ts
- [x] T005 [P] Create utility helper combining clsx and tailwind-merge in frontend/src/lib/utils.ts (cn function)
- [x] T006 [P] Define semantic design tokens (colors, radius, spacing, typography) as CSS custom properties in frontend/src/styles.css using the DesignTokenSet entity from data-model

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared UI primitive component library that ALL user story pages will consume. No page redesign can begin until these primitives exist.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Layout & Navigation

- [x] T007 Create base layout shell component with responsive container, header, and content regions in frontend/src/components/app/AppShell.tsx
- [x] T008 Create responsive navigation component with role-aware links and mobile menu in frontend/src/components/app/Navigation.tsx

### Button & Input Primitives

- [x] T009 [P] Create Button component with primary/secondary/destructive/ghost/outline variants and loading state in frontend/src/components/ui/Button.tsx
- [x] T010 [P] Create Input component with label, helper text, inline validation error, and disabled states in frontend/src/components/ui/Input.tsx
- [x] T011 [P] Create Textarea component with label, helper text, and validation error display in frontend/src/components/ui/Textarea.tsx
- [x] T012 [P] Create Select component with label, placeholder, and validation error in frontend/src/components/ui/Select.tsx

### Card, Badge & Alert Primitives

- [x] T013 [P] Create Card component with header, content, footer sections and variant support in frontend/src/components/ui/Card.tsx
- [x] T014 [P] Create Badge component with status variants (default, success, warning, error, info) in frontend/src/components/ui/Badge.tsx
- [x] T015 [P] Create Alert component with severity variants (info, warning, error, success) and dismissible option in frontend/src/components/ui/Alert.tsx

### Dialog, Sheet & Feedback Primitives

- [x] T016 [P] Create Dialog component with accessible modal behavior, title, description, and action footer in frontend/src/components/ui/Dialog.tsx
- [x] T017 [P] Create Sheet component (slide-over panel) for side panels and mobile drawers in frontend/src/components/ui/Sheet.tsx
- [x] T018 [P] Create Toast/notification component for transient success/error feedback in frontend/src/components/ui/Toast.tsx

### State Display Primitives

- [x] T019 [P] Create Skeleton loading placeholder component with configurable shapes in frontend/src/components/ui/Skeleton.tsx
- [x] T020 [P] Create EmptyState component with icon, title, description, and action slot in frontend/src/components/ui/EmptyState.tsx
- [x] T021 [P] Create Spinner/LoadingIndicator component for inline and page-level loading in frontend/src/components/ui/Spinner.tsx

### Data Display Primitives

- [x] T022 [P] Create Table component with header, body, and responsive overflow handling in frontend/src/components/ui/Table.tsx
- [x] T023 [P] Create Tabs component with accessible tab panels for sectioned content in frontend/src/components/ui/Tabs.tsx
- [x] T024 [P] Create Separator/Divider component for visual content separation in frontend/src/components/ui/Separator.tsx

### Integration

- [x] T025 Create component index file exporting all UI primitives from frontend/src/components/ui/index.ts
- [x] T026 Update frontend/src/app/router.tsx to use new AppShell layout wrapper with Navigation

**Checkpoint**: Foundation ready — all shared UI primitives exist. User story page redesign can now begin.

---

## Phase 3: User Story 1 — Browse and Trust the Platform (Priority: P1) 🎯 MVP

**Goal**: Redesign the event listing and event details pages so first-time attendees encounter a clear, professional, consistent interface that builds immediate trust.

**Independent Test**: Open event list and event details pages as a new visitor. Confirm visual hierarchy, readable event cards, clear primary actions, and consistent design language across both pages.

### Composed App Components for US1

- [x] T027 [P] [US1] Create EventCard composed component with image region, title, date, venue, price, and availability badge in frontend/src/components/app/EventCard.tsx
- [x] T028 [P] [US1] Create PageHeader composed component with title, subtitle, and optional breadcrumb in frontend/src/components/app/PageHeader.tsx
- [x] T029 [P] [US1] Create EventDetailsSummary composed component showing event info, pricing, capacity, and status badges in frontend/src/components/app/EventDetailsSummary.tsx

### Page Redesign for US1

- [x] T030 [US1] Redesign EventListPage with PageHeader, responsive EventCard grid, loading skeletons, and empty state in frontend/src/pages/EventListPage.tsx
- [x] T031 [US1] Redesign EventDetailsPage with EventDetailsSummary, clear primary booking action, waitlist panel, cancellation panel, loading and error states in frontend/src/pages/EventDetailsPage.tsx

### Responsive & State Polish for US1

- [x] T032 [US1] Add responsive breakpoint behavior to EventListPage for mobile card stacking and desktop grid layout in frontend/src/pages/EventListPage.tsx
- [x] T033 [US1] Add responsive breakpoint behavior to EventDetailsPage for mobile single-column and desktop two-column layout in frontend/src/pages/EventDetailsPage.tsx
- [x] T034 [US1] Implement loading skeleton states for EventListPage (shimmer card placeholders) and EventDetailsPage (content skeleton) using Skeleton primitives

**Checkpoint**: User Story 1 is fully functional and testable. Attendees see a professional event browsing experience.

---

## Phase 4: User Story 2 — Complete Booking with Confidence (Priority: P2)

**Goal**: Redesign authentication and checkout pages so attendees move through forms with clear guidance, inline validation, and trustworthy confirmation feedback.

**Independent Test**: Perform a full auth-to-checkout journey. Confirm field labels are clear, validation errors are inline and actionable, submission states prevent duplicates, and success/failure feedback is unambiguous.

### Composed App Components for US2

- [x] T035 [P] [US2] Create FormField composed component wrapping Input/Select with label, helper, and error display in frontend/src/components/app/FormField.tsx
- [x] T036 [P] [US2] Create OrderSummary composed component showing line items, discount effects, and total in frontend/src/components/app/OrderSummary.tsx
- [x] T037 [P] [US2] Create ConfirmationBanner composed component for post-action success/failure messaging with next-step guidance in frontend/src/components/app/ConfirmationBanner.tsx

### Page Redesign for US2

- [x] T038 [US2] Redesign AuthPage with card-based form layout, clear field labels, inline validation, loading state on submit, and error feedback in frontend/src/pages/AuthPage.tsx
- [x] T039 [US2] Redesign CheckoutPage with OrderSummary, FormField-based inputs, discount code integration, submit-disabled-while-pending, and confirmation/error states in frontend/src/pages/CheckoutPage.tsx

### Component Migration for US2

- [x] T040 [US2] Migrate DiscountCodeInput to use UI primitives (Input, Button, Alert) with inline validation and applied-discount feedback in frontend/src/components/DiscountCodeInput.tsx
- [x] T041 [US2] Migrate WaitlistPanel to use UI primitives (Card, Button, Badge, Alert) with clear join/leave states and feedback in frontend/src/components/WaitlistPanel.tsx

### Responsive & State Polish for US2

- [x] T042 [US2] Add responsive behavior to AuthPage for centered card layout on all viewport tiers in frontend/src/pages/AuthPage.tsx
- [x] T043 [US2] Add responsive behavior to CheckoutPage for stacked mobile and side-by-side desktop layout in frontend/src/pages/CheckoutPage.tsx
- [x] T044 [US2] Implement form submission duplicate-prevention (disabled button + spinner) and post-submit toast notifications across auth and checkout flows

**Checkpoint**: User Stories 1 AND 2 are fully functional. Attendees have a complete professional browse-to-book experience.

---

## Phase 5: User Story 3 — Manage Events in a Polished Workspace (Priority: P3)

**Goal**: Redesign organizer dashboard and admin organizer requests pages so management tasks are efficient, clearly structured, and visually consistent with the attendee experience.

**Independent Test**: Log in as organizer and admin. Complete key tasks (view dashboard, create/edit event, review organizer requests). Confirm structured layout, status clarity, action feedback, and visual consistency.

### Composed App Components for US3

- [x] T045 [P] [US3] Create StatusPanel composed component for dashboard status summaries with icon, value, and label in frontend/src/components/app/StatusPanel.tsx
- [x] T046 [P] [US3] Create DataTable composed component wrapping Table with sortable headers, status badges, and action buttons in frontend/src/components/app/DataTable.tsx
- [x] T047 [P] [US3] Create ActionConfirmDialog composed component for destructive/important action confirmation in frontend/src/components/app/ActionConfirmDialog.tsx

### Page Redesign for US3

- [x] T048 [US3] Redesign OrganizerDashboardPage with PageHeader, StatusPanel grid, event DataTable, and create-event action in frontend/src/pages/OrganizerDashboardPage.tsx
- [x] T049 [US3] Redesign AdminOrganizerRequestsPage with PageHeader, request DataTable with status badges, approve/reject actions, and confirmation dialogs in frontend/src/pages/AdminOrganizerRequestsPage.tsx

### Component Migration for US3

- [x] T050 [US3] Migrate OrganizerEventForm to use UI primitives (FormField, Card, Button) with clear sections, validation feedback, and loading state in frontend/src/components/OrganizerEventForm.tsx
- [x] T051 [US3] Migrate EventCancellationPanel to use UI primitives (Card, Alert, Button, ActionConfirmDialog) with clear destructive action confirmation in frontend/src/components/EventCancellationPanel.tsx

### Responsive & State Polish for US3

- [x] T052 [US3] Add responsive behavior to OrganizerDashboardPage for stacked mobile and grid desktop layout in frontend/src/pages/OrganizerDashboardPage.tsx
- [x] T053 [US3] Add responsive behavior to AdminOrganizerRequestsPage for card-based mobile and table-based desktop layout in frontend/src/pages/AdminOrganizerRequestsPage.tsx
- [x] T054 [US3] Implement empty states for organizer dashboard (no events), admin requests (no pending requests), and loading skeletons for all management pages

**Checkpoint**: All three user stories are independently functional. The entire platform has a consistent professional UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all pages, accessibility hardening, and validation

### Accessibility Hardening

- [x] T055 [P] Audit and fix keyboard navigation (focus-visible, tab order) across all redesigned pages and components
- [x] T056 [P] Audit and fix ARIA attributes (roles, labels, live regions) on all UI primitives and composed components
- [x] T057 [P] Verify color contrast meets WCAG 2.2 AA across all design token values and component states

### Cross-Page Consistency

- [x] T058 Remove legacy ad-hoc CSS classes from frontend/src/styles.css that are replaced by Tailwind utility classes and design tokens
- [x] T059 [P] Verify all pages use AppShell, Navigation, and shared UI primitives consistently (no residual mixed styling)
- [x] T060 [P] Verify all error/empty/loading states follow InteractionState patterns from data-model across every page

### Quality Gates

- [x] T061 Run dependency cycle check (npm run lint:cycles) and fix any circular imports introduced by new component layers
- [x] T062 Run full lint pass (npm run lint) and resolve all TypeScript and ESLint violations
- [x] T063 Run existing test suite (npm test) and ensure all tests pass with redesigned components
- [x] T064 Run frontend build verification (npm run build --workspace frontend) and confirm clean production build
- [x] T065 Execute quickstart.md UX acceptance checklist (primary action visibility, journey completion, error recovery) across all pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion — can run in parallel with US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Phase 2. No dependencies on other stories. **Recommended MVP scope.**
- **User Story 2 (P2)**: Independent after Phase 2. May reuse PageHeader from US1 but is independently testable.
- **User Story 3 (P3)**: Independent after Phase 2. May reuse PageHeader, DataTable concepts, but is independently testable.

### Within Each User Story

1. Composed app components (can be parallel within the story)
2. Page redesigns (depend on composed components)
3. Component migrations (depend on UI primitives from Phase 2)
4. Responsive and state polish (depend on page redesigns)

### Parallel Opportunities

**Phase 1**: T005 and T006 can run in parallel after T001-T004 complete sequentially
**Phase 2**: All UI primitive tasks T009-T024 can run in parallel (different files, no interdependencies). T025-T026 depend on completion of primitives.
**Phase 3 (US1)**: T027, T028, T029 can run in parallel. T030-T031 depend on composed components. T032-T034 depend on page redesigns.
**Phase 4 (US2)**: T035, T036, T037 can run in parallel. T038-T039 depend on composed components. T040-T041 can run in parallel with page redesigns.
**Phase 5 (US3)**: T045, T046, T047 can run in parallel. T048-T049 depend on composed components. T050-T051 can run in parallel with page redesigns.
**Phase 6**: T055, T056, T057 can run in parallel. T059, T060 can run in parallel. T061-T065 run sequentially as quality gates.
**Cross-story**: US1, US2, and US3 can be worked on simultaneously by different developers once Phase 2 completes.

### Implementation Strategy

- **MVP (recommended)**: Complete Phase 1 + Phase 2 + Phase 3 (User Story 1). This delivers a professional event browsing experience that immediately improves first impressions.
- **Increment 2**: Add Phase 4 (User Story 2) to complete the attendee conversion journey.
- **Increment 3**: Add Phase 5 (User Story 3) to polish operational workflows.
- **Final**: Phase 6 for cross-cutting quality and accessibility hardening.
