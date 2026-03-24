# Research: Core UX Enhancements

**Feature**: 004-core-ux-enhancements
**Date**: 2026-03-17
**Status**: Complete

## R1: Booking Cancellation Transaction Design

**Decision**: Use `withTransaction()` for the atomic portion (update booking status → restore tier inventory → create refund → decrement discount usage), then trigger waitlist promotion and notification as fire-and-forget outside the transaction.

**Rationale**: Follows the existing pattern from `cancelOrganizerEvent` in `organizerEventService.ts`, where the transaction handles data mutations and notifications happen outside. The `createBookingAtomically` function in `bookingRepository.ts` already demonstrates the `withTransaction` wrapper for booking operations. Keeping waitlist promotion outside the transaction mirrors `promoteWaitlistForTier`'s existing non-transactional design.

**Alternatives considered**:
- All-in-one transaction (including notifications): Rejected — notification failures would roll back the cancellation, violating fire-and-forget principle.
- No transaction (sequential updates): Rejected — partial failures could leave inventory inconsistent (e.g., booking cancelled but tier not updated).

## R2: Dynamic SQL Query Building for Event Search/Filter

**Decision**: Build SQL queries with conditional WHERE clauses using parameterized array construction. Each filter appends a condition and its parameter(s) to arrays, which are joined with `AND` to form the final query. Use SQLite `LIKE` with `%` wildcards for text search.

**Rationale**: better-sqlite3 uses `?` placeholders and `.all(...params)`. Building WHERE clauses dynamically with an array of conditions and parameters is the standard pattern for SQLite query builders without an ORM. The existing codebase uses direct `db.prepare()` calls, so this maintains consistency.

**Pattern**:
```typescript
const conditions: string[] = ["status = 'published'"];
const params: unknown[] = [];

if (search) {
  conditions.push("(title LIKE ? OR description LIKE ?)");
  params.push(`%${search}%`, `%${search}%`);
}
if (dateFrom) {
  conditions.push("start_at >= ?");
  params.push(dateFrom);
}
// ...
const where = conditions.join(' AND ');
db.prepare(`SELECT ... FROM events WHERE ${where} ...`).all(...params);
```

**Alternatives considered**:
- Query builder library (knex, kysely): Rejected — adds a dependency when the project uses direct better-sqlite3 queries throughout.
- Client-side filtering: Rejected — doesn't scale with event count; server should filter for pagination correctness.

## R3: Price Filtering via Subquery

**Decision**: Use an `EXISTS` subquery to filter events by tier price range. This avoids duplicating event rows from a JOIN when multiple tiers match.

**Rationale**: An event has multiple tiers. A simple JOIN would return duplicate event rows. EXISTS is semantically correct ("has at least one tier in range") and efficient for SQLite.

**Pattern**:
```sql
AND EXISTS (
  SELECT 1 FROM ticket_tiers
  WHERE ticket_tiers.event_id = events.id
    AND ticket_tiers.status = 'active'
    AND ticket_tiers.price_minor >= ?    -- minPrice (in minor units)
    AND ticket_tiers.price_minor <= ?    -- maxPrice (in minor units)
)
```

**Alternatives considered**:
- JOIN with DISTINCT: Rejected — less efficient, requires deduplication.
- Separate query for tier filtering then intersect IDs: Rejected — more complex, two roundtrips.

## R4: Default Upcoming Events Filter

**Decision**: Add a `includePast` boolean query parameter to `GET /events` (default: `false`). When `false`, add `start_at >= ?` with today's date (ISO string) to the WHERE clause. Frontend passes `includePast=true` when the toggle is enabled.

**Rationale**: SQLite stores dates as TEXT in ISO 8601 format, which sorts lexicographically correctly. Comparing `start_at >= '2026-03-17T00:00:00.000Z'` works correctly for date filtering. The default-false behavior ensures backward compatibility (existing clients see only upcoming events).

**Alternatives considered**:
- Frontend-only filtering: Rejected — pagination would be incorrect if server returns past events that are filtered out client-side.
- Default true (show all): Rejected — contradicts clarification answer requiring upcoming-only default.

## R5: Frontend Search Debounce Pattern

**Decision**: Use a custom `useDebounce` hook (or inline `useEffect` + `setTimeout`) with 300ms delay. The search/filter state lives in the `EventListPage` component and is passed to the API call. Filter UI is extracted into an `EventSearchFilters` component that communicates via callback props.

