# Phase 0 Research - Event Ticket Booking Web App

## Decision 1: Frontend stack uses React + TypeScript with Vite
- Decision: Use React 18 + TypeScript 5.x with Vite build tooling.
- Rationale: Matches constitution requirements for typed React UI, supports fast feedback loops, and cleanly structures attendee/organizer flows.
- Alternatives considered: Next.js (rejected for unnecessary SSR complexity in MVP), plain React JS (rejected because constitution requires TypeScript).

## Decision 2: Backend stack uses Node.js + Express REST API
- Decision: Implement backend as Node.js 22 LTS + Express 4.x REST service.
- Rationale: Aligns with constitution, broad ecosystem for auth/validation/testing, and straightforward route/middleware composition.
- Alternatives considered: Fastify (rejected for scope control and explicit requirement preference for Express), GraphQL (rejected because constitution mandates REST semantics).

## Decision 3: Persistence uses SQLite with transactional booking updates
- Decision: Use SQLite as the primary relational store with transactions around booking/inventory operations.
- Rationale: User-selected database, low operational overhead for MVP, and sufficient consistency guarantees for oversell prevention with transactional logic.
- Alternatives considered: PostgreSQL (rejected because user explicitly requested SQLite), in-memory store (rejected for durability and correctness).

## Decision 4: Authentication and authorization use JWT with role claims
- Decision: Use signed JWT access tokens containing user identity and role claims (`attendee`, `organizer`, `admin`) validated by backend middleware.
- Rationale: Constitution requires JWT and explicit 401/403 behavior; role claims support organizer approval and protected operations.
- Alternatives considered: Session cookies (rejected due to explicit JWT requirement), opaque tokens + introspection (rejected for MVP complexity).

## Decision 5: Oversell prevention is enforced with atomic inventory checks
- Decision: Reject full purchase when requested quantity exceeds availability and confirm bookings only via atomic transactional updates.
- Rationale: Clarification mandates full-request rejection (no partial fulfillment) and constitution demands deterministic REST outcomes.
- Alternatives considered: Auto-adjust to available quantity (rejected per clarification), split booking/waitlist remainder (rejected for additional UX complexity).

## Decision 6: Waitlist promotion uses FIFO with 30-minute reservation hold
- Decision: Promote waitlist entries in enrollment order and reserve newly available inventory for 30 minutes per promoted user.
- Rationale: Clarification explicitly defines hold duration and fairness model; deterministic timeout behavior simplifies implementation and testing.
- Alternatives considered: No hold period (rejected due to race/fairness concerns), 2+ hour holds (rejected due to slower inventory turnover).

## Decision 7: Discount handling allows one code per booking
- Decision: Support exactly one validated discount code per booking.
- Rationale: Clarification requires single-code policy; easier to reason about pricing, misuse prevention, and auditability.
- Alternatives considered: Stacking multiple codes (rejected due to complexity and abuse risk), mixed platform+organizer stacking (rejected for MVP).

## Decision 8: Cancellation refunds are full amount to original payment method
- Decision: For organizer-cancelled events, refund 100% paid amount to original payment method and track asynchronous refund status.
- Rationale: Clarification defines policy; status tracking supports transparency and failure recovery.
- Alternatives considered: Credit-only refund (rejected per clarification), partial refund excluding fees (rejected per clarification).

## Decision 9: Contract-first API via OpenAPI in specs/contracts
- Decision: Define REST endpoints and schemas in OpenAPI before implementation.
- Rationale: Constitution requires contract-first design and standardized HTTP status semantics.
- Alternatives considered: Ad hoc endpoint documentation (rejected due to drift risk), code-first schema extraction only (rejected for planning-stage clarity).

## Decision 10: Circular dependency prevention via lint + CI checks
- Decision: Enforce acyclic imports using ESLint `import/no-cycle` (frontend/backend) and CI validation gates.
- Rationale: Constitution mandates no circular dependencies and pre-merge enforcement.
- Alternatives considered: Manual review only (rejected as insufficient), post-merge cleanup (rejected as too late).
