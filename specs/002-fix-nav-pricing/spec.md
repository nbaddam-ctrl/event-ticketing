# Feature Specification: Navigation, Logout & Checkout Pricing Fixes

**Feature Branch**: `002-fix-nav-pricing`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "1. Add proper navigation bar, log out button, make sure all functionalities are working fine. 2. Price of ticket is not updating properly and there are some console errors. Fix this and any other related issue."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Functional Logout and Auth-Aware Navigation (Priority: P1) 🎯 MVP

An authenticated user needs a visible "Log Out" button in the navigation bar so they can end their session. After logging out, the navigation must immediately reflect the unauthenticated state (show "Auth" link, hide role-specific links like "Organizer" and "Admin") without requiring a full page reload. After logging in, the navigation must immediately update to show the user's role-appropriate links and email.

**Why this priority**: Without the ability to log out, users are locked into a single session until they manually clear browser storage. This is the most critical functional gap — it blocks all multi-user testing and represents a basic usability failure.

**Independent Test**: Log in as any user, confirm navigation shows the user's email and role-appropriate links, click the "Log Out" button, confirm navigation immediately reverts to the unauthenticated state (shows "Auth" link, hides "Organizer"/"Admin" links), and confirm that protected routes redirect to the auth page.

**Acceptance Scenarios**:

1. **Given** a logged-in user on any page, **When** they click the "Log Out" button in the navigation bar, **Then** their auth token and user data are cleared from storage, the navigation immediately updates to show the unauthenticated state, and the user is redirected to the events list page.
2. **Given** an unauthenticated user, **When** they log in via the auth page, **Then** the navigation immediately updates to show the user's email, the "Log Out" button, and any role-appropriate links (Organizer, Admin) without a full page reload.
3. **Given** a logged-out user, **When** they attempt to access a protected route (e.g., /organizer, /admin/organizer-requests, /checkout/:eventId/:tierId), **Then** they are redirected to the auth page.
4. **Given** a mobile viewport user, **When** they open the mobile navigation menu, **Then** the "Log Out" button is visible and functional within the mobile menu.

---

### User Story 2 — Accurate Ticket Pricing on Checkout Page (Priority: P1) 🎯 MVP

A buyer selecting tickets on the checkout page needs to see the real ticket price per unit, the line-item subtotal based on quantity, any discount applied, and the correct final total. Currently the checkout page displays $0.00 for all amounts because it does not fetch or receive the ticket tier's price. The price must be sourced from the event details data and correctly computed.

**Why this priority**: Displaying a $0.00 price destroys buyer trust and makes the checkout flow unusable. This is tied with P1 because it is a core transactional flow bug.

**Independent Test**: Navigate to an event's detail page, click "Book Now" on a tier, confirm the checkout page shows the correct per-ticket price, adjust quantity and confirm the subtotal updates, apply a discount code and confirm the total adjusts correctly.

**Acceptance Scenarios**:

1. **Given** a buyer navigating from a tier's "Book Now" button to the checkout page, **When** the checkout page loads, **Then** the page displays the tier name, the per-ticket price, and the correct subtotal for the default quantity of 1.
2. **Given** a buyer on the checkout page, **When** they change the quantity, **Then** the line-item subtotal and order total update immediately to reflect (unit price × quantity).
3. **Given** a buyer on the checkout page with a valid discount code applied, **When** the discount is validated, **Then** the order summary shows the discount amount subtracted and the correct final total (subtotal − discount).
4. **Given** a buyer on the checkout page, **When** the tier price is zero or the tier ID is invalid, **Then** an appropriate message is displayed rather than a blank or $0.00 price.

---

### User Story 3 — Console Error Resolution and Robustness (Priority: P2)

Console errors degrade developer experience and may indicate runtime issues for users (e.g., failed API calls, React warnings, navigation state mismatches). All console errors visible during normal user flows (browse events → view details → checkout → auth → organizer dashboard → admin) must be identified and resolved.

**Why this priority**: Console errors are a secondary concern to visible UI bugs but still affect reliability and maintainability. Fixing them ensures a clean runtime and prevents latent issues from surfacing later.

**Independent Test**: Open the browser developer console, perform a full user journey (browse → details → login → checkout → organizer dashboard → admin page → logout), and confirm zero console errors or warnings.

**Acceptance Scenarios**:

1. **Given** a user performing the standard browse-to-book flow, **When** they navigate through events list → event details → checkout, **Then** no console errors or warnings appear.
2. **Given** a user performing the auth flow, **When** they register, log in, and log out, **Then** no console errors or warnings appear.
3. **Given** an organizer or admin user, **When** they access their respective dashboards and perform standard operations, **Then** no console errors or warnings appear.
4. **Given** any page with loading states, **When** data is being fetched, **Then** no React key warnings, missing dependency warnings, or failed network requests appear in the console.

---

### Edge Cases

