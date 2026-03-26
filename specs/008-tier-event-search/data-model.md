# Data Model: Search Event by Name for Tier Management

**Feature**: 008-tier-event-search  
**Created**: 2026-03-26

## Schema Changes

**None.** This feature does not modify the database schema. The `events` table already has the `title` column used for search and the `organizer_id` column used for scoping.

## Existing Entities (Referenced)

### Event (events table)

| Field | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID, used to load tiers after selection |
| title | TEXT NOT NULL | Searched via LIKE for the event picker |
| description | TEXT | Also searchable (consistent with public search) |
| venue_name | TEXT NOT NULL | Displayed in dropdown items |
| start_at | TEXT NOT NULL | Displayed in dropdown items |
| end_at | TEXT NOT NULL | — |
| timezone | TEXT NOT NULL | — |
| status | TEXT NOT NULL | Displayed as badge in dropdown items |
| organizer_id | TEXT NOT NULL FK | Scopes search to the authenticated organizer |
| created_at | TEXT NOT NULL | Default sort order for suggestions |

### TicketTier (ticket_tiers table)

No changes. Loaded after event selection via existing `getOrganizerEventDetails(eventId)`.

## Query Pattern

The search adds a conditional WHERE clause to the existing organizer events query:

```sql
-- Without search (existing behavior preserved):
WHERE e.organizer_id = ?

-- With search:
WHERE e.organizer_id = ?
  AND (e.title LIKE ? OR e.description LIKE ?)
```

Parameters: `organizerId`, `%search%`, `%search%`

This matches the pattern already used in `buildFilterClauses()` for the public event browse.
