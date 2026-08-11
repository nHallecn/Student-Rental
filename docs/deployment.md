# Deployment runbook

## Local full stack with PostgreSQL

1. Copy `.env.example` to `.env` and replace the secrets.
2. Run `docker compose up -d database`.
3. Set `DATABASE_URL=postgresql://student_rental:local-development-only@localhost:5432/student_rental` and `DEMO_MODE=false` in the shell used for commands.
4. Run `npm run db:migrate -w @student-rental/api`.
5. Set a 12+ character `SEED_ADMIN_PASSWORD`, then run `npm run db:seed -w @student-rental/api`.
6. Run `npm run dev` and set the mobile API URL to the computer's reachable address.

`docker compose up --build` can run the API and PostGIS together. Run migration and seed as one-off commands before first use.

## Production API

Build `apps/api/Dockerfile` from the repository root. Deploy behind a TLS-terminating load balancer and a persistent volume or object-storage adapter for images.

Required environment configuration:

- `NODE_ENV=production`, `PORT`, `API_PUBLIC_URL`, `CORS_ORIGINS`
- `DATABASE_URL` with TLS and least-privilege credentials
- a random `JWT_SECRET` of at least 32 characters
- `DEMO_MODE=false`
- `OTP_PROVIDER=webhook`, `OTP_DELIVERY_WEBHOOK_URL`, and provider token when required
- availability reminder/stale thresholds
- image driver, limits and storage credentials

Run the migration as a release job before starting the new API revision. Run the idempotent seed once to create the initial administrator, universities and amenities. Confirm `/health`, then run `API_URL=https://your-api.example npm run smoke`.

Use managed PostgreSQL backups and point-in-time recovery. Alert on API 5xx rate, latency, failed OTP deliveries, moderation backlog, stale availability, disk usage and database connection saturation.

## Mobile builds

1. Set `EXPO_PUBLIC_API_URL` to the production `/api/v1` URL.
2. Replace the EAS project ID and confirm Android/iOS bundle identifiers in `apps/mobile/app.json`.
3. Add final store icons, splash assets, privacy URLs and support contact.
4. Run `npx expo-doctor@latest` from `apps/mobile`.
5. Run `eas build --profile preview` for stakeholder acceptance.
6. Run `eas build --profile production`, test the signed artifact, then submit with `eas submit --profile production`.

Store secrets in the deployment/EAS secret manager, never in the repository. Use separate development, staging and production API/database projects.

## Rollback

Deploy immutable API image tags. Roll back the application image first; database migrations in V1 are additive. Take a backup before any future destructive migration and publish a tested down/forward-fix plan with that release.

