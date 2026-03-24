import jwt from 'jsonwebtoken';
import { ApiError } from '../api/errors.js';

export type UserRole = 'attendee' | 'organizer' | 'admin';

export interface JwtClaims {
  sub: string;
  email: string;
  roles: UserRole[];
}

const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as jwt.SignOptions['expiresIn'];

export function issueToken(claims: JwtClaims): string {
  return jwt.sign(claims, jwtSecret, { expiresIn: jwtExpiresIn });
}

export function verifyToken(token: string): JwtClaims {
  try {
    return jwt.verify(token, jwtSecret) as JwtClaims;
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}