- What happens when a user logs out while on a protected route (e.g., /organizer)? They should be redirected to the events page or auth page.
- What happens when the checkout page is accessed directly via URL without valid eventId/tierId params? An appropriate error should be shown.
- What happens when the event details API call fails while the checkout page needs pricing data? The checkout should show an error state rather than $0.00.
- How does the system handle stale auth tokens (expired JWT)? Navigation should degrade gracefully, and API 401 responses should trigger logout.
- What if a user resizes from desktop to mobile while the nav is open? The nav should remain functional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Log Out" button visible in the navigation bar for authenticated users on both desktop and mobile viewports.
- **FR-002**: System MUST clear the auth token and user data from local storage when the user clicks "Log Out."
- **FR-003**: Navigation MUST reactively update to reflect the current authentication state (logged in vs. logged out) immediately after login or logout, without requiring a full page reload.
- **FR-004**: The checkout page MUST display the actual per-ticket price for the selected tier, sourced from event details data.
- **FR-005**: The checkout page MUST compute and display the correct line-item subtotal as (unit price × quantity) whenever quantity changes.
- **FR-006**: The checkout page MUST compute and display the correct order total as (subtotal − discount amount) when a discount code is applied.
- **FR-007**: The checkout page order summary MUST update in real time as quantity or discount state changes.
- **FR-008**: All console errors and warnings produced during standard user flows MUST be resolved.
- **FR-009**: After logout, the user MUST be redirected away from any protected route to the events list page.
- **FR-010**: The auth page MUST trigger navigation state updates after successful login without using `window.location.assign` (which causes a full page reload).

### Key Entities

- **AuthSession**: Represents the current user's authentication state — includes token, user profile (email, roles), and provides methods for login, logout, and state observation.
- **TicketTier**: Represents a pricing tier for an event — includes tier ID, name, per-ticket price (in minor currency units), and remaining quantity.
- **OrderSummary**: Represents the computed checkout totals — includes line items (tier name, quantity, unit price, subtotal), discount details, and final total.

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: All changes are within React TypeScript components. Navigation state management uses typed React state/context. Checkout pricing uses typed tier data with compile-time safety.
- **CA-Backend**: No backend changes are required. All data needed (event details with tier pricing) is already served by existing REST endpoints.
- **CA-Separation**: The frontend fetches tier pricing via the existing `/events/:eventId` endpoint. No new API contracts are needed. The `apiClient` service handles all backend communication.
- **CA-Auth**: JWT token is stored in `localStorage` and sent via `Authorization: Bearer` header. Logout clears the token. Navigation reacts to auth state changes. Protected routes check auth state and redirect to `/auth` when unauthenticated.
- **CA-REST**: Existing REST endpoints are sufficient. The `/events/:eventId` response already includes `tiers[].priceMinor`. No new endpoints are required.
- **CA-Dependencies**: Changes are confined to `services/authSession.ts`, `components/app/Navigation.tsx`, `pages/CheckoutPage.tsx`, `pages/AuthPage.tsx`, and `app/router.tsx`. No new circular dependencies will be introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can log out with a single click from any page, and navigation updates within 1 second.
- **SC-002**: The checkout page displays the correct per-ticket price matching the event details page within 1 second of loading.
- **SC-003**: Changing ticket quantity on the checkout page updates the displayed total within 200ms.
- **SC-004**: A complete user journey (browse → details → login → checkout → logout) produces zero console errors or warnings.
- **SC-005**: 100% of acceptance scenarios defined in this specification pass manual verification.
- **SC-006**: Navigation state correctly reflects auth status on both desktop and mobile viewports after every login and logout action.

## Assumptions

- The existing `/events/:eventId` API response already includes `tiers[].priceMinor` and does not need modification.
- The checkout page can fetch event details (or receive pricing data via route state/URL params) to obtain the tier price — the simplest approach is to fetch event details on the checkout page.
- The current `window.location.assign('/')` pattern used after auth in `AuthPage` is the root cause of the "full reload" behavior; replacing it with React Router's `useNavigate` will solve navigation reactivity.
- The application does not currently have a global auth state context; introducing one (or a lightweight event-based approach) is the recommended way to make Navigation react to auth changes.
- No backend changes are needed to resolve these issues — all fixes are frontend-only.: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: Confirm UI scope is implemented with React components in
  TypeScript, including typed props/state and compile-time type safety.
- **CA-Backend**: Confirm backend scope uses Node.js + Express REST endpoints and
  defines request/response validation.
- **CA-Separation**: Define clear frontend/backend boundaries and describe API
  client interactions between applications.
- **CA-Auth**: Document JWT authentication/authorization behavior, token handling,
  and expected 401/403 scenarios.
- **CA-REST**: Define RESTful resource design and required HTTP status codes for
  success and error scenarios.
- **CA-Dependencies**: State how the implementation prevents circular
  dependencies across frontend, backend, and shared modules.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
