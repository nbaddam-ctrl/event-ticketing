import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRoutes } from './api/routes/authRoutes.js';
import { eventRoutes } from './api/routes/eventRoutes.js';
import { bookingRoutes } from './api/routes/bookingRoutes.js';
import { organizerRoutes } from './api/routes/organizerRoutes.js';
import { organizerEventRoutes } from './api/routes/organizerEventRoutes.js';
import { adminOrganizerRoutes } from './api/routes/adminOrganizerRoutes.js';
import { waitlistRoutes } from './api/routes/waitlistRoutes.js';
import { discountRoutes } from './api/routes/discountRoutes.js';
import { notificationRoutes } from './api/routes/notificationRoutes.js';
import { errorHandler } from './api/middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use('/auth', authRoutes);
  app.use('/organizer', organizerRoutes);
  app.use('/admin', adminOrganizerRoutes);
  app.use('/events', eventRoutes);
  app.use('/events', organizerEventRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/waitlist', waitlistRoutes);
  app.use('/discounts', discountRoutes);
  app.use('/notifications', notificationRoutes);

  app.use(errorHandler);

  return app;
}
