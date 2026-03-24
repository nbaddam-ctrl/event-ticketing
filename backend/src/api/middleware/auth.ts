import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors.js';
import { verifyToken, type JwtClaims, type UserRole } from '../../auth/jwt.js';

export interface AuthenticatedRequest extends Request {
  auth?: JwtClaims;
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Missing bearer token'));
    return;
  }

  req.auth = verifyToken(token);
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }

    const hasRole = req.auth.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      next(new ApiError(403, 'FORBIDDEN', 'Insufficient role'));
      return;
    }

    next();
  };
}
