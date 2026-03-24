import { apiRequest } from './apiClient';

export interface CreateTierPayload {
  name: string;
  priceMinor: number;
  currency: string;
  capacityLimit: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  venueName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  tiers: CreateTierPayload[];
}

export interface TierDetails {
  id: string;
  eventId: string;
  name: string;
  priceMinor: number;
  currency: string;
  capacityLimit: number;
  soldQuantity: number;
  reservedQuantity: number;
  remainingQuantity: number;
  status: string;
}

export interface OrganizerEventDetails {
  id: string;
  organizerId: string;
  title: string;
  description: string | null;
  venueName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: string;
  cancellationReason: string | null;
  tiers: TierDetails[];
}

export interface OrganizerRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  status: string;
  decisionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export function requestOrganizerRole() {
  return apiRequest<{ requestId: string; status: string }>('/organizer/requests', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export function createOrganizerEvent(payload: CreateEventPayload) {
  return apiRequest<{ id: string; status: string }>('/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function cancelOrganizerEvent(eventId: string, reason?: string) {
  return apiRequest<{ eventId: string; status: string; refundCount: number }>(`/events/${eventId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

export function decideOrganizerRequest(payload: {
  requestId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}) {
  return apiRequest<{ requestId: string; status: string; decidedAt: string }>(
    `/admin/organizer-requests/${payload.requestId}/decision`,
    {
      method: 'POST',
      body: JSON.stringify({ decision: payload.decision, reason: payload.reason })
    }
  );
}

export function listOrganizerRequests(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<{ requests: OrganizerRequest[] }>(`/admin/organizer-requests${query}`);
}

export interface OrganizerEventItem {
  id: string;
  title: string;
  venueName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: string;
  cancellationReason: string | null;
  totalCapacity: number;
  totalSold: number;
  createdAt: string;
}

export interface OrganizerEventListResult {
  items: OrganizerEventItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listOrganizerEvents(page = 1, pageSize = 20) {
  return apiRequest<OrganizerEventListResult>(`/events/mine?page=${page}&pageSize=${pageSize}`);
}

export function getOrganizerEventDetails(eventId: string) {
  return apiRequest<OrganizerEventDetails>(`/events/${eventId}/manage`);
}

export function updateEventTiers(eventId: string, tiers: CreateTierPayload[]) {
  return apiRequest<{ eventId: string; tiers: TierDetails[] }>(`/events/${eventId}/tiers`, {
    method: 'PUT',
    body: JSON.stringify({ tiers }),
  });
}

export function addTierToEvent(eventId: string, tier: CreateTierPayload) {
  return apiRequest<TierDetails>(`/events/${eventId}/tiers`, {
    method: 'POST',
    body: JSON.stringify(tier),
  });
}

export function updateTier(eventId: string, tierId: string, updates: Partial<CreateTierPayload>) {
  return apiRequest<TierDetails>(`/events/${eventId}/tiers/${tierId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function deleteTier(eventId: string, tierId: string) {
  return apiRequest<{ tierId: string; status: string }>(`/events/${eventId}/tiers/${tierId}`, {
    method: 'DELETE',
  });
}
