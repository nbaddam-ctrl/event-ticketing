export type Role = 'attendee' | 'organizer' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  roles: Role[];
  organizerApprovalStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string | null;
  venueName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: 'draft' | 'published' | 'cancelled';
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  priceMinor: number;
  currency: string;
  capacityLimit: number;
  soldQuantity: number;
  reservedQuantity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  discountCodeId: string | null;
  discountAmountMinor: number;
  totalPaidMinor: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'organizer_request_submitted'
  | 'organizer_request_approved'
  | 'organizer_request_rejected'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'event_cancelled'
  | 'waitlist_promoted'
  | 'waitlist_expired';

export type NotificationReferenceType =
  | 'event'
  | 'booking'
  | 'organizer_request'
  | 'waitlist_entry';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId: string | null;
  referenceType: NotificationReferenceType | null;
  navigationPath: string | null;
  createdAt: string;
  readAt: string | null;
}
