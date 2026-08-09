import { Router, type Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { getRepository } from '../data/index.js';
import { authenticate } from '../middleware/auth.js';
import { AuthService } from '../services/auth.service.js';
import { AppError } from '../lib/errors.js';
import { toPublicUser } from '../data/types.js';

const router = Router();
const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
const identitySchema = z.string().trim().min(5).max(254);
const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128),
  role: z.enum(['STUDENT', 'LANDLORD', 'AGENT']),
}).refine((value) => value.phone || value.email, { message: 'Phone or email is required' });
const requestContext = (request: Request) => ({ userAgent: request.header('user-agent'), ipAddress: request.ip });

router.post('/register', authLimit, async (request, response) => {
  const input = registerSchema.parse(request.body);
  const result = await new AuthService(getRepository()).register(input, requestContext(request));
  response.status(201).json(result);
});
router.post('/login', authLimit, async (request, response) => {
  const input = z.object({ identity: identitySchema, password: z.string().min(1).max(128) }).parse(request.body);
  response.json(await new AuthService(getRepository()).login(input.identity, input.password, requestContext(request)));
});
router.post('/refresh', authLimit, async (request, response) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(32) }).parse(request.body);
  response.json(await new AuthService(getRepository()).refresh(refreshToken, requestContext(request)));
});
router.post('/logout', async (request, response) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(32) }).parse(request.body);
  await new AuthService(getRepository()).logout(refreshToken);
  response.status(204).send();
});
router.post('/request-otp', authLimit, async (request, response) => {
  const input = z.object({ identity: identitySchema, purpose: z.enum(['VERIFY_PHONE', 'SIGN_IN']) }).parse(request.body);
  response.status(202).json(await new AuthService(getRepository()).requestOtp(input.identity, input.purpose));
});
router.post('/verify-otp', authLimit, async (request, response) => {
  const input = z.object({ identity: identitySchema, purpose: z.enum(['VERIFY_PHONE', 'SIGN_IN']), code: z.string().regex(/^\d{6}$/) }).parse(request.body);
  response.json(await new AuthService(getRepository()).verifyOtp(input.identity, input.purpose, input.code, requestContext(request)));
});
router.get('/me', authenticate, async (request, response) => {
  const user = await getRepository().findUserById(request.auth!.userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  response.json({ user: toPublicUser(user) });
});

export { router as authRouter };
