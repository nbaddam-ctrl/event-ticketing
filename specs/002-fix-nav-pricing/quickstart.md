# Quickstart: Navigation, Logout & Checkout Pricing Fixes

**Feature**: 002-fix-nav-pricing | **Date**: 2026-03-11

## Prerequisites

- Node.js 22 LTS
- npm (comes with Node.js)
- Backend server running on `http://localhost:4000`

## Setup

```bash
# From repository root
npm install

# Initialize database (if not already done)
npm run db:migrate --workspace backend
npm run db:seed --workspace backend

# Start backend
npm run dev:backend

# Start frontend (separate terminal)
npm run dev:frontend
```

Frontend runs at `http://localhost:5173`, backend API at `http://localhost:4000`.

## Verification Checklist

### US1 — Logout and Auth-Aware Navigation

1. Open http://localhost:5173
2. Click "Auth" in the navigation bar
3. Register a new account (email: `test@example.com`, password: `password123`, name: `Test`)
4. **Verify**: Navigation immediately updates — shows user email, hides "Auth" link
5. **Verify**: "Log Out" button is visible in the navigation bar
6. Click "Log Out"
7. **Verify**: Navigation immediately reverts — "Auth" link reappears, email and "Log Out" disappear
8. **Verify**: Browser redirects to the events list page (`/`)
9. Try navigating to `/organizer` directly
10. **Verify**: Redirected to `/auth` (protected route guard)

### US1 — Mobile Navigation

1. Resize browser to mobile width (<768px)
2. Open hamburger menu
3. **Verify**: "Log Out" button visible in mobile menu
4. Click "Log Out"
5. **Verify**: Same logout behavior as desktop

### US2 — Checkout Pricing

1. Log in as any user
2. Click on any event from the events list
3. Click "Book Now" on any tier (note the displayed price, e.g., "$25.00")
4. **Verify**: Checkout page shows the tier name and correct per-ticket price (matching the event details page)
5. Change quantity to 3
6. **Verify**: Subtotal updates to 3× the unit price (e.g., "$75.00")
7. Enter a valid discount code (if seeded data includes one)
8. **Verify**: Discount amount is subtracted from the total
9. **Verify**: Total is never negative

### US3 — Console Errors

1. Open browser developer console (F12 → Console tab)
2. Clear the console
3. Perform the full flow: browse events → view details → log in → checkout → log out
4. **Verify**: Zero console errors or warnings throughout

## Seed Data Reference

After running `npm run db:seed --workspace backend`, the database contains sample events with ticket tiers at various price points. Use these for testing checkout pricing.

## Quality Gates

```bash
# Run from repository root
npm run lint:cycles    # Check for circular imports
npm run lint           # ESLint (backend + frontend)
npm test               # Vitest (frontend) + Jest (backend)
npm run build --workspace frontend  # TypeScript compile + Vite production build
```

All gates must pass before the feature is considered complete.
