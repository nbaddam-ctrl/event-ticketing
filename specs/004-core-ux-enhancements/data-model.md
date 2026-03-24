# Data Model: Core UX Enhancements

**Feature**: 004-core-ux-enhancements
**Date**: 2026-03-17

## Overview

This feature does **not** introduce new database tables. All changes extend existing entities through new functions, query patterns, and one new notification type. The data model section documents the affected entities, their state transitions, and validation rules.

## Entities

### Booking (existing — extended behavior)

**Table**: `bookings`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | TEXT | PK, UUID | |
| user_id | TEXT | FK → users, NOT NULL | |
| event_id | TEXT | FK → events, NOT NULL | |
| ticket_tier_id | TEXT | FK → ticket_tiers, NOT NULL | |
| quantity | INTEGER | NOT NULL | |
| unit_price_minor | INTEGER | NOT NULL | Cents |
| subtotal_minor | INTEGER | NOT NULL | Cents |
| discount_code_id | TEXT | FK → discount_codes, nullable | |
| discount_amount_minor | INTEGER | DEFAULT 0 | Cents |
| total_paid_minor | INTEGER | NOT NULL | Cents |
| status | TEXT | DEFAULT 'confirmed' | pending/confirmed/cancelled/refunded |
| created_at | TEXT | NOT NULL | ISO 8601 |

**New state transition**: `confirmed → cancelled` (user-initiated cancellation)

**State Machine**:
```
pending ──► confirmed ──► cancelled (by user or event cancellation)
                │
                └──────► refunded (by admin/system)
```

**Validation rules for cancellation**:
- Booking must be in `confirmed` status
- Booking must belong to the authenticated user (`user_id = req.auth.sub`)
- Event associated with the booking must NOT be `cancelled`
- Event `start_at` must be in the future (`start_at > now`)

### Refund (existing — extended reason)

**Table**: `refunds`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | TEXT | PK, UUID | |
| booking_id | TEXT | FK → bookings, NOT NULL | |
| payment_reference | TEXT | NOT NULL | |
| amount_minor | INTEGER | NOT NULL | Cents |
| method | TEXT | NOT NULL | Default: 'original_payment_method' |
| status | TEXT | DEFAULT 'requested' | |
| reason | TEXT | DEFAULT 'event_cancelled' | **Now also**: 'user_cancelled' |
| provider_message | TEXT | nullable | |
| requested_at | TEXT | NOT NULL | ISO 8601 |
| completed_at | TEXT | nullable | |

**New reason value**: `'user_cancelled'` — used when refund is created from attendee-initiated booking cancellation.

### Event (existing — extended query behavior)

**Table**: `events`

No schema changes. Extended with:
- **Text search**: LIKE query on `title` and `description` fields
- **Date range filter**: Comparison on `start_at` field (ISO 8601 string comparison)
- **Default upcoming filter**: `start_at >= today` unless `includePast=true`
- **Cancelled event display**: `getEventDetails` no longer rejects `status = 'cancelled'`

### Ticket Tier (existing — used for price filtering)

**Table**: `ticket_tiers`

No schema changes. Used for:
- **Price range filter**: EXISTS subquery checking `price_minor` against min/max values
- **Inventory restoration on booking cancel**: Decrement `sold_quantity` by cancelled booking's `quantity`

### Discount Code (existing — extended with decrement)

**Table**: `discount_codes`

No schema changes. Extended with:
- **Usage decrement**: New `decrementDiscountUsage(id)` function to restore usage count on booking cancellation

### Notification (existing — new type)

**Table**: `notifications`

No schema changes. Extended with:
- **New NotificationType**: `'booking_cancelled'`
- **New NotificationReferenceType**: Uses existing `'booking'` reference type

**Notification template for booking_cancelled**:
- **title**: "Booking Cancelled"
- **message**: "Your booking for {eventTitle} ({tierName}, {quantity} ticket(s)) has been cancelled. A refund of ${amount} has been initiated."
- **referenceId**: booking ID
- **referenceType**: 'booking'
- **navigationPath**: '/my-bookings'

## Query Patterns

### Filtered Event Listing

```sql
SELECT e.id, e.organizer_id, e.title, e.description, e.venue_name,
       e.start_at, e.end_at, e.timezone, e.status
FROM events e
WHERE e.status = 'published'
  AND (? IS NULL OR (e.title LIKE ? OR e.description LIKE ?))  -- text search
  AND (? IS NULL OR e.start_at >= ?)                           -- dateFrom
  AND (? IS NULL OR e.start_at <= ?)                           -- dateTo
  AND (? IS NULL OR EXISTS (                                   -- price filter
    SELECT 1 FROM ticket_tiers t
    WHERE t.event_id = e.id AND t.status = 'active'
      AND (? IS NULL OR t.price_minor >= ?)
      AND (? IS NULL OR t.price_minor <= ?)
  ))
ORDER BY e.start_at ASC
LIMIT ? OFFSET ?
```

Note: The actual implementation builds conditions dynamically (see research.md R2) rather than using `? IS NULL` patterns, for better query plan efficiency.

### Organizer Event Listing

```sql
SELECT e.*,
  COALESCE(SUM(t.capacity_limit), 0) as total_capacity,
  COALESCE(SUM(t.sold_quantity), 0) as total_sold
FROM events e
LEFT JOIN ticket_tiers t ON t.event_id = e.id AND t.status = 'active'
WHERE e.organizer_id = ?
GROUP BY e.id
ORDER BY e.created_at DESC
LIMIT ? OFFSET ?
```

### Booking Cancellation (within transaction)

```sql
-- 1. Verify booking exists, is confirmed, owned by user
SELECT b.*, e.start_at, e.status as event_status, e.title as event_title,
       t.name as tier_name
FROM bookings b
JOIN events e ON b.event_id = e.id
JOIN ticket_tiers t ON b.ticket_tier_id = t.id
WHERE b.id = ? AND b.user_id = ?

-- 2. Update booking status
UPDATE bookings SET status = 'cancelled' WHERE id = ?

-- 3. Restore tier inventory
UPDATE ticket_tiers SET sold_quantity = sold_quantity - ? WHERE id = ?

-- 4. Create refund
INSERT INTO refunds (id, booking_id, payment_reference, amount_minor, method, status, reason, requested_at)
VALUES (?, ?, ?, ?, 'original_payment_method', 'requested', 'user_cancelled', ?)

-- 5. Decrement discount usage (if applicable)
UPDATE discount_codes SET used_count = MAX(0, used_count - 1) WHERE id = ?
```

### Sorted Bookings Query

```sql
SELECT b.*, e.title as event_title, e.venue_name, e.start_at as event_start_at,
       t.name as tier_name
FROM bookings b
JOIN events e ON b.event_id = e.id
JOIN ticket_tiers t ON b.ticket_tier_id = t.id
WHERE b.user_id = ?
ORDER BY CASE b.status
  WHEN 'confirmed' THEN 1
  WHEN 'pending' THEN 2
  WHEN 'cancelled' THEN 3
  WHEN 'refunded' THEN 4
  ELSE 5
END, b.created_at DESC
```
