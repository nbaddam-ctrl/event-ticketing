# Feature Specification: Event End Date Display

**Feature Branch**: `007-event-end-date`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "add end date to event details page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display End Date on Event Details (Priority: P1)

As an attendee viewing an event details page, I want to see the event's end date alongside the start date so I know how long the event lasts.

**Why this priority**: This is the core (and only) user story — displaying the end date is the entire feature request.

**Independent Test**: Navigate to any event details page and verify the end date appears in the summary card next to the start date.

**Acceptance Scenarios**:

1. **Given** an event with both `startAt` and `endAt` on the same day, **When** the user views the event details page, **Then** the summary card shows a formatted date range like "Mar 24, 2026 · 6:00 PM – 10:00 PM"
2. **Given** an event with `startAt` and `endAt` on different days, **When** the user views the event details page, **Then** the summary card shows a formatted date range like "Mar 24 – Mar 26, 2026"
3. **Given** an event where `endAt` is missing or empty, **When** the user views the event details page, **Then** only the start date is displayed (graceful fallback)

---

### Edge Cases

- What happens when `endAt` is the same instant as `startAt`? → Display only the single date (no range)
- What happens when `startAt` is missing? → Show "TBA" (existing behavior, unchanged)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The event details summary card MUST display the event end date alongside the start date
- **FR-002**: Same-day events MUST show time range format (e.g., "Mar 24, 2026 · 6:00 PM – 10:00 PM")
- **FR-003**: Multi-day events MUST show date range format (e.g., "Mar 24 – Mar 26, 2026")
- **FR-004**: If `endAt` is missing, the system MUST fall back to displaying only the start date
- **FR-005**: No backend changes are required — `endAt` already exists in the Event entity, database schema, API response, and frontend `EventDetailsResult` type

### Key Entities

- **Event**: Already has `startAt`, `endAt`, `timezone` fields. No schema changes needed.

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: Change is entirely within a single React/TypeScript page component (`EventDetailsPage.tsx`). No new components needed.
- **CA-Backend**: No backend changes. `endAt` is already returned by `GET /events/:eventId`.
- **CA-Separation**: No API boundary changes — the existing `EventDetailsResult` type already includes `endAt: string`.
- **CA-Auth**: No authentication impact.
- **CA-REST**: No REST endpoint changes.
- **CA-Dependencies**: No new dependencies or imports.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event details page displays the end date for all events that have one
- **SC-002**: Date formatting is human-readable and context-appropriate (same-day vs. multi-day)
- **SC-003**: Zero TypeScript compilation errors, zero lint errors
- **SC-004**: Existing functionality (start date display, TBA fallback) remains unchanged