**Rationale**: React's `useEffect` with cleanup is the standard pattern for debounced API calls. 300ms matches FR-010 requirement. A separate filter component promotes reusability and follows the project's component architecture.

**Pattern**:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

useEffect(() => {
  // Fetch with debouncedSearch + other filter state
  listEvents({ search: debouncedSearch, dateFrom, dateTo, minPrice, maxPrice, includePast });
}, [debouncedSearch, dateFrom, dateTo, minPrice, maxPrice, includePast, page]);
```

**Alternatives considered**:
- lodash.debounce: Rejected — adds dependency; native `setTimeout` is sufficient.
- Server-side debounce: Not applicable — debounce must happen client-side.
- URL search params sync: Rejected for MVP — can be added later for shareable filtered URLs.

## R6: Refund Reason Extension

**Decision**: Modify `createRefundRequest` in `refundRepository.ts` to accept an optional `reason` parameter (default: `'event_cancelled'`). Pass `'user_cancelled'` when creating refunds from booking cancellation.

**Rationale**: The `refunds.reason` column is already `TEXT NOT NULL DEFAULT 'event_cancelled'`. By accepting the reason as a parameter, the same function serves both event-cancellation refunds and user-initiated booking cancellation refunds.

**Alternatives considered**:
- Separate `createUserRefundRequest` function: Rejected — unnecessary duplication; only the reason differs.
- Enum column: Not needed — SQLite doesn't enforce enums; TEXT with application-level validation is consistent with the project.

## R7: Discount Usage Decrement

**Decision**: Add a `decrementDiscountUsage(discountCodeId: string)` function to `discountRepository.ts`, mirroring the existing `incrementDiscountUsage`. Guard against negative values with `MAX(0, used_count - 1)`.

**Rationale**: No decrement function exists. The booking cancellation spec requires restoring discount usage (FR-006). The decrement should be safe (clamp to 0) in case of data inconsistencies.

**Pattern**:
```sql
UPDATE discount_codes SET used_count = MAX(0, used_count - 1) WHERE id = ?
```

**Alternatives considered**:
- Ignore discount restoration: Rejected — contradicts FR-006 and could permanently exhaust discount codes.
- Full revalidation: Rejected — overengineered; simple decrement is sufficient and follows the increment pattern.

## R8: Booking Cancellation — Past Event Check

**Decision**: Compare the event's `start_at` timestamp to `new Date().toISOString()` before allowing cancellation. If the event has already started, return `400 BAD_REQUEST`.

**Rationale**: FR-002 requires rejecting cancellation for events that have already started. ISO 8601 string comparison works correctly since all dates are stored in UTC ISO format.

**Alternatives considered**:
- Allow cancellation anytime: Rejected — contradicts spec requirement and edge case.
- Grace period (e.g., 1 hour after start): Rejected — not specified; keep it simple.

## R9: My Bookings Sorting

**Decision**: Sort bookings server-side by a custom order: `confirmed` first, then `cancelled`, then `refunded`, then `pending`. Use a SQL `CASE` expression for ordering.

**Rationale**: FR-019 requires confirmed bookings to appear before cancelled/refunded. Server-side sorting ensures paginated results are correctly ordered.

**Pattern**:
```sql
ORDER BY CASE status
  WHEN 'confirmed' THEN 1
  WHEN 'pending' THEN 2
  WHEN 'cancelled' THEN 3
  WHEN 'refunded' THEN 4
  ELSE 5
END, created_at DESC
```

**Alternatives considered**:
- Client-side sorting: Rejected — won't work with pagination.
- Separate queries per status: Rejected — unnecessary complexity.

## R10: Organizer Events Endpoint

**Decision**: Add `GET /events/mine` to the existing organizer event routes (mounted at `/events` in app.ts via `organizerEventRoutes`). This returns all events for the authenticated organizer, regardless of status, paginated and ordered by `created_at DESC`. Include tier aggregates (total capacity, total sold) computed via a subquery.

**Rationale**: The organizer already has routes at `/events/` for creating and cancelling events. Adding a GET to list their own events follows the same resource pattern. Including tier aggregates avoids N+1 queries.

**Pattern**:
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

**Alternatives considered**:
- Separate `/organizer/events` route: Rejected — the project already organizes organizer event actions under `organizerEventRoutes` mounted at `/events`.
- Reuse `GET /events` with a query parameter: Rejected — `/events` is public; mixing public browse with organizer-specific listing adds complexity.
