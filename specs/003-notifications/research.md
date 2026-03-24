# Research: In-App Notifications

**Branch**: `003-notifications` | **Date**: 2026-03-12

## 1. Notification Storage Strategy

**Decision**: Single `notifications` SQLite table with TEXT columns following existing schema conventions.

**Rationale**: The project uses better-sqlite3 (synchronous) with TEXT primary keys (UUID v4), TEXT timestamps (ISO 8601), and snake_case column naming. A single table with a `type` discriminator column is simpler than multiple tables and supports the 7 notification types defined in the spec. All existing tables follow this pattern (e.g., `organizer_requests`, `bookings`).

**Alternatives considered**:
- **Separate tables per notification type**: Rejected — adds schema complexity with no benefit for a single-entity read pattern.
- **JSON blob for notification metadata**: Rejected — while flexible, it prevents SQL filtering by type and breaks the project's strict relational pattern.
- **In-memory only**: Rejected — spec requires persistence across sessions (FR-003).

## 2. Notification Creation Pattern (Fire-and-Forget)

**Decision**: Wrap notification creation in a try/catch within existing service functions. On failure, log a warning and continue. No background job queue.

**Rationale**: The spec explicitly states (A-006, Clarification Q4) that notification creation is fire-and-forget — primary operations must never fail due to notification issues. Since better-sqlite3 is synchronous and single-threaded, the notification insert happens in the same call stack. The `withTransaction` helper is already used for atomic operations — notification inserts should happen OUTSIDE the primary transaction to prevent rollback of the primary operation on notification failure.

**Alternatives considered**:
- **Inside the same transaction**: Rejected — if notification insert fails, it would roll back the primary operation (violates A-006).
- **Background job queue (Bull, Agenda)**: Rejected — over-engineering for synchronous SQLite + fire-and-forget semantics. No Redis or job infrastructure exists.
- **Event emitter pattern**: Rejected — adds indirection without clear benefit given the synchronous, single-process architecture. Direct function calls are simpler and match existing patterns.

## 3. Notification Delivery to Multiple Recipients (Admin Broadcast)

**Decision**: When an organizer request is submitted, query all admin users and insert one notification row per admin. Use a helper function `createNotificationsForAdmins(type, payload)` that internally fetches admin user IDs.

**Rationale**: FR-006 requires all admin users receive the notification. The `users` table has a `roles` TEXT column containing comma-separated roles. Querying `WHERE roles LIKE '%admin%'` retrieves all admins. With a small admin count, inserting individual rows in a loop is acceptable. This matches the edge case that "both admins receive the notification independently."

**Alternatives considered**:
- **Single notification with "admin" as recipient (fan-out on read)**: Rejected — complicates read queries and read/unread tracking per user.
- **Notification groups/channels**: Rejected — over-engineering for MVP with a small fixed set of admin users.

## 4. Polling vs. Real-Time Updates

**Decision**: Frontend polls `GET /notifications/unread-count` every 30 seconds using `setInterval` in the NotificationBell component. Full notification list is fetched only when the panel is opened.

**Rationale**: Spec clarification explicitly chose 30-second polling (A-002). The unread count endpoint is lightweight (single SQL `COUNT` query). Full list fetch occurs only on user action (opening the panel), minimizing unnecessary data transfer.

**Alternatives considered**:
- **WebSockets / Server-Sent Events**: Rejected by spec decision — not needed for MVP.
- **Shorter polling interval (5-10s)**: Rejected — 30s was explicitly chosen to balance freshness vs. server load.
- **No polling (refresh only)**: Rejected — spec requires notifications to surface without manual page refresh.

## 5. Pagination Strategy

**Decision**: Cursor-based pagination couldn't leverage a sortable unique column effectively with TEXT UUIDs. Use offset-based pagination with `LIMIT/OFFSET` on the notifications query, ordered by `created_at DESC, id DESC`.

**Rationale**: FR-012 requires pagination. The existing codebase does not have pagination on any current endpoint, so there's no established pattern to follow. Offset-based is simplest for a dropdown panel with "Load more" UX. For the expected notification volumes (tens to low hundreds per user), offset performance is not a concern with SQLite.

**Alternatives considered**:
- **Cursor-based (keyset) pagination**: Considered but adds complexity for marginal benefit at this scale. TEXT UUID is not naturally sortable, would need composite cursor on `(created_at, id)`.
- **No pagination (load all)**: Rejected — spec explicitly requires pagination (FR-012) and edge cases mention "hundreds of notifications."

