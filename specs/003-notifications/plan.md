# Implementation Plan: In-App Notifications

**Branch**: `003-notifications` | **Date**: 2026-03-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-notifications/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add persistent in-app notifications across the event ticketing system. A new `notifications` SQLite table stores per-user notifications triggered by backend service operations (organizer requests, admin decisions, bookings, cancellations, waitlist promotions/expiry). The backend exposes REST endpoints for listing, counting unread, and marking notifications as read. The frontend adds a notification bell with unread badge in the navigation bar with a dropdown panel, polling the unread count every 30 seconds. Notification creation is fire-and-forget — failures are logged but never block the primary operation.

## Technical Context

**Language/Version**: TypeScript ^5.8.2 (backend ES2022/NodeNext, frontend ESNext/Bundler)  
**Primary Dependencies**: Express ^4.21.2, better-sqlite3 ^11.7.0, Zod ^3.24.2, jsonwebtoken ^9.0.2 (backend); React ^18.3.1, react-router-dom ^6.30.0, Vite ^6.2.1, Tailwind CSS ^3.4.19, lucide-react ^0.577.0 (frontend)  
**Storage**: SQLite via better-sqlite3 (synchronous, single `db` instance, `withTransaction` helper)  
**Testing**: Jest ^29.7.0 (backend), Vitest ^3.0.8 (frontend)  
**Target Platform**: Local development (Node.js server + Vite dev server)  
**Project Type**: Web application (npm workspaces: `backend/` + `frontend/`)  
**Performance Goals**: Notification panel renders in <2s for up to 50 notifications; unread count endpoint responds in <100ms  
**Constraints**: Synchronous SQLite — no async drivers; fire-and-forget notification creation; 30s polling interval (no WebSockets)  
**Scale/Scope**: Small-to-medium user base; 7 notification types; ~4 new API endpoints; 1 new DB table; ~6 new/modified frontend components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: UI scope is implemented with typed React
      components and no untyped production JavaScript paths.
      *Notification bell, badge, dropdown panel, and notification item components will all be TypeScript React components with typed props, state, and API response types.*
- [x] **Node.js + Express Backend**: Backend scope is delivered through Express
      REST endpoints with validated request/response schemas.
      *Four new Express routes (GET /notifications, GET /notifications/unread-count, PATCH /notifications/:id/read, PATCH /notifications/read-all) with Zod-validated request params and typed responses. Notification creation via a dedicated service module with Zod schemas.*
- [x] **Frontend/Backend Separation**: App boundaries remain isolated and all UI
      server interaction occurs via explicit API clients.
      *Frontend consumes notifications exclusively through apiClient.ts calls to backend REST endpoints. No direct DB access from frontend. Notification creation is purely backend-side.*
- [x] **JWT Auth**: Protected endpoints include JWT validation, role/permission
      rules, and explicit 401/403 behavior.
      *All notification endpoints require requireAuth middleware. Users can only access their own notifications (user ID from JWT claims). Admin-targeted notifications are filtered by role on creation, not on read. 401 for missing/invalid token, 403 not needed (users only see own data).*
- [x] **REST Semantics**: Endpoint design and status codes follow REST method
      intent and standardized error response contracts.
      *GET for reads, PATCH for partial updates (read status). 200 for list/count, 204 for mark-as-read, 401 for unauthenticated, 404 for notification not found or not owned. Consistent ApiError contract.*
- [x] **Acyclic Dependencies**: Import and module dependency checks are defined to
      prevent circular dependencies in frontend/backend/shared code.
      *notificationService is a leaf dependency — existing services call it, but it does not import any other service. notificationRepository depends only on db/client. Frontend notification components depend on apiClient only. No cycles introduced.*

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │       └── notificationRoutes.ts    # NEW: GET /notifications, GET /unread-count, PATCH /:id/read, PATCH /read-all
│   ├── db/
│   │   └── schema.sql                   # MODIFIED: Add notifications table
│   ├── domain/
│   │   └── types.ts                     # MODIFIED: Add Notification, NotificationType types
│   ├── repositories/
│   │   └── notificationRepository.ts    # NEW: CRUD for notifications table
│   └── services/
│       ├── notificationService.ts       # NEW: createNotification, getNotifications, markRead, markAllRead, getUnreadCount
│       ├── organizerService.ts          # MODIFIED: Call notificationService after request creation
│       ├── adminOrganizerService.ts     # MODIFIED: Call notificationService after decision
│       ├── bookingService.ts            # MODIFIED: Call notificationService after booking
│       ├── organizerEventService.ts     # MODIFIED: Call notificationService after cancellation
│       └── waitlistService.ts           # MODIFIED: Call notificationService after promotion/expiry
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── app/
│   │   │   ├── NotificationBell.tsx     # NEW: Bell icon with unread count badge
│   │   │   ├── NotificationPanel.tsx    # NEW: Dropdown panel with notification list
│   │   │   ├── NotificationItem.tsx     # NEW: Individual notification row
│   │   │   └── Navigation.tsx           # MODIFIED: Add NotificationBell to nav
│   │   └── ui/
│   ├── services/
│   │   └── notificationApi.ts           # NEW: API client functions for notification endpoints
│   └── pages/
└── tests/
```

**Structure Decision**: Web application structure (Option 2) — matches existing `backend/` + `frontend/` workspace layout. New files follow established patterns: repository → service → routes (backend), apiClient → components (frontend). No new top-level directories required.

## Complexity Tracking

> No constitution violations identified. All six gates pass without deviation.
