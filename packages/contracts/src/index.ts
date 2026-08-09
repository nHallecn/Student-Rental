export const USER_ROLES = ['STUDENT', 'LANDLORD', 'AGENT', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const UNIT_AVAILABILITIES = ['AVAILABLE', 'OCCUPIED', 'AVAILABLE_SOON', 'UNCONFIRMED'] as const;
export type UnitAvailability = (typeof UNIT_AVAILABILITIES)[number];

export const PROPERTY_STATUSES = ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'ARCHIVED'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PHONE_VERIFIED', 'PROPERTY_VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const UNIT_TYPES = ['ROOM', 'MODERN_ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const PROPERTY_CATEGORIES = ['MINI_CITE', 'HOSTEL', 'APARTMENT_BUILDING', 'HOUSE', 'COMPOUND'] as const;
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

export const LOCATION_VISIBILITIES = ['APPROXIMATE', 'EXACT'] as const;
export type LocationVisibility = (typeof LOCATION_VISIBILITIES)[number];

export const REPORT_REASONS = ['NO_LONGER_AVAILABLE', 'WRONG_PRICE', 'FALSE_LOCATION', 'FRAUD', 'UNDISCLOSED_FEE', 'DUPLICATE', 'INAPPROPRIATE', 'OTHER'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ListingSource = 'LANDLORD' | 'AGENT';
export type ContactMethod = 'WHATSAPP' | 'PHONE';
export type SortOption = 'CLOSEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'NEWEST' | 'RECENTLY_CONFIRMED';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UniversitySummary extends Coordinates {
  id: string;
  name: string;
  shortName: string;
  city: string;
  defaultRadiusKm: number;
  logoUrl?: string;
  active: boolean;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  role: UserRole;
  phoneVerified: boolean;
  profileImageUrl?: string;
  suspendedAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface RentalCharges {
  monthlyRent: number;
  advanceMonths: number;
  cautionAmount: number;
  visitFee: number;
  agentCommission: number;
}

export interface RentalUnitSummary extends RentalCharges {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  unitType: UnitType;
  availabilityStatus: UnitAvailability;
  availableFrom?: string;
  lastAvailabilityConfirmedAt?: string;
  distanceKm: number;
  neighbourhood: string;
  landmark: string;
  source: ListingSource;
  verificationStatus: VerificationStatus;
  thumbnailUrl?: string;
  amenities: string[];
  publicLocation: Coordinates;
}

export interface RentalSearchParams {
  minPrice?: number;
  maxPrice?: number;
  types?: UnitType[];
  distanceKm?: number;
  source?: ListingSource;
  amenityIds?: string[];
  availability?: UnitAvailability[];
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}
