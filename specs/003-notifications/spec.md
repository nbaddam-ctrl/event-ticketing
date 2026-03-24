# Feature Specification: In-App Notifications

**Feature Branch**: `003-notifications`  
**Created**: 2026-03-12  
**Status**: Draft  
**Input**: User description: "Add functionality to implement notifications. User should receive proper notification for different flows. Add persistent notifications for approval requests received by admin and also notify user when their request is approved."

## Clarifications

### Session 2026-03-12

- Q: How should new notifications surface while a user is already on a page (beyond initial page load)? → A: Periodic background polling of unread count every 30 seconds while the page is open.
- Q: Should all notification types support click-through navigation to a relevant page? → A: Yes, all types navigate to a contextual page (organizer request → Admin Requests, approval decision → Organizer Dashboard, booking → My Bookings, event cancelled → Event Details, waitlist → Event Details).
- Q: Should users be able to delete notifications, or only mark them as read? → A: No deletion in MVP — users can only mark as read/unread. Old notifications scroll off via pagination.
- Q: If notification creation fails, should the primary operation (booking, approval, etc.) also fail? → A: No — primary operation always succeeds; notification failure is logged as a warning but silently swallowed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Receives Notification for New Organizer Requests (Priority: P1)

An admin user logs in and sees a notification indicator (e.g., a bell icon with an unread count) in the navigation bar. When a new organizer role request is submitted by any user, the admin receives a persistent in-app notification alerting them that a new request is pending review. The admin can click the notification to navigate directly to the organizer requests management page. Notifications persist until the admin explicitly marks them as read or dismisses them.

**Why this priority**: The user explicitly requested persistent notifications for admin approval requests. Currently, admins have no awareness of incoming organizer requests and must manually poll the requests page, which delays approvals and creates a poor experience.

**Independent Test**: Can be fully tested by having an attendee submit an organizer request and verifying the admin sees a notification badge with the correct count and can navigate to the requests page from the notification.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** an attendee submits an organizer role request, **Then** the admin sees the notification count increment and a new notification appears describing the request.
2. **Given** an admin has unread notifications, **When** the admin views the notification list, **Then** each notification shows the requester's name, the request type, and the time it was created.
3. **Given** an admin clicks on an organizer request notification, **When** the notification panel interaction occurs, **Then** the admin is navigated to the Admin Organizer Requests page.
4. **Given** an admin has read a notification, **When** the admin marks it as read, **Then** the unread count decreases and the notification visual state changes to indicate it has been read.
5. **Given** an admin closes and reopens the browser, **When** the admin logs back in, **Then** all previously unread notifications are still visible and unread (persistence).

---

### User Story 2 - User Notified When Organizer Request Is Approved or Rejected (Priority: P1)

A user who has submitted an organizer role request receives a persistent in-app notification when an admin approves or rejects their request. The notification clearly states the decision outcome (approved or rejected) and includes the optional reason provided by the admin. The notification persists until the user reads or dismisses it.

**Why this priority**: The user explicitly requested that users be notified when their organizer request is approved. Currently, users are told to "check back soon" with no way to know when a decision has been made.

**Independent Test**: Can be fully tested by having an admin approve or reject a pending organizer request and verifying the requesting user sees a notification with the correct decision and reason.

**Acceptance Scenarios**:

1. **Given** a user has a pending organizer request, **When** an admin approves the request, **Then** the user receives a notification stating their organizer request has been approved.
2. **Given** a user has a pending organizer request, **When** an admin rejects the request with a reason, **Then** the user receives a notification stating the rejection and including the admin's reason.
3. **Given** a user has an unread approval notification, **When** the user logs in on a new session, **Then** the notification is still visible and marked as unread (persistence).
4. **Given** a user reads the approval notification, **When** they mark it as read, **Then** the unread count updates accordingly.

---

### User Story 3 - User Notified on Booking Confirmation (Priority: P2)

After a user successfully purchases a ticket, they receive an in-app notification confirming their booking. The notification includes the event name, ticket tier, quantity, and total amount paid. This provides immediate acknowledgment beyond the page redirect.

**Why this priority**: Booking confirmation is the most common transaction in the system. While the user is already redirected to My Bookings, a notification provides a persistent reference and reinforces confidence in the transaction.

**Independent Test**: Can be fully tested by completing a ticket purchase and verifying a notification appears with the correct booking details.

**Acceptance Scenarios**:

1. **Given** a user completes a ticket purchase, **When** the booking is confirmed, **Then** a notification appears with the event name, tier name, quantity, and total paid.
2. **Given** a user has booking confirmation notifications, **When** the user views the notification list, **Then** all past booking confirmations are listed in reverse chronological order.

---

### User Story 4 - User Notified on Event Cancellation (Priority: P2)

