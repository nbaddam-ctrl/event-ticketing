# Implementation Plan: QA Test Scenarios

**Branch**: `005-qa-test-scenarios` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-qa-test-scenarios/spec.md`

## Summary

Implement comprehensive QA test infrastructure for the event ticketing system: state transition validation tests for all stateful entities, concurrency scenario tests, Gherkin-style acceptance tests for core flows, and invalid purchase attempt coverage. Backend tests use Jest with an isolated in-memory SQLite database. Frontend tests use Vitest for component validation. No new features are added — this is a test-only deliverable.

## Technical Context

**Language/Version**: TypeScript 5.8, Node.js (ES2022 target)
**Primary Dependencies**: Express 4.x, better-sqlite3, Zod, React 18, React Router 6
**Storage**: SQLite via better-sqlite3 (file-based, `DATABASE_URL` env var)
**Testing**: Jest 29 + ts-jest (backend), Vitest 3 (frontend); both configured with `--passWithNoTests`, no existing tests
**Target Platform**: Windows/Linux development, Node.js server
**Project Type**: Web application (monorepo with `backend/` and `frontend/` workspaces)
**Performance Goals**: Concurrency tests must verify correctness under parallel load (5+ simultaneous requests)
**Constraints**: Tests must run against in-memory SQLite (`:memory:`) to avoid polluting dev database; Jest ESM compatibility via ts-jest + NodeNext modules
**Scale/Scope**: ~15 source files to test, 6 entities with state transitions, 25+ Gherkin scenarios, 6 concurrency scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **React + TypeScript Frontend**: Test files use TypeScript. Frontend tests validate typed React component behavior through Vitest.
- [x] **Node.js + Express Backend**: All backend tests exercise Express endpoints via supertest or direct service/repository calls against the real Express app.
- [x] **Frontend/Backend Separation**: Backend tests live in `backend/tests/`. Frontend tests live in `frontend/tests/` or co-located as `*.test.tsx`. No cross-boundary imports.
- [x] **JWT Auth**: Tests cover unauthenticated access (401), unauthorized role access (403), and valid JWT scenarios. Test helpers generate valid JWTs for test users.
- [x] **REST Semantics**: Every test scenario asserts the correct HTTP status code (200/201/400/401/403/404/409) per the spec.
- [x] **Acyclic Dependencies**: Test files import only from the modules they test. No circular test dependencies. Cycle linting via existing `npm run lint:cycles` remains enforced.

## Project Structure

### Documentation (this feature)

```text
specs/005-qa-test-scenarios/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no new API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/                        # Existing source (no changes)
│   ├── api/routes/
│   ├── services/
│   ├── repositories/
│   ├── db/
│   └── domain/
├── tests/
│   ├── setup.ts                # Test DB setup: in-memory SQLite, schema, seed
│   ├── helpers/
│   │   ├── auth.ts             # JWT token generation for test users
│   │   └── db.ts               # DB reset/seed between tests
│   ├── unit/
│   │   ├── booking.service.test.ts
│   │   ├── event.service.test.ts
│   │   └── waitlist.service.test.ts
│   ├── integration/
│   │   ├── booking.routes.test.ts        # Gherkin: purchase + invalid attempts
│   │   ├── booking-cancel.routes.test.ts # Gherkin: cancellation flows
│   │   ├── event-tier.routes.test.ts     # Gherkin: tier management
│   │   ├── event-cancel.routes.test.ts   # Gherkin: event cancellation
│   │   └── waitlist.routes.test.ts       # Gherkin: waitlist flows
│   ├── concurrency/
│   │   ├── last-ticket-race.test.ts      # CS-001
│   │   ├── cancel-rebook-race.test.ts    # CS-002
│   │   ├── discount-exhaustion.test.ts   # CS-003
│   │   ├── waitlist-position.test.ts     # CS-004
│   │   ├── event-cancel-purchase.test.ts # CS-005
│   │   └── cascade-promotion.test.ts     # CS-006
│   └── state-transitions/
│       ├── booking.transitions.test.ts
│       ├── event.transitions.test.ts
│       ├── tier.transitions.test.ts
│       ├── waitlist.transitions.test.ts
│       ├── refund.transitions.test.ts
│       └── organizer.transitions.test.ts
├── jest.config.ts              # Jest configuration for ts-jest + ESM
└── package.json                # (existing, scripts already configured)

frontend/
├── src/                        # Existing source (no changes)
└── tests/                      # Minimal — spec is backend-focused
    └── (deferred to future frontend-test feature)
```

**Structure Decision**: Backend tests are the primary deliverable since all spec scenarios (state transitions, concurrency, Gherkin acceptance) exercise backend API and service logic. Tests are organized by test type: `unit/`, `integration/`, `concurrency/`, and `state-transitions/`. Frontend test infrastructure is deferred — the spec's Gherkin scenarios target API-level behavior.

## Complexity Tracking

No constitution violations. All tests align with existing architecture.
