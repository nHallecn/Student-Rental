import type { RequestHandler } from 'express';
import type { UserRole } from '@student-rental/contracts';
import { getRepository } from '../data/index.js';
import { AppError } from '../lib/errors.js';
import { AuthService } from '../services/auth.service.js';

function bearerToken(header: string | undefined) {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' ? token : undefined;
}

export const authenticate: RequestHandler = async (request, _response, next) => {
  try {
    const token = bearerToken(request.header('authorization'));
    if (!token) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'A bearer access token is required');
    request.auth = await new AuthService(getRepository()).verifyAccessToken(token);
    next();
  } catch (error) { next(error); }
};

export const optionalAuthenticate: RequestHandler = async (request, _response, next) => {
  const token = bearerToken(request.header('authorization'));
  if (!token) return next();
  try { request.auth = await new AuthService(getRepository()).verifyAccessToken(token); next(); } catch (error) { next(error); }
};

export const requireRole = (...roles: UserRole[]): RequestHandler => (request, _response, next) => {
  if (!request.auth) return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required'));
  if (!roles.includes(request.auth.role)) return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
  next();
};

