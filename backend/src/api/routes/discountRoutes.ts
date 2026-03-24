import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { parseValidateDiscountRequest, validateDiscount } from '../../services/discountService.js';
import { listAvailableDiscounts } from '../../repositories/discountRepository.js';

export const discountRoutes = Router();

discountRoutes.get('/available', requireAuth, (req, res, next) => {
  try {
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : '';
    if (!eventId) {
      res.status(400).json({ message: 'eventId query parameter is required' });
      return;
    }
    const discounts = listAvailableDiscounts(eventId).map((d) => ({
      code: d.code,
      description:
        d.type === 'percentage'
          ? `${d.value}% off`
          : `$${(d.value / 100).toFixed(2)} off`,
      type: d.type,
      value: d.value,
    }));
    res.status(200).json({ discounts });
  } catch (error) {
    next(error);
  }
});

discountRoutes.post('/validate', requireAuth, (req, res, next) => {
  try {
    const payload = parseValidateDiscountRequest(req.body);
    const result = validateDiscount(payload);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
