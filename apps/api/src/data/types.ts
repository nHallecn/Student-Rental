import type {
  AmenitySummary, ContactMethod, LocationVisibility, MarketplaceStats, Paginated, PropertyCategory,
  OwnerDashboard, PropertyDetails, PropertyImageSummary, PropertyReportSummary, PropertyStatus, PublicUser, RentalSearchParams,
  RentalUnitDetails, RentalUnitSummary, ReportReason, UniversitySummary, UserRole, VerificationStatus,
} from '@student-rental/contracts';

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
  listAmenities(): Promise<AmenitySummary[]>;
  createProperty(ownerId: string, input: PropertyInput): Promise<PropertyDetails>;
  listOwnerProperties(ownerId: string): Promise<PropertyDetails[]>;
  findPropertyDetails(id: string): Promise<PropertyDetails | undefined>;
  updateProperty(id: string, input: Partial<PropertyInput>): Promise<PropertyDetails | undefined>;
  setPropertyStatus(id: string, status: PropertyStatus, reviewNotes?: string): Promise<PropertyDetails | undefined>;
  setPropertyVerification(id: string, status: VerificationStatus): Promise<PropertyDetails | undefined>;
  addPropertyImage(propertyId: string, input: PropertyImageInput): Promise<PropertyImageSummary>;
  deletePropertyImage(propertyId: string, imageId: string): Promise<boolean>;
  createUnit(propertyId: string, input: RentalUnitInput): Promise<RentalUnitDetails>;
  updateUnit(id: string, input: Partial<RentalUnitInput>): Promise<RentalUnitDetails | undefined>;
  deleteUnit(id: string): Promise<boolean>;
  findUnit(id: string): Promise<RentalUnitDetails | undefined>;
  searchRentals(universityId: string, params: RentalSearchParams): Promise<Paginated<RentalUnitSummary>>;
  listFavourites(studentId: string): Promise<RentalUnitSummary[]>;
  addFavourite(studentId: string, unitId: string): Promise<void>;
  removeFavourite(studentId: string, unitId: string): Promise<void>;
  createReport(userId: string | undefined, propertyId: string, reason: ReportReason, description: string): Promise<PropertyReportSummary>;
  listReports(): Promise<PropertyReportSummary[]>;
  resolveReport(id: string, adminId: string, status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED', notes?: string): Promise<PropertyReportSummary | undefined>;
  createInquiry(studentId: string | undefined, unitId: string, method: ContactMethod): Promise<void>;
  recordAnalytics(userId: string | undefined, anonymousId: string | undefined, eventName: string, properties?: Record<string, unknown>): Promise<void>;
  listPendingProperties(): Promise<PropertyDetails[]>;
  listAllProperties(): Promise<PropertyDetails[]>;
  listUsers(): Promise<PublicUser[]>;
  setUserSuspended(id: string, suspended: boolean): Promise<PublicUser | undefined>;
  getMarketplaceStats(staleDays: number): Promise<MarketplaceStats>;
  downgradeStaleUnits(staleDays: number): Promise<number>;
  getOwnerDashboard(ownerId: string, reminderDays: number): Promise<OwnerDashboard>;
}

export interface PropertyInput {
  name: string;
  propertyCategory: PropertyCategory;
  description: string;
  city: string;
  neighbourhood: string;
  landmark: string;
  accessDetails?: string;
  latitude: number;
  longitude: number;
  locationVisibility: LocationVisibility;
  amenityIds: string[];
}

export interface PropertyImageInput {
  imageUrl: string;
  thumbnailUrl?: string;
  position: number;
}

export interface RentalUnitInput {
  name: string;
  unitType: RentalUnitDetails['unitType'];
  description: string;
  monthlyRent: number;
  advanceMonths: number;
  cautionAmount: number;
  visitFee: number;
  agentCommission: number;
  availabilityStatus: RentalUnitDetails['availabilityStatus'];
  availableFrom?: string;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...publicUser } = user;
  return publicUser;
}
