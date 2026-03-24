import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';

export function createOrganizerRequest(userId: string) {
  const now = new Date().toISOString();
  const existing = db
    .prepare("SELECT id, status FROM organizer_requests WHERE user_id = ? AND status = 'pending'")
    .get(userId) as { id: string; status: string } | undefined;

  if (existing) {
    return existing;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO organizer_requests (id, user_id, status, created_at, updated_at)
     VALUES (?, ?, 'pending', ?, ?)`
  ).run(id, userId, now, now);

  db.prepare(
    `UPDATE users
     SET organizer_approval_status = 'pending', updated_at = ?
     WHERE id = ?`
  ).run(now, userId);

  return { id, status: 'pending' };
}

export function getOrganizerRequestById(requestId: string) {
  return db
    .prepare(
      `SELECT id, user_id as userId, status
       FROM organizer_requests
       WHERE id = ?`
    )
    .get(requestId) as { id: string; userId: string; status: string } | undefined;
}

export function decideOrganizerRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  decidedByUserId: string,
  reason?: string
) {
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE organizer_requests
     SET status = ?, decision_reason = ?, decided_by_user_id = ?, decided_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(decision, reason ?? null, decidedByUserId, now, now, requestId);

  const request = getOrganizerRequestById(requestId);
  if (!request) {
    return undefined;
  }

  if (decision === 'approved') {
    db.prepare(
      `UPDATE users
       SET roles = CASE
         WHEN instr(roles, 'organizer') > 0 THEN roles
         ELSE roles || ',organizer'
       END,
       organizer_approval_status = 'approved',
       updated_at = ?
       WHERE id = ?`
    ).run(now, request.userId);
  } else {
    db.prepare(
      `UPDATE users
       SET organizer_approval_status = 'rejected', updated_at = ?
       WHERE id = ?`
    ).run(now, request.userId);
  }

  return {
    requestId,
    status: decision,
    decidedAt: now
  };
}

export function listOrganizerRequests(statusFilter?: string) {
  let sql = `SELECT r.id, r.user_id AS userId, u.email, u.display_name AS displayName,
       r.status, r.decision_reason AS decisionReason,
       r.created_at AS createdAt, r.decided_at AS decidedAt
     FROM organizer_requests r
     JOIN users u ON u.id = r.user_id`;
  const params: string[] = [];
  if (statusFilter) {
    sql += ` WHERE r.status = ?`;
    params.push(statusFilter);
  }
  sql += ` ORDER BY r.created_at DESC`;
  return db.prepare(sql).all(...params) as Array<{
    id: string;
    userId: string;
    email: string;
    displayName: string;
    status: string;
    decisionReason: string | null;
    createdAt: string;
    decidedAt: string | null;
  }>;
}

export function isApprovedOrganizerOrAdmin(userId: string): boolean {
  const user = db
    .prepare('SELECT roles, organizer_approval_status as organizerApprovalStatus FROM users WHERE id = ?')
    .get(userId) as { roles: string; organizerApprovalStatus: string } | undefined;

  if (!user) {
    return false;
  }

  const roles = user.roles.split(',').map((item) => item.trim());
  if (roles.includes('admin')) {
    return true;
  }

  return roles.includes('organizer') && user.organizerApprovalStatus === 'approved';
}
