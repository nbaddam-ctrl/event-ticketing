import { Router } from 'express';
import { z } from 'zod';
import { browseEvents, getEventDetails } from '../../services/eventService.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { listOrganizerEventsForUser } from '../../services/organizerEventService.js';

export const eventRoutes = Router();

const browseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  includePast: z.enum(['true', 'false']).transform((v) => v === 'true').default('false'),
});

eventRoutes.get('/', (req, res, next) => {
  try {
    const query = browseQuerySchema.parse(req.query);
    const filters = {
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      includePast: query.includePast,
    };
    res.status(200).json(browseEvents(query.page, query.pageSize, filters));
  } catch (error) {
    next(error);
  }
});

// Organizer's own events — MUST be before /:eventId to avoid route collision
eventRoutes.get(
  '/mine',
  requireAuth,
  requireRole(['organizer', 'admin']),
  (req: AuthenticatedRequest, res, next) => {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);
      res.status(200).json(listOrganizerEventsForUser(req.auth!.sub, page, pageSize));
    } catch (error) {
      next(error);
    }
  }
);

eventRoutes.get('/:eventId', (req, res, next) => {
  try {
    res.status(200).json(getEventDetails(req.params.eventId));
  } catch (error) {
    next(error);
  }
});
