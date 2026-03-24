/**
 * Test database setup. Imported by test files that need a database.
 * Each Jest worker gets its own in-memory SQLite DB (via setup-env.ts).
 * Call `initTestDb()` in `beforeAll` and `clearAllTables()` in `beforeEach`.
 */
import { db } from '../src/db/client.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schema = readFileSync(resolve(__dirname, '../src/db/schema.sql'), 'utf-8');

/** Bootstrap schema into the in-memory database. Call once in beforeAll. */
export function initTestDb() {
  db.exec(schema);
}

/** Remove all rows from every table. Call in beforeEach for isolation. */
export function clearAllTables() {
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM refunds;
    DELETE FROM bookings;
    DELETE FROM waitlist_entries;
    DELETE FROM discount_codes;
    DELETE FROM ticket_tiers;
    DELETE FROM events;
    DELETE FROM organizer_requests;
    DELETE FROM users;
  `);
}

/** Close the database connection. Call in afterAll if needed. */
export function closeTestDb() {
  db.close();
}

export { db };
