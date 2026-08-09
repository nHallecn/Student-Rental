BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('STUDENT', 'LANDLORD', 'AGENT', 'ADMIN');
CREATE TYPE unit_availability AS ENUM ('AVAILABLE', 'OCCUPIED', 'AVAILABLE_SOON', 'UNCONFIRMED');
CREATE TYPE property_status AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'ARCHIVED');
CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'PHONE_VERIFIED', 'PROPERTY_VERIFIED', 'REJECTED');
CREATE TYPE unit_type AS ENUM ('ROOM', 'MODERN_ROOM', 'STUDIO', 'APARTMENT', 'HOUSE');
CREATE TYPE property_category AS ENUM ('MINI_CITE', 'HOSTEL', 'APARTMENT_BUILDING', 'HOUSE', 'COMPOUND');
CREATE TYPE location_visibility AS ENUM ('APPROXIMATE', 'EXACT');
CREATE TYPE report_reason AS ENUM ('NO_LONGER_AVAILABLE', 'WRONG_PRICE', 'FALSE_LOCATION', 'FRAUD', 'UNDISCLOSED_FEE', 'DUPLICATE', 'INAPPROPRIATE', 'OTHER');
CREATE TYPE moderation_status AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE contact_method AS ENUM ('WHATSAPP', 'PHONE');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text UNIQUE,
  email citext UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL,
  phone_verified boolean NOT NULL DEFAULT false,
  profile_image_url text,
  suspended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_identity_required CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity text NOT NULL,
  purpose text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_identity_purpose_idx ON otp_codes(identity, purpose, created_at DESC);

CREATE TABLE universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  city text NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  default_radius_km numeric(5,2) NOT NULL DEFAULT 5 CHECK (default_radius_km > 0),
  logo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX universities_location_gix ON universities USING gist(location);
CREATE INDEX universities_search_idx ON universities USING gin(to_tsvector('simple', name || ' ' || short_name || ' ' || city));

CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  property_category property_category NOT NULL,
  description text NOT NULL DEFAULT '',
  city text NOT NULL,
  neighbourhood text NOT NULL,
  landmark text NOT NULL,
  access_details text,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  location_visibility location_visibility NOT NULL DEFAULT 'APPROXIMATE',
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  status property_status NOT NULL DEFAULT 'DRAFT',
  review_notes text,
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_location_gix ON properties USING gist(location);
CREATE INDEX properties_owner_idx ON properties(owner_id);
CREATE INDEX properties_status_idx ON properties(status, published_at DESC);

CREATE TABLE rental_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit_type unit_type NOT NULL,
  description text NOT NULL DEFAULT '',
  monthly_rent integer NOT NULL CHECK (monthly_rent >= 0),
  advance_months integer NOT NULL DEFAULT 0 CHECK (advance_months >= 0),
  caution_amount integer NOT NULL DEFAULT 0 CHECK (caution_amount >= 0),
  visit_fee integer NOT NULL DEFAULT 0 CHECK (visit_fee >= 0),
  agent_commission integer NOT NULL DEFAULT 0 CHECK (agent_commission >= 0),
  availability_status unit_availability NOT NULL DEFAULT 'UNCONFIRMED',
  available_from date,
  last_availability_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rental_units_property_idx ON rental_units(property_id);
CREATE INDEX rental_units_discovery_idx ON rental_units(availability_status, monthly_rent);

CREATE TABLE property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  thumbnail_url text,
  position integer NOT NULL DEFAULT 0,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, position)
);

CREATE TABLE amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE property_amenities (
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES amenities(id),
  PRIMARY KEY(property_id, amenity_id)
);

CREATE TABLE favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, unit_id)
);

CREATE TABLE property_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description text NOT NULL DEFAULT '',
  status moderation_status NOT NULL DEFAULT 'OPEN',
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id)
);
CREATE INDEX property_reports_status_idx ON property_reports(status, created_at DESC);

CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE SET NULL,
  unit_id uuid NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
  contact_method contact_method NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inquiries_unit_idx ON inquiries(unit_id, created_at DESC);

CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id text,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_event_name_idx ON analytics_events(event_name, created_at DESC);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);

COMMIT;
