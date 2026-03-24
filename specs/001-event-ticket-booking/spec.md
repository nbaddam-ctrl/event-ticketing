# Feature Specification: Event Ticket Booking Web App

**Feature Branch**: `001-event-ticket-booking`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "Build an event ticket booking web app with browsing, booking, organizer management, waitlist, discount codes, and tiered pricing"

## Clarifications

### Session 2026-03-06

- Q: How long should released tickets be reserved for the next waitlisted user before expiring and moving to the next user? → A: Hold released tickets for 30 minutes, then auto-expire and move to next user.
- Q: How many discount codes can be applied to a single booking? → A: Exactly one discount code per booking.
- Q: What refund policy applies when an organizer cancels an event? → A: Refund 100% of paid ticket amount to the original payment method.
- Q: What should happen when requested ticket quantity exceeds remaining inventory? → A: Reject the entire purchase and require a new request with a lower quantity.
- Q: Who can create events? → A: Registered users must request organizer role and be admin-approved before creating events.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Purchase Tickets (Priority: P1)

As an attendee, I can browse events, open event details, choose ticket quantity by
available pricing tiers, register/login, and complete a ticket purchase.

**Why this priority**: This is the core attendee value and primary revenue flow.

**Independent Test**: Can be fully tested by creating one event with multiple
ticket tiers, then completing registration, login, and purchase for a valid
quantity without using organizer-only features.

**Acceptance Scenarios**:

1. **Given** published events exist, **When** a visitor browses the event list,
  **Then** the system shows event summaries including date, location, and
  starting ticket price.
2. **Given** an event has tiered pricing, **When** a visitor opens event
  details, **Then** the system shows each ticket tier, price, and remaining
  quantity.
3. **Given** a visitor is not authenticated, **When** they attempt checkout,
  **Then** the system requires registration or login before purchase.
4. **Given** an authenticated attendee selects a valid quantity, **When** they
  confirm purchase, **Then** the system creates a booking and reduces
  inventory atomically.

---

### User Story 2 - Manage Events as Organizer (Priority: P2)

As an organizer, I can create an event, configure ticket limits and tiered
pricing, and cancel an event so attendees are refunded.

**Why this priority**: Supply-side management is required to operate events and
control ticket availability.

**Independent Test**: Can be tested independently by authenticating as an
organizer, creating an event with tiers and limits, selling tickets, then
cancelling the event and verifying refunds for affected bookings.

**Acceptance Scenarios**:

1. **Given** an authenticated, admin-approved organizer, **When** they create an event with
  ticket tiers and capacity limits, **Then** the event is saved and becomes
  bookable.
2. **Given** ticket sales exist for an event, **When** the organizer cancels the
  event, **Then** bookings are marked cancelled and refunds are initiated for
  paid tickets.

---

### User Story 3 - Waitlist and Discounted Booking (Priority: P3)

As an attendee, I can join a waitlist when tickets are sold out and apply valid
discount codes during checkout when purchasing available tickets.

**Why this priority**: Waitlists recover demand on sold-out events and discounts
support promotional conversion.

**Independent Test**: Can be tested independently by filling an event to
capacity, joining the waitlist, freeing capacity, and completing a discounted
purchase using a valid code.

**Acceptance Scenarios**:

1. **Given** an event tier is sold out, **When** an attendee requests tickets,
  **Then** the system offers waitlist enrollment.
2. **Given** a valid discount code is entered at checkout, **When** the attendee
  confirms purchase, **Then** the payable amount reflects discount rules and
  audit details are recorded.
3. **Given** capacity becomes available, **When** waitlisted users are next in
  order, **Then** they are notified and can purchase within a 30-minute
  reservation window.

---

### Edge Cases

- Two attendees attempt to buy the last available ticket at the same time.
- An attendee tries to purchase more tickets than remaining inventory.
- A partial quantity is available but less than requested at checkout time.
- A discount code is expired, usage-capped, not applicable to the chosen tier,
  or causes total price to go below zero.
- An attendee tries to apply multiple discount codes to a single booking.
- A registered user requests organizer role but remains pending approval.
- An organizer cancels an event after partial ticket sales and after some
  waitlist entries exist.
- A refund to the original payment method fails due to provider issues.
- A waitlist user does not act within the reservation window.
- A previously available tier becomes unavailable during checkout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to browse a list of published events.
- **FR-002**: System MUST provide event detail pages with schedule, venue,
  ticket tiers, prices, and remaining quantities.
- **FR-003**: System MUST allow users to register new accounts and log in before
  booking tickets.
- **FR-004**: System MUST allow only authenticated, admin-approved organizers to
  create events.
- **FR-005**: System MUST allow organizers to define per-tier ticket inventory
  limits.
- **FR-026**: System MUST allow registered users to request organizer role and
  MUST require admin approval before organizer capabilities are enabled.
- **FR-027**: System MUST allow admins to approve or reject organizer role
  requests and record the decision status.
