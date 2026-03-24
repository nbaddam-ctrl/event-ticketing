import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  cancelOrganizerEvent,
  createOrganizerEvent,
  parseCreateEventRequest,
  parseUpdateTiersRequest,
  updateEventTiers,
  addTierToExistingEvent,
  updateExistingTier,
  deactivateExistingTier,
  getOrganizerEventDetails
} from '../../services/organizerEventService.js';

export const organizerEventRoutes = Router();

organizerEventRoutes.post('/', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = parseCreateEventRequest(req.body);
    const event = createOrganizerEvent(req.auth!.sub, payload);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

organizerEventRoutes.post('/:eventId/cancel', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const result = cancelOrganizerEvent(req.auth!.sub, eventId, req.body?.reason);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /events/:eventId/manage — get event details for organizer management
organizerEventRoutes.get('/:eventId/manage', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const result = getOrganizerEventDetails(req.auth!.sub, eventId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /events/:eventId/tiers — sync all tiers (bulk replace)
organizerEventRoutes.put('/:eventId/tiers', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const payload = parseUpdateTiersRequest(req.body);
    const result = updateEventTiers(req.auth!.sub, eventId, payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /events/:eventId/tiers — add a single tier
organizerEventRoutes.post('/:eventId/tiers', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const tier = addTierToExistingEvent(req.auth!.sub, eventId, req.body);
    res.status(201).json(tier);
  } catch (error) {
    next(error);
  }
});

// PATCH /events/:eventId/tiers/:tierId — update a single tier
organizerEventRoutes.patch('/:eventId/tiers/:tierId', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const tierId = Array.isArray(req.params.tierId) ? req.params.tierId[0] : req.params.tierId;
    const result = updateExistingTier(req.auth!.sub, eventId, tierId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /events/:eventId/tiers/:tierId — deactivate a tier
organizerEventRoutes.delete('/:eventId/tiers/:tierId', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const tierId = Array.isArray(req.params.tierId) ? req.params.tierId[0] : req.params.tierId;
    const result = deactivateExistingTier(req.auth!.sub, eventId, tierId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
