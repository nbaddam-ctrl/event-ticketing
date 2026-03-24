/**
 * Database seed helpers for tests.
 * Creates minimal, deterministic test data with predictable IDs.
 */
import { db } from '../../src/db/client.js';
import { randomUUID } from 'node:crypto';

// ─── Users ─────────────────────────────────────────────────

export interface SeedUserOverrides {
  id?: string;
  email?: string;
  displayName?: string;
  roles?: string;
  organizerApprovalStatus?: string;
  passwordHash?: string;
}

export function seedUser(overrides: SeedUserOverrides = {}) {
  const now = new Date().toISOString();
  const id = overrides.id ?? randomUUID();
  const user = {
    id,
    email: overrides.email ?? `user-${id.slice(0, 8)}@test.com`,
    displayName: overrides.displayName ?? `Test User ${id.slice(0, 8)}`,
    roles: overrides.roles ?? 'attendee',
    organizerApprovalStatus: overrides.organizerApprovalStatus ?? 'none',
    passwordHash: overrides.passwordHash ?? '$2a$10$fakehashfortest000000000000000000000000000000000000',
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, roles, organizer_approval_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.email, user.passwordHash, user.displayName, user.roles, user.organizerApprovalStatus, user.createdAt, user.updatedAt);

  return user;
}

/** Seed an approved organizer */
export function seedOrganizer(overrides: SeedUserOverrides = {}) {
  return seedUser({
    roles: 'attendee,organizer',
    organizerApprovalStatus: 'approved',
    ...overrides,
  });
}

/** Seed an admin user */
export function seedAdmin(overrides: SeedUserOverrides = {}) {
  return seedUser({
    roles: 'attendee,admin',
    ...overrides,
  });
}

// ─── Events ────────────────────────────────────────────────

export interface SeedEventOverrides {
  id?: string;
  organizerId?: string;
  title?: string;
  description?: string | null;
  venueName?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  status?: string;
  cancellationReason?: string | null;
}

