# Feature Specification: Core UX Enhancements

**Feature Branch**: `004-core-ux-enhancements`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "1. Add ability to cancel event 2. Add ability to cancel booking 3. Add ability to for user to search for events and apply filters. 4. Implement any other functionality you think will improve ux"

> **Note**: Event cancellation (item 1) is already fully implemented in the system — organizers can cancel their events from the Organizer Dashboard, affected bookings are automatically cancelled, refunds are created, and attendees receive notifications. This specification focuses on the remaining three items: booking cancellation, event search & filtering, and UX improvements.

## Clarifications

### Session 2026-03-17

- Q: Should event search include past events or default to upcoming only? → A: Show upcoming by default, with an explicit toggle to include past events.
- Q: Should booking cancellation require a confirmation dialog? → A: Yes, a confirmation dialog is required before proceeding.
- Q: Should price filter inputs use whole dollars or cents/minor units? → A: Users enter whole dollar amounts (e.g., "50"); system converts to minor units internally.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Attendee Cancels a Booking (Priority: P1)

An attendee who has a confirmed booking decides they can no longer attend. They navigate to My Bookings, find the relevant booking, and cancel it. The system releases the reserved tickets back to inventory, initiates a refund, and confirms the cancellation. If a waitlist exists for the same tier, the next person in line is automatically promoted.

**Why this priority**: Booking cancellation is a fundamental attendee expectation. Without it, users have no recourse after purchasing tickets, leading to frustration and support requests. It also enables healthy ticket circulation by releasing inventory back to the pool.

**Independent Test**: Register as an attendee, purchase tickets for an event, navigate to My Bookings, click Cancel on the booking, confirm the cancellation, and verify the booking status changes to "cancelled", the tier's available capacity increases, and a refund record is created.

**Acceptance Scenarios**:

1. **Given** an attendee has a confirmed booking, **When** they click Cancel on that booking, **Then** a confirmation dialog is shown. **When** they confirm in the dialog, **Then** the booking status changes to "cancelled", the ticket tier's sold quantity decreases by the booking's quantity, a refund record is created, and the attendee sees a cancellation success message.
2. **Given** a booking is cancelled for a tier that has a waitlist, **When** the cancellation completes, **Then** the system automatically promotes the next eligible waitlisted user (if any) following existing waitlist promotion logic.
3. **Given** a booking is already cancelled or refunded, **When** the attendee views it in My Bookings, **Then** no Cancel button is displayed for that booking.
4. **Given** an attendee attempts to cancel a booking for a cancelled event, **When** the cancellation request is made, **Then** the system rejects it with an appropriate error message since the event is already cancelled and refunds are already in progress.
5. **Given** an attendee cancels a booking, **When** the cancellation completes, **Then** the attendee receives a "booking_cancelled" notification confirming the cancellation with event name, tier, quantity, and refund amount.

---

### User Story 2 — Attendee Searches for Events (Priority: P1)

An attendee lands on the event listing page and wants to find events matching their interests. They type a keyword into a search bar and the event list filters to show only events whose title or description matches. The search results update as the user types (with debounce) or when they press Enter / click Search.

**Why this priority**: With a growing number of events, the ability to quickly find relevant ones is essential for usability. Text search is the most intuitive and commonly used discovery mechanism.

**Independent Test**: Navigate to the Events page, type a keyword in the search bar, and verify only events containing that keyword in their title or description are displayed. Clear the search and verify all events return.

**Acceptance Scenarios**:

1. **Given** a user is on the Events page, **When** they type a search term, **Then** the event list updates to show only events whose title or description contains the search term (case-insensitive).
2. **Given** a user searches for a term that matches no events, **When** results load, **Then** an empty state message is shown (e.g., "No events found matching your search").
3. **Given** a user has an active search, **When** they clear the search input, **Then** the full event list is restored.
4. **Given** the user types rapidly, **When** keystrokes occur within 300ms of each other, **Then** only the final term triggers an API call (debounced).
5. **Given** a user is on the Events page, **When** the page loads with default settings, **Then** only upcoming events (start date >= today) are shown. A toggle allows including past events.

---

### User Story 3 — Attendee Filters Events by Date Range (Priority: P2)

An attendee wants to find events happening within a specific date range. They select a start date and/or end date using date picker controls, and the event list filters to show only events starting within that range.

**Why this priority**: Date-based filtering is the second most important discovery mechanism after text search. Attendees typically plan around their availability.

**Independent Test**: Navigate to the Events page, select a "From" date and "To" date, and verify only events starting within that range are displayed. Remove one or both date filters and verify results update accordingly.

**Acceptance Scenarios**:

