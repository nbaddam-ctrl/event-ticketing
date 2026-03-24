# Implementation Plan: Modern UI Redesign

**Branch**: `006-modern-ui-redesign` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-modern-ui-redesign/spec.md`

## Summary

Redesign the entire frontend application with a modern, premium visual identity. Introduce an indigo-to-violet primary color palette, refined typography and spacing tokens, smooth Framer Motion entrance animations, micro-interaction transitions, a hero section on the event listing page, polished event cards and tier cards, dark mode with system-preference detection, a minimal site-wide footer, and visual polish across all 8 pages (EventList, EventDetails, Checkout, Auth, MyBookings, OrganizerDashboard, RequestOrganizer, AdminOrganizerRequests). This is a frontend-only effort — no backend or API changes.

## Technical Context

**Language/Version**: TypeScript 5.8, React 18  
**Primary Dependencies**: React 18, React Router 6, Tailwind CSS, tailwindcss-animate, class-variance-authority, clsx, tailwind-merge, lucide-react, Framer Motion (new)  
**Storage**: localStorage (dark mode preference persistence only)  
**Testing**: Vitest 3 (existing frontend test runner)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge — last 2 versions)  
**Project Type**: Web application (monorepo — frontend workspace)  
**Performance Goals**: Above-fold content visually complete within 1 second; all transitions 150–300ms  
**Constraints**: Framer Motion adds ~30KB gzipped; total bundle increase must stay under 50KB gzipped  
**Scale/Scope**: 8 pages, ~36 components (15 app + 21 ui), 1 CSS file, 1 Tailwind config

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: All changes are React components in TypeScript. New tokens added via Tailwind config extensions and CSS custom properties. All component prop interfaces remain typed.
- [x] **Node.js + Express Backend**: N/A — this feature is frontend-only. No backend changes.
- [x] **Frontend/Backend Separation**: All changes are within the `frontend/` workspace. No backend coupling introduced. Existing API client calls unchanged.
- [x] **JWT Auth**: Auth UX receives visual polish only. Token handling, 401/403 behavior, and session logic remain unchanged.
- [x] **REST Semantics**: N/A — no endpoint changes. Frontend continues to consume existing APIs with existing status code handling.
- [x] **Acyclic Dependencies**: All changes stay within the existing frontend module structure. New context (ThemeContext) follows the same pattern as existing AuthContext. No circular imports introduced.

## Project Structure

### Documentation (this feature)

```text
specs/006-modern-ui-redesign/
├── plan.md              # This file
├── research.md          # Phase 0: Technology research and decisions
├── data-model.md        # Phase 1: Design token model and component inventory
├── quickstart.md        # Phase 1: Development setup and workflow
├── contracts/           # Phase 1: No external contracts (frontend-only)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── index.html                          # Add Inter font preload
├── tailwind.config.ts                  # Extended tokens, dark mode class strategy
├── src/
│   ├── main.tsx                        # Wrap with ThemeProvider
│   ├── styles.css                      # Refined tokens, dark mode overrides
│   ├── contexts/
│   │   ├── AuthContext.tsx             # Unchanged
│   │   └── ThemeContext.tsx            # NEW — dark/light mode state + toggle
│   ├── components/
│   │   ├── ui/                         # Enhanced base components (Button, Card, Input, Badge, etc.)
│   │   ├── app/
│   │   │   ├── AppShell.tsx            # Add footer, animation wrapper
│   │   │   ├── Navigation.tsx          # Dark mode toggle, polished styling
│   │   │   ├── Footer.tsx              # NEW — minimal site footer
│   │   │   ├── HeroSection.tsx         # NEW — event list hero banner
│   │   │   ├── EventCard.tsx           # Enhanced gradient header, price badge
│   │   │   ├── PageHeader.tsx          # Entrance animation wrapper
│   │   │   ├── EventSearchFilters.tsx  # Visual polish
│   │   │   ├── OrderSummary.tsx        # Enhanced styling
│   │   │   └── ...                     # Other app components — visual polish
│   │   ├── DiscountCodeInput.tsx       # Visual polish
│   │   ├── WaitlistPanel.tsx           # Visual polish
│   │   ├── OrganizerEventForm.tsx      # Visual polish
│   │   ├── EventCancellationPanel.tsx  # Visual polish
│   │   └── TierManagementPanel.tsx     # Visual polish
│   ├── pages/                          # All 8 pages — entrance animations, layout refinement
│   └── services/                       # Unchanged
```

**Structure Decision**: Frontend-only changes. The existing `frontend/src/` structure is preserved. New files are limited to `ThemeContext.tsx`, `Footer.tsx`, and `HeroSection.tsx`. All other work enhances existing files.

## Complexity Tracking

> No Constitution Check violations. All 6 gates pass cleanly — this is a frontend-only visual redesign with no backend, API, or auth behavioral changes.
