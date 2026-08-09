import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcryptjs';
import type { AmenitySummary, ContactMethod, PropertyDetails, PropertyReportSummary, PublicUser, RentalSearchParams, RentalUnitDetails, RentalUnitSummary, ReportReason } from '@student-rental/contracts';
import type { CoreRepository, NewUser, OtpRecord, PropertyImageInput, PropertyInput, RefreshSessionRecord, RentalUnitInput, UniversityInput, UniversityRecord, UserRecord } from './types.js';
import { toPublicUser } from './types.js';

const now = () => new Date().toISOString();

export class DemoRepository implements CoreRepository {
  private readonly users: UserRecord[];
  private readonly sessions: RefreshSessionRecord[] = [];
  private readonly otps: OtpRecord[] = [];
  private readonly universities: UniversityRecord[];
  private readonly amenities: AmenitySummary[];
  private readonly properties: PropertyDetails[];
  private readonly favourites = new Set<string>();
  private readonly reports: PropertyReportSummary[] = [];
  private readonly inquiries: Array<{ studentId?: string; unitId: string; method: ContactMethod; createdAt: string }> = [];
  private readonly analytics: Array<{ userId?: string; anonymousId?: string; eventName: string; properties: Record<string, unknown>; createdAt: string }> = [];
  readonly auditEntries: Array<Record<string, unknown>> = [];

