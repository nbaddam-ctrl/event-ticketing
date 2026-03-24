# Implementation Plan: Event End Date Display

**Feature Branch**: `007-event-end-date`  
**Created**: 2026-03-24

## Overview

Display the event end date (`endAt`) alongside the start date in the event details page summary card. The `endAt` field already exists in the database, backend domain types, API responses, and frontend `EventDetailsResult` TypeScript type — it just isn't rendered.

## Tech Stack

- **Frontend**: React 18, TypeScript 5.8, Tailwind CSS, Framer Motion
- **Backend**: No changes needed

## Scope

### In Scope

- Render `endAt` in the event summary card on `EventDetailsPage.tsx`
- Smart date formatting: same-day events show time range, multi-day events show date range
- Create a reusable `formatDateRange` utility function in `frontend/src/lib/`
- Graceful fallback when `endAt` is missing

### Out of Scope

- EventCard on the list page (only shows `startAt` — no change requested)
- Backend/API changes (data already flows correctly)
- Organizer form (already supports `endAt` input)

## Project Structure (affected files)

```
frontend/src/
  lib/
    formatDateRange.ts          ← NEW: date range formatting utility
  pages/
    EventDetailsPage.tsx        ← MODIFY: render endAt in summary card
```

## Implementation Approach

1. Create a `formatDateRange(startAt, endAt)` utility that:
   - Returns `"TBA"` if no `startAt`
   - Returns just the start date if no `endAt` or if `endAt === startAt`
   - Returns `"Mar 24, 2026 · 6:00 PM – 10:00 PM"` for same-day events
   - Returns `"Mar 24 – Mar 26, 2026"` for multi-day events

2. Update `EventDetailsPage.tsx` to use `formatDateRange(data.startAt, data.endAt)` in the Calendar summary item

## Dependencies

No new npm packages. Uses native `Intl.DateTimeFormat` / `Date.toLocaleDateString()`.
