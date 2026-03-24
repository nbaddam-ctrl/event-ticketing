import { z, type ZodTypeAny } from 'zod';
import { ApiError } from './errors.js';

export function validateBody<T extends ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new ApiError(400, 'BAD_REQUEST', 'Validation failed', parsed.error.flatten());
  }

  return parsed.data;
}
