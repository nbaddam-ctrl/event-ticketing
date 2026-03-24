import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { joinWaitlist, parseJoinWaitlistRequest } from '../../services/waitlistService.js';

export const waitlistRoutes = Router();

waitlistRoutes.post('/', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = parseJoinWaitlistRequest(req.body);
    const result = joinWaitlist(req.auth!.sub, payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
