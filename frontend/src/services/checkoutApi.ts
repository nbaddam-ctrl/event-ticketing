import { apiRequest } from './apiClient';

export interface JoinWaitlistPayload {
  eventId: string;
  ticketTierId: string;
  requestedQuantity: number;
}

export interface ValidateDiscountPayload {
  code: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
}

export function joinWaitlist(payload: JoinWaitlistPayload) {
  return apiRequest<{ id: string; status: string; position: number }>('/waitlist', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function validateDiscount(payload: ValidateDiscountPayload) {
  return apiRequest<{ valid: boolean; discountAmountMinor: number; reason?: string }>('/discounts/validate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export interface AvailableDiscount {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export function listAvailableDiscounts(eventId: string) {
  return apiRequest<{ discounts: AvailableDiscount[] }>(
    `/discounts/available?eventId=${encodeURIComponent(eventId)}`
  );
}
