# Data Model: Navigation, Logout & Checkout Pricing Fixes

**Feature**: 002-fix-nav-pricing | **Date**: 2026-03-11

## Entities

### AuthState (new — React Context state)

Represents the current authentication state shared across the component tree.

| Field   | Type             | Description                                  |
|---------|------------------|----------------------------------------------|
| user    | `AuthUser │ null` | Current logged-in user or null when logged out |

**Methods provided by AuthProvider**:
- `login(user: AuthUser, token: string): void` — Sets auth token in apiClient + localStorage, stores user, updates context state.
- `logout(): void` — Clears auth token from apiClient + localStorage, clears stored user, sets context state to null, navigates to `/`.

**Relationships**: Consumed by `Navigation` (conditionally renders links/logout button), `AuthPage` (calls login), `CheckoutPage` (reads auth for protected access), and route guards (`RequireAuth`, `RequireRole`).

---

### AuthUser (existing — unchanged)

Represents a stored user profile.

| Field  | Type       | Description                |
|--------|------------|----------------------------|
| id     | `string`   | User UUID                  |
| email  | `string`   | User email address         |
| roles  | `string[]` | Role identifiers (`admin`, `organizer`, `attendee`) |

**Source**: `frontend/src/services/authSession.ts`

---

### TicketTier (existing — unchanged, used by CheckoutPage)

Represents a pricing tier within an event, returned by `GET /events/:eventId`.

| Field             | Type     | Description                                    |
|-------------------|----------|------------------------------------------------|
| id                | `string` | Tier UUID                                      |
| name              | `string` | Display name (e.g., "General Admission", "VIP") |
| priceMinor        | `number` | Price per ticket in minor currency units (cents)|
| remainingQuantity | `number` | Tickets still available                        |

**Source**: `frontend/src/services/attendeeApi.ts` (`EventDetailsResult.tiers[]`)

---

### CheckoutState (new — component-level state in CheckoutPage)

Represents the computed state of the checkout page.

| Field               | Type                  | Description                                    |
|---------------------|-----------------------|------------------------------------------------|
| tierName            | `string`              | Name of the selected tier                      |
| unitPriceMinor      | `number`              | Per-ticket price in minor currency units       |
| quantity            | `number`              | Number of tickets selected (≥ 1)               |
| subtotalMinor       | `number`              | Computed: `unitPriceMinor × quantity`           |
| discountCode        | `string │ undefined`  | Applied discount code                          |
| discountAmountMinor | `number`              | Discount amount returned by validate endpoint  |
| totalMinor          | `number`              | Computed: `max(0, subtotalMinor − discountAmountMinor)` |

**Validation rules**:
- `quantity` must be ≥ 1 (enforced by UI and clamped before computation)
- `totalMinor` must never be negative (clamped to 0)
- `unitPriceMinor` sourced from event details API; if fetch fails, show error state

**State transitions**:
- **Loading**: Checkout fetches event details → loading spinner shown
- **Ready**: Tier found → prices displayed, form active
- **Error**: Fetch failed or tier not found → error message, form disabled
- **Submitted**: Booking created → confirmation banner shown

## No New Database Entities

All changes are frontend-only. The existing backend schema is unchanged.
