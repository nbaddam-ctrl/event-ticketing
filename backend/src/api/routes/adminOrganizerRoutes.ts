import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../validation.js';
import { decideOrganizerRoleRequest, listOrganizerRoleRequests } from '../../services/adminOrganizerService.js';

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional()
});

export const adminOrganizerRoutes = Router();

adminOrganizerRoutes.get(
  '/organizer-requests',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const requests = listOrganizerRoleRequests(status);
      res.status(200).json({ requests });
    } catch (error) {
      next(error);
    }
  }
);

adminOrganizerRoutes.post(
  '/organizer-requests/:requestId/decision',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
      const payload = validateBody(decisionSchema, req.body);
      const result = decideOrganizerRoleRequest(
        requestId,
        payload.decision,
        req.auth!.sub,
        payload.reason
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