export function seedEvent(organizerId: string, overrides: SeedEventOverrides = {}) {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const id = overrides.id ?? randomUUID();

  const event = {
    id,
    organizerId,
    title: overrides.title ?? `Test Event ${id.slice(0, 8)}`,
    description: overrides.description ?? 'Test event description',
    venueName: overrides.venueName ?? 'Test Venue',
    startAt: overrides.startAt ?? tomorrow,
    endAt: overrides.endAt ?? dayAfter,
    timezone: overrides.timezone ?? 'UTC',
    status: overrides.status ?? 'published',
    cancellationReason: overrides.cancellationReason ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO events (id, organizer_id, title, description, venue_name, start_at, end_at, timezone, status, cancellation_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(event.id, event.organizerId, event.title, event.description, event.venueName, event.startAt, event.endAt, event.timezone, event.status, event.cancellationReason, event.createdAt, event.updatedAt);

  return event;
}

// ─── Tiers ─────────────────────────────────────────────────

export interface SeedTierOverrides {
  id?: string;
  name?: string;
  priceMinor?: number;
  currency?: string;
  capacityLimit?: number;
  soldQuantity?: number;
  reservedQuantity?: number;
  status?: string;
}

export function seedTier(eventId: string, overrides: SeedTierOverrides = {}) {
  const now = new Date().toISOString();
  const id = overrides.id ?? randomUUID();

  const tier = {
    id,
    eventId,
    name: overrides.name ?? 'General Admission',
    priceMinor: overrides.priceMinor ?? 5000,
    currency: overrides.currency ?? 'USD',
    capacityLimit: overrides.capacityLimit ?? 100,
    soldQuantity: overrides.soldQuantity ?? 0,
    reservedQuantity: overrides.reservedQuantity ?? 0,
    status: overrides.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(tier.id, tier.eventId, tier.name, tier.priceMinor, tier.currency, tier.capacityLimit, tier.soldQuantity, tier.reservedQuantity, tier.status, tier.createdAt, tier.updatedAt);

  return tier;
}

// ─── Discount Codes ────────────────────────────────────────

export interface SeedDiscountOverrides {
  id?: string;
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  maxUses?: number | null;
  usedCount?: number;
  validFrom?: string | null;
  validUntil?: string | null;
  applicableEventId?: string | null;
  applicableTierId?: string | null;
  status?: string;
}

export function seedDiscount(overrides: SeedDiscountOverrides = {}) {
  const now = new Date().toISOString();
  const id = overrides.id ?? randomUUID();

  const discount = {
    id,
    code: overrides.code ?? `TEST-${id.slice(0, 8).toUpperCase()}`,
    type: overrides.type ?? 'percentage',
    value: overrides.value ?? 10,
    maxUses: overrides.maxUses ?? null,
    usedCount: overrides.usedCount ?? 0,
    validFrom: overrides.validFrom ?? null,
    validUntil: overrides.validUntil ?? null,
    applicableEventId: overrides.applicableEventId ?? null,
    applicableTierId: overrides.applicableTierId ?? null,
    status: overrides.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO discount_codes (id, code, type, value, max_uses, used_count, valid_from, valid_until, applicable_event_id, applicable_tier_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(discount.id, discount.code, discount.type, discount.value, discount.maxUses, discount.usedCount, discount.validFrom, discount.validUntil, discount.applicableEventId, discount.applicableTierId, discount.status, discount.createdAt, discount.updatedAt);

  return discount;
}

// ─── Bookings ──────────────────────────────────────────────

export interface SeedBookingOverrides {
  id?: string;
  userId?: string;
  eventId?: string;
  ticketTierId?: string;
  quantity?: number;
  unitPriceMinor?: number;
  subtotalMinor?: number;
  discountCodeId?: string | null;
  discountAmountMinor?: number;
  totalPaidMinor?: number;
  status?: string;
}

export function seedBooking(
  userId: string,
  eventId: string,
  ticketTierId: string,
  overrides: SeedBookingOverrides = {},
) {
  const now = new Date().toISOString();
  const id = overrides.id ?? randomUUID();
  const quantity = overrides.quantity ?? 1;
  const unitPrice = overrides.unitPriceMinor ?? 5000;
  const subtotal = overrides.subtotalMinor ?? quantity * unitPrice;
  const discountAmount = overrides.discountAmountMinor ?? 0;

  const booking = {
    id,
    userId,
    eventId,
    ticketTierId,
    quantity,
    unitPriceMinor: unitPrice,
    subtotalMinor: subtotal,
    discountCodeId: overrides.discountCodeId ?? null,
    discountAmountMinor: discountAmount,
    totalPaidMinor: overrides.totalPaidMinor ?? Math.max(0, subtotal - discountAmount),
    status: overrides.status ?? 'confirmed',
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO bookings (id, user_id, event_id, ticket_tier_id, quantity, unit_price_minor, subtotal_minor, discount_code_id, discount_amount_minor, total_paid_minor, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(booking.id, booking.userId, booking.eventId, booking.ticketTierId, booking.quantity, booking.unitPriceMinor, booking.subtotalMinor, booking.discountCodeId, booking.discountAmountMinor, booking.totalPaidMinor, booking.status, booking.createdAt, booking.updatedAt);

  return booking;
}

// ─── Waitlist Entries ──────────────────────────────────────

export interface SeedWaitlistOverrides {
  id?: string;
  requestedQuantity?: number;
  position?: number;
  status?: string;
  reservationExpiresAt?: string | null;
  notifiedAt?: string | null;
}

export function seedWaitlistEntry(
  eventId: string,
  ticketTierId: string,
  userId: string,
  overrides: SeedWaitlistOverrides = {},
) {
  const now = new Date().toISOString();
  const id = overrides.id ?? randomUUID();

  const entry = {
    id,
    eventId,
    ticketTierId,
    userId,
    requestedQuantity: overrides.requestedQuantity ?? 1,
    position: overrides.position ?? 1,
    status: overrides.status ?? 'queued',
    reservationExpiresAt: overrides.reservationExpiresAt ?? null,
    notifiedAt: overrides.notifiedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO waitlist_entries (id, event_id, ticket_tier_id, user_id, requested_quantity, position, status, reservation_expires_at, notified_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(entry.id, entry.eventId, entry.ticketTierId, entry.userId, entry.requestedQuantity, entry.position, entry.status, entry.reservationExpiresAt, entry.notifiedAt, entry.createdAt, entry.updatedAt);

  return entry;
}

// ─── Utilities ─────────────────────────────────────────────

/** Re-export clearAllTables from setup for convenience */
export { clearAllTables } from '../setup.js';
