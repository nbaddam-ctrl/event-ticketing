# Research: Navigation, Logout & Checkout Pricing Fixes

**Feature**: 002-fix-nav-pricing | **Date**: 2026-03-11

## Research Tasks

### 1. Auth State Management Pattern for React Navigation

**Question**: How should Navigation reactively update when auth state changes (login/logout) without full page reload?

**Decision**: Introduce a React Context (`AuthContext`) that holds the current `AuthUser | null` state and exposes `login()` / `logout()` actions. Navigation consumes this context to conditionally render links and the logout button. AuthPage calls context `login()` instead of directly writing to localStorage + doing `window.location.assign`.

**Rationale**: React Context is the standard React approach for sharing state across components without prop drilling. It's lightweight (no external state library needed), idiomatic for this codebase, and ensures any component consuming the context re-renders when auth state changes. The current approach (reading `localStorage` directly in component bodies) doesn't trigger re-renders because `localStorage` changes are invisible to React's reconciler.

**Alternatives considered**:
- **Custom event emitter (pub/sub)**: Would work but requires manual subscription/unsubscription in useEffect hooks — more boilerplate, less idiomatic React.
- **Zustand/Jotai/Redux**: Overkill for a single slice of state. Adds a dependency for a problem React Context solves natively.
- **useSyncExternalStore with localStorage**: Technically correct but over-engineered for the use case and wouldn't simplify the implementation compared to Context.

---

### 2. Checkout Page Pricing Data Source

**Question**: How should the checkout page obtain the tier's per-ticket price?

**Decision**: Call `getEventDetails(eventId)` on CheckoutPage mount, find the matching tier by `tierId`, and extract `priceMinor`. Store it in component state alongside a loading/error state. Compute subtotal as `priceMinor × quantity` and total as `subtotal − discountAmountMinor`.

**Rationale**: The `GET /events/:eventId` endpoint already returns `tiers[].priceMinor` (confirmed in `eventService.ts` and `attendeeApi.ts`). The function `getEventDetails` already exists in `attendeeApi.ts`. This avoids creating a new API endpoint. The only cost is one additional API call on checkout mount, which is acceptable given the data is small and cacheable.

**Alternatives considered**:
- **Pass price via React Router state (Link state prop)**: Fragile — if user navigates directly to checkout URL or refreshes, the state is lost. Would still need a fallback fetch.
- **Create a new `/tiers/:tierId` endpoint**: Unnecessary — the event details endpoint already contains all needed data. Adding an endpoint violates the "no backend changes" constraint.
- **Store price in URL params**: Exposes price manipulation risk (user could edit URL). Not trustworthy for display.

---

### 3. Navigation Logout UX Pattern

**Question**: What should happen when the user clicks "Log Out"?

**Decision**: 
1. Clear auth token from `apiClient.ts` module-level variable via `setAuthToken(null)`.
2. Clear stored user via `setStoredUser(null)`.
3. Update AuthContext state to `null` (triggers re-render of all consumers including Navigation).
4. Navigate to `/` via React Router's `useNavigate`.

**Rationale**: This ensures all three storage layers are cleared (module variable, localStorage token, localStorage user) and the React state tree is notified. Using `useNavigate('/')` keeps it a client-side transition without a full page reload.

**Alternatives considered**:
- **`window.location.assign('/')` (current pattern in AuthPage)**: Forces full page reload — defeats the purpose of SPA reactivity. This is exactly what we're fixing.
- **Only clear localStorage without updating Context**: Would leave a stale auth state in React until next render cycle or page refresh.

---

### 4. Console Error Identification

**Question**: What console errors exist in the current application?

**Decision**: Based on codebase analysis, the following issues will produce console errors or warnings:
1. **Negative total in OrderSummary**: `total={0 - discountAmountMinor}` produces negative values displayed as negative dollar amounts.
2. **`window.location.assign` in ConfirmationBanner callbacks**: Not a console error per se, but causes full page reloads that lose React state — should be replaced with `useNavigate`.
3. **Potential React key warnings**: The `navItems` array uses `item.to` as key — this is fine, but the `OrderSummary` items use array index as key (`idx`) which can cause warnings if items reorder (low risk here).
4. **Missing quantity guard**: Quantity input accepts values < 1 if user types directly (the `min={1}` attribute doesn't prevent typed input).

**Rationale**: These issues were identified by static analysis of the codebase. Runtime testing may reveal additional issues; the implementation should include a manual verification pass.

**Alternatives considered**: N/A — this is a diagnostic task, not a design decision.

---

### 5. apiClient Module-Level Token Sync

**Question**: The `apiClient.ts` module caches `authToken` in a module-level variable initialized at import time. How should logout ensure this is cleared?

**Decision**: The existing `setAuthToken(null)` function already handles this — it sets the module-level variable to `null` and calls `setStoredToken(null)`. The AuthContext `logout()` function will call `setAuthToken(null)` to ensure synchronization.

**Rationale**: No new mechanism needed. The existing function handles both the in-memory and localStorage layers. The Context layer adds the React reactivity on top.

**Alternatives considered**:
- **Remove module-level cache entirely, read from localStorage on each request**: Slower (synchronous localStorage read on every API call) and doesn't solve the React reactivity problem.
