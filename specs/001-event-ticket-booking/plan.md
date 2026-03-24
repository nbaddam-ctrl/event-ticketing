# Implementation Plan: Event Ticket Booking Web App

**Branch**: `001-event-ticket-booking` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-ticket-booking/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver a full web-based event ticket booking experience with attendee purchase
flows, organizer event management, waitlist handling, discount application, and
cancellation refunds. The solution uses a React + TypeScript frontend and a
Node.js + Express REST backend with SQLite persistence, JWT-based
authentication/authorization, strict oversell prevention, and explicit
frontend/backend separation.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS (backend), TypeScript 5.x + React 18 (frontend)  
**Primary Dependencies**: Express 4.x, SQLite3, JWT (`jsonwebtoken`), schema validation (Zod), React Router, Vite  
**Storage**: SQLite (single primary relational database)  
**Testing**: Vitest + React Testing Library (frontend), Jest + Supertest (backend), contract tests against OpenAPI  
**Target Platform**: Web browsers (frontend) + Linux container/server runtime (backend)
**Project Type**: Web application (separate frontend and backend services)  
**Performance Goals**: p95 API latency < 300ms for browse/detail/checkout APIs at 200 concurrent users; waitlist promotion processing < 60s  
**Constraints**: Strict no-oversell guarantee, one discount code per booking, 30-minute waitlist reservation hold, 100% organizer-cancel refund to original payment method, no circular dependencies  
**Scale/Scope**: MVP scope for one production region, up to 10k registered users, up to 500 concurrent checkout attempts during peak event launches

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: UI scope is implemented with typed React
      components and no untyped production JavaScript paths.
- [x] **Node.js + Express Backend**: Backend scope is delivered through Express
      REST endpoints with validated request/response schemas.
- [x] **Frontend/Backend Separation**: App boundaries remain isolated and all UI
      server interaction occurs via explicit API clients.
- [x] **JWT Auth**: Protected endpoints include JWT validation, role/permission
      rules, and explicit 401/403 behavior.
- [x] **REST Semantics**: Endpoint design and status codes follow REST method
      intent and standardized error response contracts.
- [x] **Acyclic Dependencies**: Import and module dependency checks are defined to
      prevent circular dependencies in frontend/backend/shared code.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   ├── services/
│   ├── domain/
│   ├── repositories/
│   ├── auth/
│   └── app.ts
└── tests/
      ├── unit/
      ├── integration/
      └── contract/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── app/
└── tests/
      ├── unit/
      └── integration/

shared/
└── contracts/
```

**Structure Decision**: Use a two-app web architecture (`frontend/`, `backend/`)
with a shared contract/types boundary to preserve strict separation while
enabling typed API integration.

## Phase 0 Research Summary

- Completed: [research.md](./research.md)
- Clarifications resolved in research/design decisions:
      - React + TypeScript frontend tooling
      - Node.js + Express REST backend architecture
      - SQLite transactional persistence model
      - JWT auth/authz strategy
      - Oversell rejection behavior (full-request rejection)
      - Waitlist promotion + 30-minute hold
      - Single discount code policy
      - Full refund policy to original payment method

## Phase 1 Design Artifacts

- Data model: [data-model.md](./data-model.md)
- API contracts: [contracts/openapi.yaml](./contracts/openapi.yaml)
- Runbook/validation flow: [quickstart.md](./quickstart.md)
- Agent context update executed via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`

## Post-Design Constitution Check

- [x] **React + TypeScript Frontend**: Component-driven typed frontend captured in plan structure and quickstart flow.
- [x] **Node.js + Express Backend**: Express REST contract formalized in OpenAPI.
- [x] **Frontend/Backend Separation**: Separate app boundaries and shared-contract boundary defined.
- [x] **JWT Auth**: JWT bearer security scheme and protected route behavior included in contract.
- [x] **REST Semantics**: Endpoint resources and HTTP status code outcomes defined across happy/error paths.
- [x] **Acyclic Dependencies**: Lint/CI cycle checks included in research and quickstart quality gates.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified.
