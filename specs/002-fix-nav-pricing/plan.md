# Implementation Plan: Navigation, Logout & Checkout Pricing Fixes

**Branch**: `002-fix-nav-pricing` | **Date**: 2026-03-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-fix-nav-pricing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Fix three interconnected frontend issues: (1) add a logout button to the navigation bar and make navigation reactively update on auth state changes without full page reloads, (2) fetch and display actual ticket tier prices on the checkout page with correct subtotal/discount/total computation, and (3) resolve all console errors across standard user flows. The approach introduces a lightweight React Context for auth state, fetches event details on the checkout page to obtain tier pricing, and replaces `window.location.assign` with React Router navigation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 18.x, React Router 6.x, Vite 6.x, Tailwind CSS 3.x, shadcn-style components (cva, clsx, tailwind-merge, lucide-react)
**Storage**: N/A (frontend-only changes; backend uses SQLite via better-sqlite3, unchanged)
**Testing**: Vitest (frontend), Jest (backend) — no test files currently exist
**Target Platform**: Browser (SPA served by Vite dev server, API on localhost:4000)
**Project Type**: Web application (npm workspaces: `frontend/` + `backend/`)
**Performance Goals**: Navigation auth state update <1s, checkout price display <1s after load, quantity change reflected <200ms
**Constraints**: Frontend-only changes — no backend modifications. Must maintain existing component architecture (ui/ → app/ → pages/).
**Scale/Scope**: 6 frontend pages, ~15 components, 4 service modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: All changes are in typed React TSX components
      and TypeScript service modules. No untyped JavaScript paths introduced.
- [x] **Node.js + Express Backend**: No backend changes required. Existing Express
      endpoints already serve all needed data (event details with tier pricing).
- [x] **Frontend/Backend Separation**: All changes stay within `frontend/src/`. API
      interaction continues through `apiClient.ts`. No direct backend access.
- [x] **JWT Auth**: Logout clears stored JWT token. Navigation reads auth state
      reactively. Protected route guards already redirect unauthenticated users.
      No changes to JWT validation or 401/403 server behavior.
- [x] **REST Semantics**: No new endpoints needed. Existing `GET /events/:eventId`
      already returns `tiers[].priceMinor`. No API contract changes.
- [x] **Acyclic Dependencies**: New `AuthContext` is consumed by Navigation and
      AuthPage via React Context (unidirectional). CheckoutPage fetches event
      details via existing `attendeeApi.ts`. No circular imports introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-nav-pricing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no new API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── main.tsx                      # App entry point (wraps with AuthProvider)
│   ├── app/
│   │   └── router.tsx                # Route definitions, RequireAuth/RequireRole guards
│   ├── components/
│   │   ├── ui/                       # Shared UI primitives (Button, Input, etc.)
│   │   ├── app/
│   │   │   ├── AppShell.tsx          # Layout shell (unchanged)
│   │   │   ├── Navigation.tsx        # ★ Add logout button, consume AuthContext
│   │   │   └── OrderSummary.tsx      # Already supports unitPrice display
│   │   ├── DiscountCodeInput.tsx     # Discount validation (unchanged)
│   │   └── WaitlistPanel.tsx         # Waitlist join/leave (unchanged)
│   ├── contexts/
│   │   └── AuthContext.tsx           # ★ NEW: React Context for reactive auth state
│   ├── pages/
│   │   ├── AuthPage.tsx              # ★ Use AuthContext login, useNavigate
│   │   ├── CheckoutPage.tsx          # ★ Fetch event details for tier pricing
│   │   ├── EventListPage.tsx         # (unchanged)
│   │   ├── EventDetailsPage.tsx      # (unchanged)
│   │   ├── OrganizerDashboardPage.tsx # (unchanged)
│   │   └── AdminOrganizerRequestsPage.tsx # (unchanged)
│   └── services/
│       ├── apiClient.ts              # ★ Clear module-level authToken on logout
│       ├── attendeeApi.ts            # (unchanged — getEventDetails already exists)
│       ├── authSession.ts            # ★ Add logout() function
│       ├── checkoutApi.ts            # (unchanged)
│       └── organizerApi.ts           # (unchanged)
```

**Structure Decision**: Existing `frontend/` + `backend/` web application layout. All changes contained within `frontend/src/`. New `contexts/` directory added for `AuthContext.tsx` following standard React patterns. No structural changes to backend.

## Complexity Tracking

> No Constitution Check violations. No complexity escalations needed.
