# Implementation Plan: Core UX Enhancements

**Branch**: `004-core-ux-enhancements` | **Date**: 2026-03-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-core-ux-enhancements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add booking cancellation (with refund + inventory restore + waitlist promotion), event search & filtering (text, date range, price range with composable filters), organizer "My Events" list, enhanced My Bookings page, and cancelled-event display. The backend extends existing booking/event services and repositories with new cancel, search, and filter operations. The frontend adds a search/filter bar on the Events page, a cancel button with confirmation dialog on My Bookings, an organizer events table on the dashboard, and a cancellation banner on event detail pages for cancelled events.

## Technical Context

**Language/Version**: TypeScript ^5.8.2 (backend ES2022/NodeNext, frontend ESNext/Bundler)
**Primary Dependencies**: Express ^4.21.2, better-sqlite3 ^11.7.0, Zod ^3.24.2, jsonwebtoken ^9.0.2 (backend); React ^18.3.1, react-router-dom ^6.30.0, Vite ^6.2.1, Tailwind CSS ^3.4.19, lucide-react ^0.577.0 (frontend)
**Storage**: SQLite via better-sqlite3 (synchronous, single `db` instance, `withTransaction<T>` helper)
**Testing**: Jest ^29.7.0 (backend), Vitest ^3.0.8 (frontend)
**Target Platform**: Local development (Node.js server + Vite dev server)
**Project Type**: Web application (npm workspaces: `backend/` + `frontend/`)
**Performance Goals**: Event search/filter returns results in <1s for up to 1,000 events; booking cancellation completes in <500ms
**Constraints**: Synchronous SQLite — no async drivers; fire-and-forget notification creation; 300ms search debounce; prices stored as integer minor units (cents) internally, displayed as dollars in UI
**Scale/Scope**: Small-to-medium user base; 5 new/modified API endpoints; no new DB tables; ~8 modified backend files; ~6 modified/new frontend files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: UI scope is implemented with typed React
      components and no untyped production JavaScript paths.
      *Search bar, filter controls, cancel booking dialog, organizer events table, and cancelled-event banner will all be TypeScript React components with typed props, state, and API response types.*
- [x] **Node.js + Express Backend**: Backend scope is delivered through Express
      REST endpoints with validated request/response schemas.
      *POST /bookings/:id/cancel with Zod-validated request. GET /events enhanced with Zod-validated query parameters for search/filter. GET /organizer/events for organizer event list. getEventDetails modified to allow cancelled events.*
- [x] **Frontend/Backend Separation**: App boundaries remain isolated and all UI
      server interaction occurs via explicit API clients.
      *Frontend calls backend exclusively via apiClient.ts wrappers. New functions: cancelBooking() in attendeeApi.ts, updated listEvents() with filter params, new listOrganizerEvents() in organizerApi.ts. No direct DB access from frontend.*
- [x] **JWT Auth**: Protected endpoints include JWT validation, role/permission
      rules, and explicit 401/403 behavior.
      *POST /bookings/:id/cancel requires requireAuth + validates booking ownership (userId match). GET /organizer/events requires requireAuth + organizer/admin role. GET /events (search/filter) remains public. 401 for missing token, 404 for not-owned booking.*
- [x] **REST Semantics**: Endpoint design and status codes follow REST method
      intent and standardized error response contracts.
      *POST for cancellation action (state transition, not just update). GET with query params for search/filter. 200 for successful cancellation with body, 400 for validation errors, 401 for unauthenticated, 404 for not found/not owned, 409 for already cancelled.*
- [x] **Acyclic Dependencies**: Import and module dependency checks are defined to
      prevent circular dependencies in frontend/backend/shared code.
      *bookingService imports from discountRepository and waitlistService (existing leaf dependencies). No new circular paths — all new functions extend existing modules in the same dependency direction.*

## Project Structure

### Documentation (this feature)

```text
specs/004-core-ux-enhancements/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── routes/
│   │       ├── bookingRoutes.ts           # MODIFIED: Add POST /:id/cancel
│   │       ├── eventRoutes.ts             # MODIFIED: Add search/filter query params
│   │       └── organizerEventRoutes.ts    # MODIFIED: Add GET /events (organizer list)
│   ├── domain/
│   │   └── types.ts                       # MODIFIED: Add 'booking_cancelled' NotificationType
│   ├── repositories/
│   │   ├── bookingRepository.ts           # MODIFIED: Add cancelBookingAtomically, getBookingById
│   │   ├── discountRepository.ts          # MODIFIED: Add decrementDiscountUsage
│   │   └── eventRepository.ts            # MODIFIED: Add listFilteredEvents, listOrganizerEvents, countFilteredEvents
│   └── services/
│       ├── bookingService.ts              # MODIFIED: Add cancelBooking function
│       ├── eventService.ts                # MODIFIED: Add search/filter params to browseEvents, allow cancelled events in getEventDetails
│       └── organizerEventService.ts       # MODIFIED: Add listOrganizerEvents function
└── tests/

frontend/
├── src/
│   ├── components/
│   │   └── app/
│   │       └── EventSearchFilters.tsx     # NEW: Search bar + date/price filter controls
│   ├── pages/
│   │   ├── EventListPage.tsx              # MODIFIED: Integrate search/filter controls
│   │   ├── EventDetailsPage.tsx           # MODIFIED: Show cancelled events with banner
│   │   ├── MyBookingsPage.tsx             # MODIFIED: Add cancel button, sort by status, richer cards
│   │   └── OrganizerDashboardPage.tsx     # MODIFIED: Add organizer events list
│   └── services/
│       ├── attendeeApi.ts                 # MODIFIED: Add cancelBooking, update listEvents with filter params
│       └── organizerApi.ts                # MODIFIED: Add listOrganizerEvents
└── tests/
```

**Structure Decision**: Web application structure — matches existing `backend/` + `frontend/` workspace layout. Changes are primarily modifications to existing files with one new frontend component (`EventSearchFilters.tsx`). No new top-level directories required.

## Complexity Tracking

> No constitution violations identified. All six gates pass without deviation.
