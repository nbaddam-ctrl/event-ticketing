import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { toApiError } from '../errors.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const apiError = toApiError(error);
  const incomingCorrelationId = _req.header('x-correlation-id');
  const correlationId = incomingCorrelationId && incomingCorrelationId.length > 0
    ? incomingCorrelationId
    : randomUUID();

  console.error('[api-error]', {
    correlationId,
    method: _req.method,
    path: _req.path,
    status: apiError.status,
    code: apiError.code,
    message: apiError.message
  });

  res.setHeader('x-correlation-id', correlationId);
  res.status(apiError.status).json({
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
    correlationId
  });
}