  constructor() {
    const createdAt = now();
    const sharedPassword = hashSync('Demo123!', 10);
    this.users = [
      { id: '10000000-0000-4000-8000-000000000001', firstName: 'Amina', lastName: 'Student', phone: '+237670000001', email: 'student@demo.cm', passwordHash: sharedPassword, role: 'STUDENT', phoneVerified: true, createdAt, updatedAt: createdAt },
      { id: '10000000-0000-4000-8000-000000000002', firstName: 'Grace', lastName: 'Landlord', phone: '+237670000002', email: 'landlord@demo.cm', passwordHash: sharedPassword, role: 'LANDLORD', phoneVerified: true, createdAt, updatedAt: createdAt },
      { id: '10000000-0000-4000-8000-000000000003', firstName: 'Paul', lastName: 'Agent', phone: '+237670000003', email: 'agent@demo.cm', passwordHash: sharedPassword, role: 'AGENT', phoneVerified: true, createdAt, updatedAt: createdAt },
      { id: '10000000-0000-4000-8000-000000000004', firstName: 'Marie', lastName: 'Admin', phone: '+237670000004', email: 'admin@demo.cm', passwordHash: sharedPassword, role: 'ADMIN', phoneVerified: true, createdAt, updatedAt: createdAt },
    ];
    this.universities = [
      { id: '20000000-0000-4000-8000-000000000001', name: 'University of Yaounde I', shortName: 'UY1', city: 'Yaounde', latitude: 3.8619, longitude: 11.5007, defaultRadiusKm: 5, active: true, createdAt, updatedAt: createdAt },
      { id: '20000000-0000-4000-8000-000000000002', name: 'Catholic University of Central Africa', shortName: 'UCAC', city: 'Yaounde', latitude: 3.8876, longitude: 11.5126, defaultRadiusKm: 5, active: true, createdAt, updatedAt: createdAt },
      { id: '20000000-0000-4000-8000-000000000003', name: 'University of Yaounde II', shortName: 'UY2', city: 'Soa', latitude: 3.9694, longitude: 11.5878, defaultRadiusKm: 7, active: true, createdAt, updatedAt: createdAt },
    ];
    this.amenities = [
      ['30000000-0000-4000-8000-000000000001', 'CAMWATER', 'Water'], ['30000000-0000-4000-8000-000000000002', 'Borehole', 'Water'],
      ['30000000-0000-4000-8000-000000000003', 'ENEO', 'Electricity'], ['30000000-0000-4000-8000-000000000004', 'Prepaid meter', 'Electricity'],
      ['30000000-0000-4000-8000-000000000005', 'Private toilet', 'Room'], ['30000000-0000-4000-8000-000000000006', 'Kitchen', 'Room'],
      ['30000000-0000-4000-8000-000000000007', 'Balcony', 'Room'], ['30000000-0000-4000-8000-000000000008', 'Furnished', 'Room'],
      ['30000000-0000-4000-8000-000000000009', 'Security gate', 'Building'], ['30000000-0000-4000-8000-000000000010', 'Parking', 'Building'],
      ['30000000-0000-4000-8000-000000000011', 'Wi-Fi', 'Building'], ['30000000-0000-4000-8000-000000000012', 'Tarred road', 'Access'],
    ].map(([id, name, category]) => ({ id: id!, name: name!, category: category! }));
    const availableAt = new Date(Date.now() - 86_400_000).toISOString();
    this.properties = [
      {
        id: '40000000-0000-4000-8000-000000000001', ownerId: this.users[1]!.id, ownerName: 'Grace Landlord', source: 'LANDLORD', contactPhone: '+237670000002',
        name: 'Grace Student Residence', propertyCategory: 'MINI_CITE', description: 'Quiet gated student residence with reliable water near Ngoa-Ekelle campus.', city: 'Yaounde', neighbourhood: 'Ngoa-Ekelle', landmark: 'Behind the university stadium', accessDetails: 'Tarred road and motorbike access',
        latitude: 3.8627, longitude: 11.4945, locationVisibility: 'APPROXIMATE', verificationStatus: 'PROPERTY_VERIFIED', status: 'ACTIVE',
        images: [{ id: '50000000-0000-4000-8000-000000000001', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', thumbnailUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', position: 0 }],
        amenities: this.amenities.filter((_item, index) => [0, 2, 4, 5, 8, 11].includes(index)),
        units: [
          { id: '60000000-0000-4000-8000-000000000001', propertyId: '40000000-0000-4000-8000-000000000001', name: 'Room A02', unitType: 'MODERN_ROOM', description: 'Tiled room with private toilet and kitchen corner.', monthlyRent: 50000, advanceMonths: 6, cautionAmount: 50000, visitFee: 0, agentCommission: 0, availabilityStatus: 'AVAILABLE', lastAvailabilityConfirmedAt: availableAt, createdAt, updatedAt: createdAt },
          { id: '60000000-0000-4000-8000-000000000002', propertyId: '40000000-0000-4000-8000-000000000001', name: 'Studio B01', unitType: 'STUDIO', description: 'Independent studio with balcony.', monthlyRent: 75000, advanceMonths: 6, cautionAmount: 75000, visitFee: 0, agentCommission: 0, availabilityStatus: 'AVAILABLE_SOON', availableFrom: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10), lastAvailabilityConfirmedAt: availableAt, createdAt, updatedAt: createdAt },
        ], createdAt, updatedAt: createdAt, publishedAt: createdAt,
      },
      {
        id: '40000000-0000-4000-8000-000000000002', ownerId: this.users[2]!.id, ownerName: 'Paul Agent', source: 'AGENT', contactPhone: '+237670000003',
        name: 'Melen Campus Studios', propertyCategory: 'APARTMENT_BUILDING', description: 'Compact studios with easy taxi access.', city: 'Yaounde', neighbourhood: 'Melen', landmark: 'Near Total Melen', accessDetails: 'Car accessible', latitude: 3.8582, longitude: 11.4913, locationVisibility: 'EXACT', verificationStatus: 'PHONE_VERIFIED', status: 'ACTIVE',
        images: [{ id: '50000000-0000-4000-8000-000000000002', imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', thumbnailUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', position: 0 }], amenities: this.amenities.slice(2, 7),
        units: [{ id: '60000000-0000-4000-8000-000000000003', propertyId: '40000000-0000-4000-8000-000000000002', name: 'Studio 4', unitType: 'STUDIO', description: 'Bright studio on the first floor.', monthlyRent: 65000, advanceMonths: 10, cautionAmount: 65000, visitFee: 2000, agentCommission: 65000, availabilityStatus: 'AVAILABLE', lastAvailabilityConfirmedAt: availableAt, createdAt, updatedAt: createdAt }], createdAt, updatedAt: createdAt, publishedAt: createdAt,
      },
      {
        id: '40000000-0000-4000-8000-000000000003', ownerId: this.users[1]!.id, ownerName: 'Grace Landlord', source: 'LANDLORD', contactPhone: '+237670000002', name: 'New Soa Residence', propertyCategory: 'HOSTEL', description: 'New listing awaiting moderation.', city: 'Soa', neighbourhood: 'Soa centre', landmark: 'Market road', latitude: 3.9701, longitude: 11.582, locationVisibility: 'APPROXIMATE', verificationStatus: 'UNVERIFIED', status: 'PENDING_REVIEW', images: [], amenities: [], units: [{ id: '60000000-0000-4000-8000-000000000004', propertyId: '40000000-0000-4000-8000-000000000003', name: 'Room 1', unitType: 'ROOM', description: '', monthlyRent: 35000, advanceMonths: 6, cautionAmount: 35000, visitFee: 0, agentCommission: 0, availabilityStatus: 'UNCONFIRMED', createdAt, updatedAt: createdAt }], createdAt, updatedAt: createdAt,
      },
    ];
  }

  async findUserById(id: string) { return this.users.find((user) => user.id === id); }
  async findUserByIdentity(identity: string) {
    const normalized = identity.trim().toLowerCase();
    return this.users.find((user) => user.email?.toLowerCase() === normalized || user.phone === identity.trim());
  }
  async createUser(input: NewUser) {
    const timestamp = now();
    const user: UserRecord = { id: randomUUID(), ...input, phoneVerified: false, createdAt: timestamp, updatedAt: timestamp };
    this.users.push(user);
    return user;
  }
  async setPhoneVerified(userId: string) {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) throw new Error('User not found');
    user.phoneVerified = true;
    user.updatedAt = now();
    return user;
  }
  async createRefreshSession(input: Omit<RefreshSessionRecord, 'id' | 'createdAt'>) {
    const session = { id: randomUUID(), createdAt: now(), ...input };
    this.sessions.push(session);
    return session;
  }
  async findRefreshSession(tokenHash: string) { return this.sessions.find((session) => session.tokenHash === tokenHash); }
  async revokeRefreshSession(tokenHash: string) {
    const session = this.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (session) session.revokedAt = now();
  }
  async createOtp(input: Omit<OtpRecord, 'id' | 'createdAt'>) {
    const otp = { id: randomUUID(), createdAt: now(), ...input };
    this.otps.push(otp);
    return otp;
  }
  async findLatestOtp(identity: string, purpose: string) {
    return this.otps.filter((otp) => otp.identity === identity && otp.purpose === purpose).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }
  async consumeOtp(id: string) {
    const otp = this.otps.find((candidate) => candidate.id === id);
    if (otp) otp.consumedAt = now();
  }
  async listUniversities(options: { query?: string; includeInactive?: boolean } = {}) {
    const query = options.query?.trim().toLowerCase();
    return this.universities.filter((university) => {
      if (!options.includeInactive && !university.active) return false;
      if (!query) return true;
      return `${university.name} ${university.shortName} ${university.city}`.toLowerCase().includes(query);
    });
  }
  async findUniversityById(id: string) { return this.universities.find((university) => university.id === id); }
  async createUniversity(input: UniversityInput) {
    const timestamp = now();
    const university = { id: randomUUID(), ...input, createdAt: timestamp, updatedAt: timestamp };
    this.universities.push(university);
    return university;
  }
  async updateUniversity(id: string, input: Partial<UniversityInput>) {
    const university = this.universities.find((candidate) => candidate.id === id);
    if (!university) return undefined;
    Object.assign(university, input, { updatedAt: now() });
    return university;
  }
  async audit(actorId: string | undefined, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
    this.auditEntries.push({ id: randomUUID(), actorId, action, entityType, entityId, metadata, createdAt: now() });
  }

  async listAmenities() { return this.amenities.filter((item) => item); }

  async createProperty(ownerId: string, input: PropertyInput) {
    const owner = this.users.find((user) => user.id === ownerId)!;
    const timestamp = now();
    const property: PropertyDetails = {
      id: randomUUID(), ownerId, ownerName: `${owner.firstName} ${owner.lastName}`, source: owner.role === 'AGENT' ? 'AGENT' : 'LANDLORD', contactPhone: owner.phone,
      name: input.name, propertyCategory: input.propertyCategory, description: input.description, city: input.city, neighbourhood: input.neighbourhood, landmark: input.landmark,
      accessDetails: input.accessDetails, latitude: input.latitude, longitude: input.longitude, locationVisibility: input.locationVisibility,
      verificationStatus: owner.phoneVerified ? 'PHONE_VERIFIED' : 'UNVERIFIED', status: 'DRAFT', images: [], amenities: this.amenities.filter((amenity) => input.amenityIds.includes(amenity.id)), units: [], createdAt: timestamp, updatedAt: timestamp,
    };
    this.properties.push(property);
    return property;
  }

  async listOwnerProperties(ownerId: string) { return this.properties.filter((property) => property.ownerId === ownerId); }
  async findPropertyDetails(id: string) { return this.properties.find((property) => property.id === id); }
  async updateProperty(id: string, input: Partial<PropertyInput>) {
    const property = this.properties.find((candidate) => candidate.id === id);
    if (!property) return undefined;
    const { amenityIds, ...fields } = input;
    Object.assign(property, fields, { updatedAt: now() });
    if (amenityIds) property.amenities = this.amenities.filter((amenity) => amenityIds.includes(amenity.id));
    return property;
  }
  async setPropertyStatus(id: string, status: PropertyDetails['status'], reviewNotes?: string) {
    const property = this.properties.find((candidate) => candidate.id === id);
    if (!property) return undefined;
    property.status = status;
    property.reviewNotes = reviewNotes;
    property.updatedAt = now();
    if (status === 'ACTIVE') property.publishedAt = now();
    return property;
  }
  async setPropertyVerification(id: string, status: PropertyDetails['verificationStatus']) {
    const property = this.properties.find((candidate) => candidate.id === id);
    if (!property) return undefined;
    property.verificationStatus = status;
    property.updatedAt = now();
    return property;
  }
  async addPropertyImage(propertyId: string, input: PropertyImageInput) {
    const property = this.properties.find((candidate) => candidate.id === propertyId)!;
    const image = { id: randomUUID(), ...input };
    property.images.push(image);
    property.images.sort((a, b) => a.position - b.position);
    property.updatedAt = now();
    return image;
  }
  async deletePropertyImage(propertyId: string, imageId: string) {
    const property = this.properties.find((candidate) => candidate.id === propertyId);
    if (!property) return false;
    const index = property.images.findIndex((image) => image.id === imageId);
    if (index < 0) return false;
    property.images.splice(index, 1);
    property.updatedAt = now();
    return true;
  }
  async createUnit(propertyId: string, input: RentalUnitInput) {
    const timestamp = now();
    const unit: RentalUnitDetails = { id: randomUUID(), propertyId, ...input, lastAvailabilityConfirmedAt: input.availabilityStatus === 'AVAILABLE' ? timestamp : undefined, createdAt: timestamp, updatedAt: timestamp };
    this.properties.find((property) => property.id === propertyId)!.units.push(unit);
    return unit;
  }
  async updateUnit(id: string, input: Partial<RentalUnitInput>) {
    const unit = await this.findUnit(id);
    if (!unit) return undefined;
    Object.assign(unit, input, { updatedAt: now() });
    if (input.availabilityStatus === 'AVAILABLE') unit.lastAvailabilityConfirmedAt = now();
    return unit;
  }
  async deleteUnit(id: string) {
    for (const property of this.properties) {
      const index = property.units.findIndex((unit) => unit.id === id);
      if (index >= 0) { property.units.splice(index, 1); return true; }
    }
    return false;
  }
  async findUnit(id: string) { return this.properties.flatMap((property) => property.units).find((unit) => unit.id === id); }

  async searchRentals(universityId: string, params: RentalSearchParams) {
    const university = this.universities.find((candidate) => candidate.id === universityId)!;
    const maxDistance = params.distanceKm ?? university.defaultRadiusKm;
    let items = this.properties.filter((property) => property.status === 'ACTIVE').flatMap((property) => property.units.map((unit) => this.toRentalSummary(property, unit, university))).filter((unit) => {
      if (unit.distanceKm > maxDistance) return false;
      if (!params.availability?.length && !['AVAILABLE', 'AVAILABLE_SOON'].includes(unit.availabilityStatus)) return false;
      if (params.availability?.length && !params.availability.includes(unit.availabilityStatus)) return false;
      if (params.minPrice !== undefined && unit.monthlyRent < params.minPrice) return false;
      if (params.maxPrice !== undefined && unit.monthlyRent > params.maxPrice) return false;
      if (params.types?.length && !params.types.includes(unit.unitType)) return false;
      if (params.source && unit.source !== params.source) return false;
      if (params.amenityIds?.length && !params.amenityIds.every((id) => unit.amenities.includes(id))) return false;
      return true;
    });
    const sort = params.sort ?? 'RECENTLY_CONFIRMED';
    items = items.sort((a, b) => sort === 'CLOSEST' ? a.distanceKm - b.distanceKm : sort === 'PRICE_LOW' ? a.monthlyRent - b.monthlyRent : sort === 'PRICE_HIGH' ? b.monthlyRent - a.monthlyRent : sort === 'NEWEST' ? b.id.localeCompare(a.id) : (b.lastAvailabilityConfirmedAt ?? '').localeCompare(a.lastAvailabilityConfirmedAt ?? ''));
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 50);
    return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length, totalPages: Math.ceil(items.length / pageSize) };
  }

  async listFavourites(studentId: string) {
    const units: RentalUnitSummary[] = [];
    for (const key of this.favourites) {
      const [ownerId, unitId] = key.split(':');
      if (ownerId !== studentId) continue;
      const property = this.properties.find((candidate) => candidate.units.some((unit) => unit.id === unitId));
      const unit = property?.units.find((candidate) => candidate.id === unitId);
      if (property && unit) units.push(this.toRentalSummary(property, unit, this.universities[0]!));
    }
    return units;
  }
  async addFavourite(studentId: string, unitId: string) { this.favourites.add(`${studentId}:${unitId}`); }
  async removeFavourite(studentId: string, unitId: string) { this.favourites.delete(`${studentId}:${unitId}`); }
  async createReport(userId: string | undefined, propertyId: string, reason: ReportReason, description: string) {
    const property = this.properties.find((candidate) => candidate.id === propertyId)!;
    const report: PropertyReportSummary = { id: randomUUID(), userId, propertyId, propertyName: property.name, reason, description, status: 'OPEN', createdAt: now() };
    this.reports.push(report);
    return report;
  }
  async listReports() { return [...this.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async resolveReport(id: string, _adminId: string, status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED', notes?: string) {
    const report = this.reports.find((candidate) => candidate.id === id);
    if (!report) return undefined;
    report.status = status;
    report.resolutionNotes = notes;
    if (status === 'RESOLVED' || status === 'DISMISSED') report.resolvedAt = now();
    return report;
  }
  async createInquiry(studentId: string | undefined, unitId: string, method: ContactMethod) { this.inquiries.push({ studentId, unitId, method, createdAt: now() }); }
  async recordAnalytics(userId: string | undefined, anonymousId: string | undefined, eventName: string, properties: Record<string, unknown> = {}) { this.analytics.push({ userId, anonymousId, eventName, properties, createdAt: now() }); }
  async listPendingProperties() { return this.properties.filter((property) => ['SUBMITTED', 'PENDING_REVIEW', 'NEEDS_CHANGES'].includes(property.status)); }
  async listUsers(): Promise<PublicUser[]> { return this.users.map(toPublicUser); }
  async setUserSuspended(id: string, suspended: boolean) {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) return undefined;
    user.suspendedAt = suspended ? now() : undefined;
    user.updatedAt = now();
    return toPublicUser(user);
  }
  async getMarketplaceStats(staleDays: number) {
    const cutoff = Date.now() - staleDays * 86_400_000;
    const units = this.properties.flatMap((property) => property.units);
    return { users: this.users.length, activeProperties: this.properties.filter((property) => property.status === 'ACTIVE').length, availableUnits: units.filter((unit) => unit.availabilityStatus === 'AVAILABLE').length, pendingListings: this.properties.filter((property) => ['SUBMITTED', 'PENDING_REVIEW'].includes(property.status)).length, openReports: this.reports.filter((report) => ['OPEN', 'IN_REVIEW'].includes(report.status)).length, contactActions: this.inquiries.length, staleUnits: units.filter((unit) => unit.availabilityStatus === 'AVAILABLE' && (!unit.lastAvailabilityConfirmedAt || new Date(unit.lastAvailabilityConfirmedAt).getTime() < cutoff)).length };
  }
  async downgradeStaleUnits(staleDays: number) {
    const cutoff = Date.now() - staleDays * 86_400_000;
    let count = 0;
    for (const unit of this.properties.flatMap((property) => property.units)) {
      if (unit.availabilityStatus === 'AVAILABLE' && (!unit.lastAvailabilityConfirmedAt || new Date(unit.lastAvailabilityConfirmedAt).getTime() < cutoff)) { unit.availabilityStatus = 'UNCONFIRMED'; unit.updatedAt = now(); count += 1; }
    }
    return count;
  }
  async getOwnerDashboard(ownerId: string, reminderDays: number) {
    const properties = this.properties.filter((property) => property.ownerId === ownerId); const unitIds = new Set(properties.flatMap((property) => property.units.map((unit) => unit.id))); const units = properties.flatMap((property) => property.units);
    const cutoff = Date.now() - reminderDays * 86_400_000;
    return { properties: properties.length, activeProperties: properties.filter((property) => property.status === 'ACTIVE').length, availableUnits: units.filter((unit) => unit.availabilityStatus === 'AVAILABLE').length, occupiedUnits: units.filter((unit) => unit.availabilityStatus === 'OCCUPIED').length, inquiries: this.inquiries.filter((inquiry) => unitIds.has(inquiry.unitId)).length, confirmationNeededUnits: units.filter((unit) => unit.availabilityStatus === 'AVAILABLE' && (!unit.lastAvailabilityConfirmedAt || new Date(unit.lastAvailabilityConfirmedAt).getTime() < cutoff)).length };
  }

  private toRentalSummary(property: PropertyDetails, unit: RentalUnitDetails, university: UniversityRecord): RentalUnitSummary {
    const distanceKm = haversineKm(university.latitude, university.longitude, property.latitude, property.longitude);
    const approximate = property.locationVisibility === 'APPROXIMATE';
    return { id: unit.id, propertyId: property.id, propertyName: property.name, name: unit.name, unitType: unit.unitType, monthlyRent: unit.monthlyRent, advanceMonths: unit.advanceMonths, cautionAmount: unit.cautionAmount, visitFee: unit.visitFee, agentCommission: unit.agentCommission, availabilityStatus: unit.availabilityStatus, availableFrom: unit.availableFrom, lastAvailabilityConfirmedAt: unit.lastAvailabilityConfirmedAt, distanceKm: Math.round(distanceKm * 10) / 10, neighbourhood: property.neighbourhood, landmark: property.landmark, source: property.source, verificationStatus: property.verificationStatus, thumbnailUrl: property.images[0]?.thumbnailUrl ?? property.images[0]?.imageUrl, amenities: property.amenities.map((amenity) => amenity.id), publicLocation: { latitude: property.latitude + (approximate ? 0.0014 : 0), longitude: property.longitude - (approximate ? 0.0012 : 0) } };
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1); const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
