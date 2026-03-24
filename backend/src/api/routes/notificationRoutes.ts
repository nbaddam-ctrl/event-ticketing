import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notificationService.js';

export const notificationRoutes = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /notifications?page=1&limit=20
notificationRoutes.get('/', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = getNotifications(req.auth!.sub, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /notifications/unread-count
notificationRoutes.get('/unread-count', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const result = getUnreadCount(req.auth!.sub);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PATCH /notifications/:id/read
notificationRoutes.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    const notificationId = req.params.id as string;
    markAsRead(notificationId, req.auth!.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /notifications/read-all
notificationRoutes.patch('/read-all', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    markAllAsRead(req.auth!.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