When an organizer or admin cancels an event, all attendees who had confirmed bookings for that event receive a notification informing them that the event has been cancelled and that a refund has been initiated. The notification includes the event name, cancellation reason (if provided), and refund details.

**Why this priority**: Event cancellations directly impact users financially and logistically. Currently, attendees only discover cancellations when viewing their bookings page — they have no proactive alert.

**Independent Test**: Can be fully tested by cancelling an event with existing bookings and verifying all affected attendees receive notifications with correct cancellation and refund information.

**Acceptance Scenarios**:

1. **Given** a user has a confirmed booking for an event, **When** the event is cancelled, **Then** the user receives a notification with the event name, cancellation reason, and refund amount.
2. **Given** multiple users have bookings for an event, **When** the event is cancelled, **Then** each affected user receives their own notification.
3. **Given** a user has no bookings for a cancelled event, **When** the event is cancelled, **Then** the user does not receive a notification.

---

### User Story 5 - Waitlist Promotion Notification (Priority: P3)

When capacity becomes available for a sold-out ticket tier and a waitlisted user is promoted, the user receives a notification informing them that tickets are now available for them. The notification includes the event name, tier name, the number of tickets available to claim, and the reservation expiry time.

**Why this priority**: Waitlist promotion has a time-sensitive reservation window (30 minutes). Without a notification, users have no way of knowing they've been promoted and their reservation may expire unused.

**Independent Test**: Can be fully tested by promoting a waitlisted user and verifying they receive a notification with the correct event, tier, and reservation expiry details.

**Acceptance Scenarios**:

1. **Given** a user is on the waitlist for a ticket tier, **When** capacity becomes available and the user is promoted, **Then** the user receives a notification with the event name, tier name, available quantity, and reservation expiry deadline.
2. **Given** a user's waitlist reservation has expired, **When** the expiry is detected, **Then** the user receives a notification that their reservation has expired.

---

### User Story 6 - Notification Center UI (Priority: P1)

All authenticated users see a notification bell icon in the application header/navigation bar. The bell icon displays an unread notification count badge. Clicking the bell opens a notification panel or dropdown showing recent notifications in reverse chronological order. Each notification displays an icon/type indicator, a message, a relative timestamp, and a read/unread visual indicator. Users can mark individual notifications as read or mark all as read.

**Why this priority**: This is the foundational UI element that enables all other notification stories. Without the notification center, users have no way to access or interact with notifications.

**Independent Test**: Can be fully tested by verifying the bell icon appears for logged-in users, the dropdown renders notifications, and mark-as-read interactions work correctly.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** the page loads, **Then** a notification bell icon is visible in the navigation area.
2. **Given** a user has 3 unread notifications, **When** the page loads, **Then** the bell icon displays a badge with the number "3".
3. **Given** a user has no unread notifications, **When** the page loads, **Then** the bell icon appears without a count badge.
4. **Given** a user clicks the bell icon, **When** the notification panel opens, **Then** notifications are displayed in reverse chronological order with type indicator, message, relative time, and read status.
5. **Given** a user clicks "Mark all as read", **When** the action completes, **Then** all notifications change to read state and the unread count badge disappears.
6. **Given** an unauthenticated visitor, **When** viewing any page, **Then** no notification bell icon is shown.

---

### Edge Cases

- What happens when a user has hundreds of notifications? The notification panel should support pagination or lazy-loading to avoid performance issues; only the most recent notifications (e.g., 50) should load initially.
- What happens when a notification references a deleted or cancelled event? The notification message should remain readable with the original event name, but navigation to the event may show a "not found" or "cancelled" state.
- What happens if two admins exist and an organizer request comes in? Both admins receive the notification independently.
- What happens when a user marks a notification as read on one device/session? On their next page load or session, the notification should reflect the updated read state.
- What happens if an admin approves a request but the requesting user's account has been deleted? The notification creation should gracefully skip non-existent users.
- What happens when notifications are created while a user is offline? They are stored persistently and displayed when the user next loads the application.
- What happens if notification creation fails during a primary operation (e.g., booking)? The primary operation succeeds regardless; the notification failure is logged as a warning for operational monitoring, and the user simply does not receive that notification.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a notification bell icon with unread count badge in the navigation bar for all authenticated users.
- **FR-002**: System MUST display a notification panel when the bell icon is clicked, showing notifications in reverse chronological order.
- **FR-003**: System MUST persist notifications so they survive page reloads and new sessions.
- **FR-004**: System MUST allow users to mark individual notifications as read.
- **FR-005**: System MUST allow users to mark all notifications as read in a single action.
- **FR-006**: System MUST create a notification for all admin users when an organizer role request is submitted.
- **FR-007**: System MUST create a notification for the requesting user when their organizer request is approved or rejected, including the decision reason if provided.
- **FR-008**: System MUST create a notification for the booking user when a ticket purchase is confirmed, including event name, tier, quantity, and total paid.
- **FR-009**: System MUST create a notification for each affected attendee when an event is cancelled, including event name, cancellation reason, and refund amount.
- **FR-010**: System MUST create a notification for waitlisted users when they are promoted, including event name, tier, available quantity, and reservation deadline.
- **FR-011**: System MUST create a notification for waitlisted users when their reservation expires.
- **FR-012**: System MUST support pagination for the notification list to handle large volumes of notifications.
- **FR-013**: System MUST return the current unread notification count without requiring the full notification list to be loaded.
- **FR-014**: System MUST only show notifications belonging to the authenticated user; users MUST NOT see other users' notifications.
- **FR-015**: System MUST visually distinguish between read and unread notifications in the UI.
- **FR-016**: System MUST display a relative timestamp (e.g., "5 minutes ago", "2 hours ago") for each notification.
- **FR-017**: System MUST support different notification types with distinct visual indicators (e.g., icons or colors for booking, approval, cancellation, waitlist).
- **FR-018**: System MUST support click-through navigation on all notification types, linking to a contextually relevant page: organizer request notifications → Admin Organizer Requests page, approval/rejection notifications → Organizer Dashboard, booking confirmations → My Bookings, event cancellation → Event Details, waitlist promotion/expiry → Event Details.

