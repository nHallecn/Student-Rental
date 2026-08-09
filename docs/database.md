# PostgreSQL and PostGIS setup

The API runs in memory while `DEMO_MODE=true`. When a database is ready, provision PostgreSQL 16 or newer with the PostGIS extension and follow this sequence.

1. Create an empty database and a least-privilege application user.
2. Set `DATABASE_URL` in the API environment.
3. Set `DEMO_MODE=false`.
4. Run `npm run db:migrate -w @student-rental/api` once.
5. Seed an administrator, universities, amenities, and initial inventory using the seed command added in the launch stage.
6. Start the API and verify `GET /health` reports `mode: postgres`.

The initial migration enables `postgis`, `pgcrypto`, and `citext`; creates all V1 entities; enforces non-negative charges and valid coordinates; and adds GiST, text-search, discovery, moderation, and analytics indexes.

Production deployments should use a managed connection pool, encrypted connections, automated backups, point-in-time recovery, and separate migration credentials from runtime credentials.

