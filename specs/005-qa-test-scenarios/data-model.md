# Data Model: QA Test Scenarios

**Feature**: 005-qa-test-scenarios
**Date**: 2026-03-20

> This feature adds tests only — no schema changes. This document catalogs the
> entities under test and their state machines for reference during test
> implementation.

## Entities Under Test

### Booking

| Field | Type | Test Relevance |
|-------|------|----------------|
| id | UUID | Primary key for cancellation/lookup tests |
| userId | UUID | Ownership checks (cancel another user's booking → 404) |
| eventId | UUID | Event-level validation (cancelled event → 404) |
| ticketTierId | UUID | Tier-level validation (non-existent tier → 404) |
| quantity | integer ≥ 1 | Validation tests (0, -1 → 400) |
| unitPriceMinor | integer | Price calculation assertions |
| subtotalMinor | integer | = unitPriceMinor × quantity |
| discountCodeId | UUID or null | Discount application assertions |
| discountAmountMinor | integer | Discount calculation assertions |
| totalPaidMinor | integer | = max(0, subtotalMinor - discountAmountMinor) |
| status | enum | **State machine under test** |

**Status values**: `pending` (defined, unreachable), `confirmed`, `cancelled`, `refunded` (defined, unreachable)

**Transitions**:
```
(new) ──[purchaseTickets]──► confirmed ──[cancelBooking | cancelEvent]──► cancelled
```

### Event

| Field | Type | Test Relevance |
|-------|------|----------------|
| id | UUID | Route parameter for all event operations |
| organizerId | UUID | Ownership checks (non-owner cancel → 403) |
| status | enum | **State machine under test** |

**Status values**: `draft` (defined, unreachable), `published`, `cancelled`

**Transitions**:
```
(new) ──[createOrganizerEvent]──► published ──[cancelOrganizerEvent]──► cancelled
```

### TicketTier

| Field | Type | Test Relevance |
|-------|------|----------------|
| id | UUID | Tier selection in purchase flow |
| eventId | UUID | FK constraint |
| capacityLimit | integer | Inventory boundary tests |
| soldQuantity | integer | Concurrency + inventory assertions |
| reservedQuantity | integer | Waitlist reservation assertions |
| status | enum | **State machine under test** |

**Status values**: `active`, `inactive`

**Transitions**:
```
(new) ──► active ⇄ inactive  (deactivate: only if sold=0, reserved=0)
```

### WaitlistEntry

| Field | Type | Test Relevance |
|-------|------|----------------|
| id | UUID | Entry identification |
| position | integer | Sequential assignment (concurrency test CS-004) |
| requestedQuantity | integer | Promotion eligibility (skip if > available) |
| status | enum | **State machine under test** |
| reservationExpiresAt | ISO timestamp | 30-minute window assertion |

**Status values**: `queued`, `notified`, `expired`

**Transitions**:
```
(new) ──► queued ──[promoteWaitlistForTier]──► notified ──[expireWaitlistHold]──► expired
```

### Refund

| Field | Type | Test Relevance |
|-------|------|----------------|
| id | UUID | Created as side effect of cancellation |
| bookingId | UUID | FK — verify 1:1 with cancelled booking |
| amountMinor | integer | Must match booking's totalPaidMinor |
| status | enum | Created as `requested` |
| reason | enum | `user_cancelled` or `event_cancelled` |

**Status values**: `requested` (terminal for now)

### DiscountCode

| Field | Type | Test Relevance |
|-------|------|----------------|
| code | string | Input for purchase validation |
| type | `percentage` or `fixed` | Calculation assertions |
| value | number | Discount amount assertions |
| maxUses | integer or null | Usage limit tests (CS-003) |
| usedCount | integer | Increment/decrement tracking |
| applicableEventId | UUID or null | Event scoping tests |
| applicableTierId | UUID or null | Tier scoping tests |
| validFrom | ISO timestamp or null | "Not active yet" tests |
| validUntil | ISO timestamp or null | "Expired" tests |

## No Schema Changes

This feature does not add, modify, or remove any database tables, columns, or
indexes. All entities listed above already exist in `backend/src/db/schema.sql`.
