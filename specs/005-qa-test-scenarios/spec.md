# Feature Specification: QA Test Scenarios

**Feature Branch**: `005-qa-test-scenarios`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Add following for QA: State transition diagrams, Concurrency scenario testing, Gherkin-style acceptance tests, Invalid purchase attempts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — State Transition Diagrams (Priority: P1)

As a QA engineer, I need comprehensive state transition diagrams for every stateful entity in the system so that I can verify every entity follows its defined lifecycle, identify unreachable or dead-end states, and build targeted test cases for each transition.

**Why this priority**: State transitions are the foundation of every other test scenario. Without a verified understanding of entity lifecycles, concurrency tests and acceptance tests cannot be built correctly. This story produces the reference material all other QA efforts depend on.

**Independent Test**: Can be validated by tracing every status-changing code path in the system and confirming each transition matches the documented diagram. Delivers immediate value as a living reference for all team members.

**Acceptance Scenarios**:

1. **Given** the system defines status fields on Booking, Event, TicketTier, WaitlistEntry, Refund, OrganizerRequest, and User entities, **When** a QA engineer reviews the state transition diagrams, **Then** every status value and every valid transition for each entity is documented with its trigger action and resulting side effects.
2. **Given** a state transition diagram for Bookings, **When** the diagram is compared against the codebase, **Then** every code path that changes `booking.status` is represented in the diagram, including the direct `confirmed` creation (bypassing `pending`).
3. **Given** a state transition diagram for Events, **When** the diagram lists the `draft` state, **Then** it notes that `draft` is defined but currently unreachable since events are created as `published` directly.
4. **Given** all transition diagrams, **When** an engineer attempts to trigger an undocumented transition (e.g. `cancelled → confirmed` for a Booking), **Then** the system rejects the operation with the appropriate error code specified in the diagram.

---

### User Story 2 — Invalid Purchase Attempt Testing (Priority: P1)

As a QA engineer, I need a complete catalog of invalid purchase scenarios with Gherkin-style acceptance tests so that I can systematically verify that every guard clause in the booking flow returns the correct error and leaves system state unchanged.

**Why this priority**: Purchase flow is the revenue-critical path. Invalid purchase attempts must be rejected cleanly without corrupting inventory, double-charging users, or creating orphan records. This is tied with P1 because purchase integrity is the system's highest-risk area.

**Independent Test**: Can be tested by sending invalid booking requests to the API and verifying error responses, HTTP status codes, and that tier `soldQuantity` and discount `usedCount` remain unchanged after each rejected attempt.

**Acceptance Scenarios**:

1. **Given** a published event with a tier that has 0 remaining tickets, **When** an authenticated user attempts to purchase 1 ticket for that tier, **Then** the system returns HTTP 409 with code `CONFLICT` and message "Insufficient inventory for requested quantity", and `soldQuantity` is unchanged.
2. **Given** a cancelled event, **When** an authenticated user attempts to purchase a ticket, **Then** the system returns HTTP 404 with message "Event not found".
3. **Given** a valid event and tier, **When** an unauthenticated user attempts to purchase, **Then** the system returns HTTP 401.
4. **Given** a valid event and tier, **When** a user submits a booking with `quantity: 0` or `quantity: -1`, **Then** the system returns HTTP 400 with a validation error.
5. **Given** a valid event and tier, **When** a user submits a booking with a non-UUID `ticketTierId`, **Then** the system returns HTTP 400 with a validation error.
6. **Given** a valid event and tier, **When** a user submits a booking with a discount code containing a comma or space, **Then** the system returns HTTP 400 with message "Only one discount code is allowed per booking".
7. **Given** a discount code with `usedCount >= maxUses`, **When** a user attempts to purchase using that code, **Then** the system returns HTTP 400 with reason "Code usage limit reached".
8. **Given** a discount code with `validUntil` in the past, **When** a user attempts to purchase using that code, **Then** the system returns HTTP 400 with reason "Code expired".
9. **Given** a discount code scoped to event A, **When** a user attempts to use it for event B, **Then** the system returns HTTP 400 with reason "Code not valid for this event".
10. **Given** a discount code scoped to tier X, **When** a user attempts to use it for tier Y, **Then** the system returns HTTP 400 with reason "Code not valid for this tier".

---

### User Story 3 — Concurrency Scenario Testing (Priority: P2)

