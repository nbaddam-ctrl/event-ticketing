# Contracts: Navigation, Logout & Checkout Pricing Fixes

**Feature**: 002-fix-nav-pricing | **Date**: 2026-03-11

## No New API Contracts

This feature is entirely frontend-only. No new backend endpoints, request/response schemas, or API contract changes are required.

### Existing Endpoints Used (unchanged)

| Method | Endpoint              | Used By          | Relevant Response Fields        |
|--------|-----------------------|------------------|---------------------------------|
| GET    | `/events/:eventId`    | CheckoutPage     | `tiers[].id`, `tiers[].name`, `tiers[].priceMinor` |
| POST   | `/auth/login`         | AuthPage         | `token`, `user.id`, `user.email`, `user.roles` |
| POST   | `/auth/register`      | AuthPage         | `token`, `user.id`, `user.email`, `user.roles` |
| POST   | `/bookings`           | CheckoutPage     | booking confirmation            |
| POST   | `/discounts/validate` | DiscountCodeInput| `valid`, `discountAmountMinor`  |

### New Frontend Interface: AuthContext

This is a React Context interface, not an API contract, but documented here for completeness:

```typescript
interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}
```

**Provider**: `AuthProvider` wraps the app in `main.tsx`.  
**Consumers**: `Navigation`, `AuthPage`, route guards.
