# Student Rental Finder Cameroon

A deployable Expo/React Native mobile application and Node.js API for finding currently available student accommodation around universities in Cameroon. The implementation follows `Student_Rental_Finder_Cameroon_MVP_Specification.docx`.

## Workspace

- `apps/mobile` - Expo SDK 57 React Native app for students, landlords, agents, and administrators.
- `apps/api` - Express and TypeScript REST API under `/api/v1`.
- `packages/contracts` - shared domain types and API contracts.
- `docs` - architecture, setup, deployment, API, and requirements traceability.

## Prerequisites

- Node.js 22.13 or newer
- npm 11 or newer
- PostgreSQL 16+ with PostGIS for production (not required for demo mode)
- Expo Go or an Android/iOS emulator

## Quick start without a database

1. Copy `.env.example` to `.env` and leave `DEMO_MODE=true`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the mobile app with Expo Go or an emulator.

Demo mode starts with realistic Yaounde universities, properties, rental units, users, reports, and analytics. Data is reset when the API restarts.

Demo sign-ins use password `Demo123!`: `student@demo.cm`, `landlord@demo.cm`, `agent@demo.cm`, and `admin@demo.cm`.

## Production database

The repository contains a PostgreSQL/PostGIS-ready schema and migration workflow. When the database is available, set `DATABASE_URL`, set `DEMO_MODE=false`, run the documented migrations and seed, then deploy the API. See `docs/database.md` and `docs/deployment.md`.

For a local PostGIS instance, use `docker compose up -d database`. The full launch and rollback procedure is in `docs/deployment.md`; endpoint and acceptance references are in `docs/api.md` and `docs/acceptance.md`.

## Quality commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Security

Never commit `.env` files or real credentials. Production requires HTTPS, a randomly generated JWT secret, managed object storage, an email/SMS provider for OTP, and database backups.
