import type { QueryResultRow } from 'pg';
import type { AmenitySummary, ContactMethod, MarketplaceStats, OwnerDashboard, Paginated, PropertyDetails, PropertyImageSummary, PropertyReportSummary, PublicUser, RentalSearchParams, RentalUnitDetails, RentalUnitSummary, ReportReason } from '@student-rental/contracts';
import { getPool } from '../db/pool.js';
import type { CoreRepository, NewUser, OtpRecord, PropertyImageInput, PropertyInput, RefreshSessionRecord, RentalUnitInput, UniversityInput, UniversityRecord, UserRecord } from './types.js';
import { toPublicUser } from './types.js';

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
interface PropertyRow extends QueryResultRow {
  id: string; owner_id: string; owner_name: string; source: 'LANDLORD' | 'AGENT'; contact_phone: string | null; name: string;
  property_category: PropertyDetails['propertyCategory']; description: string; city: string; neighbourhood: string; landmark: string; access_details: string | null;
  latitude: number; longitude: number; location_visibility: PropertyDetails['locationVisibility']; verification_status: PropertyDetails['verificationStatus']; status: PropertyDetails['status']; review_notes: string | null; created_at: Date; updated_at: Date; published_at: Date | null;
}
interface UnitRow extends QueryResultRow {
  id: string; property_id: string; name: string; unit_type: RentalUnitDetails['unitType']; description: string; monthly_rent: number; advance_months: number; caution_amount: number; visit_fee: number; agent_commission: number; availability_status: RentalUnitDetails['availabilityStatus']; available_from: string | null; last_availability_confirmed_at: Date | null; created_at: Date; updated_at: Date;
}
interface ImageRow extends QueryResultRow { id: string; image_url: string; thumbnail_url: string | null; position: number; }
interface AmenityRow extends QueryResultRow { id: string; name: string; category: string; }
interface ReportRow extends QueryResultRow { id: string; user_id: string | null; property_id: string; property_name: string; reason: ReportReason; description: string; status: PropertyReportSummary['status']; resolution_notes: string | null; created_at: Date; resolved_at: Date | null; }
interface RentalRow extends QueryResultRow {
  id: string; property_id: string; property_name: string; name: string; unit_type: RentalUnitDetails['unitType']; monthly_rent: number; advance_months: number; caution_amount: number; visit_fee: number; agent_commission: number; availability_status: RentalUnitDetails['availabilityStatus']; available_from: string | null; last_availability_confirmed_at: Date | null; distance_km: number; neighbourhood: string; landmark: string; source: 'LANDLORD' | 'AGENT'; verification_status: PropertyDetails['verificationStatus']; thumbnail_url: string | null; amenity_ids: string[]; public_latitude: number; public_longitude: number; total_count: number;
}