1. **Given** a user sets a "From" date, **When** results load, **Then** only events with a start date on or after the selected date are shown.
2. **Given** a user sets a "To" date, **When** results load, **Then** only events with a start date on or before the selected date are shown.
3. **Given** a user sets both "From" and "To" dates, **When** results load, **Then** only events starting within that date range (inclusive) are shown.
4. **Given** a user clears a date filter, **When** the filter is removed, **Then** the results update to reflect the remaining active filters.

---

### User Story 4 — Attendee Filters Events by Price Range (Priority: P2)

An attendee is budget-conscious and wants to see only events that have at least one ticket tier within their price range. They adjust minimum and/or maximum price inputs, and the event list filters accordingly.

**Why this priority**: Price is a key decision factor. Allowing attendees to filter by budget avoids wasted time browsing unaffordable events.

**Independent Test**: Navigate to the Events page, enter a maximum price, and verify only events with at least one active tier priced at or below that amount are displayed.

**Acceptance Scenarios**:

1. **Given** a user sets a maximum price, **When** results load, **Then** only events that have at least one active ticket tier priced at or below the maximum are shown.
2. **Given** a user sets a minimum price, **When** results load, **Then** only events that have at least one active ticket tier priced at or above the minimum are shown.
3. **Given** a user sets both min and max price, **When** results load, **Then** only events with at least one active tier within that price range are shown.
4. **Given** a user clears price filters, **When** the filter is removed, **Then** all events matching other active filters are shown.

---

### User Story 5 — Combined Search and Filters (Priority: P2)

An attendee uses text search together with date and price filters simultaneously. All filters compose additively — only events matching ALL active criteria are displayed. Active filters are visually indicated and can be individually cleared.

**Why this priority**: Real-world usage involves combining multiple criteria. The system must handle intersecting filters gracefully.

**Independent Test**: Apply a search term, a date range, and a price range simultaneously. Verify only events matching all three criteria are displayed. Clear one filter and verify the results expand accordingly.

**Acceptance Scenarios**:

1. **Given** a user has a search term and date filter active, **When** they also set a price filter, **Then** only events matching all three criteria are shown.
2. **Given** multiple filters are active, **When** the user clears one filter, **Then** results update to reflect the remaining filters.
3. **Given** multiple filters are active, **When** the user clicks a "Clear all filters" action, **Then** all filters are reset and the full event list is displayed.
4. **Given** filters are active, **When** results are paginated, **Then** pagination works correctly with the filtered result set (total count reflects filtered results).

---

### User Story 6 — Organizer Views Their Own Events (Priority: P2)

An organizer navigates to their dashboard and sees a list of all events they have created, with status indicators (published, cancelled). This gives organizers visibility into their portfolio without searching the public event list.

**Why this priority**: Organizers currently have no way to see their own events in one place. They can only create new events or cancel via a search of all published events. A dedicated "My Events" list improves organizer workflow and provides the foundation for future event management actions.

**Independent Test**: Log in as an organizer, navigate to the Organizer Dashboard, and verify a list of the organizer's events is displayed with title, date, venue, status, and ticket sales summary.

**Acceptance Scenarios**:

1. **Given** an organizer is on the dashboard, **When** the page loads, **Then** a list of all their created events is displayed, ordered by creation date (newest first).
2. **Given** an organizer has both published and cancelled events, **When** viewing the list, **Then** each event shows a status badge (published, cancelled).
3. **Given** an organizer has events with ticket sales, **When** viewing the list, **Then** each event shows a summary of tickets sold vs. capacity.
4. **Given** an organizer has no events, **When** viewing the list, **Then** an empty state is shown encouraging them to create their first event.

---

### User Story 7 — Improved My Bookings Page (Priority: P3)

The My Bookings page is enhanced with better organization, sorting, and visual indicators. Bookings are grouped or sortable by status (confirmed first, then cancelled/refunded). Each booking card shows more details: event date, venue, tier, quantity, amount paid, and a clear status badge. The cancel action from User Story 1 is integrated here.

**Why this priority**: The current bookings page shows basic information. Enhancing it with sorting, richer details, and clear status indicators improves the attendee experience, especially as users accumulate more bookings over time.

**Independent Test**: Log in as an attendee with multiple bookings (mixed statuses), navigate to My Bookings, and verify bookings are clearly displayed with full details and sorted with confirmed bookings first.

**Acceptance Scenarios**:

1. **Given** an attendee has bookings with mixed statuses, **When** viewing My Bookings, **Then** confirmed bookings appear before cancelled and refunded bookings.
2. **Given** an attendee views a booking, **When** looking at the booking card, **Then** event title, date, venue, tier name, quantity, amount paid, and status badge are all visible.
3. **Given** an attendee has many bookings, **When** viewing the page, **Then** bookings are paginated or scrollable for performance.

