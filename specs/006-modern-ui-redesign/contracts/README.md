# Contracts: Modern UI Redesign

This feature is **frontend-only** — it does not introduce, modify, or remove any backend API endpoints, request/response schemas, or external interfaces.

## Existing Contracts (unchanged)

The frontend continues to consume the following existing backend REST endpoints with no changes:

| Area | Endpoints | Status |
|------|-----------|--------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Unchanged |
| Events (attendee) | `GET /api/events`, `GET /api/events/:id` | Unchanged |
| Bookings (attendee) | `POST /api/bookings`, `GET /api/bookings/mine`, `PATCH /api/bookings/:id/cancel` | Unchanged |
| Waitlist | `POST /api/events/:id/waitlist`, `GET /api/events/:id/waitlist/status` | Unchanged |
| Organizer | `GET /api/organizer/events`, `POST /api/organizer/events`, `POST /api/organizer/request-role` | Unchanged |
| Organizer Events | `POST /api/organizer/events/:id/cancel`, `POST /api/organizer/events/:id/tiers`, `PUT /api/organizer/events/:id/tiers/:tierId`, `DELETE /api/organizer/events/:id/tiers/:tierId` | Unchanged |
| Discounts (attendee) | `POST /api/events/:eventId/discounts/validate` | Unchanged |
| Admin | `GET /api/admin/organizer-requests`, `PATCH /api/admin/organizer-requests/:id` | Unchanged |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` | Unchanged |
| Health | `GET /health` | Unchanged |

## New Interfaces

**None.** This is a visual-only redesign within the frontend workspace.

## localStorage Contract (new)

| Key | Values | Default | Purpose |
|-----|--------|---------|---------|
| `theme` | `'light'` \| `'dark'` \| `'system'` | absent (treated as `'system'`) | Persist user's color mode preference |
