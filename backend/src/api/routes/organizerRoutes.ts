import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { requestOrganizerRole } from '../../services/organizerService.js';

export const organizerRoutes = Router();

organizerRoutes.post('/requests', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const result = requestOrganizerRole(req.auth!.sub);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});
