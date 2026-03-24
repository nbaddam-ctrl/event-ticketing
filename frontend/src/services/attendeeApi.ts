import { apiRequest } from './apiClient';

export interface AuthPayload {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResult {
  token: string;
  user: { id: string; email: string; roles: string[] };
}

export interface EventListResult {
  items: Array<{ id: string; title: string; description: string | null; venueName: string; startAt: string; status: string }>;
  total: number;
  page: number;
  pageSize: number;
}

export interface EventDetailsResult {
  id: string;
  title: string;
  description: string | null;
  venueName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: string;
  cancellationReason: string | null;
  tiers: Array<{ id: string; name: string; priceMinor: number; remainingQuantity: number }>;
}

export async function register(payload: AuthPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function login(payload: AuthPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export interface EventFilterParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  includePast?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listEvents(params: EventFilterParams = {}): Promise<EventListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
  if (params.includePast) query.set('includePast', 'true');
  const qs = query.toString();
  return apiRequest<EventListResult>(`/events${qs ? `?${qs}` : ''}`);
}

export async function getEventDetails(eventId: string): Promise<EventDetailsResult> {
  return apiRequest<EventDetailsResult>(`/events/${eventId}`);
}

export async function createBooking(payload: {
  eventId: string;
  ticketTierId: string;
  quantity: number;
  discountCode?: string;
}) {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export interface BookingItem {
  id: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  discountAmountMinor: number;
  totalPaidMinor: number;
  status: string;
  createdAt: string;
  eventTitle: string;
  venueName: string;
  eventStartAt: string;
  tierName: string;
}

export interface BookingListResult {
  items: BookingItem[];
}

export async function getMyBookings(): Promise<BookingListResult> {
  return apiRequest<BookingListResult>('/bookings');
}

export interface CancelBookingResult {
  bookingId: string;
  status: string;
  refundId: string;
  refundAmountMinor: number;
}

export async function cancelBooking(bookingId: string): Promise<CancelBookingResult> {
  return apiRequest<CancelBookingResult>(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
  });
}
