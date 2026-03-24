# Interface Contract — UI/UX Redesign

## Scope
This contract defines the expected frontend interface behavior for redesigned attendee, organizer, and admin flows. It complements existing backend API contracts and does not introduce new backend endpoints.

## Contract 1: Page-Level Experience
- Every primary page MUST provide:
  - clear page title and contextual description
  - one visually dominant primary action
  - clearly separated secondary actions
  - explicit loading, empty, success, and error states
- Applies to:
  - Event list
  - Event details
  - Authentication
  - Checkout
  - Organizer dashboard
  - Admin organizer requests

## Contract 2: Form and Validation Behavior
- Every form field MUST include:
  - persistent label text
  - optional helper text when constraints are non-obvious
  - inline validation message on invalid input
- Submission behavior MUST include:
  - disabled submit during pending request
  - prevention of duplicate submission
  - post-submit success/error feedback with next-step guidance

## Contract 3: Component System Consistency
- Shared component primitives MUST be used for:
  - buttons
  - inputs/selects/textarea
  - cards and panels
  - status badges/alerts
  - dialogs/sheets
  - loading skeletons/placeholders
- New UI work MUST use design-system tokens and variants rather than page-specific ad-hoc styling.

## Contract 4: Responsive and Accessibility Baseline
- Responsive behavior MUST preserve complete task execution at:
  - small mobile (320-639)
  - large mobile (640-767)
  - tablet (768-1023)
  - desktop (1024-1439)
  - wide desktop (>=1440)
- Accessibility baseline MUST meet WCAG 2.2 AA for all redesigned pages, including keyboard operability and visible focus states.

## Contract 5: Frontend/Backend Integration Boundary
- Frontend page components MUST consume data via `frontend/src/services/*` API clients.
- UI components MUST NOT perform direct network calls.
- Existing backend endpoint semantics and HTTP status handling are preserved.

## Compatibility Notes
- This contract is additive over `specs/001-event-ticket-booking/contracts/openapi.yaml`.
- API request/response schemas remain unchanged for this feature.
