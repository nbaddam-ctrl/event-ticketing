# Tasks: In-App Notifications

**Input**: Design documents from `/specs/003-notifications/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema change and shared type definitions needed by all subsequent phases.

- [x] T001 Add notifications table definition with indexes (idx_notifications_user_unread, idx_notifications_user_created) to backend/src/db/schema.sql
- [x] T002 [P] Add NotificationType, NotificationReferenceType, and Notification interface to backend/src/domain/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend notification CRUD infrastructure (repository, service, routes) and frontend API client. MUST be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create notificationRepository with insert, findByUserId (paginated), countUnreadByUserId, markReadById, and markAllReadByUserId functions in backend/src/repositories/notificationRepository.ts
- [x] T004 Create notificationService with createNotification, createNotificationsForAdmins, getNotifications, getUnreadCount, markAsRead, and markAllAsRead functions in backend/src/services/notificationService.ts
- [x] T005 Create notification REST routes (GET /, GET /unread-count, PATCH /:id/read, PATCH /read-all) with Zod validation and requireAuth middleware in backend/src/api/routes/notificationRoutes.ts
- [x] T006 Mount notificationRoutes at /notifications in backend/src/app.ts
- [x] T007 [P] Create notification API client functions (fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead) in frontend/src/services/notificationApi.ts
- [x] T008 [P] Add formatRelativeTime utility function to frontend/src/lib/utils.ts

**Checkpoint**: Backend notification endpoints functional (testable via curl/Postman), frontend API client ready. All user story phases can now begin.

---

## Phase 3: User Story 6 — Notification Center UI (Priority: P1) 🎯 MVP

**Goal**: Add a notification bell icon with unread badge and dropdown panel to the navigation bar for all authenticated users.

**Independent Test**: Log in as any user, manually insert a notification row in the DB, verify the bell icon shows a badge count, click to open the dropdown, verify the notification renders with correct type icon, message, and relative timestamp. Mark as read and verify the badge decrements.

### Implementation for User Story 6

- [x] T009 [P] [US6] Create NotificationItem component with type-specific icons and colors (per research.md type mapping), message text, relative timestamp, read/unread styling, and click-through navigation in frontend/src/components/app/NotificationItem.tsx
- [x] T010 [US6] Create NotificationPanel dropdown component with scrollable notification list, "Load more" pagination, "Mark all as read" button, and empty state in frontend/src/components/app/NotificationPanel.tsx
- [x] T011 [US6] Create NotificationBell component with lucide-react Bell icon, unread count badge, 30-second polling via setInterval, and panel toggle in frontend/src/components/app/NotificationBell.tsx
- [x] T012 [US6] Integrate NotificationBell into desktop and mobile navigation layouts in frontend/src/components/app/Navigation.tsx

**Checkpoint**: Notification bell visible for logged-in users, badge shows unread count, dropdown panel renders notification list with mark-as-read interactions. US6 acceptance scenarios 1–6 verifiable.

---

## Phase 4: User Story 1 — Admin Receives Notification for New Organizer Requests (Priority: P1)

**Goal**: When an attendee submits an organizer role request, all admin users receive a persistent in-app notification with click-through to the Admin Organizer Requests page.

**Independent Test**: Register as an attendee, submit an organizer request. Log in as admin. Verify GET /notifications returns an organizer_request_submitted notification with navigation_path "/admin/organizer-requests". Verify the bell badge increments in the UI.

### Implementation for User Story 1

- [x] T013 [US1] Add fire-and-forget organizer_request_submitted notification for all admin users after request creation in backend/src/services/organizerService.ts

**Checkpoint**: Submitting an organizer request creates notification rows for every admin user. US1 acceptance scenarios 1–5 verifiable.

---

## Phase 5: User Story 2 — User Notified When Organizer Request Is Approved or Rejected (Priority: P1)

**Goal**: When an admin approves or rejects an organizer request, the requesting user receives a notification with the decision outcome and optional reason.

**Independent Test**: As admin, approve or reject a pending organizer request. Log in as the requesting user. Verify GET /notifications returns an organizer_request_approved or organizer_request_rejected notification with correct message including the decision reason.

### Implementation for User Story 2

- [x] T014 [US2] Add fire-and-forget organizer_request_approved/rejected notification for requesting user after admin decision in backend/src/services/adminOrganizerService.ts

**Checkpoint**: Admin decision creates the correct notification type for the requesting user. US2 acceptance scenarios 1–4 verifiable.

---

## Phase 6: User Story 3 — Booking Confirmation Notification (Priority: P2)

**Goal**: After a successful ticket purchase, the booking user receives a notification confirming the booking with event name, tier, quantity, and total paid.

**Independent Test**: Purchase a ticket as an attendee. Verify GET /notifications returns a booking_confirmed notification with the correct event name, tier name, quantity, and total amount. Verify navigation_path is "/my-bookings".

### Implementation for User Story 3

- [x] T015 [US3] Add fire-and-forget booking_confirmed notification with event name, tier name, quantity, and total paid after successful purchase in backend/src/services/bookingService.ts

**Checkpoint**: Completing a booking creates a booking_confirmed notification. US3 acceptance scenarios 1–2 verifiable.

---

## Phase 7: User Story 4 — Event Cancellation Notification (Priority: P2)

**Goal**: When an event is cancelled, every attendee with a confirmed booking receives a notification with the event name, cancellation reason, and refund amount.

**Independent Test**: Create an event with bookings from multiple users. Cancel the event. Verify each affected user has an event_cancelled notification with the correct refund amount. Verify users without bookings have no notification.

### Implementation for User Story 4

- [x] T016 [US4] Add fire-and-forget event_cancelled notification for each attendee with a confirmed booking (including cancellation reason and per-booking refund amount) after event cancellation in backend/src/services/organizerEventService.ts

**Checkpoint**: Cancelling an event creates one notification per affected attendee. US4 acceptance scenarios 1–3 verifiable.

---

## Phase 8: User Story 5 — Waitlist Promotion & Expiry Notifications (Priority: P3)

**Goal**: When a waitlisted user is promoted (capacity opens), they receive a notification with event, tier, available quantity, and reservation expiry. When a reservation expires, they receive an expiry notification.

**Independent Test**: Promote a waitlisted user by cancelling a booking for a sold-out tier. Verify the promoted user receives a waitlist_promoted notification with the reservation deadline. Simulate expiry and verify a waitlist_expired notification is created.

### Implementation for User Story 5

- [x] T017 [US5] Add fire-and-forget waitlist_promoted notification with event name, tier name, available quantity, and reservation expiry after waitlist promotion in backend/src/services/waitlistService.ts
- [x] T018 [US5] Add fire-and-forget waitlist_expired notification when a waitlist reservation expires in backend/src/services/waitlistService.ts

**Checkpoint**: Waitlist promotion and expiry both create the correct notification types. US5 acceptance scenarios 1–2 verifiable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validation, dependency hygiene, and end-to-end verification across all stories.

- [x] T019 [P] Run dependency cycle detection (npm run lint:cycles) and verify no circular imports introduced by notification service integrations
- [x] T020 [P] Verify all 7 notification types render correctly in NotificationPanel with correct lucide-react icons, Tailwind colors, messages, and navigation paths per research.md type mapping
- [x] T021 Run quickstart.md verification steps 1–10 for end-to-end validation of schema, endpoints, UI, polling, and navigation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US6 (Phase 3)**: Depends on Foundational (T007, T008 specifically). Provides the UI for viewing notifications
- **US1 (Phase 4)**: Depends on Foundational (T004 specifically). Independent of US6 (backend-only)
- **US2 (Phase 5)**: Depends on Foundational (T004 specifically). Independent of US1 and US6 (backend-only)
- **US3 (Phase 6)**: Depends on Foundational (T004 specifically). Independent of US1, US2, US6
- **US4 (Phase 7)**: Depends on Foundational (T004 specifically). Independent of US1–US3, US6
- **US5 (Phase 8)**: Depends on Foundational (T004 specifically). Independent of US1–US4, US6
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US6 (P1)**: Depends only on Foundational — no dependencies on other stories
- **US1 (P1)**: Depends only on Foundational — no dependencies on other stories
- **US2 (P1)**: Depends only on Foundational — no dependencies on other stories
- **US3 (P2)**: Depends only on Foundational — no dependencies on other stories
- **US4 (P2)**: Depends only on Foundational — no dependencies on other stories
- **US5 (P3)**: Depends only on Foundational — no dependencies on other stories

**Key insight**: All user stories (US1–US6) are fully independent of each other — they modify different files and share only the foundational notification infrastructure. They can all proceed in parallel after Phase 2.

### Within Each User Story

- Models/types before repository (Phase 1 → Phase 2)
- Repository before service (T003 → T004)
- Service before routes (T004 → T005)
- Routes before app mount (T005 → T006)
- API client before UI components (T007 → T009–T012)
- NotificationItem before NotificationPanel (T009 → T010)
- NotificationPanel before NotificationBell (T010 → T011)
- NotificationBell before Navigation integration (T011 → T012)

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 2**: T007 and T008 can run in parallel with each other AND with T003–T006 (frontend vs backend)
- **Phases 3–8**: All six user stories can run in parallel after Phase 2 completes (all modify different files)
- **Phase 4–8 specifically**: T013, T014, T015, T016, T017/T018 all modify different backend service files — fully parallelizable
- **Phase 9**: T019 and T020 can run in parallel

---

## Parallel Example: After Foundational Phase

```text
# All user story phases can launch simultaneously after Phase 2:

