# Tasks: Modern UI Redesign

**Input**: Design documents from `/specs/006-modern-ui-redesign/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story. This is a frontend-only visual redesign — no backend tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- All file paths are relative to repository root

---

## Phase 1: Setup (Project Configuration)

**Purpose**: Install new dependency, configure build tools, prepare index.html

- [x] T001 Install framer-motion as a dependency in frontend/package.json
- [x] T002 [P] Add `darkMode: 'class'` to frontend/tailwind.config.ts and extend shadow tokens per data-model.md section 1.2
- [x] T003 [P] Add Inter font preload link and FOUC-prevention inline script to frontend/index.html per research R-004 and R-007

---

## Phase 2: Foundational (Design Tokens & Base Components)

**Purpose**: Establish the new design token system and update all 16 UI base components. MUST complete before any user story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Update light-mode CSS custom properties in frontend/src/styles.css `:root` with indigo-violet palette per data-model.md section 1.1 (all 26 tokens)
- [x] T005 [P] Add `.dark` CSS custom property overrides in frontend/src/styles.css per data-model.md section 1.1 dark mode column
- [x] T006 [P] Update shimmer animation in frontend/src/styles.css to work in both light and dark modes
- [x] T007 [P] Enhance Button component with indigo-violet primary, refined hover/focus states, and smooth transitions in frontend/src/components/ui/Button.tsx
- [x] T008 [P] Enhance Card component with updated shadow, hover elevation, and transition in frontend/src/components/ui/Card.tsx
- [x] T009 [P] Enhance Badge component with updated palette variants in frontend/src/components/ui/Badge.tsx
- [x] T010 [P] Enhance Input component with branded focus ring and transition states in frontend/src/components/ui/Input.tsx
- [x] T011 [P] Enhance Alert component with refined spacing and semantic color updates in frontend/src/components/ui/Alert.tsx
- [x] T012 [P] Enhance Dialog component with backdrop blur in frontend/src/components/ui/Dialog.tsx
- [x] T013 [P] Enhance Skeleton component shimmer for dark mode compatibility in frontend/src/components/ui/Skeleton.tsx
- [x] T014 [P] Enhance Select component with focus ring and transitions in frontend/src/components/ui/Select.tsx
- [x] T015 [P] Enhance Tabs component with active indicator and transitions in frontend/src/components/ui/Tabs.tsx
- [x] T016 [P] Enhance EmptyState component with improved icon treatment and spacing in frontend/src/components/ui/EmptyState.tsx
- [x] T017 [P] Enhance Separator, Table, Textarea, Sheet, Spinner, Toast components with token updates in frontend/src/components/ui/ (6 files)

**Checkpoint**: Design tokens established, all 16 UI base components updated — user story work can begin

---

## Phase 3: User Story 1 — Visual Identity & Design System Refresh (Priority: P1) MVP

**Goal**: Apply the new design system to the application shell — navigation, layout, footer, page headers — so every page immediately benefits from the modern visual identity.

**Independent Test**: Open any page in the application. Navigation should display polished active-link indicators, page headers use the modular type scale, and the footer appears at the bottom. All interactive elements show smooth hover/focus transitions.

### Implementation

- [x] T018 [US1] Create ThemeContext with useTheme hook, system preference detection, localStorage persistence, and matchMedia listener in frontend/src/contexts/ThemeContext.tsx
- [x] T019 [US1] Wrap app with ThemeProvider in frontend/src/main.tsx
- [x] T020 [P] [US1] Create minimal Footer component with brand name, copyright year, and separator in frontend/src/components/app/Footer.tsx
- [x] T021 [US1] Update AppShell to include Footer and add Framer Motion entrance animation wrapper in frontend/src/components/app/AppShell.tsx
- [x] T022 [US1] Polish Navigation with updated active-link styling, smooth mobile menu transition, and dark mode toggle button in frontend/src/components/app/Navigation.tsx
- [x] T023 [P] [US1] Update PageHeader with entrance animation (Framer Motion fade-in) and refined typography (tracking-tight, font-bold) in frontend/src/components/app/PageHeader.tsx
- [x] T024 [P] [US1] Polish FormField component with label styling and validation error treatment in frontend/src/components/app/FormField.tsx
- [x] T025 [P] [US1] Polish ConfirmationBanner with entrance animation in frontend/src/components/app/ConfirmationBanner.tsx
- [x] T026 [P] [US1] Polish ActionConfirmDialog with animation and dark mode styling in frontend/src/components/app/ActionConfirmDialog.tsx

**Checkpoint**: Application shell (nav, footer, page headers) displays the new visual identity. Every page benefits from the design system refresh.

---

## Phase 4: User Story 2 — Hero & Event Discovery Experience (Priority: P1)

**Goal**: Transform the event listing page into a visually compelling discovery experience with a hero section, rich event cards, and polished search/filter controls.

**Independent Test**: Load the home page (event list). A hero banner appears above the grid. Event cards show gradient headers, price badges, venue/date icons, and elevate on hover. Filters are visually grouped with active indicators. Empty state is polished.

### Implementation

- [x] T027 [US2] Create HeroSection component with headline, subtext, CTA button, and Framer Motion entrance animation in frontend/src/components/app/HeroSection.tsx
- [x] T028 [US2] Enhance EventCard with gradient placeholder header, starting-price badge, hover shadow elevation, and stagger animation in frontend/src/components/app/EventCard.tsx
- [x] T029 [P] [US2] Polish EventSearchFilters with visual grouping, clear labels, and active filter indicators in frontend/src/components/app/EventSearchFilters.tsx
- [x] T030 [US2] Redesign EventListPage to integrate HeroSection above grid, apply Framer Motion entrance animation, refine skeleton loading, and polish pagination in frontend/src/pages/EventListPage.tsx

**Checkpoint**: Event discovery experience is visually compelling — hero, rich cards, polished filters. MVP complete (US1 + US2).

---

## Phase 5: User Story 3 — Event Details & Checkout Flow (Priority: P2)

**Goal**: Polish the event details page with clear tier cards and availability indicators, and streamline the checkout page with a refined order summary and form experience.

**Independent Test**: Navigate from an event card to event details. Tier cards show name, price, availability bar, and contextual buy/waitlist button. Proceed to checkout — order summary is visually separated, form inputs are polished, and confirmation/error states are clear.

### Implementation

- [x] T031 [US3] Redesign EventDetailsPage with prominent header section, tier cards with availability progress bar, sold-out muting, and entrance animation in frontend/src/pages/EventDetailsPage.tsx
- [x] T032 [P] [US3] Polish EventDetailsSummary with refined layout and typography in frontend/src/components/app/EventDetailsSummary.tsx
- [x] T033 [P] [US3] Enhance WaitlistPanel with updated card styling and dark mode support in frontend/src/components/WaitlistPanel.tsx
- [x] T034 [US3] Redesign CheckoutPage with polished order summary panel, refined form layout, loading/confirmation states, and entrance animation in frontend/src/pages/CheckoutPage.tsx
- [x] T035 [P] [US3] Enhance OrderSummary component with visual separation, line-item styling, and total emphasis in frontend/src/components/app/OrderSummary.tsx
- [x] T036 [P] [US3] Polish DiscountCodeInput with updated focus states and validation styling in frontend/src/components/DiscountCodeInput.tsx

**Checkpoint**: Event details and checkout flow are polished end-to-end with clear visual hierarchy and confidence-building design.

---

## Phase 6: User Story 4 — Authentication Experience (Priority: P2)

**Goal**: Create a welcoming, visually polished authentication flow with branded card, clear form design, and smooth tab transitions.

**Independent Test**: Navigate to /auth. The page shows a centered card with branded header area, login/register tabs with smooth transitions, polished inputs with focus states, and inline validation errors.

### Implementation

- [x] T037 [US4] Redesign AuthPage with branded card header area, refined tab styling, polished form inputs, inline validation errors, and entrance animation in frontend/src/pages/AuthPage.tsx

**Checkpoint**: Authentication experience feels welcoming and trustworthy.

---

## Phase 7: User Story 5 — My Bookings & Management Pages (Priority: P3)

**Goal**: Polish all management pages (My Bookings, Organizer Dashboard, Request Organizer, Admin Approvals) with consistent card/table styling, status badges, and empty states.

**Independent Test**: Navigate to My Bookings, Organizer Dashboard, and Admin Approvals. Booking cards show clear grouping, organizer event cards show status and metrics, admin table has polished headers and row hover. All empty states are informative.

### Implementation

- [x] T038 [US5] Redesign MyBookingsPage with refined booking cards, status badges, empty state, and entrance animation in frontend/src/pages/MyBookingsPage.tsx
- [x] T039 [US5] Redesign OrganizerDashboardPage with polished event cards, status indicators, metrics display, and management action layout in frontend/src/pages/OrganizerDashboardPage.tsx
- [x] T040 [P] [US5] Polish OrganizerEventForm with refined form layout, label styling, and section grouping in frontend/src/components/OrganizerEventForm.tsx
- [x] T041 [P] [US5] Polish EventCancellationPanel with dark mode support and spacing in frontend/src/components/EventCancellationPanel.tsx
- [x] T042 [P] [US5] Polish TierManagementPanel with card layout and dark mode support in frontend/src/components/TierManagementPanel.tsx
- [x] T043 [P] [US5] Polish StatusPanel with dark mode styling in frontend/src/components/app/StatusPanel.tsx
- [x] T044 [P] [US5] Polish DataTable with row hover, header styling, and dark mode in frontend/src/components/app/DataTable.tsx
- [x] T045 [US5] Redesign AdminOrganizerRequestsPage with polished table, action buttons, and status badges in frontend/src/pages/AdminOrganizerRequestsPage.tsx
- [x] T046 [P] [US5] Redesign RequestOrganizerPage with refined form layout and confirmation in frontend/src/pages/RequestOrganizerPage.tsx
- [x] T047 [P] [US5] Polish NotificationBell, NotificationPanel, and NotificationItem with dark mode support in frontend/src/components/app/NotificationBell.tsx, NotificationPanel.tsx, NotificationItem.tsx

**Checkpoint**: All management pages are polished and visually consistent with the rest of the application.

---

## Phase 8: User Story 6 — Dark Mode Support (Priority: P3)

**Goal**: Ensure dark mode works correctly across the entire application — all components, pages, and states render with proper contrast and no visual artifacts.

**Independent Test**: Toggle dark mode via the navigation toggle. Verify all 8 pages render correctly with dark backgrounds, light text, adjusted surfaces, and distinguishable semantic colors. Toggle back to light — no FOUC. Change OS theme — app follows (if in system mode).

### Implementation

- [x] T048 [US6] Verify dark mode token coverage by testing all 16 UI components in dark mode and fixing any contrast or styling issues in frontend/src/components/ui/ (multi-file sweep)
- [x] T049 [US6] Verify dark mode rendering across all 8 pages and fix any visual artifacts, hardcoded colors, or contrast issues in frontend/src/pages/ (multi-file sweep)
- [x] T050 [US6] Verify dark mode in all app and feature components (Navigation, EventCard, HeroSection, Footer, and all feature components) and fix any remaining issues (multi-file sweep)

**Checkpoint**: Dark mode works flawlessly across the entire application with WCAG AA contrast compliance.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, performance check, and cleanup

- [x] T051 Run TypeScript compilation check (`npx tsc --noEmit` in frontend/) and fix any type errors
- [x] T052 [P] Run lint check (`npm run lint --workspace frontend`) and fix any lint errors
- [x] T053 [P] Run circular dependency check (`npm run lint:cycles`) and fix any new cycles
- [x] T054 Verify `prefers-reduced-motion` support — confirm Framer Motion animations are disabled when OS reduced-motion is set
- [x] T055 Run quickstart.md validation — confirm all documented setup and dev commands work correctly
- [x] T056 Visual smoke test — open each page in both light and dark mode and verify no visual regressions, broken layouts, or contrast issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 Visual Identity (Phase 3)**: Depends on Phase 2 — can start immediately after
- **US2 Event Discovery (Phase 4)**: Depends on Phase 3 (needs AppShell, Navigation, PageHeader)
- **US3 Details & Checkout (Phase 5)**: Depends on Phase 2 — can run in parallel with Phase 4
- **US4 Authentication (Phase 6)**: Depends on Phase 2 — can run in parallel with Phases 4-5
- **US5 Management Pages (Phase 7)**: Depends on Phase 2 — can run in parallel with Phases 4-6
- **US6 Dark Mode (Phase 8)**: Depends on Phases 3-7 (needs all components built first to verify)
- **Polish (Phase 9)**: Depends on all user story phases being complete

### User Story Independence

- **US1 (Visual Identity)**: Application shell — foundation for all other stories. Must go first.
- **US2 (Event Discovery)**: Depends on US1 for AppShell/Navigation updates. Otherwise independent.
- **US3 (Details & Checkout)**: Independent from US2/US4/US5. Only needs base components (Phase 2).
- **US4 (Authentication)**: Fully independent. Only needs base components (Phase 2).
- **US5 (Management Pages)**: Fully independent. Only needs base components (Phase 2).
- **US6 (Dark Mode)**: Cross-cutting — needs all components built first for verification sweep.

### Within Each User Story

- All tasks marked [P] within a story can be written in parallel
- Page-level tasks may depend on component tasks within the same story

### Parallel Execution Examples

**Maximum parallelism** (after Phase 3):
- Track A: T027-T030 (US2 — Event Discovery)
- Track B: T031-T036 (US3 — Details & Checkout)
- Track C: T037 (US4 — Authentication)
- Track D: T038-T047 (US5 — Management Pages)

### Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2) — delivers the visual identity refresh and the hero/event discovery experience
- **Core Conversion**: + Phase 5 (US3) + Phase 6 (US4) — covers the full browse-to-purchase funnel
- **Full Delivery**: + Phase 7 (US5) + Phase 8 (US6) + Phase 9 — complete modern UI with dark mode