As a QA engineer, I need documented concurrency test scenarios and expected behaviors so that I can verify the system handles simultaneous operations safely — preventing double-bookings, inventory corruption, and race conditions around discount codes and waitlist positions.

**Why this priority**: Concurrency bugs are silent and can cause financial loss. While the current system uses serialized transactions, documenting and testing these scenarios guards against regressions when the system scales or migrates to a different data store.

**Independent Test**: Can be tested by simulating concurrent requests (parallel booking attempts for the last available ticket, simultaneous cancellation and re-booking, concurrent discount code usage) and verifying that only the correct number of bookings succeed and inventory totals are consistent.

**Acceptance Scenarios**:

1. **Given** a tier with exactly 1 remaining ticket, **When** 5 users simultaneously attempt to purchase 1 ticket each, **Then** exactly 1 booking is created as `confirmed`, the other 4 receive HTTP 409, and the tier's `soldQuantity` reflects exactly 1 additional sale.
2. **Given** a confirmed booking for the last ticket in a tier, **When** that user cancels the booking at the same time another user attempts to purchase, **Then** the cancellation completes first (restoring inventory), and the second user's purchase either succeeds (if inventory was restored) or fails with 409 — but never results in negative `soldQuantity`.
3. **Given** a discount code with `maxUses: 1` and `usedCount: 0`, **When** 2 users simultaneously submit bookings using that code, **Then** at most 1 booking applies the discount, and the code's `usedCount` never exceeds `maxUses`.
4. **Given** a tier where 3 tickets just became available, **When** 10 waitlist entries are eligible for promotion simultaneously, **Then** only entries whose `requestedQuantity` fits within the available tickets are promoted, the total allocated does not exceed the available amount, and no two entries are promoted for the same tickets.
5. **Given** multiple users joining the waitlist for the same tier at the same time, **When** positions are assigned, **Then** every entry receives a unique position number with no duplicates or gaps in sequential order.
6. **Given** an organizer cancelling an event, **When** a user simultaneously attempts to book a ticket for that event, **Then** the booking either completes before the cancellation (and is then cancelled with a refund) or is rejected with a 404, but never remains as a `confirmed` booking for a cancelled event.

---

### User Story 4 — Gherkin-Style Acceptance Tests for Core Flows (Priority: P2)

As a QA engineer, I need formal Gherkin-style acceptance test specifications for the end-to-end happy-path and error flows so that they can serve as executable documentation, a regression test baseline, and onboarding material for new QA team members.

**Why this priority**: Gherkin scenarios bridge the gap between business requirements and test automation. They ensure every flow is documented in a format that is both human-readable and machine-executable, reducing ambiguity and enabling continuous verification.

**Independent Test**: Can be validated by reviewing each Gherkin scenario against the running system — executing the described steps either manually or through automation and confirming the expected outcomes match.

**Acceptance Scenarios**:

1. **Given** the booking flow, **When** Gherkin scenarios are written, **Then** they cover: successful purchase, purchase with discount, purchase with invalid discount, purchase for sold-out tier, and purchase quantity validation failure.
2. **Given** the cancellation flow, **When** Gherkin scenarios are written, **Then** they cover: successful booking cancellation, cancel already-cancelled booking, cancel booking for started event, and cancel booking for cancelled event.
3. **Given** the waitlist flow, **When** Gherkin scenarios are written, **Then** they cover: joining waitlist, promotion on cancellation, reservation expiry, and re-joining after expiry.
4. **Given** the organizer flow, **When** Gherkin scenarios are written, **Then** they cover: event creation with multiple tiers, tier management (add/update/deactivate), and event cancellation with refund creation.

---

### Edge Cases

- What happens when an organizer deactivates the last remaining active tier on an event? The system must reject this to prevent an event with zero purchasable tiers.
- What happens when a user cancels a booking and the freed ticket triggers waitlist promotion, but the promoted user's reservation expires before they purchase? The ticket must return to available inventory.
- What happens when the same user creates two bookings for the same event and tier? The system currently allows this — this should be documented and tested.
- What happens when a discount code's `validFrom` is in the future? The system must reject with "Code not active yet".
- What happens when an event is cancelled while a waitlist-promoted user has an active reservation? The reservation should be invalidated along with the event cancellation.
- What happens when `capacityLimit` is updated to a value below `soldQuantity + reservedQuantity`? The system must reject the update.
- What happens when a booking is created with `quantity` greater than the tier's total `capacityLimit`? The system must reject since remaining < requested.

## State Transition Diagrams *(mandatory)*

