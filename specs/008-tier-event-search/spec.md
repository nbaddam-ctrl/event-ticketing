# Feature Specification: Search Event by Name for Tier Management

**Feature Branch**: `008-tier-event-search`  
**Created**: 2026-03-26  
**Status**: Draft  
**Input**: User description: "currently we are searching event for tier change with id, it is not very convenient. make changes to allow user to search event by name to update tier"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Search & Select Event by Name in Tier Management Panel (Priority: P1)

As an organizer on the dashboard, I want to search for my events by name inside the Tier Management panel so I can quickly find and load an event to manage its tiers — without needing to copy-paste a UUID.

**Why this priority**: This is the core pain point. Currently the Tier Management panel requires manually entering a raw event UUID, which is error-prone and unintuitive. Replacing the raw ID input with a searchable event picker directly solves the user's request.

**Independent Test**: Open the Organizer Dashboard → in the Tier Management panel, type a partial event name → see matching events appear in a dropdown → select one → tiers load for editing.

**Acceptance Scenarios**:

1. **Given** an organizer is on the dashboard, **When** they type at least 1 character into the event search field in the Tier Management panel, **Then** a dropdown appears showing matching events (filtered by title, showing title + date + status)
2. **Given** matching events are shown in the dropdown, **When** the organizer selects an event, **Then** the event's tiers are loaded into the editing form (same behavior as current "Load" with a valid ID)
3. **Given** the organizer types a search term with no matches, **When** the dropdown appears, **Then** it shows "No events found" with a helpful message
4. **Given** the organizer has selected an event and is editing tiers, **When** they clear the search field, **Then** the tier editor resets and the panel returns to the search state
5. **Given** the search field is empty, **When** it receives focus, **Then** the most recent events are shown as suggestions (up to 5)

---

### User Story 2 — Backend Search Support for Organizer Events (Priority: P1)

As the system, the organizer event listing endpoint needs to accept an optional search query parameter to filter the organizer's events by title, so the frontend can implement the search-as-you-type experience.

**Why this priority**: The frontend event picker depends on this backend capability. The public event listing already supports title search — this extends the same pattern to the organizer's own events.

**Independent Test**: Call `GET /events/mine?search=concert` with a valid organizer JWT → response contains only the organizer's events whose titles match "concert".

**Acceptance Scenarios**:

1. **Given** an organizer has events titled "Summer Concert" and "Winter Gala", **When** `GET /events/mine?search=concert` is called, **Then** only "Summer Concert" is returned
2. **Given** an organizer calls `GET /events/mine` without a search parameter, **Then** all events are returned (existing behavior preserved)
3. **Given** a search term matches no events, **When** the endpoint is called, **Then** an empty items array is returned with total: 0

---

### Edge Cases

- What happens when the organizer types very quickly? → Frontend debounces search input (300ms) to avoid excessive API calls
- What happens when the search API is slow? → Show a loading spinner in the dropdown
- What happens when the organizer's event list is empty? → Show "No events yet. Create an event first." in the dropdown
- What happens when the selected event is cancelled? → Still show it in results (organizer may need to view tiers on cancelled events), but display a "Cancelled" badge

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Tier Management panel MUST replace the raw "Event ID" text input with a search-by-name input field
- **FR-002**: The search input MUST show a dropdown of matching events as the organizer types (min 1 character, debounced at 300ms)
- **FR-003**: Each dropdown item MUST display the event title, date, and status badge
- **FR-004**: Selecting a dropdown item MUST load the event's tiers into the editing form
- **FR-005**: The `GET /events/mine` endpoint MUST accept an optional `search` query parameter that filters events by title (case-insensitive partial match)
- **FR-006**: The existing behavior of `GET /events/mine` without a search parameter MUST be preserved (returns all organizer events, paginated)
- **FR-007**: When the search field is focused but empty, the panel SHOULD show the most recent events (up to 5) as quick-select suggestions
- **FR-008**: The search field MUST show a clear button to reset the selection and return to search mode

### Key Entities

- **Event**: Existing entity — no schema changes. Relevant attributes: `id`, `title`, `startAt`, `status`, `organizerId`
- **TicketTier**: Existing entity — no changes. Loaded after event selection.

### Assumptions

- The search is scoped to the organizer's own events only (enforced by the existing `GET /events/mine` auth check)
- Search uses case-insensitive LIKE matching on the event title, consistent with the existing public event search pattern
- Results are limited by existing pagination (default page size 10), which is sufficient for a search dropdown

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: The Tier Management panel component (`TierManagementPanel.tsx`) will be updated with TypeScript-typed search state and dropdown rendering. No new standalone components needed — the search/select UI is internal to the panel.
- **CA-Backend**: The existing `GET /events/mine` Express route will be extended with an optional `search` query parameter. Zod validation will be used for query parsing.
- **CA-Separation**: The frontend calls `listOrganizerEvents(page, pageSize, search?)` through the existing API client. No direct database access from frontend.
- **CA-Auth**: The `GET /events/mine` endpoint already requires a valid JWT and scopes results to the authenticated organizer. No auth changes needed.
- **CA-REST**: Extended query parameter on existing `GET /events/mine` resource. Returns 200 with filtered results or empty array. No new endpoints.
- **CA-Dependencies**: Changes touch backend repository → service → route (vertical slice) and frontend API → component (vertical slice). No circular dependency risk.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Organizers can find and load an event for tier management in under 10 seconds by typing part of the event name
- **SC-002**: The raw UUID input field is fully replaced — organizers never need to copy-paste an event ID
- **SC-003**: Search results appear within 1 second of the user stopping typing
- **SC-004**: Zero TypeScript compilation errors and zero lint errors across frontend and backend
