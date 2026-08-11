# Architecture

## System shape

The product is a TypeScript monorepo with an Expo/React Native client, an Express API, shared contracts, and a PostgreSQL/PostGIS persistence layer. The mobile app communicates only through versioned REST endpoints. It never connects directly to PostgreSQL.

## Mobile application

Expo Router provides native stack and tab navigation, deep links, and a web-compatible fallback. TanStack Query owns server state; Zustand owns session and local UI state; React Hook Form and Zod validate forms. Secure tokens are stored with Expo Secure Store. Public browsing does not require authentication.

## API

The API is organized by domain modules: authentication, universities, properties, units, discovery, favourites, reports, inquiries, uploads, admin, and analytics. Middleware applies request IDs, structured logging, secure headers, CORS, validation, authentication, authorization, and centralized error responses.

## Persistence modes

- PostgreSQL mode is the production path and uses geospatial indexes and `ST_DWithin`/`ST_Distance` for university-radius discovery.
- Demo mode implements the same repository contracts in memory so the complete product can be reviewed before a database is provisioned.

## Location privacy

Exact coordinates remain server-side. Discovery results calculate against exact coordinates, but the public API returns a deterministic approximate point when a property owner selects approximate visibility. Admin and listing owners can access the exact point.

## Availability lifecycle

An available unit records `lastAvailabilityConfirmedAt`. A scheduled maintenance job identifies units after the reminder threshold and downgrades them to `UNCONFIRMED` after the stale threshold. The thresholds are environment-configurable.

