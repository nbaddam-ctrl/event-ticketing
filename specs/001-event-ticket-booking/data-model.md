# Data Model - Event Ticket Booking Web App

## Entity: User
- Fields:
  - id (UUID)
  - email (unique, required)
  - passwordHash (required)
  - displayName (required)
  - roles (set: attendee|organizer|admin)
  - organizerApprovalStatus (none|pending|approved|rejected)
  - createdAt, updatedAt
- Validation rules:
  - email must be valid format and unique
  - organizer role activation requires `organizerApprovalStatus=approved`
- Relationships:
  - one-to-many with Event (as organizer)
  - one-to-many with Booking
  - one-to-many with WaitlistEntry

## Entity: Event
- Fields:
  - id (UUID)
  - organizerId (FK User)
  - title (required)
  - description
  - venueName (required)
  - startAt, endAt (required, endAt > startAt)
  - timezone (required)
  - status (draft|published|cancelled)
  - cancellationReason (nullable)
  - createdAt, updatedAt
- Validation rules:
  - organizer must be approved organizer or admin
  - cannot publish without at least one active TicketTier
- Relationships:
  - one-to-many with TicketTier
  - one-to-many with Booking
  - one-to-many with WaitlistEntry

## Entity: TicketTier
- Fields:
  - id (UUID)
  - eventId (FK Event)
  - name (required)
  - priceMinor (integer cents, >= 0)
  - currency (ISO code)
  - capacityLimit (integer > 0)
  - soldQuantity (integer >= 0)
  - reservedQuantity (integer >= 0)
  - status (active|inactive)
  - createdAt, updatedAt
- Derived fields:
  - remainingQuantity = capacityLimit - soldQuantity - reservedQuantity
- Validation rules:
  - sold + reserved must never exceed capacityLimit

## Entity: Booking
- Fields:
  - id (UUID)
  - userId (FK User)
  - eventId (FK Event)
  - ticketTierId (FK TicketTier)
  - quantity (integer > 0)
  - unitPriceMinor (integer >= 0)
  - subtotalMinor (integer >= 0)
  - discountCodeId (nullable FK DiscountCode)
  - discountAmountMinor (integer >= 0)
  - totalPaidMinor (integer >= 0)
  - status (pending|confirmed|cancelled|refunded)
  - createdAt, updatedAt
- Validation rules:
  - single discount code max per booking
  - reject entire booking if requested quantity > remainingQuantity at commit time
- Relationships:
  - one-to-one/one-to-many with Refund (depending on payment provider event model)

## Entity: DiscountCode
- Fields:
  - id (UUID)
  - code (unique, required)
  - type (percentage|fixed)
  - value (numeric, required)
  - maxUses (nullable integer)
  - usedCount (integer >= 0)
  - validFrom, validUntil
  - applicableEventId (nullable FK Event)
  - applicableTierId (nullable FK TicketTier)
  - status (active|inactive)
  - createdAt, updatedAt
- Validation rules:
  - active, within validity window, under usage cap
  - one code per booking

## Entity: WaitlistEntry
- Fields:
  - id (UUID)
  - eventId (FK Event)
  - ticketTierId (FK TicketTier)
  - userId (FK User)
  - requestedQuantity (integer > 0)
  - position (integer > 0)
  - status (queued|notified|expired|converted|cancelled)
  - reservationExpiresAt (nullable timestamp)
  - notifiedAt (nullable timestamp)
  - createdAt, updatedAt
- Validation rules:
  - FIFO ordering by createdAt (or monotonic position)
  - on promotion, set `reservationExpiresAt = now + 30 minutes`

## Entity: Refund
- Fields:
  - id (UUID)
  - bookingId (FK Booking)
  - paymentReference (required)
  - amountMinor (integer >= 0)
  - method (original_payment_method)
  - status (requested|processing|succeeded|failed)
  - reason (event_cancelled)
  - providerMessage (nullable)
  - requestedAt, completedAt, updatedAt
- Validation rules:
  - for organizer-cancelled events, amountMinor must equal booking.totalPaidMinor

## State Transitions
- Event:
  - draft -> published
  - published -> cancelled
  - cancelled is terminal
- Booking:
  - pending -> confirmed
  - confirmed -> cancelled -> refunded
  - confirmed -> refunded (provider-specific direct settlement reversal)
- WaitlistEntry:
  - queued -> notified
  - notified -> converted | expired
  - queued/notified -> cancelled
- Refund:
  - requested -> processing -> succeeded|failed
