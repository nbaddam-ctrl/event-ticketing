# Quickstart: In-App Notifications

**Branch**: `003-notifications` | **Date**: 2026-03-12

## Prerequisites

- Node.js (LTS)
- npm workspaces set up (`npm install` from repo root)
- Backend running (`npm run dev --workspace backend`)
- Frontend running (`npm run dev --workspace frontend`)

## New Files to Create

### Backend

| File | Purpose |
|------|---------|
| `backend/src/repositories/notificationRepository.ts` | SQLite queries for notifications CRUD |
| `backend/src/services/notificationService.ts` | Business logic: create, list, count, mark-read |
| `backend/src/api/routes/notificationRoutes.ts` | Express routes: GET /notifications, GET /unread-count, PATCH /:id/read, PATCH /read-all |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/services/notificationApi.ts` | API client wrapper for notification endpoints |
| `frontend/src/components/app/NotificationBell.tsx` | Bell icon + unread badge + 30s polling |
| `frontend/src/components/app/NotificationPanel.tsx` | Dropdown panel with notification list |
| `frontend/src/components/app/NotificationItem.tsx` | Single notification row with type icon, message, timestamp |

## Existing Files to Modify

### Backend

| File | Change |
|------|--------|
| `backend/src/db/schema.sql` | Add `notifications` table + indexes |
| `backend/src/domain/types.ts` | Add `Notification`, `NotificationType`, `NotificationReferenceType` types |
| `backend/src/app.ts` | Mount `/notifications` routes |
| `backend/src/services/organizerService.ts` | Add fire-and-forget notification after organizer request creation |
| `backend/src/services/adminOrganizerService.ts` | Add fire-and-forget notification after decision |
| `backend/src/services/bookingService.ts` | Add fire-and-forget notification after booking |
| `backend/src/services/organizerEventService.ts` | Add fire-and-forget notifications for all affected attendees after cancellation |
| `backend/src/services/waitlistService.ts` | Add fire-and-forget notification after waitlist promotion |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/components/app/Navigation.tsx` | Add `NotificationBell` component between nav items and user email |

## Database Schema Change

Add to `backend/src/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  reference_id TEXT,
  reference_type TEXT,
  navigation_path TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
```

Then restart the backend (the `migrate.ts` script runs `schema.sql` on startup).

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications?page=1&limit=20` | Required | List user's notifications (paginated) |
| GET | `/notifications/unread-count` | Required | Get unread count (lightweight, for polling) |
| PATCH | `/notifications/:id/read` | Required | Mark single notification as read |
| PATCH | `/notifications/read-all` | Required | Mark all user's notifications as read |

## Key Architectural Decisions

1. **Fire-and-forget creation**: Notification inserts happen OUTSIDE primary transactions. Wrap in try/catch, log warnings on failure.
2. **No WebSockets**: Frontend polls `/notifications/unread-count` every 30 seconds via `setInterval`.
3. **No deletion**: Users can only mark as read/unread. No DELETE endpoint in MVP.
4. **Polymorphic references**: `reference_id` + `reference_type` link to events, bookings, organizer_requests, or waitlist_entries without multiple FK columns.
5. **Acyclic dependencies**: `notificationService` is called BY other services, never imports them.

## Verification Steps

1. **Schema**: Restart backend → verify `notifications` table exists in SQLite
2. **Create notification**: Submit organizer request → verify notification row created for admin users
3. **List endpoint**: `GET /notifications` with JWT → returns paginated notifications
4. **Unread count**: `GET /notifications/unread-count` → returns `{ unreadCount: N }`
5. **Mark read**: `PATCH /notifications/:id/read` → returns 204, notification `is_read` = 1
6. **Mark all read**: `PATCH /notifications/read-all` → returns 204, all set to read
7. **UI bell**: Log in → see bell icon with badge count
8. **UI panel**: Click bell → dropdown shows notifications with correct icons and timestamps
9. **Polling**: Wait 30s → badge updates if new notifications exist
10. **Navigation**: Click notification → navigates to correct page
