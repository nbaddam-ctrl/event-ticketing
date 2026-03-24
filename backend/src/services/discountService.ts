import { z } from 'zod';
import { ApiError } from '../api/errors.js';
import { validateBody } from '../api/validation.js';
import { listEventTiers } from '../repositories/eventRepository.js';
import { validateDiscountCode } from '../repositories/discountRepository.js';

const validateDiscountSchema = z.object({
  code: z.string().min(1),
  eventId: z.string().uuid(),
  ticketTierId: z.string().uuid(),
  quantity: z.number().int().min(1)
});

export type ValidateDiscountRequest = z.infer<typeof validateDiscountSchema>;

export function parseValidateDiscountRequest(payload: unknown): ValidateDiscountRequest {
  return validateBody(validateDiscountSchema, payload);
}

export function validateDiscount(input: ValidateDiscountRequest) {
  const tier = listEventTiers(input.eventId).find((item) => item.id === input.ticketTierId);
  if (!tier) {
    throw new ApiError(404, 'NOT_FOUND', 'Ticket tier not found');
  }

  return validateDiscountCode({
    code: input.code,
    eventId: input.eventId,
    ticketTierId: input.ticketTierId,
    quantity: input.quantity,
    unitPriceMinor: tier.priceMinor
  });
}