---

### User Story 8 — Event Details Shows Cancellation Status (Priority: P3)

When an event has been cancelled, attendees who navigate to or share the event URL see a clear cancellation notice rather than a "not found" error. The page displays the event information in a read-only state with a prominent cancellation banner and the cancellation reason (if provided).

**Why this priority**: Currently, cancelled events return a 404. Users who bookmarked or shared an event link get a confusing error. Showing a cancelled state with explanation is more user-friendly.

**Independent Test**: Cancel an event, then navigate to its URL as an attendee. Verify a cancellation banner is displayed with the event details in a read-only state.

**Acceptance Scenarios**:

1. **Given** an event is cancelled, **When** a user navigates to the event detail page, **Then** the event information is displayed with a prominent "Event Cancelled" banner.
2. **Given** a cancelled event has a cancellation reason, **When** viewing the event, **Then** the reason is displayed in the cancellation banner.
3. **Given** an event is cancelled, **When** viewing the event detail page, **Then** the "Book Tickets" and "Join Waitlist" actions are hidden or disabled.

---

### Edge Cases

- What happens when an attendee tries to cancel a booking after the event has already started? — Cancellation is rejected; bookings for past events cannot be cancelled.
- What happens when two users cancel bookings simultaneously for the same tier with a waitlist? — Each cancellation independently increases available capacity and triggers waitlist promotion; the system handles concurrent inventory updates atomically via transactions.
- What happens when a search query contains special characters? — Special characters are treated as literal text; the search is sanitized to prevent injection.
- What happens when a user applies filters that result in zero events, then paginates? — Pagination shows page 1 of 0 results with the empty state message.
- What happens when an attendee cancels a booking that used a discount code? — The discount code's `used_count` is decremented, making it available for re-use (if not expired).
- What happens when an organizer has hundreds of events? — The organizer event list is paginated to maintain performance.
- What happens when a user bookmarks a cancelled event and returns later? — The event detail page shows the cancelled state instead of 404.

## Requirements *(mandatory)*

### Functional Requirements

**Booking Cancellation**

- **FR-001**: System MUST allow an attendee to cancel their own confirmed booking.
- **FR-002**: System MUST reject cancellation of bookings that are already cancelled, refunded, or for events that have already started.
- **FR-003**: Upon booking cancellation, system MUST decrease the ticket tier's sold quantity by the booking's ticket count, making those tickets available again.
- **FR-004**: Upon booking cancellation, system MUST create a refund record associated with the cancelled booking.
- **FR-005**: Upon booking cancellation, system MUST trigger waitlist promotion for the affected tier (if a waitlist exists).
- **FR-006**: Upon booking cancellation, system MUST decrement the associated discount code's used count (if a discount was applied to the booking).
- **FR-007**: Upon booking cancellation, system MUST send a "booking_cancelled" notification to the attendee with event name, tier, quantity, and refund amount.
- **FR-008**: System MUST NOT display a Cancel action for bookings that are not in "confirmed" status.
- **FR-008a**: System MUST show a confirmation dialog before executing a booking cancellation. The dialog MUST clearly state the action is irreversible and that a refund will be initiated.

**Event Search**

- **FR-009**: System MUST support text search on the event listing, matching against event title and description (case-insensitive).
- **FR-010**: Search input MUST be debounced (minimum 300ms) to avoid excessive requests during typing.
- **FR-011**: System MUST display an empty state message when search or filters yield no results.

**Event Filtering**

- **FR-012**: System MUST support filtering events by start date range (from date, to date, or both). By default, only upcoming events (start date >= today) are shown.
- **FR-012a**: System MUST provide a toggle to include past events in search/filter results. When disabled (default), only events with a start date on or after today are returned.
- **FR-013**: System MUST support filtering events by ticket price range (minimum price, maximum price, or both), matching events that have at least one active tier within the range. Users enter prices in whole dollar amounts (e.g., "50" for $50); the frontend converts to minor units before sending to the API.
- **FR-014**: All filters (search text, date range, price range) MUST compose additively — only events matching ALL active criteria are returned.
- **FR-015**: System MUST provide a "Clear all filters" action that resets all active filters.
- **FR-016**: Pagination MUST work correctly with filtered results, reflecting the filtered total count.

**Organizer Event List**

- **FR-017**: System MUST provide organizers with a list of their own created events, including title, date, venue, status, and ticket sales summary.
- **FR-018**: Organizer event list MUST show events ordered by creation date (newest first) and paginated.

