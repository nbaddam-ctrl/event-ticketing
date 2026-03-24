# Contracts: QA Test Scenarios

This feature adds test infrastructure only — no new API endpoints, no new
request/response schemas, no interface changes.

All tested contracts are the **existing** endpoints documented in previous
feature specs (001-event-ticket-booking through 004-core-ux-enhancements).

## Endpoints Under Test

| Method | Path | Spec Section |
|--------|------|-------------|
| POST | /bookings | Ticket Purchase, Invalid Purchase Attempts |
| POST | /bookings/:id/cancel | Booking Cancellation |
| GET | /events | Event Listing (filter validation) |
| GET | /events/:id | Event Details |
| POST | /events | Event Creation (tier management) |
| POST | /events/:id/cancel | Event Cancellation |
| PUT | /events/:id/tiers | Tier bulk sync |
| POST | /events/:id/tiers | Add tier |
| PATCH | /events/:id/tiers/:tierId | Update tier |
| DELETE | /events/:id/tiers/:tierId | Deactivate tier |
| POST | /waitlist | Join Waitlist |
| GET | /events/:id/manage | Organizer event details |
