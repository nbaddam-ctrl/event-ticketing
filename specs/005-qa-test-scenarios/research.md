# Research: QA Test Scenarios

**Feature**: 005-qa-test-scenarios
**Date**: 2026-03-20

## R-001: Jest Configuration for ESM + TypeScript Backend

**Decision**: Use ts-jest with ESM preset (`ts-jest/presets/default-esm`) and `--experimental-vm-modules` Node flag.

**Rationale**: The backend uses `"type": "module"` in package.json and `"module": "NodeNext"` in tsconfig. Standard Jest cannot process ESM imports (`.js` extensions in TypeScript source). ts-jest's ESM preset handles this by transforming `.ts` files while respecting NodeNext module resolution. The `moduleNameMapper` maps `.js` imports back to `.ts` source files.

**Alternatives considered**:
- **Vitest for backend**: Would avoid ESM hassles since Vite handles ESM natively. Rejected because Jest is already declared as a devDependency and referenced in package.json scripts. Switching would require changing the existing project convention.
- **SWC + Jest**: Faster compilation but adds a new dependency (swc) not currently in the project. Unnecessary complexity for a test-only feature.

**Configuration approach**:
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.ts$': ['ts-jest', { useESM: true }] },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFilesAfterSetup: ['<rootDir>/tests/setup.ts'],
};
```

## R-002: In-Memory SQLite Test Isolation

**Decision**: Override `DATABASE_URL` to `:memory:` before importing `db/client.ts`. Each test suite gets a fresh database by re-running the schema migration and optional seed data in `beforeAll`.

**Rationale**: The existing `client.ts` reads `process.env.DATABASE_URL ?? './data/event-ticketing.db'`. Setting `DATABASE_URL=:memory:` before the module loads creates an ephemeral database that is destroyed when the test process exits. This avoids polluting the development database and provides perfect test isolation.

**Alternatives considered**:
- **Temporary file-based DB**: Creates a file per test run, requires cleanup. More complex, no benefit over in-memory for unit/integration tests.
- **Mock the database entirely**: Would not test actual SQL queries and repository logic. Defeats the purpose of integration and state-transition tests.
- **Shared in-memory DB with reset**: Use a single in-memory DB across all tests with `beforeEach` table truncation. Rejected for concurrency tests which need parallel execution against the same DB.

**Implementation approach**:
```typescript
// tests/setup.ts
process.env.DATABASE_URL = ':memory:';
import { db } from '../src/db/client.js';
import fs from 'node:fs';
import path from 'node:path';

const schema = fs.readFileSync(
  path.resolve(__dirname, '../src/db/schema.sql'),
  'utf-8'
);

beforeAll(() => {
  db.exec(schema);
});

afterAll(() => {
  db.close();
});
```

**Test isolation between test files**: Jest runs each test file in a separate worker by default. Each worker creates its own `:memory:` database, providing natural isolation. For tests within a single file, use `beforeEach` to clear tables.

## R-003: HTTP Integration Testing Approach

**Decision**: Use `supertest` to test Express routes directly, without starting an HTTP server.

**Rationale**: supertest binds to the Express app instance and makes HTTP-like requests in-process. This avoids port conflicts, is faster than real HTTP, and allows testing the full middleware pipeline (auth, validation, error handling) end-to-end.

**Alternatives considered**:
- **Direct service/repository calls**: Faster but skips middleware (auth checks, Zod validation, error handler). Would miss entire categories of bugs the spec requires testing (401, 403, 400 validation errors).
- **Start actual HTTP server**: Requires port management, server lifecycle, and is slower. No benefit over supertest for these test scenarios.

**Required dependency**: `supertest` + `@types/supertest` (devDependencies in backend).

**Pattern**:
```typescript
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

it('should return 401 for unauthenticated purchase', async () => {
  const res = await request(app)
    .post('/bookings')
    .send({ eventId: '...', ticketTierId: '...', quantity: 1 });
  expect(res.status).toBe(401);
});
```

## R-004: JWT Token Generation for Tests

**Decision**: Create a test helper that generates valid JWT tokens using the same signing secret as the application, with configurable user ID and roles.

**Rationale**: The auth middleware (`requireAuth`) validates JWTs and extracts `sub` (user ID) and roles. Tests need valid tokens for authenticated scenarios and must be able to set specific roles (attendee, organizer, admin) for authorization tests.

**Alternatives considered**:
- **Mock the auth middleware**: Would bypass actual JWT validation, reducing test coverage. Rejected because the spec explicitly requires testing 401/403 responses.
- **Use real login endpoint**: Would require seeding user credentials and hitting `/auth/login` first. Adds unnecessary coupling and latency.

**Implementation approach**:
```typescript
// tests/helpers/auth.ts
import jwt from 'jsonwebtoken';