### Key Entities

- **Notification**: Represents a single in-app notification addressed to a specific user. Key attributes: recipient user, notification type, title, message body, read/unread status, reference to related resource (event, booking, organizer request), navigation target path, creation timestamp, read timestamp.
- **Notification Type**: A categorization of notifications that determines the visual treatment and behavior. Types include: organizer_request_submitted, organizer_request_approved, organizer_request_rejected, booking_confirmed, event_cancelled, waitlist_promoted, waitlist_expired.

### Constitution Alignment *(mandatory)*

- **CA-Frontend**: The notification bell icon, badge, and dropdown panel will be implemented as React components in TypeScript with typed props and state. Notification data types will be defined with compile-time type safety.
- **CA-Backend**: Notification endpoints will be implemented as Node.js + Express REST routes. Request parameters (pagination, filter) and response shapes will be validated.
- **CA-Separation**: The frontend will consume notification data exclusively through API client calls. Notification creation happens on the backend as a side effect of existing service operations. The frontend only reads and updates (mark as read) notifications.
- **CA-Auth**: All notification endpoints will require JWT authentication. Users can only access their own notifications. Unauthorized access to another user's notifications will return 401/403 responses.
- **CA-REST**: Notification endpoints will follow RESTful conventions: `GET /notifications` (list with pagination), `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`. Appropriate HTTP status codes (200, 204, 401, 403, 404) will be used.
- **CA-Dependencies**: Notification creation logic will be encapsulated in a notification service module. Existing services (booking, organizer, event, waitlist) will call the notification service — not the reverse. No circular dependencies will be introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins see new organizer request notifications within 5 seconds of page load after a request is submitted (no manual refresh required to discover new requests on next visit).
- **SC-002**: Users see organizer approval/rejection notifications on their next login or page load after a decision is made, eliminating the need to manually check request status.
- **SC-003**: 100% of booking confirmations, event cancellations, and waitlist promotions result in corresponding notifications being created for affected users.
- **SC-004**: Users can access and interact with at least their 50 most recent notifications without noticeable delay (under 2 seconds for the notification panel to render).
- **SC-005**: Notification read state is consistent across sessions — marking a notification as read persists immediately and is reflected on all subsequent page loads.
- **SC-006**: The notification unread count badge accurately reflects the number of unread notifications at all times, with no stale or incorrect counts after user interactions.

## Assumptions

- **A-001**: Notifications will be delivered as **in-app only** (no email, SMS, or push notifications). This is a reasonable MVP scope for the current application.
- **A-002**: The frontend will fetch notifications on page load and additionally poll the unread count endpoint every 30 seconds while the page is open. When the poll detects new unread notifications, the badge updates automatically. Real-time push (e.g., WebSockets) is not required for MVP.
- **A-003**: All admin users receive organizer request notifications. The system does not support per-admin notification preferences.
- **A-004**: Notifications do not expire or auto-delete, and users cannot delete notifications in MVP. Users can only mark notifications as read/unread. Old notifications are managed through pagination. A future enhancement could add deletion or retention policies.
- **A-005**: The notification bell and panel are part of the global application layout, visible on all pages when authenticated.
- **A-006**: Notification creation is synchronous within the same request that triggers the event (e.g., booking creation, admin decision). However, notification creation is **fire-and-forget** — if it fails, the primary operation still succeeds and the failure is logged as a warning. No background job queue is needed for MVP.
