import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (request, _response, next) => {
  next(new AppError(404, 'NOT_FOUND', `No route matches ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const normalized = error instanceof ZodError
    ? new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', error.flatten())
    : error instanceof AppError
      ? error
      : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');

  if (normalized.status >= 500) {
    request.log?.error({ err: error }, 'Unhandled request error');
  }

  response.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      requestId: response.getHeader('x-request-id'),
    },
  });
};