- **FR-006**: System MUST support tiered ticket pricing within an event.
- **FR-007**: System MUST allow authenticated attendees to select ticket
  quantities and purchase available tickets.
- **FR-008**: System MUST prevent overselling by ensuring final ticket
  confirmation cannot exceed available inventory.
- **FR-009**: System MUST reject the entire purchase when requested quantity
  exceeds available tickets and MUST NOT auto-adjust to a lower quantity.
- **FR-010**: System MUST return a clear error instructing the attendee to retry
  with a lower quantity when inventory is insufficient.
- **FR-011**: System MUST allow organizers to cancel an event.
- **FR-012**: System MUST mark all active bookings for a cancelled event as
  cancelled and trigger ticket refunds.
- **FR-013**: System MUST refund 100% of paid ticket amount to the original
  payment method for bookings cancelled due to organizer event cancellation.
- **FR-014**: System MUST track refund status per booking and expose it to users.
- **FR-015**: System MUST provide waitlist enrollment for sold-out events or
  sold-out tiers.
- **FR-016**: System MUST maintain fair waitlist order based on enrollment time.
- **FR-017**: System MUST notify the next eligible waitlisted users when
  inventory becomes available.
- **FR-018**: System MUST reserve newly available tickets for 30 minutes for the
  next eligible waitlisted user, then auto-expire and advance to the next user
  if not purchased.
- **FR-019**: System MUST allow attendees to apply discount codes at checkout.
- **FR-020**: System MUST validate discount code rules (active period, usage
  limits, applicability) before finalizing discounted totals.
- **FR-021**: System MUST allow at most one discount code per booking and MUST
  reject additional codes with a clear validation response.
- **FR-022**: System MUST calculate final order totals using base tier price,
  quantity, and applied discount effects.
- **FR-023**: System MUST produce a booking confirmation record containing event,
  tier, quantity, amount paid, and booking status.
- **FR-024**: System MUST enforce authenticated access for purchase,
  organizer-only event management, and cancellation operations.
- **FR-025**: System MUST expose booking, cancellation, waitlist, and discount
  outcomes with consistent success/error response formats.

### Key Entities *(include if feature involves data)*

- **User**: Account holder with attendee or organizer role, authentication
  identity, and contact details.
- **Event**: Bookable listing with organizer ownership, title, description,
  schedule, venue, and lifecycle state (draft/published/cancelled).
- **TicketTier**: Price bucket for an event with name, price, capacity limit,
  sold quantity, and remaining quantity.
- **Booking**: Purchase intent and fulfillment record linking user, event,
  ticket tier, quantity, total amount, and status.
- **DiscountCode**: Promotional rule with code value, validity window, usage
  constraints, eligibility scope, and discount type/value.
- **WaitlistEntry**: Ordered request by user for sold-out event/tier with
  enrollment time, notification state, and reservation expiry.
- **Refund**: Reversal record linked to cancelled bookings with amount, reason,
  request time, and processing status.

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: Attendee and organizer flows are specified as component-driven
  web journeys with typed data inputs/outputs.
- **CA-Backend**: All booking, event management, waitlist, refund, and discount
  behaviors are defined as API-driven capabilities with explicit validation.
- **CA-Separation**: Specification keeps UI concerns (browse, checkout,
  management screens) separate from backend concerns (inventory control,
  waitlist ordering, refunds).
- **CA-Auth**: Protected operations include authenticated booking and
  organizer-only event creation/cancellation with unauthorized access outcomes.
- **CA-REST**: Requirements define consistent success/failure outcomes that map
  to RESTful resource operations and status semantics.
- **CA-Dependencies**: Scope anticipates separate frontend/backend/shared
  modules and requires no circular dependency relationships.

## Assumptions

- Discount codes can be either percentage-based or fixed-amount and are applied
  to eligible ticket subtotals.
- Exactly one discount code can be applied to a booking.
- Waitlist processing is first-come, first-served within each event tier.
- Waitlist reservation holds expire after 30 minutes if unpurchased.
- Event cancellation triggers refunds for paid bookings only; pending/unpaid
  bookings are simply cancelled.
- Organizer-triggered cancellations refund 100% of paid ticket amount to the
  original payment method.
- Refund completion time depends on payment processor latency but must remain
  visible to users through status updates.
- Ticket limits are enforced per tier and contribute to total event capacity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of test users can complete browse-to-purchase flow in
  under 4 minutes on first attempt.
- **SC-002**: Zero confirmed bookings exceed configured ticket capacity across
  all events during test and pilot periods.
- **SC-003**: 95% of event cancellation cases trigger refund initiation for all
  eligible bookings within 5 minutes of cancellation.
- **SC-006**: 100% of eligible organizer-cancelled paid bookings are refunded at
  full paid amount to the original payment method in acceptance tests.
- **SC-004**: At least 85% of eligible waitlist notifications result in either a
  completed purchase or explicit decline within the 30-minute reservation
  window.
- **SC-005**: Discount code validation accuracy is 100% for active, expired,
  ineligible, and usage-capped scenarios in acceptance testing.
