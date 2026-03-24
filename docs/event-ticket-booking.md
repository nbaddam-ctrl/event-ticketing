# Event Ticket Booking Delivery Notes

## Scope Delivered

- Attendee MVP (US1): registration/login, event browse/details, checkout booking with oversell prevention.
- Organizer/admin management (US2): organizer role request, admin decision endpoint/UI, event creation and cancellation with refund request creation.
- Waitlist and discounts (US3): waitlist enrollment, FIFO promotion service with 30-minute hold, discount validation and one-code checkout enforcement.

## Backend Architecture Notes

- API stack: Node.js + Express with Zod request validation and centralized error handling.
- Persistence: SQLite via `better-sqlite3` with transactional booking updates.
- AuthN/AuthZ: JWT bearer tokens with role checks (`attendee`, `organizer`, `admin`).
- Resilience/observability: error responses include correlation IDs and the same ID is emitted in server logs.

## Frontend Architecture Notes

- React + TypeScript + React Router structure with page-level route organization.
- Shared API client with persisted auth token and role-aware route guards.
- Organizer/admin workflows exposed through dedicated pages/components.
- Checkout now supports discount validation and sold-out waitlist enrollment from event details.

## Contract and Operations

- OpenAPI contract synchronized to implementation response fields/endpoints in `specs/001-event-ticket-booking/contracts/openapi.yaml`.
- Quickstart runbook updated and executed with validation checklist evidence.
- Root quality gates (`lint`, `lint:cycles`, `test`) are passing in current workspace state.

## Known Gaps

- Automated contract/integration tests are still absent; current test commands pass with `--passWithNoTests`.
- Waitlist promotion lifecycle currently exists at service layer but is not yet wired to automated inventory-release triggers.
