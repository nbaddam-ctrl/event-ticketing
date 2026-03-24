# Quickstart - Event Ticket Booking Web App

## Prerequisites
- Node.js 22 LTS
- npm 10+
- SQLite 3

## 1) Install dependencies

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

## 2) Configure environment

Create `backend/.env`:

```env
PORT=4000
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=1h
DATABASE_URL=./data/event-ticketing.db
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

## 3) Initialize database

```bash
cd backend
npm run db:migrate
npm run db:seed
```

## 4) Run services

```bash
# backend
cd backend
npm run dev

# frontend
cd ../frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- OpenAPI (static/served): `/api-docs` or from `specs/001-event-ticket-booking/contracts/openapi.yaml`

Note: Route guards are active for checkout and role-protected organizer/admin views;
authenticate first via `/auth` in the frontend.

## 5) Validate core flows

### Attendee purchase flow
1. Register user via UI or `POST /auth/register`.
2. Login and obtain JWT.
3. Browse `GET /events`, open event details `GET /events/{eventId}`.
4. Purchase via `POST /bookings` with quantity within availability.
5. Verify booking status via `GET /bookings/{bookingId}`.

### Organizer flow
1. Register/login as regular user.
2. Request organizer role via `POST /organizer/requests`.
3. Admin approves organizer role (admin workflow).
4. Create event via `POST /events`.
5. Cancel event via `POST /events/{eventId}/cancel` and confirm refund status progression.

### Waitlist and discounts
1. Exhaust a tier inventory.
2. Join waitlist via `POST /waitlist`.
3. Free inventory and verify FIFO promotion + 30-minute reservation hold.
4. Validate one discount code via `POST /discounts/validate` and purchase with single code.

## 6) Run tests

```bash
# backend
cd backend
npm test

# frontend
cd ../frontend
npm test

# contract checks
cd ..
npm run test:contract
```

## 7) Quality gates

```bash
# lint + cycle checks
npm run lint
npm run lint:cycles
```

Expected outcomes:
- No circular dependency violations
- JWT-protected routes return 401/403 correctly
- Oversell attempts return 409 and do not create partial bookings
- Organizer cancellation issues full refunds to original payment method

## 8) Validation checklist (2026-03-09)

- [x] `npm run db:migrate --workspace backend`
- [x] `npm run db:seed --workspace backend`
- [x] `npm run build --workspace backend`
- [x] `npm run build --workspace frontend`
- [x] `npm run lint`
- [x] `npm run lint:cycles`
- [x] `npm test`
- [x] `GET /health` returned `{ "ok": true }`
- [x] `GET /events` returned seeded published events
