# Implementation Plan: Comprehensive Professional UI/UX Refresh

**Branch**: `001-uiux-professional-redesign` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-uiux-professional-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver a comprehensive frontend redesign that makes attendee, organizer, and
admin experiences professional, cohesive, and easy to use by standardizing the
UI system with a shadcn-style component approach, semantic design tokens,
consistent interaction states, and phased page migration without changing
backend business behavior or API contracts.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x (frontend), Node.js 22 LTS runtime in workspace  
**Primary Dependencies**: Vite, React Router, Tailwind CSS, shadcn-style component scaffolding, class-variance-authority, tailwind-merge, clsx, lucide-react  
**Storage**: N/A for redesign scope (existing backend SQLite persists unchanged)  
**Testing**: Vitest (frontend), Jest (backend), ESLint, dependency cycle check script  
**Target Platform**: Responsive web browsers (mobile and desktop)  
**Project Type**: Web application (separate `frontend/` and `backend/`)  
**Performance Goals**: Preserve current functional performance and achieve Core Web Vitals targets on redesigned core pages (LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at p75)  
**Constraints**: No backend contract changes, preserve JWT-based protected behavior, preserve REST status-driven UX behavior, no circular dependencies, complete critical tasks across responsive tiers  
**Scale/Scope**: Redesign all existing user-facing core pages (attendee, organizer, admin) and shared UI primitives in frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: All redesign scope is frontend React + TypeScript with typed props/state and shared component primitives.
- [x] **Node.js + Express Backend**: Backend remains Node.js + Express with existing validated REST contracts unchanged.
- [x] **Frontend/Backend Separation**: UI uses frontend service clients; no direct persistence access and no cross-boundary code mixing.
- [x] **JWT Auth**: Existing authentication/authorization behavior is preserved; redesign improves clarity of auth-related states.
- [x] **REST Semantics**: Existing endpoint semantics and status handling are retained and reflected consistently in UI states.
- [x] **Acyclic Dependencies**: Existing cycle-check tooling remains in quality gates; redesign introduces layered UI boundaries to prevent cycles.

## Project Structure

### Documentation (this feature)

```text
specs/001-uiux-professional-redesign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── api/
│   │   ├── middleware/
│   │   └── routes/
│   ├── services/
│   ├── repositories/
│   ├── domain/
│   └── auth/
└── data/

frontend/
├── src/
│   ├── components/
│   │   ├── (existing feature components)
│   │   ├── ui/                 # planned shared design-system primitives
│   │   └── app/                # planned composed app-level components
│   ├── pages/
│   └── services/
└── src/styles.css

scripts/
└── check-cycles.mjs
```

**Structure Decision**: Use the existing two-application web structure with UI redesign changes concentrated in `frontend/src`, while keeping backend contracts untouched and enforcing layered frontend boundaries (`pages` -> `components/app` -> `components/ui`, with API calls only in `services`).

## Phase 0 Research Summary

- Completed: [research.md](./research.md)
- Resolved topics:
      - shadcn-style adoption strategy and dependency set for current React/Vite app
      - accessibility baseline and UX quality gate metrics
      - frontend architecture boundaries to preserve acyclic dependencies
      - phased rollout strategy by prioritized user journeys

## Phase 1 Design Artifacts

- Data model: [data-model.md](./data-model.md)
- Interface contracts: [contracts/ui-ux-contract.md](./contracts/ui-ux-contract.md)
- Implementation/validation runbook: [quickstart.md](./quickstart.md)
- Agent context update command: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`

## Post-Design Constitution Check

- [x] **React + TypeScript Frontend**: Design artifacts standardize typed React component usage and reusable UI primitives.
- [x] **Node.js + Express Backend**: No backend architecture drift introduced; existing backend services remain source of business logic.
- [x] **Frontend/Backend Separation**: Contract enforces API calls through frontend service layer only.
- [x] **JWT Auth**: Auth flows remain protected by existing JWT enforcement; UI contracts specify clear auth state handling.
- [x] **REST Semantics**: Existing API semantics/status behavior are consumed without redesign-side contract mutation.
- [x] **Acyclic Dependencies**: Layered component boundaries + `npm run lint:cycles` quality gate prevent cyclical imports.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified.
