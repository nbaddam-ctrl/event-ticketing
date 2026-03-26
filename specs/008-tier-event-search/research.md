# Research: Search Event by Name for Tier Management

**Feature**: 008-tier-event-search  
**Created**: 2026-03-26

## Research Questions Resolved

### R1: How does the existing public event search work?

**Decision**: Replicate the same LIKE pattern on `e.title` (and `e.description`) already used in `listFilteredEvents()`.

**Rationale**: The public browse endpoint already implements `WHERE (e.title LIKE ? OR e.description LIKE ?)` with `%search%` wrapping — this is proven, tested, and consistent.

**Alternatives considered**:
- Full-text search (FTS5) — rejected, overkill for a small-scale title search
- COLLATE NOCASE exact match — rejected, users expect partial matching

### R2: How should the backend API be extended?

**Decision**: Add an optional `search` query parameter to the existing `GET /events/mine` endpoint. Use a Zod schema (like the existing `browseQuerySchema` on `GET /events/`) for consistent validation.

**Rationale**: Extending the existing endpoint is simpler than creating a new one. The Zod schema pattern is already used on the public browse route. This keeps the API footprint small.

**Alternatives considered**:
- New dedicated `GET /events/mine/search?q=` endpoint — rejected, unnecessary complexity for one query param
- Reuse the public browse endpoint with an `organizer=me` filter — rejected, would require refactoring auth scoping

### R3: Where should the search input go in the UI?

**Decision**: Replace the "Event ID" text input + "Load" button in `TierManagementPanel.tsx` with an inline search input + dropdown. No new component file needed — the search UI is internal to the panel.

**Rationale**: The tier management panel is the only consumer of this search. Extracting to a separate component would be premature since no other panel needs an organizer event picker.

**Alternatives considered**:
- Move event search to the "My Events" table and make rows clickable to open tier editing — rejected, larger UX change outside the spec scope
- Create a reusable `EventPicker` component — rejected, no second consumer exists

### R4: How should the debounce work?

**Decision**: Use the same `useState` + `useEffect` + `setTimeout(300ms)` debounce pattern already used in `EventListPage.tsx`.

**Rationale**: Consistent with existing codebase, no new dependencies, simple and proven.

**Alternatives considered**:
- `useDeferredValue` (React 18) — rejected, not a true debounce (still sends requests on every render)
- Third-party `use-debounce` library — rejected, adds unnecessary dependency

### R5: Repository function signature approach?

**Decision**: Add an optional `search?: string` parameter directly to `listOrganizerEvents(organizerId, page, pageSize, search?)` and `countOrganizerEvents(organizerId, search?)`. Build the SQL conditionally.

**Rationale**: Simpler than introducing a separate `OrganizerEventFilters` interface for a single optional field. If more filters are needed later, the interface can be extracted then.

**Alternatives considered**:
- Create an `OrganizerEventFilters` type matching the `EventFilters` pattern — rejected, over-engineering for one field
- Separate `searchOrganizerEvents` function — rejected, duplicates most of the query logic

### R6: Dropdown behavior on empty focus?

**Decision**: When the search field receives focus with an empty value, show the 5 most recent events. This reuses the same API call (`listOrganizerEvents(1, 5, '')`) which returns the default sorted results.

**Rationale**: Provides immediate value without extra API work. Common UX pattern in search inputs.