### Booking Lifecycle

```
                   ┌───────────┐
                   │  (start)  │
                   └─────┬─────┘
                         │ purchaseTickets()
                         │ [event published, tier has inventory]
                         ▼
               ┌─────────────────┐
               │    confirmed    │
               └────────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             │
   user cancels   event cancelled    │
   cancelBooking() cancelOrganizerEvent()
          │             │             │
          ▼             ▼             │
   ┌─────────────────────────┐       │
   │       cancelled         │       │
   └────────────┬────────────┘       │
                │                    │
                ▼                    │
     refund record created           │
     (refunds table, status:         │
      'requested')                   │
                                     │
          Note: 'pending' and        │
          'refunded' statuses are    │
          defined but currently      │
          unreachable in code.       │
```

**Valid Transitions**:

| From | To | Trigger | Side Effects |
| ---- | -- | ------- | ------------ |
| (new) | confirmed | `purchaseTickets()` | tier `soldQuantity` incremented, discount `usedCount` incremented (if used), `booking_confirmed` notification sent |
| confirmed | cancelled | `cancelBooking()` (user) | tier `soldQuantity` decremented, refund created, discount `usedCount` decremented, waitlist promotion triggered, `booking_cancelled` notification sent |
| confirmed | cancelled | `cancelOrganizerEvent()` | refund created per booking, `event_cancelled` notification sent to each affected user |

**Invalid Transitions** (must be rejected):

| Attempted | Error |
| --------- | ----- |
| cancelled → confirmed | Not possible; no reactivation path exists |
| cancelled → cancelled | HTTP 409: "Booking is already cancelled or refunded" |
| refunded → cancelled | HTTP 409: "Booking is already cancelled or refunded" |
| confirmed → cancelled (event already started) | HTTP 400: "Cannot cancel booking for an event that has already started" |
| confirmed → cancelled (event cancelled) | HTTP 400: "Cannot cancel booking for a cancelled event" |

### Event Lifecycle

```
   ┌───────────┐
   │  (start)  │
   └─────┬─────┘
         │ createOrganizerEvent()
         │ [organizer approved]
         ▼
   ┌───────────┐
   │ published │
   └─────┬─────┘
         │ cancelOrganizerEvent()
         ▼
   ┌───────────┐
   │ cancelled │◄── terminal state
   └───────────┘

   Note: 'draft' is defined in types but
   currently bypassed — events are created
   directly as 'published'.
```

**Valid Transitions**:

| From | To | Trigger | Side Effects |
| ---- | -- | ------- | ------------ |
| (new) | published | `createOrganizerEvent()` | Tiers created, event visible in listings |
| published | cancelled | `cancelOrganizerEvent()` | All confirmed bookings cancelled, refunds created, notifications sent |

**Invalid Transitions**:

| Attempted | Result |
| --------- | ------ |
| cancelled → cancelled | No-op; returns `{ refundCount: 0 }` |
| cancelled → published | No reactivation path exists |

### Ticket Tier Lifecycle

```
   ┌───────────┐
   │  (start)  │
   └─────┬─────┘
         │ created with event or addTierToEvent()
         ▼
   ┌──────────┐      deactivateTier()
   │  active  │──────[soldQty=0, reservedQty=0]────►┌──────────┐
   └──────────┘                                     │ inactive │
        ▲                                           └──────────┘
        │              syncEventTiers()                  │
        └────────────[name matches desired tier]─────────┘
```

### Waitlist Entry Lifecycle

```
   ┌───────────┐
   │  (start)  │
   └─────┬─────┘
         │ joinWaitlist()
         ▼
   ┌──────────┐      promoteWaitlistForTier()
   │  queued  │──────[sufficient inventory]──────►┌──────────┐
   └──────────┘                                   │ notified │
                                                  └────┬─────┘
                                                       │ 30-min timer expires
                                                       ▼
                                                  ┌──────────┐
                                                  │ expired  │◄── terminal
                                                  └──────────┘
```

**Key Behavior**: During promotion, if a queued entry's `requestedQuantity` exceeds remaining availability, it is **skipped** (not partially fulfilled) and the next entry is evaluated.

### Organizer Approval Lifecycle

```
   ┌──────┐     requestOrganizerRole()     ┌─────────┐     admin decides
   │ none │──────────────────────────────►│ pending │─────┬──────────►┌──────────┐
   └──────┘                               └─────────┘     │          │ approved │
                                                          │          └──────────┘
                                                          │
                                                          └──────────►┌──────────┐
                                                                      │ rejected │
                                                                      └──────────┘
```