# Frontend (US6):
Task T009: NotificationItem.tsx     ─┐
Task T010: NotificationPanel.tsx     │ (sequential within US6)
Task T011: NotificationBell.tsx      │
Task T012: Navigation.tsx           ─┘

# Backend triggers (US1–US5) — all in parallel:
Task T013: organizerService.ts         (US1)
Task T014: adminOrganizerService.ts    (US2)
Task T015: bookingService.ts           (US3)
Task T016: organizerEventService.ts    (US4)
Task T017: waitlistService.ts          (US5)
Task T018: waitlistService.ts          (US5, same file as T017 — sequential)
```

---

## Implementation Strategy

### MVP First (US6 + US1 + US2)

1. Complete Phase 1: Setup (schema + types)
2. Complete Phase 2: Foundational (repo, service, routes, API client, utilities)
3. Complete Phase 3: US6 (Notification Center UI)
4. Complete Phase 4: US1 (Admin organizer request notifications)
5. Complete Phase 5: US2 (User approval/rejection notifications)
6. **STOP and VALIDATE**: All P1 stories complete — test end-to-end with the primary user-requested flows
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Backend endpoints functional
2. Add US6 → Notification UI visible and interactive (MVP UI!)
3. Add US1 → Admin sees organizer request notifications (MVP trigger 1!)
4. Add US2 → Users see approval/rejection notifications (MVP trigger 2!)
5. Add US3 → Booking confirmation notifications (P2 enhancement)
6. Add US4 → Event cancellation notifications (P2 enhancement)
7. Add US5 → Waitlist promotion/expiry notifications (P3 enhancement)
8. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within the same phase
- [Story] label maps task to specific user story for traceability
- All user stories are independently completable and testable after Phase 2
- Fire-and-forget pattern: notification inserts happen OUTSIDE primary transactions, wrapped in try/catch with console.warn on failure
- notificationService is a leaf dependency — existing services import it, never the reverse
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
