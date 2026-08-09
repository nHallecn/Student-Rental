import type { PublicUser, UniversitySummary, UserRole } from '@student-rental/contracts';

export interface UserRecord extends PublicUser {
  passwordHash: string;
  updatedAt: string;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  passwordHash: string;
  role: Exclude<UserRole, 'ADMIN'>;
}

export interface UniversityRecord extends UniversitySummary {
  createdAt: string;
  updatedAt: string;
}

export interface UniversityInput {
  name: string;
  shortName: string;
  city: string;
  latitude: number;
  longitude: number;
  defaultRadiusKm: number;
  logoUrl?: string;
  active: boolean;
}

export interface RefreshSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface OtpRecord {
  id: string;
  identity: string;
  purpose: string;
  codeHash: string;
  expiresAt: string;
  consumedAt?: string;
  createdAt: string;
}

export interface CoreRepository {
  findUserById(id: string): Promise<UserRecord | undefined>;
  findUserByIdentity(identity: string): Promise<UserRecord | undefined>;
  createUser(input: NewUser): Promise<UserRecord>;
  setPhoneVerified(userId: string): Promise<UserRecord>;
  createRefreshSession(input: Omit<RefreshSessionRecord, 'id' | 'createdAt'>): Promise<RefreshSessionRecord>;
  findRefreshSession(tokenHash: string): Promise<RefreshSessionRecord | undefined>;
  revokeRefreshSession(tokenHash: string): Promise<void>;
  createOtp(input: Omit<OtpRecord, 'id' | 'createdAt'>): Promise<OtpRecord>;
  findLatestOtp(identity: string, purpose: string): Promise<OtpRecord | undefined>;
  consumeOtp(id: string): Promise<void>;
  listUniversities(options?: { query?: string; includeInactive?: boolean }): Promise<UniversityRecord[]>;
  findUniversityById(id: string): Promise<UniversityRecord | undefined>;
  createUniversity(input: UniversityInput): Promise<UniversityRecord>;
  updateUniversity(id: string, input: Partial<UniversityInput>): Promise<UniversityRecord | undefined>;
  audit(actorId: string | undefined, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>): Promise<void>;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...publicUser } = user;
  return publicUser;
}

