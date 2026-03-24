import { ApiError } from '../api/errors.js';
import {
  getEventById,
  listEventTiers,
  listFilteredEvents,
  countFilteredEvents,
  type EventFilters
} from '../repositories/eventRepository.js';

export function browseEvents(page: number, pageSize: number, filters: EventFilters = {}) {
  const items = listFilteredEvents(filters, page, pageSize);
  const total = countFilteredEvents(filters);
  return { items, total, page, pageSize };
}

export function getEventDetails(eventId: string) {
  const event = getEventById(eventId);
  if (!event) {
    throw new ApiError(404, 'NOT_FOUND', 'Event not found');
  }

  const tiers = listEventTiers(eventId).map((tier) => ({
    ...tier,
    remainingQuantity: tier.capacityLimit - tier.soldQuantity - tier.reservedQuantity
  }));

  return { ...event, tiers };
}
