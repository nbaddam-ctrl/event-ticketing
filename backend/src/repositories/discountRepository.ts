import { db } from '../db/client.js';

export interface DiscountValidationInput {
  code: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface DiscountValidationResult {
  valid: boolean;
  discountAmountMinor: number;
  reason?: string;
  discountCodeId?: string;
}

export function validateDiscountCode(input: DiscountValidationInput): DiscountValidationResult {
  const now = new Date().toISOString();

  const code = db
    .prepare(
      `SELECT
        id,
        type,
        value,
        max_uses as maxUses,
        used_count as usedCount,
        valid_from as validFrom,
        valid_until as validUntil,
        applicable_event_id as applicableEventId,
        applicable_tier_id as applicableTierId,
        status
       FROM discount_codes
       WHERE lower(code) = lower(?)`
    )
    .get(input.code) as
    | {
        id: string;
        type: 'percentage' | 'fixed';
        value: number;
        maxUses: number | null;
        usedCount: number;
        validFrom: string | null;
        validUntil: string | null;
        applicableEventId: string | null;
        applicableTierId: string | null;
        status: string;
      }
    | undefined;

  if (!code || code.status !== 'active') {
    return { valid: false, discountAmountMinor: 0, reason: 'Code not found or inactive' };
  }

  if (code.maxUses !== null && code.usedCount >= code.maxUses) {
    return { valid: false, discountAmountMinor: 0, reason: 'Code usage limit reached' };
  }

  if (code.validFrom && code.validFrom > now) {
    return { valid: false, discountAmountMinor: 0, reason: 'Code not active yet' };
  }

  if (code.validUntil && code.validUntil < now) {
    return { valid: false, discountAmountMinor: 0, reason: 'Code expired' };
  }

  if (code.applicableEventId && code.applicableEventId !== input.eventId) {
    return { valid: false, discountAmountMinor: 0, reason: 'Code not valid for this event' };
  }

  if (code.applicableTierId && code.applicableTierId !== input.ticketTierId) {
    return { valid: false, discountAmountMinor: 0, reason: 'Code not valid for this tier' };
  }

  const subtotal = input.unitPriceMinor * input.quantity;
  const discountAmountMinor =
    code.type === 'percentage'
      ? Math.floor((subtotal * code.value) / 100)
      : Math.floor(code.value);

  return {
    valid: true,
    discountAmountMinor: Math.max(0, Math.min(subtotal, discountAmountMinor)),
    discountCodeId: code.id
  };
}

export function incrementDiscountUsage(discountCodeId: string): void {
  db.prepare(
    `UPDATE discount_codes
     SET used_count = used_count + 1, updated_at = ?
     WHERE id = ?`
  ).run(new Date().toISOString(), discountCodeId);
}

export function decrementDiscountUsage(discountCodeId: string): void {
  db.prepare(
    `UPDATE discount_codes
     SET used_count = MAX(0, used_count - 1), updated_at = ?
     WHERE id = ?`
  ).run(new Date().toISOString(), discountCodeId);
}

export function listAvailableDiscounts(eventId: string) {
  const now = new Date().toISOString();
  return db
    .prepare(
      `SELECT id, code, type, value,
              applicable_event_id AS applicableEventId,
              applicable_tier_id AS applicableTierId
       FROM discount_codes
       WHERE status = 'active'
         AND (max_uses IS NULL OR used_count < max_uses)
         AND (valid_from IS NULL OR valid_from <= ?)
         AND (valid_until IS NULL OR valid_until >= ?)
         AND (applicable_event_id IS NULL OR applicable_event_id = ?)
       ORDER BY value DESC`
    )
    .all(now, now, eventId) as Array<{
      id: string;
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      applicableEventId: string | null;
      applicableTierId: string | null;
    }>;
}