## 6. Notification Data Shape and Reference Fields

**Decision**: Each notification stores: `id`, `user_id`, `type`, `title`, `message`, `is_read`, `reference_id`, `reference_type`, `navigation_path`, `created_at`, `read_at`. The `reference_id` + `reference_type` pair allows linking to related entities (events, bookings, organizer requests) without foreign keys.

**Rationale**: FR-018 requires click-through navigation to contextual pages. Storing `navigation_path` (e.g., `/admin/organizer-requests`, `/my-bookings`) directly avoids frontend logic to derive paths from type. The `reference_id` + `reference_type` pair is a polymorphic reference pattern that avoids multiple nullable foreign key columns.

**Alternatives considered**:
- **Multiple nullable FK columns (event_id, booking_id, request_id)**: Rejected — only one is non-null per notification, creating sparse columns. Polymorphic reference is cleaner.
- **No reference fields**: Rejected — needed for navigation and future features (e.g., showing related entity details).
- **Foreign key constraints on reference_id**: Rejected — polymorphic references can't have FK constraints. Data integrity is maintained by the notification service creating references from verified entities.

## 7. Frontend Component Architecture

**Decision**: Three new components: `NotificationBell` (icon + badge + click handler), `NotificationPanel` (dropdown with list + "mark all read"), `NotificationItem` (single notification row). A new `notificationApi.ts` service module for API calls.

**Rationale**: Follows existing component patterns — app-level components in `components/app/`, API functions in `services/`. The bell integrates into the existing `Navigation` component between the nav items and the user email/logout section. The panel renders as an absolute-positioned dropdown below the bell, consistent with common notification UX patterns.

**Alternatives considered**:
- **Separate notifications page**: Rejected for MVP — dropdown panel is sufficient and more discoverable. A full page could be added later.
- **React Context for notification state**: Considered but unnecessary — the NotificationBell component owns the polling state and passes data down. No deep prop drilling needed since the notification UI is localized to the navigation area.
- **Global state manager (Zustand/Redux)**: Rejected — project uses React Context sparingly and component-local state for most features.

## 8. Notification Type Visual Indicators

**Decision**: Map each notification type to a lucide-react icon and Tailwind color class. The mapping is a static TypeScript object in the NotificationItem component.

**Rationale**: FR-017 requires distinct visual indicators per type. lucide-react is already installed and used throughout the project. A simple type→icon/color map is the most maintainable approach.

| Type | Icon | Color |
|------|------|-------|
| organizer_request_submitted | UserCheck | blue |
| organizer_request_approved | CheckCircle | green |
| organizer_request_rejected | XCircle | red |
| booking_confirmed | Ticket | green |
| event_cancelled | AlertTriangle | red |
| waitlist_promoted | ArrowUpCircle | blue |
| waitlist_expired | Clock | amber |

## 9. Relative Timestamp Display

**Decision**: Implement a lightweight `formatRelativeTime(isoString: string): string` utility in the frontend. No external library.

**Rationale**: FR-016 requires relative timestamps ("5 minutes ago", "2 hours ago"). The logic is simple (compare current time to notification time, pick the largest unit). Adding a dependency like `date-fns` or `dayjs` for one function is unnecessary. The existing project has no date formatting library.

**Alternatives considered**:
- **Intl.RelativeTimeFormat**: Viable native browser API, but its output is less controllable and requires manual unit selection logic anyway.
- **date-fns/dayjs**: Rejected — adds a dependency for a single utility function.

## 10. Schema Migration Approach

**Decision**: Add the `CREATE TABLE IF NOT EXISTS notifications` statement to the existing `schema.sql` file. The `migrate.ts` script reads and executes `schema.sql` on startup.

**Rationale**: The project uses a simple migration approach — `schema.sql` contains all `CREATE TABLE IF NOT EXISTS` statements, and `migrate.ts` runs them. Since `IF NOT EXISTS` is idempotent, adding the new table definition is safe for existing databases.

**Alternatives considered**:
- **Separate migration files**: The project doesn't use a migration framework (no Knex, Prisma, etc.). Adding one for a single table change is over-engineering.
- **Manual ALTER TABLE**: Not needed since `CREATE TABLE IF NOT EXISTS` is the established pattern.