const TEST_SECRET = process.env.JWT_SECRET ?? 'test-secret';

export function createTestToken(userId: string, roles: string[] = ['attendee']): string {
  return jwt.sign({ sub: userId, roles: roles.join(',') }, TEST_SECRET, { expiresIn: '1h' });
}
```

## R-005: Concurrency Testing Strategy

**Decision**: Use `Promise.all()` with multiple supertest requests to simulate concurrent access. Annotate each test with the SQLite serialization caveat.

**Rationale**: SQLite serializes writes at the database level, so true concurrency races cannot manifest in the current architecture. However, the spec requires these tests as regression guards. `Promise.all()` with multiple HTTP requests exercises the concurrent code paths at the application level — the requests are dispatched simultaneously and the Express/SQLite stack serializes them. This validates that the transactional logic is correct regardless of execution order.

**Alternatives considered**:
- **Worker threads with separate DB connections**: SQLite in WAL mode supports concurrent readers but serializes writers. Separate connections in worker threads would still serialize, providing no additional race coverage. Adds complexity without benefit.
- **Skip concurrency tests entirely**: Rejected because the spec explicitly requires them (CS-001 through CS-006) as regression documentation.
- **Use a multi-process PostgreSQL setup**: Would test true concurrent writes but introduces a dependency the project doesn't have. Out of scope.

**Pattern for CS-001 (last-ticket race)**:
```typescript
it('should allow exactly 1 booking when 5 users race for the last ticket', async () => {
  // Setup: tier with 1 remaining
  const promises = Array.from({ length: 5 }, (_, i) =>
    request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${tokens[i]}`)
      .send({ eventId, ticketTierId: tierId, quantity: 1 })
  );
  const results = await Promise.all(promises);
  const successes = results.filter(r => r.status === 201);
  const conflicts = results.filter(r => r.status === 409);
  expect(successes).toHaveLength(1);
  expect(conflicts).toHaveLength(4);
});
```

**Annotation**: Each concurrency test includes a comment noting that SQLite write serialization makes races impossible in the current deployment, but the test validates application-level correctness for future database migrations.

## R-006: Test Data Seeding Strategy

**Decision**: Use programmatic seed helpers (not the production `seed.ts`) that create minimal, deterministic test data per test suite.

**Rationale**: Production seed data creates random UUIDs and timestamps, making assertions brittle. Test helpers create entities with predictable IDs and controlled state. Each test suite seeds only the data it needs, avoiding cross-test pollution.

**Alternatives considered**:
- **Reuse production `seed.ts`**: Random IDs make assertions impossible. Adds unnecessary data that tests don't need.
- **SQL fixture files**: Harder to maintain and less flexible than programmatic helpers. Can't easily parameterize.

**Implementation approach**:
```typescript
// tests/helpers/db.ts
import { db } from '../../src/db/client.js';
import { randomUUID } from 'node:crypto';

export function seedUser(overrides = {}) {
  const defaults = { id: randomUUID(), email: `user-${Date.now()}@test.com`, ... };
  const user = { ...defaults, ...overrides };
  db.prepare(`INSERT INTO users (...) VALUES (...)`).run(...);
  return user;
}

export function seedEvent(organizerId: string, overrides = {}) { ... }
export function seedTier(eventId: string, overrides = {}) { ... }
export function clearAllTables() {
  db.exec('DELETE FROM notifications; DELETE FROM refunds; DELETE FROM bookings; ...');
}
```

## R-007: State Transition Test Pattern

**Decision**: Each entity's state transition tests are organized as describe blocks per valid transition, with additional describe blocks for invalid transitions. Each test asserts: the transition succeeds/fails, the new state value, side effects (e.g., refund created, inventory changed), and the HTTP response.

**Rationale**: The spec provides explicit valid/invalid transition tables per entity. Structuring tests to mirror these tables provides 1:1 traceability between spec and code.

**Pattern**:
```typescript
describe('Booking State Transitions', () => {
  describe('(new) → confirmed', () => {
    it('creates booking in confirmed state', ...);
    it('increments tier soldQuantity', ...);
    it('sends booking_confirmed notification', ...);
  });
  describe('confirmed → cancelled (user cancel)', () => {
    it('sets booking status to cancelled', ...);
    it('decrements tier soldQuantity', ...);
    it('creates refund with status requested', ...);
  });
  describe('INVALID: cancelled → confirmed', () => {
    it('rejects reactivation attempt', ...);
  });
});
```