### Refund Lifecycle

```
   ┌───────────┐
   │  (start)  │
   └─────┬─────┘
         │ createRefundRequest()
         │ [booking cancelled or event cancelled]
         ▼
   ┌───────────┐
   │ requested │◄── only status currently set
   └───────────┘

   Note: No further status transitions are
   implemented. Completion/failure tracking
   is deferred to a future payment integration.
```

## Concurrency Test Scenarios *(mandatory)*

### CS-001: Last-Ticket Race Condition

**Scenario**: Multiple users attempt to buy the last available ticket simultaneously.

**Setup**: Tier with `capacityLimit: 50`, `soldQuantity: 49`, `reservedQuantity: 0` (1 remaining).

**Test**: Fire 5 concurrent POST `/bookings` requests, each for `quantity: 1`.

**Expected**:
- Exactly 1 request returns HTTP 201 with a confirmed booking
- Exactly 4 requests return HTTP 409 with "Insufficient inventory"
- Tier `soldQuantity` = 50 (not 51+)
- Exactly 1 booking record exists for this batch

**Current Safeguard**: `createBookingAtomically()` runs inside `withTransaction()`, and SQLite serializes writes.

### CS-002: Cancel-Then-Rebook Race ● Console
                                                                                       
    console.error                                                                      
      [api-error] {                                                                    
        correlationId: '4e3e6703-0b73-4afa-8e3b-da0da6d8025c',                         
        method: 'POST',                                                                
        path: '/bookings',                                                             
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Code usage limit reached'
      }

      10 |     : randomUUID();
      11 |
    > 12 |   console.error('[api-error]', {
         |           ^
      13 |     correlationId,
      14 |     method: _req.method,
      15 |     path: _req.path,

      at errorHandler (src/api/middleware/errorHandler.ts:12:11)
      at Layer.handle_error (../node_modules/express/lib/router/layer.js:71:5)
      at trim_prefix (../node_modules/express/lib/router/index.js:326:13)
      at ../node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../node_modules/express/lib/router/index.js:346:12)  
      at next (../node_modules/express/lib/router/index.js:280:10)
      at ../node_modules/express/lib/router/index.js:646:15
      at next (../node_modules/express/lib/router/index.js:265:14)
      at next (../node_modules/express/lib/router/route.js:141:14)
      at src/api/routes/bookingRoutes.ts:51:5
      at Layer.handle [as handle_request] (../node_modules/express/lib/router/layer.js:95:5)
      at next (../node_modules/express/lib/router/route.js:149:13)
      at requireAuth (src/api/middleware/auth.ts:19:3)
      at Layer.handle [as handle_request] (../node_modules/express/lib/router/layer.js:95:5)
      at next (../node_modules/express/lib/router/route.js:149:13)
      at Route.dispatch (../node_modules/express/lib/router/route.js:119:3)
      at Layer.handle [as handle_request] (../node_modules/express/lib/router/layer.js:95:5)
      at ../node_modules/express/lib/router/index.js:284:15
      at Function.process_params (../node_modules/express/lib/router/index.js:346:12)  
      at next (../node_modules/express/lib/router/index.js:280:10)
      at Function.handle (../node_modules/express/lib/router/index.js:175:3)
      at router (../node_modules/express/lib/router/index.js:47:12)
      at Layer.handle [as handle_request] (../node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (../node_modules/express/lib/router/index.js:328:13)
      at ../node_modules/express/lib/router/index.js:286:9
      at Function.process_params (../node_modules/express/lib/router/index.js:346:12)  
      at next (../node_modules/express/lib/router/index.js:280:10)
      at ../node_modules/body-parser/lib/read.js:137:5
      at invokeCallback (../node_modules/raw-body/index.js:238:16)
      at done (../node_modules/raw-body/index.js:227:7)
      at IncomingMessage.onEnd (../node_modules/raw-body/index.js:287:7)

**Scenario**: User A cancels a booking for the last ticket while User B simultaneously tries to purchase.

**Setup**: Tier with `capacityLimit: 1`, `soldQuantity: 1`. User A has the confirmed booking.

**Test**: Fire concurrent `POST /bookings/:id/cancel` (User A) and `POST /bookings` (User B).

**Expected**:
- If cancellation commits first: User B's purchase succeeds, `soldQuantity` = 1
- If purchase evaluates first: User B gets HTTP 409, cancellation succeeds, `soldQuantity` = 0
- `soldQuantity` is never negative
- No orphan refund records are created for a booking that was never cancelled

### CS-003: Discount Code Exhaustion Race

**Scenario**: Two users simultaneously use a discount code that has 1 remaining use.

**Setup**: Discount code with `maxUses: 5`, `usedCount: 4`.

**Test**: Fire 2 concurrent booking requests both referencing the same discount code.

**Expected**:
- At most 1 booking receives the discount
- `usedCount` never exceeds `maxUses`
- The second request either succeeds without the discount (if validation rejects the code) or fails entirely

**Known Risk**: `incrementDiscountUsage()` is called outside the booking transaction. Under concurrent load, both requests could pass the `usedCount < maxUses` check before either increments, resulting in `usedCount` exceeding `maxUses`. This should be flagged as a potential defect.

### CS-004: Waitlist Position Assignment Race

**Scenario**: Multiple users join the same tier's waitlist simultaneously.

**Setup**: Tier with 0 remaining tickets, no existing waitlist entries.

**Test**: Fire 5 concurrent POST `/waitlist` requests for the same tier.

**Expected**:
- All 5 entries are created successfully
- Each entry has a unique, sequential `position` value (1, 2, 3, 4, 5)
- No two entries share the same `position`

**Known Risk**: `createWaitlistEntry()` reads `MAX(position) + 1` and then inserts in a non-transactional pattern. Concurrent requests could receive the same position value.

### CS-005: Event Cancellation During Active Purchase

**Scenario**: An organizer cancels an event while an attendee is mid-purchase.

**Setup**: Published event with available tickets. User A is submitting a booking.

**Test**: Fire concurrent `POST /events/:id/cancel` (organizer) and `POST /bookings` (User A).

**Expected**:
- If booking commits first: booking is confirmed, then event cancellation cancels it and creates a refund
- If event cancellation commits first: booking request returns HTTP 404 ("Event not found" because `status !== 'published'`)
- No confirmed bookings exist for a cancelled event without a corresponding refund

### CS-006: Waitlist Promotion During Cancellation Cascade

**Scenario**: An event cancellation triggers mass booking cancellations, which trigger waitlist promotions.

**Setup**: Event with 10 confirmed bookings and 5 waitlist entries for the same tier.

**Test**: Cancel the event via `POST /events/:id/cancel`.

**Expected**:
- All 10 bookings are cancelled with refunds
- Waitlist promotions should NOT fire for a cancelled event (promoting for a cancelled event is pointless)
- No waitlist entries are moved to `notified` status for a cancelled event

## Gherkin-Style Acceptance Tests *(mandatory)*

### Feature: Ticket Purchase

```gherkin
Feature: Ticket Purchase
  As an attendee
  I want to purchase tickets for events
  So that I can attend events I'm interested in

  Background:
    Given a published event "Summer Music Festival" exists
    And the event has a tier "General Admission" priced at $50.00 with capacity 100
    And the event has a tier "VIP" priced at $150.00 with capacity 20
    And I am logged in as an attendee

  Scenario: Successful single-tier purchase
    When I purchase 2 tickets for "General Admission"
    Then I receive a booking confirmation
    And the booking status is "confirmed"
    And the booking total is $100.00
    And "General Admission" sold quantity increases by 2
    And I receive a "booking_confirmed" notification

  Scenario: Successful purchase with percentage discount
    Given a discount code "SAVE20" exists with 20% off, applicable to all events
    When I purchase 3 tickets for "General Admission" with discount code "SAVE20"
    Then the subtotal is $150.00
    And the discount amount is $30.00
    And the booking total is $120.00
    And the discount code used count increases by 1

  Scenario: Successful purchase with fixed amount discount
    Given a discount code "FLAT500" exists with $5.00 off
    When I purchase 1 ticket for "VIP" with discount code "FLAT500"
    Then the subtotal is $150.00
    And the discount amount is $5.00
    And the booking total is $145.00

  Scenario: Purchase attempt for sold-out tier
    Given "General Admission" has sold 100 of 100 tickets
    When I attempt to purchase 1 ticket for "General Admission"
    Then I receive a 409 error with message "Insufficient inventory for requested quantity"
    And no booking is created
    And "General Admission" sold quantity remains 100

  Scenario: Purchase attempt for more tickets than available
    Given "VIP" has sold 19 of 20 tickets
    When I attempt to purchase 2 tickets for "VIP"
    Then I receive a 409 error with message "Insufficient inventory for requested quantity"
    And no booking is created

  Scenario: Purchase with zero quantity
    When I attempt to purchase 0 tickets for "General Admission"
    Then I receive a 400 validation error

  Scenario: Purchase with negative quantity
    When I attempt to purchase -1 tickets for "General Admission"
    Then I receive a 400 validation error

  Scenario: Purchase with non-UUID tier ID
    When I attempt to purchase 1 ticket with tier ID "not-a-uuid"
    Then I receive a 400 validation error

  Scenario: Purchase for non-existent event
    When I attempt to purchase 1 ticket for a non-existent event
    Then I receive a 404 error with message "Event not found"

  Scenario: Purchase for cancelled event
    Given the event "Summer Music Festival" is cancelled
    When I attempt to purchase 1 ticket for "General Admission"
    Then I receive a 404 error with message "Event not found"

  Scenario: Purchase with multiple discount codes
    When I attempt to purchase 1 ticket for "General Admission" with discount code "CODE1, CODE2"
    Then I receive a 400 error with message "Only one discount code is allowed per booking"

  Scenario: Purchase without authentication
    Given I am not logged in
    When I attempt to purchase 1 ticket for "General Admission"
    Then I receive a 401 error
```

### Feature: Booking Cancellation

```gherkin
Feature: Booking Cancellation
  As an attendee
  I want to cancel my bookings
  So that I can get a refund when my plans change

  Background:
    Given a published event "Tech Conference" exists starting tomorrow
    And I am logged in as an attendee
    And I have a confirmed booking for 2 "Standard" tickets at $75.00 each

  Scenario: Successful booking cancellation
    When I cancel my booking
    Then the booking status changes to "cancelled"
    And "Standard" sold quantity decreases by 2
    And a refund of $150.00 is created with status "requested"
    And I receive a "booking_cancelled" notification

  Scenario: Successful cancellation triggers waitlist promotion
    Given 2 users are on the waitlist for "Standard" tier
    And the first waitlist entry requests 1 ticket
    When I cancel my booking (freeing 2 tickets)
    Then the first waitlist entry is promoted to "notified" status
    And the first waitlist user receives a "waitlist_promoted" notification

  Scenario: Cancel already-cancelled booking
    Given my booking has already been cancelled
    When I attempt to cancel the booking again
    Then I receive a 409 error with message "Booking is already cancelled or refunded"

  Scenario: Cancel booking for started event
    Given the event "Tech Conference" has already started
    When I attempt to cancel my booking
    Then I receive a 400 error with message "Cannot cancel booking for an event that has already started"

  Scenario: Cancel booking for cancelled event
    Given the event "Tech Conference" has been cancelled by the organizer
    When I attempt to cancel my booking
    Then I receive a 400 error with message "Cannot cancel booking for a cancelled event"

  Scenario: Cancel another user's booking
    Given another user has a confirmed booking
    When I attempt to cancel their booking using their booking ID
    Then I receive a 404 error with message "Booking not found"
```

### Feature: Waitlist Management

```gherkin
Feature: Waitlist Management
  As an attendee
  I want to join a waitlist when tickets are sold out
  So that I can be notified when tickets become available

  Background:
    Given a published event "Concert" exists
    And the "Floor" tier has 0 remaining tickets
    And I am logged in as an attendee

  Scenario: Join waitlist for sold-out tier
    When I join the waitlist for "Floor" tier requesting 2 tickets
    Then my waitlist entry is created with status "queued"
    And my position is assigned based on queue order

  Scenario: Waitlist promotion on ticket cancellation
    Given I am queued at position 1 requesting 1 ticket
    When another user cancels their booking and 1 ticket becomes available
    Then my waitlist entry status changes to "notified"
    And I have a 30-minute reservation window
    And I receive a "waitlist_promoted" notification

  Scenario: Waitlist promotion skips entry needing more tickets than available
    Given User A is queued at position 1 requesting 3 tickets
    And User B is queued at position 2 requesting 1 ticket
    When 1 ticket becomes available
    Then User A is skipped (still "queued")
    And User B is promoted to "notified"

  Scenario: Waitlist reservation expires
    Given my waitlist entry was promoted to "notified"
    And my 30-minute reservation window has passed
    When the expiry check runs
    Then my waitlist entry status changes to "expired"
    And I receive a "waitlist_expired" notification
```

### Feature: Event Tier Management

```gherkin
Feature: Event Tier Management
  As an organizer
  I want to manage multiple ticket tiers for my events
  So that I can offer different pricing options to attendees

  Background:
    Given I am logged in as an approved organizer

  Scenario: Create event with multiple tiers
    When I create an event with tiers:
      | name              | price  | capacity |
      | Early Bird        | $35.00 | 100      |
      | General Admission | $50.00 | 200      |
      | VIP               | $150.00| 50       |
    Then the event is created with status "published"
    And all 3 tiers are created with status "active"
    And tiers are displayed ordered by price ascending

  Scenario: Add tier to existing event
    Given I have a published event with 1 tier
    When I add a new "VIP" tier priced at $200.00 with capacity 30
    Then the event now has 2 active tiers

  Scenario: Update tier price
    Given I have a published event with a "Standard" tier
    When I update the "Standard" tier price to $60.00
    Then the tier price is updated to $60.00
    And existing bookings are not affected

  Scenario: Attempt to deactivate tier with sold tickets
    Given I have a tier "Standard" with 5 tickets sold
    When I attempt to deactivate the "Standard" tier
    Then the operation is rejected
    And the tier remains active

  Scenario: Attempt to reduce capacity below sold count
    Given I have a tier with capacity 100 and 60 tickets sold
    When I attempt to update capacity to 50
    Then the capacity remains at 100

  Scenario: Deactivate tier with zero sales
    Given I have 2 active tiers and the "Early Bird" tier has 0 tickets sold
    When I deactivate the "Early Bird" tier
    Then the tier status changes to "inactive"
    And the event still has 1 active tier

  Scenario: Attempt to manage tiers on cancelled event
    Given my event has been cancelled
    When I attempt to add or modify a tier
    Then I receive a 400 error with message "Cannot modify tiers for a cancelled event"
```

### Feature: Event Cancellation

```gherkin
Feature: Event Cancellation
  As an organizer
  I want to cancel my events
  So that attendees are refunded when an event cannot proceed

  Background:
    Given I am logged in as an approved organizer
    And I have a published event "Workshop" with 5 confirmed bookings

  Scenario: Cancel event with bookings
    When I cancel the event with reason "Venue unavailable"
    Then the event status changes to "cancelled"
    And all 5 bookings are set to "cancelled"
    And 5 refund records are created with status "requested"
    And each affected attendee receives an "event_cancelled" notification with the reason

  Scenario: Cancel already-cancelled event
    Given the event has already been cancelled
    When I attempt to cancel it again
    Then I receive a response with refundCount 0 and status "cancelled"

  Scenario: Non-owner attempts to cancel event
    Given another organizer (not the event owner) is logged in
    When they attempt to cancel my event
    Then they receive a 403 error with message "Only the organizer or admin can cancel this event"

  Scenario: Admin cancels any event
    Given an admin user is logged in
    When the admin cancels my event
    Then the event is cancelled successfully with all refunds created
```

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST document all valid state transitions for Booking, Event, TicketTier, WaitlistEntry, Refund, and OrganizerRequest entities, including trigger actions, guard conditions, and side effects.
- **FR-002**: System MUST reject any state transition not listed in the valid transition table with the appropriate HTTP error code (400, 404, or 409).
- **FR-003**: System MUST return HTTP 409 (Conflict) when a purchase request exceeds the remaining ticket inventory for a tier.
- **FR-004**: System MUST return HTTP 404 when a purchase is attempted for a cancelled or non-existent event.
- **FR-005**: System MUST return HTTP 400 when a booking request fails schema validation (invalid UUID, zero/negative quantity, malformed fields).
- **FR-006**: System MUST return HTTP 400 with the specific reason text when a discount code fails validation (expired, not active yet, wrong event/tier, usage limit reached, multiple codes attempted).
- **FR-007**: System MUST guarantee that `soldQuantity` never exceeds `capacityLimit` for any ticket tier, even under concurrent purchase load.
- **FR-008**: System MUST guarantee that `soldQuantity` never becomes negative, even when cancellations and purchases happen concurrently.
- **FR-009**: System MUST guarantee that `usedCount` on a discount code never exceeds `maxUses` under concurrent usage.
- **FR-010**: System MUST guarantee unique, sequential waitlist positions per tier with no duplicates under concurrent waitlist joins.
- **FR-011**: System MUST produce Gherkin-style acceptance test specifications covering: successful purchase, purchase with discount, all invalid purchase scenarios, booking cancellation (valid and invalid), waitlist join/promotion/expiry, event creation with multiple tiers, tier management operations, and event cancellation.
- **FR-012**: System MUST ensure that no confirmed booking exists for a cancelled event without a corresponding refund record.
- **FR-013**: System MUST prevent tier deactivation when the tier has non-zero `soldQuantity` or `reservedQuantity`.
- **FR-014**: System MUST prevent tier capacity reduction below `soldQuantity + reservedQuantity`.
- **FR-015**: System MUST prevent deactivation of the last active tier on a published event.

### Key Entities

- **Booking**: Represents a ticket purchase. Status lifecycle: `confirmed → cancelled`. Links to a user, event, and ticket tier. Side effects on creation (inventory decrement, discount usage) and cancellation (inventory restoration, refund creation, discount decrement, waitlist promotion).
- **Event**: Represents a scheduled occurrence. Status lifecycle: `published → cancelled`. Owns multiple ticket tiers. Cancellation cascades to all confirmed bookings.
- **TicketTier**: Represents a pricing level within an event. Status lifecycle: `active ⇄ inactive`. Tracks `capacityLimit`, `soldQuantity`, and `reservedQuantity`. Inventory = `capacityLimit - soldQuantity - reservedQuantity`.
- **WaitlistEntry**: Represents a user queuing for a sold-out tier. Status lifecycle: `queued → notified → expired`. Promoted with a 30-minute reservation window.
- **Refund**: Represents a refund request created on booking cancellation. Status lifecycle: `requested` (terminal for now). Linked to a booking with a payment reference.
- **DiscountCode**: Represents a reusable promotional code. Tracks usage via `usedCount` against `maxUses`. Can be scoped to a specific event and/or tier.

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: Test specifications reference React/TypeScript components for UI-layer validation testing (form validation, error display, tier rendering) with typed props/state.
- **CA-Backend**: All test scenarios validate Node.js + Express REST endpoints with Zod request validation and structured error responses.
- **CA-Separation**: Test scenarios are organized by layer — API-level acceptance tests validate backend endpoints, while frontend tests validate component rendering and user interaction flows.
- **CA-Auth**: Test scenarios include JWT authentication verification: unauthenticated purchase returns 401, non-owner booking cancellation returns 404 (not found rather than 403 for security), organizer role enforcement returns 403.
- **CA-REST**: All test scenarios verify RESTful status codes: 201 (created), 200 (success), 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 409 (conflict).
- **CA-Dependencies**: Test specifications are organized as independent feature files with no circular references between test scenarios or shared mutable state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of entity status fields in the system have a corresponding state transition diagram covering all defined values, valid transitions, and documented invalid transitions.
- **SC-002**: Every HTTP error response path in the booking flow (purchase, cancel) has a corresponding Gherkin acceptance test scenario.
- **SC-003**: At least 6 concurrency scenarios are documented with expected behaviors, including scenarios for last-ticket races, cancel/rebook races, discount exhaustion, and waitlist position assignment.
- **SC-004**: At least 95% of all acceptance test scenarios pass when executed against the running system.
- **SC-005**: Every invalid purchase attempt scenario (10+ cases) has a documented expected error code, error message, and assertion that system state is unchanged.
- **SC-006**: State transition diagrams identify at least 2 defined-but-unreachable states (e.g., `draft` for events, `pending` for bookings) for future roadmap consideration.
- **SC-007**: Gherkin scenarios cover at least 5 feature areas: ticket purchase, booking cancellation, waitlist management, tier management, and event cancellation.

## Assumptions

- The system runs on a single-process SQLite backend where write serialization via `withTransaction()` provides basic concurrency safety. Concurrency test scenarios document expected behavior but flag patterns (discount increment outside transaction, non-transactional waitlist position assignment) that would be vulnerable in a multi-process or distributed deployment.
- The `pending` booking status and `draft` event status are intentionally unused in the current implementation. These are documented as unreachable states rather than flagged as defects.
- Refund processing beyond the `requested` status is deferred to a future payment integration feature. Tests only verify refund record creation, not payment provider interactions.
- Gherkin scenarios are written as executable documentation. Actual test runner integration (e.g., Cucumber, Jest-Cucumber) is implementation work outside this specification's scope.
- Discount code validation follows the current sequential check order: exists → active → not expired → not future → event match → tier match → usage limit.