**My Bookings Enhancements**

- **FR-019**: My Bookings page MUST display confirmed bookings before cancelled and refunded bookings.
- **FR-020**: Each booking card MUST display event title, event date, venue, tier name, quantity, amount paid, and a status badge.

**Cancelled Event Display**

- **FR-021**: System MUST display cancelled events with a cancellation banner and reason instead of returning a "not found" error.
- **FR-022**: System MUST hide booking and waitlist actions for cancelled events.

### Key Entities

- **Booking**: Represents a user's ticket purchase. Key attributes: user, event, tier, quantity, total paid, status (pending/confirmed/cancelled/refunded), associated discount code. New behavior: transition from confirmed → cancelled by user action.
- **Refund**: Represents a refund request tied to a booking. Key attributes: booking reference, amount, reason (event_cancelled or user_cancelled), status. New reason type: "user_cancelled" for attendee-initiated cancellations.
- **Event**: Represents a ticketed event. Key attributes: title, description, venue, start date, status (draft/published/cancelled), cancellation reason. New behavior: searchable by text and filterable by date/price.
- **Ticket Tier**: Represents a pricing tier for an event. Key attributes: name, price, capacity, sold quantity. Used for price-range filtering at the event level.
- **Notification**: Existing entity, extended with new type: "booking_cancelled".

### Constitution Alignment

- **CA-Frontend**: All new UI components (search bar, filter controls, cancel booking button, organizer event list, cancelled event banner) will be React TypeScript components with typed props and state.
- **CA-Backend**: Booking cancellation endpoint and enhanced event listing endpoint will be Express REST routes with Zod-validated request/query parameters.
- **CA-Separation**: Frontend interacts with backend exclusively via API client functions. Search and filter parameters are passed as query parameters to the event listing endpoint. Booking cancellation uses a dedicated API endpoint.
- **CA-Auth**: Booking cancellation requires authentication and validates booking ownership. Organizer event list requires authentication and organizer role. Event search and browsing remain publicly accessible.
- **CA-REST**: POST for booking cancellation action, GET with query parameters for search/filter. Standard status codes: 200 for successful reads, 200 for successful cancellation, 400 for invalid requests, 401 for unauthenticated, 403 for unauthorized, 404 for not found.
- **CA-Dependencies**: New modules follow existing patterns — notification service remains a leaf dependency called fire-and-forget from booking service. No circular imports introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Attendees can cancel a confirmed booking in under 3 clicks (My Bookings → Cancel → Confirm).
- **SC-002**: Event search returns filtered results in under 1 second for typical queries across up to 1,000 events.
- **SC-003**: Users can find a specific event within 15 seconds using search and/or filters, compared to manually scrolling through the list.
- **SC-004**: Attendees can see a cancelled event's details (with cancellation reason) instead of encountering a "not found" error, reducing confusion for 100% of shared/bookmarked cancelled event links.
- **SC-005**: Organizers can view all their created events with status and sales data from a single dashboard view without navigating away.
- **SC-006**: Filter controls handle all supported criteria (text, dates, price) simultaneously and produce correct results within 1 second.
- **SC-007**: Booking cancellations correctly restore ticket inventory — 100% of cancelled booking quantities are returned to the available pool.
- **SC-008**: 100% of booking cancellations for tiers with active waitlists trigger automatic waitlist promotion.

## Assumptions

- **A-001**: Booking cancellation is allowed at any time before the event starts. No partial cancellation — the full booking (all tickets in a single purchase) is cancelled at once.
- **A-002**: Refund for user-initiated cancellation follows the same refund mechanism as event cancellation (a refund record is created with status "requested"). Actual payment processing is out of scope.
- **A-003**: Search is a simple LIKE-based text match, not full-text search or fuzzy matching. This is appropriate for the current scale of events.
- **A-004**: Price filtering operates on the ticket tier's listed price, not on any discounted price. Users enter prices in whole dollar amounts; the frontend converts to minor units (cents) for the API query.
- **A-005**: Date filtering matches against the event's start date, not end date.
- **A-006**: The organizer event list reuses the existing event data model with no new database columns required — it filters by `organizer_id`.
- **A-007**: Event cancellation (item 1 from user request) is already fully implemented and is not included in this spec's scope.

## Out of Scope

- Real payment processing or refund execution (refund records are created but not processed)
- Full-text search engine integration (e.g., Elasticsearch)
- Event categories or tags for filtering
- Venue-based or location-based filtering
- Saved searches or filter presets
- Partial booking cancellation (cancelling individual tickets from a multi-ticket booking)
- Cancellation fees or time-based cancellation policies