const maybe = <T>(value: T | null): T | undefined => value ?? undefined;
const mapUser = (row: UserRow): UserRecord => ({ id: row.id, firstName: row.first_name, lastName: row.last_name, phone: maybe(row.phone), email: maybe(row.email), passwordHash: row.password_hash, role: row.role, phoneVerified: row.phone_verified, profileImageUrl: maybe(row.profile_image_url), suspendedAt: row.suspended_at?.toISOString(), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
const mapUniversity = (row: UniversityRow): UniversityRecord => ({ id: row.id, name: row.name, shortName: row.short_name, city: row.city, latitude: row.latitude, longitude: row.longitude, defaultRadiusKm: Number(row.default_radius_km), logoUrl: maybe(row.logo_url), active: row.active, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
const mapSession = (row: SessionRow): RefreshSessionRecord => ({ id: row.id, userId: row.user_id, tokenHash: row.token_hash, expiresAt: row.expires_at.toISOString(), revokedAt: row.revoked_at?.toISOString(), userAgent: maybe(row.user_agent), ipAddress: maybe(row.ip_address), createdAt: row.created_at.toISOString() });
const mapOtp = (row: OtpRow): OtpRecord => ({ id: row.id, identity: row.identity, purpose: row.purpose, codeHash: row.code_hash, expiresAt: row.expires_at.toISOString(), consumedAt: row.consumed_at?.toISOString(), createdAt: row.created_at.toISOString() });
const mapUnit = (row: UnitRow): RentalUnitDetails => ({ id: row.id, propertyId: row.property_id, name: row.name, unitType: row.unit_type, description: row.description, monthlyRent: row.monthly_rent, advanceMonths: row.advance_months, cautionAmount: row.caution_amount, visitFee: row.visit_fee, agentCommission: row.agent_commission, availabilityStatus: row.availability_status, availableFrom: maybe(row.available_from), lastAvailabilityConfirmedAt: row.last_availability_confirmed_at?.toISOString(), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
const mapImage = (row: ImageRow): PropertyImageSummary => ({ id: row.id, imageUrl: row.image_url, thumbnailUrl: maybe(row.thumbnail_url), position: row.position });
const mapAmenity = (row: AmenityRow): AmenitySummary => ({ id: row.id, name: row.name, category: row.category });
const mapReport = (row: ReportRow): PropertyReportSummary => ({ id: row.id, userId: maybe(row.user_id), propertyId: row.property_id, propertyName: row.property_name, reason: row.reason, description: row.description, status: row.status, resolutionNotes: maybe(row.resolution_notes), createdAt: row.created_at.toISOString(), resolvedAt: row.resolved_at?.toISOString() });
const mapRental = (row: RentalRow): RentalUnitSummary => ({ id: row.id, propertyId: row.property_id, propertyName: row.property_name, name: row.name, unitType: row.unit_type, monthlyRent: row.monthly_rent, advanceMonths: row.advance_months, cautionAmount: row.caution_amount, visitFee: row.visit_fee, agentCommission: row.agent_commission, availabilityStatus: row.availability_status, availableFrom: maybe(row.available_from), lastAvailabilityConfirmedAt: row.last_availability_confirmed_at?.toISOString(), distanceKm: Number(row.distance_km), neighbourhood: row.neighbourhood, landmark: row.landmark, source: row.source, verificationStatus: row.verification_status, thumbnailUrl: maybe(row.thumbnail_url), amenities: row.amenity_ids ?? [], publicLocation: { latitude: row.public_latitude, longitude: row.public_longitude } });

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

  async listAmenities() {
    const result = await getPool().query<AmenityRow>('SELECT id,name,category FROM amenities WHERE active=true ORDER BY category,name');
    return result.rows.map(mapAmenity);
  }

  async createProperty(ownerId: string, input: PropertyInput) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const created = await client.query<PropertyRow>(`INSERT INTO properties(owner_id,name,property_category,description,city,neighbourhood,landmark,access_details,latitude,longitude,location_visibility)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *, ''::text AS owner_name, 'LANDLORD'::text AS source, NULL::text AS contact_phone`, [ownerId, input.name, input.propertyCategory, input.description, input.city, input.neighbourhood, input.landmark, input.accessDetails, input.latitude, input.longitude, input.locationVisibility]);
      for (const amenityId of input.amenityIds) await client.query('INSERT INTO property_amenities(property_id,amenity_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [created.rows[0]!.id, amenityId]);
      await client.query('COMMIT');
      return (await this.findPropertyDetails(created.rows[0]!.id))!;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async listOwnerProperties(ownerId: string) {
    const result = await getPool().query<{ id: string }>('SELECT id FROM properties WHERE owner_id=$1 ORDER BY updated_at DESC', [ownerId]);
    return Promise.all(result.rows.map(async (row) => (await this.findPropertyDetails(row.id))!));
  }
  async findPropertyDetails(id: string) {
    const propertyResult = await getPool().query<PropertyRow>(`SELECT p.*, concat(u.first_name,' ',u.last_name) owner_name, u.role::text source, u.phone contact_phone FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=$1`, [id]);
    const row = propertyResult.rows[0];
    if (!row) return undefined;
    const [images, amenities, units] = await Promise.all([
      getPool().query<ImageRow>('SELECT id,image_url,thumbnail_url,position FROM property_images WHERE property_id=$1 ORDER BY position', [id]),
      getPool().query<AmenityRow>('SELECT a.id,a.name,a.category FROM amenities a JOIN property_amenities pa ON pa.amenity_id=a.id WHERE pa.property_id=$1 ORDER BY a.category,a.name', [id]),
      getPool().query<UnitRow>('SELECT * FROM rental_units WHERE property_id=$1 ORDER BY created_at', [id]),
    ]);
    return { id: row.id, ownerId: row.owner_id, ownerName: row.owner_name, source: row.source, contactPhone: maybe(row.contact_phone), name: row.name, propertyCategory: row.property_category, description: row.description, city: row.city, neighbourhood: row.neighbourhood, landmark: row.landmark, accessDetails: maybe(row.access_details), latitude: row.latitude, longitude: row.longitude, locationVisibility: row.location_visibility, verificationStatus: row.verification_status, status: row.status, reviewNotes: maybe(row.review_notes), images: images.rows.map(mapImage), amenities: amenities.rows.map(mapAmenity), units: units.rows.map(mapUnit), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(), publishedAt: row.published_at?.toISOString() } satisfies PropertyDetails;
  }
  async updateProperty(id: string, input: Partial<PropertyInput>) {
    const existing = await this.findPropertyDetails(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...input };
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE properties SET name=$2,property_category=$3,description=$4,city=$5,neighbourhood=$6,landmark=$7,access_details=$8,latitude=$9,longitude=$10,location_visibility=$11,updated_at=now() WHERE id=$1`, [id, merged.name, merged.propertyCategory, merged.description, merged.city, merged.neighbourhood, merged.landmark, merged.accessDetails, merged.latitude, merged.longitude, merged.locationVisibility]);
      if (input.amenityIds) { await client.query('DELETE FROM property_amenities WHERE property_id=$1', [id]); for (const amenityId of input.amenityIds) await client.query('INSERT INTO property_amenities(property_id,amenity_id) VALUES($1,$2)', [id, amenityId]); }
      await client.query('COMMIT');
      return this.findPropertyDetails(id);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async setPropertyStatus(id: string, status: PropertyDetails['status'], reviewNotes?: string) {
    const result = await getPool().query('UPDATE properties SET status=$2,review_notes=$3,submitted_at=CASE WHEN $2 IN (\'SUBMITTED\',\'PENDING_REVIEW\') THEN now() ELSE submitted_at END,published_at=CASE WHEN $2=\'ACTIVE\' THEN now() ELSE published_at END,updated_at=now() WHERE id=$1 RETURNING id', [id, status, reviewNotes]);
    return result.rowCount ? this.findPropertyDetails(id) : undefined;
  }
  async setPropertyVerification(id: string, status: PropertyDetails['verificationStatus']) {
    const result = await getPool().query('UPDATE properties SET verification_status=$2,updated_at=now() WHERE id=$1 RETURNING id', [id, status]);
    return result.rowCount ? this.findPropertyDetails(id) : undefined;
  }
  async addPropertyImage(propertyId: string, input: PropertyImageInput) {
    const result = await getPool().query<ImageRow>('INSERT INTO property_images(property_id,image_url,thumbnail_url,position) VALUES($1,$2,$3,$4) RETURNING id,image_url,thumbnail_url,position', [propertyId, input.imageUrl, input.thumbnailUrl, input.position]);
    return mapImage(result.rows[0]!);
  }
  async deletePropertyImage(propertyId: string, imageId: string) { const result = await getPool().query('DELETE FROM property_images WHERE property_id=$1 AND id=$2', [propertyId, imageId]); return Boolean(result.rowCount); }
  async createUnit(propertyId: string, input: RentalUnitInput) {
    const result = await getPool().query<UnitRow>(`INSERT INTO rental_units(property_id,name,unit_type,description,monthly_rent,advance_months,caution_amount,visit_fee,agent_commission,availability_status,available_from,last_availability_confirmed_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $10='AVAILABLE' THEN now() ELSE NULL END) RETURNING *`, [propertyId, input.name, input.unitType, input.description, input.monthlyRent, input.advanceMonths, input.cautionAmount, input.visitFee, input.agentCommission, input.availabilityStatus, input.availableFrom]);
    return mapUnit(result.rows[0]!);
  }
  async updateUnit(id: string, input: Partial<RentalUnitInput>) {
    const existing = await this.findUnit(id); if (!existing) return undefined; const merged = { ...existing, ...input };
    const result = await getPool().query<UnitRow>(`UPDATE rental_units SET name=$2,unit_type=$3,description=$4,monthly_rent=$5,advance_months=$6,caution_amount=$7,visit_fee=$8,agent_commission=$9,availability_status=$10,available_from=$11,last_availability_confirmed_at=CASE WHEN $10='AVAILABLE' THEN now() ELSE last_availability_confirmed_at END,updated_at=now() WHERE id=$1 RETURNING *`, [id, merged.name, merged.unitType, merged.description, merged.monthlyRent, merged.advanceMonths, merged.cautionAmount, merged.visitFee, merged.agentCommission, merged.availabilityStatus, merged.availableFrom]);
    return result.rows[0] ? mapUnit(result.rows[0]) : undefined;
  }
  async deleteUnit(id: string) { const result = await getPool().query('DELETE FROM rental_units WHERE id=$1', [id]); return Boolean(result.rowCount); }
  async findUnit(id: string) { const result = await getPool().query<UnitRow>('SELECT * FROM rental_units WHERE id=$1', [id]); return result.rows[0] ? mapUnit(result.rows[0]) : undefined; }

  async searchRentals(universityId: string, params: RentalSearchParams): Promise<Paginated<RentalUnitSummary>> {
    const values: unknown[] = [universityId]; const where = [`u.id=$1`, `p.status='ACTIVE'`];
    const add = (value: unknown) => { values.push(value); return `$${values.length}`; };
    const maxDistance = add((params.distanceKm ?? 5) * 1000); where.push(`ST_DWithin(p.location,u.location,${maxDistance})`);
    if (params.availability?.length) where.push(`ru.availability_status = ANY(${add(params.availability)}::unit_availability[])`); else where.push(`ru.availability_status IN ('AVAILABLE','AVAILABLE_SOON')`);
    if (params.minPrice !== undefined) where.push(`ru.monthly_rent >= ${add(params.minPrice)}`);
    if (params.maxPrice !== undefined) where.push(`ru.monthly_rent <= ${add(params.maxPrice)}`);
    if (params.types?.length) where.push(`ru.unit_type = ANY(${add(params.types)}::unit_type[])`);
    if (params.source) where.push(`owner.role::text = ${add(params.source)}`);
    if (params.amenityIds?.length) where.push(`(SELECT array_agg(pa.amenity_id::text) FROM property_amenities pa WHERE pa.property_id=p.id) @> ${add(params.amenityIds)}::text[]`);
    const order = { CLOSEST: 'distance_km ASC', PRICE_LOW: 'ru.monthly_rent ASC', PRICE_HIGH: 'ru.monthly_rent DESC', NEWEST: 'ru.created_at DESC', RECENTLY_CONFIRMED: 'ru.last_availability_confirmed_at DESC NULLS LAST' }[params.sort ?? 'RECENTLY_CONFIRMED'];
    const page = params.page ?? 1; const pageSize = Math.min(params.pageSize ?? 20, 50); const limit = add(pageSize); const offset = add((page - 1) * pageSize);
    const sql = `SELECT ru.id,ru.property_id,p.name property_name,ru.name,ru.unit_type,ru.monthly_rent,ru.advance_months,ru.caution_amount,ru.visit_fee,ru.agent_commission,ru.availability_status,ru.available_from,ru.last_availability_confirmed_at,
      round((ST_Distance(p.location,u.location)/1000)::numeric,1)::float8 distance_km,p.neighbourhood,p.landmark,owner.role::text source,p.verification_status,
      (SELECT coalesce(pi.thumbnail_url,pi.image_url) FROM property_images pi WHERE pi.property_id=p.id ORDER BY pi.position LIMIT 1) thumbnail_url,
      coalesce((SELECT array_agg(pa.amenity_id::text) FROM property_amenities pa WHERE pa.property_id=p.id),'{}') amenity_ids,
      CASE WHEN p.location_visibility='APPROXIMATE' THEN p.latitude+0.0014 ELSE p.latitude END public_latitude,CASE WHEN p.location_visibility='APPROXIMATE' THEN p.longitude-0.0012 ELSE p.longitude END public_longitude,count(*) OVER() total_count
      FROM rental_units ru JOIN properties p ON p.id=ru.property_id JOIN users owner ON owner.id=p.owner_id CROSS JOIN universities u WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`;
    const result = await getPool().query<RentalRow>(sql, values); const total = Number(result.rows[0]?.total_count ?? 0);
    return { items: result.rows.map(mapRental), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async listFavourites(studentId: string) {
    const result = await getPool().query<RentalRow>(`SELECT ru.id,ru.property_id,p.name property_name,ru.name,ru.unit_type,ru.monthly_rent,ru.advance_months,ru.caution_amount,ru.visit_fee,ru.agent_commission,ru.availability_status,ru.available_from,ru.last_availability_confirmed_at,0::float8 distance_km,p.neighbourhood,p.landmark,owner.role::text source,p.verification_status,(SELECT coalesce(pi.thumbnail_url,pi.image_url) FROM property_images pi WHERE pi.property_id=p.id ORDER BY pi.position LIMIT 1) thumbnail_url,coalesce((SELECT array_agg(pa.amenity_id::text) FROM property_amenities pa WHERE pa.property_id=p.id),'{}') amenity_ids,p.latitude public_latitude,p.longitude public_longitude,count(*) OVER() total_count FROM favourites f JOIN rental_units ru ON ru.id=f.unit_id JOIN properties p ON p.id=ru.property_id JOIN users owner ON owner.id=p.owner_id WHERE f.student_id=$1 ORDER BY f.created_at DESC`, [studentId]);
    return result.rows.map(mapRental);
  }
  async addFavourite(studentId: string, unitId: string) { await getPool().query('INSERT INTO favourites(student_id,unit_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [studentId, unitId]); }
  async removeFavourite(studentId: string, unitId: string) { await getPool().query('DELETE FROM favourites WHERE student_id=$1 AND unit_id=$2', [studentId, unitId]); }
  async createReport(userId: string | undefined, propertyId: string, reason: ReportReason, description: string) {
    const result = await getPool().query<ReportRow>(`WITH inserted AS (INSERT INTO property_reports(user_id,property_id,reason,description) VALUES($1,$2,$3,$4) RETURNING *) SELECT i.*,p.name property_name FROM inserted i JOIN properties p ON p.id=i.property_id`, [userId, propertyId, reason, description]); return mapReport(result.rows[0]!);
  }
  async listReports() { const result = await getPool().query<ReportRow>('SELECT r.*,p.name property_name FROM property_reports r JOIN properties p ON p.id=r.property_id ORDER BY r.created_at DESC'); return result.rows.map(mapReport); }
  async resolveReport(id: string, adminId: string, status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED', notes?: string) { const result = await getPool().query<ReportRow>(`WITH updated AS (UPDATE property_reports SET status=$2,resolution_notes=$3,resolved_by=CASE WHEN $2 IN ('RESOLVED','DISMISSED') THEN $4 ELSE resolved_by END,resolved_at=CASE WHEN $2 IN ('RESOLVED','DISMISSED') THEN now() ELSE resolved_at END WHERE id=$1 RETURNING *) SELECT u.*,p.name property_name FROM updated u JOIN properties p ON p.id=u.property_id`, [id, status, notes, adminId]); return result.rows[0] ? mapReport(result.rows[0]) : undefined; }
  async createInquiry(studentId: string | undefined, unitId: string, method: ContactMethod) { await getPool().query('INSERT INTO inquiries(student_id,unit_id,contact_method) VALUES($1,$2,$3)', [studentId, unitId, method]); }
  async recordAnalytics(userId: string | undefined, anonymousId: string | undefined, eventName: string, properties: Record<string, unknown> = {}) { await getPool().query('INSERT INTO analytics_events(user_id,anonymous_id,event_name,properties) VALUES($1,$2,$3,$4)', [userId, anonymousId, eventName, properties]); }
  async listPendingProperties() { const result = await getPool().query<{ id: string }>("SELECT id FROM properties WHERE status IN ('SUBMITTED','PENDING_REVIEW','NEEDS_CHANGES') ORDER BY submitted_at NULLS LAST,created_at"); return Promise.all(result.rows.map(async (row) => (await this.findPropertyDetails(row.id))!)); }
  async listUsers(): Promise<PublicUser[]> { const result = await getPool().query<UserRow>('SELECT * FROM users ORDER BY created_at DESC'); return result.rows.map((row) => toPublicUser(mapUser(row))); }
  async setUserSuspended(id: string, suspended: boolean) { const result = await getPool().query<UserRow>('UPDATE users SET suspended_at=CASE WHEN $2 THEN now() ELSE NULL END,updated_at=now() WHERE id=$1 RETURNING *', [id, suspended]); return result.rows[0] ? toPublicUser(mapUser(result.rows[0])) : undefined; }
  async getMarketplaceStats(staleDays: number): Promise<MarketplaceStats> {
    const result = await getPool().query<{ users: number; active_properties: number; available_units: number; pending_listings: number; open_reports: number; contact_actions: number; stale_units: number }>(`SELECT (SELECT count(*)::int FROM users) users,(SELECT count(*)::int FROM properties WHERE status='ACTIVE') active_properties,(SELECT count(*)::int FROM rental_units WHERE availability_status='AVAILABLE') available_units,(SELECT count(*)::int FROM properties WHERE status IN ('SUBMITTED','PENDING_REVIEW')) pending_listings,(SELECT count(*)::int FROM property_reports WHERE status IN ('OPEN','IN_REVIEW')) open_reports,(SELECT count(*)::int FROM inquiries) contact_actions,(SELECT count(*)::int FROM rental_units WHERE availability_status='AVAILABLE' AND (last_availability_confirmed_at IS NULL OR last_availability_confirmed_at < now()-($1||' days')::interval)) stale_units`, [staleDays]);
    const row = result.rows[0]!; return { users: row.users, activeProperties: row.active_properties, availableUnits: row.available_units, pendingListings: row.pending_listings, openReports: row.open_reports, contactActions: row.contact_actions, staleUnits: row.stale_units };
  }
  async downgradeStaleUnits(staleDays: number) { const result = await getPool().query("UPDATE rental_units SET availability_status='UNCONFIRMED',updated_at=now() WHERE availability_status='AVAILABLE' AND (last_availability_confirmed_at IS NULL OR last_availability_confirmed_at < now()-($1||' days')::interval)", [staleDays]); return result.rowCount ?? 0; }
  async getOwnerDashboard(ownerId: string, reminderDays: number): Promise<OwnerDashboard> { const result = await getPool().query<{ properties: number; active_properties: number; available_units: number; occupied_units: number; inquiries: number; confirmation_needed_units: number }>(`SELECT count(DISTINCT p.id)::int properties,count(DISTINCT p.id) FILTER(WHERE p.status='ACTIVE')::int active_properties,count(DISTINCT ru.id) FILTER(WHERE ru.availability_status='AVAILABLE')::int available_units,count(DISTINCT ru.id) FILTER(WHERE ru.availability_status='OCCUPIED')::int occupied_units,count(DISTINCT i.id)::int inquiries,count(DISTINCT ru.id) FILTER(WHERE ru.availability_status='AVAILABLE' AND (ru.last_availability_confirmed_at IS NULL OR ru.last_availability_confirmed_at < now()-($2||' days')::interval))::int confirmation_needed_units FROM properties p LEFT JOIN rental_units ru ON ru.property_id=p.id LEFT JOIN inquiries i ON i.unit_id=ru.id WHERE p.owner_id=$1`, [ownerId, reminderDays]); const row = result.rows[0]!; return { properties: row.properties, activeProperties: row.active_properties, availableUnits: row.available_units, occupiedUnits: row.occupied_units, inquiries: row.inquiries, confirmationNeededUnits: row.confirmation_needed_units }; }
}
