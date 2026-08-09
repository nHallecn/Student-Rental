import type { QueryResultRow } from 'pg';
import { getPool } from '../db/pool.js';
import type { CoreRepository, NewUser, OtpRecord, RefreshSessionRecord, UniversityInput, UniversityRecord, UserRecord } from './types.js';

interface UserRow extends QueryResultRow {
  id: string; first_name: string; last_name: string; phone: string | null; email: string | null; password_hash: string;
  role: UserRecord['role']; phone_verified: boolean; profile_image_url: string | null; suspended_at: Date | null; created_at: Date; updated_at: Date;
}
interface UniversityRow extends QueryResultRow {
  id: string; name: string; short_name: string; city: string; latitude: number; longitude: number; default_radius_km: string;
  logo_url: string | null; active: boolean; created_at: Date; updated_at: Date;
}
interface SessionRow extends QueryResultRow {
  id: string; user_id: string; token_hash: string; expires_at: Date; revoked_at: Date | null; user_agent: string | null; ip_address: string | null; created_at: Date;
}
interface OtpRow extends QueryResultRow {
  id: string; identity: string; purpose: string; code_hash: string; expires_at: Date; consumed_at: Date | null; created_at: Date;
}

const maybe = <T>(value: T | null): T | undefined => value ?? undefined;
const mapUser = (row: UserRow): UserRecord => ({ id: row.id, firstName: row.first_name, lastName: row.last_name, phone: maybe(row.phone), email: maybe(row.email), passwordHash: row.password_hash, role: row.role, phoneVerified: row.phone_verified, profileImageUrl: maybe(row.profile_image_url), suspendedAt: row.suspended_at?.toISOString(), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
const mapUniversity = (row: UniversityRow): UniversityRecord => ({ id: row.id, name: row.name, shortName: row.short_name, city: row.city, latitude: row.latitude, longitude: row.longitude, defaultRadiusKm: Number(row.default_radius_km), logoUrl: maybe(row.logo_url), active: row.active, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
const mapSession = (row: SessionRow): RefreshSessionRecord => ({ id: row.id, userId: row.user_id, tokenHash: row.token_hash, expiresAt: row.expires_at.toISOString(), revokedAt: row.revoked_at?.toISOString(), userAgent: maybe(row.user_agent), ipAddress: maybe(row.ip_address), createdAt: row.created_at.toISOString() });
const mapOtp = (row: OtpRow): OtpRecord => ({ id: row.id, identity: row.identity, purpose: row.purpose, codeHash: row.code_hash, expiresAt: row.expires_at.toISOString(), consumedAt: row.consumed_at?.toISOString(), createdAt: row.created_at.toISOString() });

export class PostgresRepository implements CoreRepository {
  async findUserById(id: string) {
    const result = await getPool().query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }
  async findUserByIdentity(identity: string) {
    const result = await getPool().query<UserRow>('SELECT * FROM users WHERE lower(email) = lower($1) OR phone = $1 LIMIT 1', [identity]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }
  async createUser(input: NewUser) {
    const result = await getPool().query<UserRow>('INSERT INTO users(first_name,last_name,phone,email,password_hash,role) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [input.firstName, input.lastName, input.phone, input.email, input.passwordHash, input.role]);
    return mapUser(result.rows[0]!);
  }
  async setPhoneVerified(userId: string) {
    const result = await getPool().query<UserRow>('UPDATE users SET phone_verified=true, updated_at=now() WHERE id=$1 RETURNING *', [userId]);
    return mapUser(result.rows[0]!);
  }
  async createRefreshSession(input: Omit<RefreshSessionRecord, 'id' | 'createdAt'>) {
    const result = await getPool().query<SessionRow>('INSERT INTO refresh_sessions(user_id,token_hash,expires_at,revoked_at,user_agent,ip_address) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [input.userId, input.tokenHash, input.expiresAt, input.revokedAt, input.userAgent, input.ipAddress]);
    return mapSession(result.rows[0]!);
  }
  async findRefreshSession(tokenHash: string) {
    const result = await getPool().query<SessionRow>('SELECT * FROM refresh_sessions WHERE token_hash=$1', [tokenHash]);
    return result.rows[0] ? mapSession(result.rows[0]) : undefined;
  }
  async revokeRefreshSession(tokenHash: string) { await getPool().query('UPDATE refresh_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL', [tokenHash]); }
  async createOtp(input: Omit<OtpRecord, 'id' | 'createdAt'>) {
    const result = await getPool().query<OtpRow>('INSERT INTO otp_codes(identity,purpose,code_hash,expires_at,consumed_at) VALUES($1,$2,$3,$4,$5) RETURNING *', [input.identity, input.purpose, input.codeHash, input.expiresAt, input.consumedAt]);
    return mapOtp(result.rows[0]!);
  }
  async findLatestOtp(identity: string, purpose: string) {
    const result = await getPool().query<OtpRow>('SELECT * FROM otp_codes WHERE identity=$1 AND purpose=$2 ORDER BY created_at DESC LIMIT 1', [identity, purpose]);
    return result.rows[0] ? mapOtp(result.rows[0]) : undefined;
  }
  async consumeOtp(id: string) { await getPool().query('UPDATE otp_codes SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL', [id]); }
  async listUniversities(options: { query?: string; includeInactive?: boolean } = {}) {
    const clauses = [options.includeInactive ? 'true' : 'active=true'];
    const values: unknown[] = [];
    if (options.query) { values.push(`%${options.query}%`); clauses.push(`(name ILIKE $${values.length} OR short_name ILIKE $${values.length} OR city ILIKE $${values.length})`); }
    const result = await getPool().query<UniversityRow>(`SELECT * FROM universities WHERE ${clauses.join(' AND ')} ORDER BY city,name`, values);
    return result.rows.map(mapUniversity);
  }
  async findUniversityById(id: string) {
    const result = await getPool().query<UniversityRow>('SELECT * FROM universities WHERE id=$1', [id]);
    return result.rows[0] ? mapUniversity(result.rows[0]) : undefined;
  }
  async createUniversity(input: UniversityInput) {
    const result = await getPool().query<UniversityRow>('INSERT INTO universities(name,short_name,city,latitude,longitude,default_radius_km,logo_url,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [input.name, input.shortName, input.city, input.latitude, input.longitude, input.defaultRadiusKm, input.logoUrl, input.active]);
    return mapUniversity(result.rows[0]!);
  }
  async updateUniversity(id: string, input: Partial<UniversityInput>) {
    const existing = await this.findUniversityById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...input };
    const result = await getPool().query<UniversityRow>('UPDATE universities SET name=$2,short_name=$3,city=$4,latitude=$5,longitude=$6,default_radius_km=$7,logo_url=$8,active=$9,updated_at=now() WHERE id=$1 RETURNING *', [id, merged.name, merged.shortName, merged.city, merged.latitude, merged.longitude, merged.defaultRadiusKm, merged.logoUrl, merged.active]);
    return result.rows[0] ? mapUniversity(result.rows[0]) : undefined;
  }
  async audit(actorId: string | undefined, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
    await getPool().query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5)', [actorId, action, entityType, entityId, metadata]);
  }
}

