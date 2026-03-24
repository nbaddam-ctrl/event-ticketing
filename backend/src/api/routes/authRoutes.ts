import { Router } from 'express';
import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { validateBody } from '../validation.js';
import { ApiError } from '../errors.js';
import { issueToken } from '../../auth/jwt.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export const authRoutes = Router();

authRoutes.post('/register', (req, res, next) => {
  try {
    const input = validateBody(registerSchema, req.body);
    const now = new Date().toISOString();
    const userId = randomUUID();
    const passwordHash = hashPassword(input.password);

    try {
      db.prepare(
        `INSERT INTO users (id, email, password_hash, display_name, roles, organizer_approval_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'attendee', 'none', ?, ?)`
      ).run(userId, input.email.toLowerCase(), passwordHash, input.displayName, now, now);
    } catch {
      throw new ApiError(409, 'CONFLICT', 'Email already registered');
    }

    const token = issueToken({ sub: userId, email: input.email.toLowerCase(), roles: ['attendee'] });
    res.status(201).json({ token, user: { id: userId, email: input.email.toLowerCase(), roles: ['attendee'] } });
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/login', (req, res, next) => {
  try {
    const input = validateBody(loginSchema, req.body);
    const user = db
      .prepare('SELECT id, email, password_hash as passwordHash, roles FROM users WHERE email = ?')
      .get(input.email.toLowerCase()) as
      | { id: string; email: string; passwordHash: string; roles: string }
      | undefined;

    if (!user || user.passwordHash !== hashPassword(input.password)) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    const roles = user.roles.split(',').map((role) => role.trim()) as Array<'attendee' | 'organizer' | 'admin'>;
    const token = issueToken({ sub: user.id, email: user.email, roles });
    res.status(200).json({ token, user: { id: user.id, email: user.email, roles } });
  } catch (error) {
    next(error);
  }
});
