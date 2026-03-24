PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT 'attendee',
  organizer_approval_status TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organizer_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_reason TEXT,
  decided_by_user_id TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  venue_name TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  cancellation_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(organizer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  capacity_limit INTEGER NOT NULL,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TEXT,
  valid_until TEXT,
  applicable_event_id TEXT,
  applicable_tier_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(applicable_event_id) REFERENCES events(id),
  FOREIGN KEY(applicable_tier_id) REFERENCES ticket_tiers(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  ticket_tier_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_minor INTEGER NOT NULL,
  subtotal_minor INTEGER NOT NULL,
  discount_code_id TEXT,
  discount_amount_minor INTEGER NOT NULL DEFAULT 0,
  total_paid_minor INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(event_id) REFERENCES events(id),
  FOREIGN KEY(ticket_tier_id) REFERENCES ticket_tiers(id),
  FOREIGN KEY(discount_code_id) REFERENCES discount_codes(id)
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  ticket_tier_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  reservation_expires_at TEXT,
  notified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(event_id) REFERENCES events(id),
  FOREIGN KEY(ticket_tier_id) REFERENCES ticket_tiers(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'original_payment_method',
  status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT NOT NULL DEFAULT 'event_cancelled',
  provider_message TEXT,
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  reference_id TEXT,
  reference_type TEXT,
  navigation_path TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
