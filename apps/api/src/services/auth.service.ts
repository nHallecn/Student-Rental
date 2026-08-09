import { createHash, randomBytes } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import type { AuthResponse, AuthTokens, UserRole } from '@student-rental/contracts';
import { env } from '../config/env.js';
import type { CoreRepository, NewUser, UserRecord } from '../data/types.js';
import { toPublicUser } from '../data/types.js';
import { AppError } from '../lib/errors.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

function durationSeconds(value: string) {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error(`Unsupported duration: ${value}`);
  const amount = Number(match[1]);
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return amount * factor;
}

export class AuthService {
  constructor(private readonly repository: CoreRepository) {}

  async register(input: Omit<NewUser, 'passwordHash'> & { password: string }, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> {
    const identity = input.email ?? input.phone!;
    if (await this.repository.findUserByIdentity(identity)) throw new AppError(409, 'IDENTITY_IN_USE', 'An account already exists for this email or phone');
    const user = await this.repository.createUser({ ...input, email: input.email?.toLowerCase(), passwordHash: await hash(input.password, 12) });
    await this.repository.audit(user.id, 'USER_REGISTERED', 'user', user.id, { role: user.role });
    return { user: toPublicUser(user), tokens: await this.issueTokens(user, context) };
  }

  async login(identity: string, password: string, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> {
    const user = await this.repository.findUserByIdentity(identity);
    if (!user || !(await compare(password, user.passwordHash))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
    if (user.suspendedAt) throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
    return { user: toPublicUser(user), tokens: await this.issueTokens(user, context) };
  }

  async refresh(refreshToken: string, context: { userAgent?: string; ipAddress?: string }): Promise<AuthResponse> {
    const hashValue = tokenHash(refreshToken);
    const session = await this.repository.findRefreshSession(hashValue);
    if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    const user = await this.repository.findUserById(session.userId);
    if (!user || user.suspendedAt) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    await this.repository.revokeRefreshSession(hashValue);
    return { user: toPublicUser(user), tokens: await this.issueTokens(user, context) };
  }

  async logout(refreshToken: string) { await this.repository.revokeRefreshSession(tokenHash(refreshToken)); }

  async requestOtp(identity: string, purpose: 'VERIFY_PHONE' | 'SIGN_IN') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.repository.createOtp({ identity, purpose, codeHash: tokenHash(code), expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000).toISOString() });
    return env.NODE_ENV === 'production' ? { delivery: env.OTP_PROVIDER } : { delivery: 'console', debugCode: code };
  }

  async verifyOtp(identity: string, purpose: 'VERIFY_PHONE' | 'SIGN_IN', code: string, context: { userAgent?: string; ipAddress?: string }) {
    const otp = await this.repository.findLatestOtp(identity, purpose);
    if (!otp || otp.consumedAt || new Date(otp.expiresAt) <= new Date() || otp.codeHash !== tokenHash(code)) throw new AppError(400, 'INVALID_OTP', 'The verification code is invalid or expired');
    await this.repository.consumeOtp(otp.id);
    const user = await this.repository.findUserByIdentity(identity);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'No account exists for this identity');
    const verifiedUser = purpose === 'VERIFY_PHONE' ? await this.repository.setPhoneVerified(user.id) : user;
    return { user: toPublicUser(verifiedUser), tokens: await this.issueTokens(verifiedUser, context) };
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; role: UserRole }> {
    try {
      const { payload } = await jwtVerify(token, secret, { issuer: 'student-rental-api', audience: 'student-rental-mobile' });
      if (!payload.sub || typeof payload.role !== 'string') throw new Error('Missing claims');
      return { userId: payload.sub, role: payload.role as UserRole };
    } catch {
      throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid or expired');
    }
  }

  private async issueTokens(user: UserRecord, context: { userAgent?: string; ipAddress?: string }): Promise<AuthTokens> {
    const accessSeconds = durationSeconds(env.ACCESS_TOKEN_TTL);
    const refreshSeconds = durationSeconds(env.REFRESH_TOKEN_TTL);
    const accessToken = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer('student-rental-api')
      .setAudience('student-rental-mobile')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + accessSeconds)
      .sign(secret);
    const refreshToken = randomBytes(48).toString('base64url');
    await this.repository.createRefreshSession({ userId: user.id, tokenHash: tokenHash(refreshToken), expiresAt: new Date(Date.now() + refreshSeconds * 1000).toISOString(), userAgent: context.userAgent, ipAddress: context.ipAddress });
    return { accessToken, refreshToken, expiresInSeconds: accessSeconds };
  }
}

