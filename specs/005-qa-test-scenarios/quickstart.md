# Quickstart: QA Test Scenarios

**Feature**: 005-qa-test-scenarios
**Date**: 2026-03-20

## Prerequisites

- Node.js (LTS)
- npm (workspaces enabled)
- Repository cloned and dependencies installed: `npm install`

## Install Test Dependencies

```bash
# From repository root
npm install --save-dev supertest @types/supertest --workspace backend
```

## Run All Backend Tests

```bash
# From repository root
npm run test --workspace backend

# Or from backend/ directly
cd backend && npx jest
```

## Run Tests by Category

```bash
# State transition tests only
npx jest --testPathPattern="state-transitions" --workspace backend

# Integration/acceptance tests only
npx jest --testPathPattern="integration" --workspace backend

# Concurrency tests only
npx jest --testPathPattern="concurrency" --workspace backend

# Unit tests only
npx jest --testPathPattern="unit" --workspace backend
```

## Run a Single Test File

```bash
npx jest tests/integration/booking.routes.test.ts --workspace backend
```

## Test Architecture

```
backend/tests/
├── setup.ts                     # In-memory SQLite, schema bootstrap
├── helpers/
│   ├── auth.ts                  # createTestToken(userId, roles)
│   └── db.ts                    # seedUser(), seedEvent(), seedTier(), clearAllTables()
├── state-transitions/           # One file per entity lifecycle
├── integration/                 # Gherkin acceptance tests via supertest
├── concurrency/                 # Parallel request races (CS-001..CS-006)
└── unit/                        # Direct service/repository calls
```

## Key Conventions

1. **Test DB**: All tests run against `:memory:` SQLite — no dev DB required
2. **Isolation**: Each test file gets its own DB instance (Jest workers)
3. **Auth**: Use `createTestToken(userId, ['attendee'])` for auth headers
4. **Cleanup**: Call `clearAllTables()` in `beforeEach` when tests share a DB
5. **Assertions**: Always verify HTTP status + response body + side effects (inventory, refunds, notifications)

## Verify Setup

After implementing the test infrastructure:

```bash
# Should pass with 0 failures
npm run test --workspace backend

# Should show test count > 0
npx jest --listTests --workspace backend
```
