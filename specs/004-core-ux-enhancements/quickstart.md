# Quickstart: Core UX Enhancements

**Feature**: 004-core-ux-enhancements
**Date**: 2026-03-17

## File Manifest

### New Files
| File | Purpose |
|------|---------|
| frontend/src/components/app/EventSearchFilters.tsx | Search bar + date/price filter controls + clear-all button |

### Modified Files (Backend)
| File | Changes |
|------|---------|
| backend/src/domain/types.ts | Add `'booking_cancelled'` to NotificationType |
| backend/src/repositories/bookingRepository.ts | Add `getBookingById`, `cancelBookingAtomically` |
| backend/src/repositories/discountRepository.ts | Add `decrementDiscountUsage` |
| backend/src/repositories/eventRepository.ts | Add `listFilteredEvents`, `countFilteredEvents`, `listOrganizerEvents`, `countOrganizerEvents` |
| backend/src/repositories/refundRepository.ts | Add `reason` parameter to `createRefundRequest` |
| backend/src/services/bookingService.ts | Add `cancelBooking` function |
| backend/src/services/eventService.ts | Extend `browseEvents` with filter params, update `getEventDetails` to allow cancelled events |
| backend/src/services/organizerEventService.ts | Add `listOrganizerEvents` function |
| backend/src/api/routes/bookingRoutes.ts | Add `POST /:id/cancel` route |
| backend/src/api/routes/eventRoutes.ts | Add search/filter query params to `GET /events` |
| backend/src/api/routes/organizerEventRoutes.ts | Add `GET /events/mine` route |

### Modified Files (Frontend)
| File | Changes |
|------|---------|
| frontend/src/services/attendeeApi.ts | Add `cancelBooking`, update `listEvents` with filter params, add types |
| frontend/src/services/organizerApi.ts | Add `listOrganizerEvents` function and types |
| frontend/src/pages/EventListPage.tsx | Integrate EventSearchFilters, pass filter state to API |
| frontend/src/pages/EventDetailsPage.tsx | Allow cancelled events, show cancellation banner |
| frontend/src/pages/MyBookingsPage.tsx | Add cancel button with confirmation dialog, status sorting, richer cards |
| frontend/src/pages/OrganizerDashboardPage.tsx | Add organizer events list section |

## Database Changes

**No new tables or columns.** Existing schema is sufficient. New notification type `'booking_cancelled'` and refund reason `'user_cancelled'` use existing TEXT columns.

## API Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /bookings/:id/cancel | Required | Cancel a confirmed booking |
| GET | /events | None | Browse events (+ search, dateFrom, dateTo, minPrice, maxPrice, includePast) |
| GET | /events/:eventId | None | Event details (now includes cancelled events) |
| GET | /events/mine | Required (organizer) | List organizer's own events |

## Verification Steps

### 1. Backend compiles
```bash
cd backend && npx tsc --noEmit
```
Expected: No errors

### 2. Frontend compiles
```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors

### 3. No dependency cycles
```bash
npm run lint:cycles
```
Expected: No circular dependency errors

### 4. Booking cancellation — happy path
```bash
# Register user, purchase ticket, then cancel
POST /bookings/:bookingId/cancel (with Bearer token)
```
Expected: 200 with `{ bookingId, status: 'cancelled', refundId, refundAmountMinor }`

### 5. Booking cancellation — already cancelled
```bash
POST /bookings/:bookingId/cancel (same booking again)
```
Expected: 409 Conflict

### 6. Booking cancellation — not owned
```bash
POST /bookings/:bookingId/cancel (with different user's token)
```
Expected: 404 Not Found

### 7. Event search
```bash
GET /events?search=concert
```
Expected: 200 with filtered events matching "concert" in title or description

### 8. Event filters combined
```bash
GET /events?search=concert&dateFrom=2026-01-01&maxPrice=10000
```
Expected: 200 with events matching ALL criteria, correct total count

### 9. Organizer events list
```bash
GET /events/mine (with organizer Bearer token)
```
Expected: 200 with organizer's events including totalCapacity and totalSold

### 10. Cancelled event detail
```bash
GET /events/:cancelledEventId
```
Expected: 200 with event data including `status: 'cancelled'` and `cancellationReason`
