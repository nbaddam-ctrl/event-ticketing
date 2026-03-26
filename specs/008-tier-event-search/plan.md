# Implementation Plan: Search Event by Name for Tier Management

**Branch**: `008-tier-event-search` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-tier-event-search/spec.md`

## Summary

Replace the raw UUID input in the Tier Management panel with a search-by-name event picker. The backend `GET /events/mine` endpoint gains an optional `search` query parameter (case-insensitive LIKE on title). The frontend `TierManagementPanel` replaces the ID text input with a debounced search dropdown showing matching events. The existing public event search and debounce patterns are reused.

## Technical Context

**Language/Version**: TypeScript 5.8 (frontend + backend)
**Primary Dependencies**: React 18, Express 4, Tailwind CSS, Zod, better-sqlite3
**Storage**: SQLite via better-sqlite3 (existing — no schema changes)
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Web (SPA frontend + REST API backend)
**Project Type**: Web application (monorepo with frontend/ and backend/)
**Performance Goals**: Search results appear under 1 second after typing stops
**Constraints**: 300ms debounce, max 5 results in quick-select dropdown
**Scale/Scope**: Single table query extension, one component rewrite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: UI scope is implemented with typed React
      components. TierManagementPanel uses TypeScript typed state for search,
      dropdown items, and selected event. No untyped paths.
- [x] **Node.js + Express Backend**: Backend scope adds an optional `search` query
      param to the existing `GET /events/mine` Express route. Zod validates the
      query schema. Business logic stays in the service layer.
- [x] **Frontend/Backend Separation**: Frontend calls `listOrganizerEvents(page,
      pageSize, search?)` through the existing `organizerApi.ts` API client.
      No direct database access.
- [x] **JWT Auth**: `GET /events/mine` already has `requireAuth` +
      `requireRole(['organizer', 'admin'])` middleware. No auth changes needed.
      Search is scoped to the organizer's own events via `WHERE organizer_id = ?`.
- [x] **REST Semantics**: Extends existing `GET /events/mine` with an optional
      `search` query param. Returns 200 with filtered results or empty array.
      No new endpoints or status codes.
- [x] **Acyclic Dependencies**: Changes follow existing vertical slices:
      backend (repository → service → route) and frontend (API → component).
      No cross-boundary imports. `npm run lint:cycles` will verify.

## Project Structure

### Documentation (this feature)

```text
specs/008-tier-event-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (affected files)

```text
backend/src/
├── repositories/
│   └── eventRepository.ts       ← MODIFY: add search param to listOrganizerEvents + countOrganizerEvents
├── services/
│   └── organizerEventService.ts ← MODIFY: pass search through listOrganizerEventsForUser
└── api/
    └── routes/
        └── eventRoutes.ts       ← MODIFY: parse optional search query param in GET /mine

frontend/src/
├── services/
│   └── organizerApi.ts          ← MODIFY: add search param to listOrganizerEvents function
└── components/
    └── TierManagementPanel.tsx  ← MODIFY: replace UUID input with search-and-select
```

**Structure Decision**: Existing web application structure (separate `frontend/` and `backend/` directories). No new files needed — all changes modify existing files.

## Complexity Tracking

No constitution violations. All changes follow existing patterns.
