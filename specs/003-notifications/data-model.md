# Data Model: In-App Notifications

**Branch**: `003-notifications` | **Date**: 2026-03-12

## Entities

### Notification

Represents a single persistent in-app notification addressed to a specific user.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT (UUID v4) | PRIMARY KEY | Unique notification identifier |
| user_id | TEXT (UUID v4) | NOT NULL, FK → users(id) | Recipient user |
| type | TEXT | NOT NULL | Notification type discriminator (see enum below) |
| title | TEXT | NOT NULL | Short human-readable title (e.g., "New Organizer Request") |
| message | TEXT | NOT NULL | Detailed notification body |
| is_read | INTEGER | NOT NULL DEFAULT 0 | Read status (0 = unread, 1 = read) |
| reference_id | TEXT | NULL | Polymorphic reference to related entity ID |
| reference_type | TEXT | NULL | Type of referenced entity (`event`, `booking`, `organizer_request`, `waitlist_entry`) |
| navigation_path | TEXT | NULL | Frontend route path for click-through navigation |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp of notification creation |
| read_at | TEXT | NULL | ISO 8601 timestamp when marked as read |

#### SQL Definition

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

#### Indexes

- **idx_notifications_user_unread**: Composite index on `(user_id, is_read, created_at DESC)` — optimizes the unread count query and filtered listing.
- **idx_notifications_user_created**: Composite index on `(user_id, created_at DESC)` — optimizes the paginated list query for all notifications.

### NotificationType (Enum)

Categorization of notification types that determines visual treatment and creation context.

| Value | Trigger | Recipient | Reference Type |
|-------|---------|-----------|----------------|
| `organizer_request_submitted` | User submits organizer role request | All admin users | `organizer_request` |
| `organizer_request_approved` | Admin approves organizer request | Requesting user | `organizer_request` |
| `organizer_request_rejected` | Admin rejects organizer request | Requesting user | `organizer_request` |
| `booking_confirmed` | User completes ticket purchase | Booking user | `booking` |
| `event_cancelled` | Organizer/admin cancels event | Each attendee with confirmed booking | `event` |
| `waitlist_promoted` | Waitlisted user promoted when capacity opens | Promoted user | `waitlist_entry` |
| `waitlist_expired` | Waitlist reservation expires unused | Affected user | `waitlist_entry` |

## Relationships

```
users (1) ──── (N) notifications
  └─ user_id FK

notifications ···· (0..1) events          [via reference_id WHERE reference_type = 'event']
notifications ···· (0..1) bookings         [via reference_id WHERE reference_type = 'booking']
notifications ···· (0..1) organizer_requests [via reference_id WHERE reference_type = 'organizer_request']
notifications ···· (0..1) waitlist_entries  [via reference_id WHERE reference_type = 'waitlist_entry']
```

**Note**: Polymorphic references (dashed lines) are not enforced by FK constraints. Data integrity is maintained by the notification service, which only creates references from verified entity IDs.

## Validation Rules

### Creation (Backend — notificationService)

| Field | Rule |
|-------|------|
| user_id | Must be a valid existing user ID |
| type | Must be one of the 7 defined NotificationType values |
| title | Non-empty string, max 200 characters |
| message | Non-empty string, max 2000 characters |
| reference_id | Optional; if provided, reference_type must also be provided |
| reference_type | Optional; must be one of: `event`, `booking`, `organizer_request`, `waitlist_entry` |
| navigation_path | Optional; if provided, must start with `/` |

### Update (Backend — mark as read)

| Field | Rule |
|-------|------|
| is_read | Set to 1 |
| read_at | Set to current ISO 8601 timestamp |

### Query (Backend — list notifications)

| Parameter | Rule |
|-----------|------|
| page | Integer ≥ 1, default 1 |
| limit | Integer 1–50, default 20 |
| user_id | Extracted from JWT claims (not user-supplied) |

## State Transitions

```
                  mark as read
  UNREAD ─────────────────────────► READ
  (is_read=0, read_at=NULL)         (is_read=1, read_at=timestamp)
```

Notifications are created in the `UNREAD` state. The only state transition is `UNREAD → READ`. There is no deletion or archival in MVP (per Clarification Q3).

## TypeScript Types

### Backend (domain/types.ts)

```typescript
export type NotificationType =
  | 'organizer_request_submitted'
  | 'organizer_request_approved'
  | 'organizer_request_rejected'
  | 'booking_confirmed'
  | 'event_cancelled'
  | 'waitlist_promoted'
  | 'waitlist_expired';

export type NotificationReferenceType =
  | 'event'
  | 'booking'
  | 'organizer_request'
  | 'waitlist_entry';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  referenceType: NotificationReferenceType | null;
  navigationPath: string | null;
  createdAt: string;
  readAt: string | null;
}
```

### Frontend (mirrored type)

```typescript
export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  referenceType: string | null;
  navigationPath: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
```
