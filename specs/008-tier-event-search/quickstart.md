# Quickstart: Search Event by Name for Tier Management

**Feature**: 008-tier-event-search  
**Branch**: `008-tier-event-search`

---

## Prerequisites

- Node.js 18+ and npm
- Repository cloned and on the `008-tier-event-search` branch

## Setup

```bash
# From repository root
git checkout 008-tier-event-search

# Install dependencies
npm install

# Initialize database (if not already done)
npm run db:migrate --workspace backend
npm run db:seed --workspace backend

# Start backend
npm run dev --workspace backend

# Start frontend (separate terminal)
npm run dev --workspace frontend
```

## Key Development Commands

```bash
# Backend
npm run dev --workspace backend          # Dev server with hot reload
cd backend && npx tsc --noEmit           # Type check
npm run lint --workspace backend         # Lint
npm run test --workspace backend         # Run tests

# Frontend
npm run dev --workspace frontend         # Dev server with hot reload
cd frontend && npx tsc --noEmit          # Type check
npm run lint --workspace frontend        # Lint
npm run build --workspace frontend       # Production build

# Both
npm run lint:cycles                      # Circular dependency check
```

## Testing the Feature

### Backend (API)

1. Start the backend: `npm run dev --workspace backend`
2. Log in as an organizer to get a JWT token
3. Test search: `GET /api/events/mine?search=concert` with the JWT in `Authorization: Bearer <token>`
4. Verify filtered results are returned
5. Test without search: `GET /api/events/mine` — should return all events (backward compatible)

### Frontend (UI)

1. Start both backend and frontend
2. Log in as an organizer
3. Navigate to the Organizer Dashboard
4. In the "Tier Management" card, type a partial event name in the search field
5. Verify a dropdown appears with matching events (title, date, status badge)
6. Select an event → verify tiers load into the editor
7. Clear the search → verify the panel resets

## Architecture Notes

### Modified Files

| File | Change |
|------|--------|
| `backend/src/repositories/eventRepository.ts` | Add optional `search` param to `listOrganizerEvents` and `countOrganizerEvents` |
| `backend/src/services/organizerEventService.ts` | Pass `search` through `listOrganizerEventsForUser` |
| `backend/src/api/routes/eventRoutes.ts` | Parse optional `search` query param in `GET /mine` route |
| `frontend/src/services/organizerApi.ts` | Add `search` param to `listOrganizerEvents` function |
| `frontend/src/components/TierManagementPanel.tsx` | Replace UUID input with search-and-select dropdown |

### Patterns Used

- **SQL search**: Same `LIKE '%search%'` pattern as public event browse
- **Zod validation**: Same Zod query schema pattern as `browseQuerySchema`
- **Debounce**: Same 300ms `setTimeout` debounce as `EventListPage.tsx`
- **No new dependencies**: All changes use existing libraries and patterns
