import { randomUUID, createHash } from 'node:crypto';
import { db } from './client.js';

const now = new Date().toISOString();
const eventId = randomUUID();

// Seed password for all seeded accounts: password123
const seedPasswordHash = createHash('sha256').update('password123').digest('hex');

const existingOrganizer = db
  .prepare('SELECT id FROM users WHERE email = ?')
  .get('organizer@example.com') as { id: string } | undefined;

const organizerId = existingOrganizer?.id ?? randomUUID();

db.prepare(
  `INSERT OR IGNORE INTO users (id, email, password_hash, display_name, roles, organizer_approval_status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  organizerId,
  'organizer@example.com',
  seedPasswordHash,
  'Seed Organizer',
  'organizer',
  'approved',
  now,
  now
);

// Seed an admin account
const adminId = randomUUID();
db.prepare(
  `INSERT OR IGNORE INTO users (id, email, password_hash, display_name, roles, organizer_approval_status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  adminId,
  'admin@example.com',
  seedPasswordHash,
  'Seed Admin',
  'admin',
  'none',
  now,
  now
);

db.prepare(
  `INSERT OR IGNORE INTO events (id, organizer_id, title, description, venue_name, start_at, end_at, timezone, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`
).run(eventId, organizerId, 'Sample Concert', 'Seeded event with multiple ticket tiers', 'Main Hall', now, now, 'UTC', now, now);

// Create multiple ticket tiers for the sample event
const tierIdGA = randomUUID();
const tierIdVIP = randomUUID();
const tierIdEarlyBird = randomUUID();

db.prepare(
  `INSERT OR IGNORE INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
   VALUES (?, ?, 'General Admission', 5000, 'USD', 200, 0, 0, 'active', ?, ?)`
).run(tierIdGA, eventId, now, now);

db.prepare(
  `INSERT OR IGNORE INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
   VALUES (?, ?, 'VIP', 15000, 'USD', 50, 0, 0, 'active', ?, ?)`
).run(tierIdVIP, eventId, now, now);

db.prepare(
  `INSERT OR IGNORE INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
   VALUES (?, ?, 'Early Bird', 3500, 'USD', 100, 0, 0, 'active', ?, ?)`
).run(tierIdEarlyBird, eventId, now, now);

// Create a second sample event with tiered pricing
const eventId2 = randomUUID();
const tierIdStandard = randomUUID();
const tierIdPremium = randomUUID();
const tierIdBackstage = randomUUID();

db.prepare(
  `INSERT OR IGNORE INTO events (id, organizer_id, title, description, venue_name, start_at, end_at, timezone, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`
).run(eventId2, organizerId, 'Tech Conference 2026', 'Annual tech conference with tiered pricing', 'Convention Center', now, now, 'UTC', now, now);

db.prepare(
  `INSERT OR IGNORE INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
   VALUES (?, ?, 'Standard', 7500, 'USD', 300, 0, 0, 'active', ?, ?)`
).run(tierIdStandard, eventId2, now, now);

db.prepare(
  `INSERT OR IGNORE INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
   VALUES (?, ?, 'Premium', 20000, 'USD', 100, 0, 0, 'active', ?, ?)`
).run(tierIdPremium, eventId2, now, now);

db.prepare(
  `INSERT OR IGNORE INTO ticket_tiers (id, event_id, name, price_minor, currency, capacity_limit, sold_quantity, reserved_quantity, status, created_at, updated_at)
   VALUES (?, ?, 'Backstage Pass', 50000, 'USD', 20, 0, 0, 'active', ?, ?)`
).run(tierIdBackstage, eventId2, now, now);

// Seed discount codes
const discountId1 = randomUUID();
const discountId2 = randomUUID();
const discountId3 = randomUUID();

db.prepare(
  `INSERT OR IGNORE INTO discount_codes (id, code, type, value, max_uses, used_count, valid_from, valid_until, applicable_event_id, applicable_tier_id, status, created_at, updated_at)
   VALUES (?, 'WELCOME10', 'percentage', 10, 100, 0, NULL, NULL, NULL, NULL, 'active', ?, ?)`
).run(discountId1, now, now);

db.prepare(
  `INSERT OR IGNORE INTO discount_codes (id, code, type, value, max_uses, used_count, valid_from, valid_until, applicable_event_id, applicable_tier_id, status, created_at, updated_at)
   VALUES (?, 'FLAT500', 'fixed', 500, 50, 0, NULL, NULL, NULL, NULL, 'active', ?, ?)`
).run(discountId2, now, now);

db.prepare(
  `INSERT OR IGNORE INTO discount_codes (id, code, type, value, max_uses, used_count, valid_from, valid_until, applicable_event_id, applicable_tier_id, status, created_at, updated_at)
   VALUES (?, 'EARLYBIRD20', 'percentage', 20, 30, 0, NULL, NULL, ?, NULL, 'active', ?, ?)`
).run(discountId3, eventId, now, now);

console.log('Database seed complete');
