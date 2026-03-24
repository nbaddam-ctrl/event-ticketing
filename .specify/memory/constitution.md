<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Modified principles:
  - I. Domain-Driven Design → I. React + TypeScript Frontend
  - II. API Contract First → II. Node.js + Express REST Backend
  - III. Test Discipline (NON-NEGOTIABLE) → III. Frontend/Backend Separation (NON-NEGOTIABLE)
  - IV. Security and Compliance by Default → IV. JWT Authentication and Authorization
  - V. Observability and Operational Readiness → V. RESTful API Semantics and HTTP Status Codes
  - Added VI. Acyclic Dependency Architecture
- Added sections:
  - None
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (updated Constitution Check gates)
  - ✅ .specify/templates/spec-template.md (updated Constitution Alignment checks)
  - ✅ .specify/templates/tasks-template.md (updated setup/foundational task guidance)
  - ⚠ pending .specify/templates/commands/*.md (directory not present)
  - ✅ specs/master/plan.md (aligned Constitution Check with current principles)
- Follow-up TODOs:
  - None
-->

# Event Ticketing System Constitution

## Core Principles

### I. React + TypeScript Frontend
All frontend features MUST be implemented as React components written in
TypeScript. Components MUST use typed props and explicit state models, and MUST
avoid untyped JavaScript in production paths. This enforces compile-time safety
and predictable UI behavior in booking flows.

### II. Node.js + Express REST Backend
All backend HTTP services MUST run on Node.js with Express and expose REST
endpoints. Business logic MUST reside in backend service modules, not route
handlers, and every public endpoint MUST have request/response schema
validation. This ensures maintainable APIs and consistent server behavior.

### III. Frontend/Backend Separation (NON-NEGOTIABLE)
Frontend and backend code MUST remain in separate top-level application
boundaries with independent build and runtime pipelines. Frontend code MUST call
backend APIs through explicit service clients and MUST NOT access persistence
directly. This separation prevents coupling and preserves deploy flexibility.

### IV. JWT Authentication and Authorization
Protected API endpoints MUST require JWT-based authentication and role/permission
checks appropriate to the action. JWT signing keys/secrets MUST be managed via
environment configuration and MUST NOT be hard-coded. Token validation failures
MUST return explicit unauthorized/forbidden responses.

### V. RESTful API Semantics and HTTP Status Codes
APIs MUST follow RESTful resource conventions and use HTTP methods by intent
(GET read, POST create, PUT/PATCH update, DELETE remove). Responses MUST use
correct status codes (for example 200/201/204 success, 400 validation errors,
401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, 500 server
error) and a consistent error body contract.

### VI. Acyclic Dependency Architecture
Project modules MUST maintain an acyclic dependency graph across frontend,
backend, and shared packages. Circular dependencies in imports or service wiring
MUST be blocked by linting or CI checks and resolved before merge. This keeps
the codebase testable, refactorable, and predictable.

## Additional Constraints

- The repository MUST preserve separate `frontend/` and `backend/` app
  directories unless a constitution amendment approves a structural change.
- Shared types between frontend and backend MUST be versioned and imported
  through defined shared modules, not through cross-app relative path hacks.
- Authentication and authorization behavior MUST be covered by automated tests
  for login, protected-route access, token expiry, and role restrictions.
- CI MUST fail on detected circular imports or dependency cycles.

## Delivery Workflow and Quality Gates

- Specifications MUST define prioritized user stories with independently testable
  outcomes.
- Implementation plans MUST pass Constitution Check gates before coding begins.
- Task breakdowns MUST include frontend tasks, backend tasks, API contract tasks,
  auth tasks, and dependency-hygiene tasks when applicable.
- Pull requests MUST include evidence of TypeScript compilation, backend test
  execution, JWT auth verification, and REST status-code validation.
- Releases affecting authentication or API contracts MUST include rollback
  instructions and migration notes for clients.

## Governance

This constitution supersedes conflicting local practices for this repository.
Amendments require a documented proposal, explicit maintainer approval, and
template updates before merge.

Versioning policy for this constitution follows semantic versioning:

- MAJOR: incompatible governance changes or removed principles
- MINOR: new principle/section or materially expanded policy
- PATCH: clarifications, wording improvements, or typo fixes

Compliance review is required during planning and pull request review. Any
justified deviation MUST be recorded in the implementation plan.

**Version**: 2.0.0 | **Ratified**: 2026-02-26 | **Last Amended**: 2026-03-06
