import { db, withTransaction } from '../db/client.js';
import { randomUUID } from 'node:crypto';

export interface EventRow {
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
}

export interface TierRow {
  id: string;
  eventId: string;
  name: string;
  priceMinor: number;
  currency: string;
  capacityLimit: number;
  soldQuantity: number;
  reservedQuantity: number;
  status: string;
}

export interface EventFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  includePast?: boolean;
}

export interface OrganizerEventRow {
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

function buildFilterClauses(filters: EventFilters) {
  const conditions: string[] = ["e.status = 'published'"];
  const params: unknown[] = [];

  if (!filters.includePast) {
    conditions.push('e.end_at >= ?');
    params.push(new Date().toISOString());
  }

  if (filters.search) {
    conditions.push('(e.title LIKE ? OR e.description LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.dateFrom) {
    conditions.push('e.start_at >= ?');
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push('e.start_at <= ?');
    params.push(filters.dateTo);
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const tierConditions: string[] = [
      "t.event_id = e.id",
      "t.status = 'active'"
    ];
    if (filters.minPrice !== undefined) {
      tierConditions.push('t.price_minor >= ?');
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      tierConditions.push('t.price_minor <= ?');
      params.push(filters.maxPrice);
    }
    conditions.push(`EXISTS (SELECT 1 FROM ticket_tiers t WHERE ${tierConditions.join(' AND ')})`);
  }

  return { where: conditions.join(' AND '), params };
}

export function listFilteredEvents(filters: EventFilters, page: number, pageSize: number): EventRow[] {
  const { where, params } = buildFilterClauses(filters);
  const offset = (page - 1) * pageSize;

  return db.prepare(`
    SELECT
      e.id,
      e.organizer_id as organizerId,
      e.title,
      e.description,
      e.venue_name as venueName,
      e.start_at as startAt,
      e.end_at as endAt,
      e.timezone,
      e.status,
      e.cancellation_reason as cancellationReason
    FROM events e
    WHERE ${where}
    ORDER BY e.start_at ASC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as EventRow[];
}

export function countFilteredEvents(filters: EventFilters): number {
  const { where, params } = buildFilterClauses(filters);

  const row = db.prepare(`
    SELECT COUNT(*) as total FROM events e WHERE ${where}
  `).get(...params) as { total: number };

  return row.total;
}

export function listOrganizerEvents(organizerId: string, page: number, pageSize: number): OrganizerEventRow[] {
  const offset = (page - 1) * pageSize;

  return db.prepare(`
    SELECT e.id,
      e.title,
      e.venue_name as venueName,
      e.start_at as startAt,
      e.end_at as endAt,
      e.timezone,
      e.status,
      e.cancellation_reason as cancellationReason,
      COALESCE(SUM(t.capacity_limit), 0) as totalCapacity,
      COALESCE(SUM(t.sold_quantity), 0) as totalSold,
      e.created_at as createdAt
    FROM events e
    LEFT JOIN ticket_tiers t ON t.event_id = e.id AND t.status = 'active'
    WHERE e.organizer_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(organizerId, pageSize, offset) as OrganizerEventRow[];
}

export function countOrganizerEvents(organizerId: string): number {
  const row = db.prepare(`
    SELECT COUNT(*) as total FROM events WHERE organizer_id = ?
  `).get(organizerId) as { total: number };

  return row.total;
}

export function listPublishedEvents(page: number, pageSize: number): EventRow[] {
  const offset = (page - 1) * pageSize;
  const statement = db.prepare(`
    SELECT
      id,
      organizer_id as organizerId,
      title,
      description,
      venue_name as venueName,
      start_at as startAt,
      end_at as endAt,
      timezone,
      status
    FROM events
    WHERE status = 'published'
    ORDER BY start_at ASC
    LIMIT ? OFFSET ?
  `);

  return statement.all(pageSize, offset) as EventRow[];
}

export function getEventById(eventId: string): EventRow | undefined {
  const statement = db.prepare(`
    SELECT
      id,
      organizer_id as organizerId,
      title,
      description,
      venue_name as venueName,
      start_at as startAt,
      end_at as endAt,
      timezone,
      status
    FROM events
    WHERE id = ?
  `);

  return statement.get(eventId) as EventRow | undefined;
}

export function listEventTiers(eventId: string): TierRow[] {
  const statement = db.prepare(`
    SELECT
      id,
      event_id as eventId,
      name,
      price_minor as priceMinor,
      currency,
      capacity_limit as capacityLimit,
      sold_quantity as soldQuantity,
      reserved_quantity as reservedQuantity,
      status
    FROM ticket_tiers
    WHERE event_id = ? AND status = 'active'
    ORDER BY price_minor ASC
  `);

  return statement.all(eventId) as TierRow[];
}

export function listAllEventTiers(eventId: string): TierRow[] {
  const statement = db.prepare(`
    SELECT
      id,
      event_id as eventId,
      name,
      price_minor as priceMinor,
      currency,
      capacity_limit as capacityLimit,
      sold_quantity as soldQuantity,
      reserved_quantity as reservedQuantity,
      status
    FROM ticket_tiers
    WHERE event_id = ?
    ORDER BY price_minor ASC
  `);

  return statement.all(eventId) as TierRow[];
}

export interface AddTierInput {
  name: string;
  priceMinor: number;
  currency: string;
  capacityLimit: number;
}

export function addTierToEvent(eventId: string, input: AddTierInput): TierRow {
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    `INSERT INTO ticket_tiers (
      id, event_id, name, price_minor, currency, capacity_limit,
      sold_quantity, reserved_quantity, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'active', ?, ?)`
  ).run(id, eventId, input.name, input.priceMinor, input.currency, input.capacityLimit, now, now);

  return {
    id,
    eventId,
    name: input.name,
    priceMinor: input.priceMinor,
    currency: input.currency,
    capacityLimit: input.capacityLimit,
    soldQuantity: 0,
    reservedQuantity: 0,
    status: 'active',
  };
}

export function updateTier(tierId: string, updates: { name?: string; priceMinor?: number; currency?: string; capacityLimit?: number }): boolean {
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const params: unknown[] = [now];

  if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
  if (updates.priceMinor !== undefined) { fields.push('price_minor = ?'); params.push(updates.priceMinor); }
  if (updates.currency !== undefined) { fields.push('currency = ?'); params.push(updates.currency); }
  if (updates.capacityLimit !== undefined) { fields.push('capacity_limit = ?'); params.push(updates.capacityLimit); }

  params.push(tierId);
  const result = db.prepare(`UPDATE ticket_tiers SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return result.changes > 0;
}

export function deactivateTier(tierId: string): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(
    `UPDATE ticket_tiers SET status = 'inactive', updated_at = ? WHERE id = ? AND status = 'active'`
  ).run(now, tierId);
  return result.changes > 0;
}

export function syncEventTiers(eventId: string, desiredTiers: AddTierInput[]): TierRow[] {
  return withTransaction(() => {
    const existing = listAllEventTiers(eventId);
    const now = new Date().toISOString();

    // Match existing tiers by name (case-insensitive)
    const existingByName = new Map(existing.map((t) => [t.name.toLowerCase(), t]));
    const desiredNames = new Set(desiredTiers.map((t) => t.name.toLowerCase()));

    // Deactivate tiers no longer desired (only if they have no sold/reserved tickets)
    for (const tier of existing) {
      if (tier.status !== 'active') continue;
      if (!desiredNames.has(tier.name.toLowerCase())) {
        if (tier.soldQuantity === 0 && tier.reservedQuantity === 0) {
          deactivateTier(tier.id);
        }
        // If tier has sold tickets, keep it active - can't remove it
      }
    }

    // Add or update desired tiers
    for (const desired of desiredTiers) {
      const match = existingByName.get(desired.name.toLowerCase());
      if (match) {
        // Update the existing tier (only fields that can safely change)
        const capacityUpdate = desired.capacityLimit >= match.soldQuantity + match.reservedQuantity
          ? desired.capacityLimit : undefined;
        updateTier(match.id, {
          priceMinor: desired.priceMinor,
          currency: desired.currency,
          capacityLimit: capacityUpdate ?? match.capacityLimit,
        });
        // Re-activate if it was inactive
        if (match.status === 'inactive') {
          db.prepare(`UPDATE ticket_tiers SET status = 'active', updated_at = ? WHERE id = ?`).run(now, match.id);
        }
      } else {
        // Create new tier
        addTierToEvent(eventId, desired);
      }
    }

    return listEventTiers(eventId);
  });
}
