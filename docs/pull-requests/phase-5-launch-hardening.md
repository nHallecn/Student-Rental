# PR: Add launch hardening, CI and deployment operations

## Summary

Turns the complete application into an operable release: production API container, local PostGIS stack, idempotent seed, CI gates, smoke test, strict production configuration, OTP delivery adapter and deployment/security/acceptance runbooks.

## What changed

- Multi-stage non-root API Docker image with health check and workspace-only runtime dependencies.
- Docker Compose PostGIS and persistent image storage for local integration.
- Administrator/university/amenity seed and migration commands.
- Production secret and OTP provider validation plus authenticated OTP webhook delivery.
- General API rate limit in addition to auth-specific throttling.
- GitHub Actions checks, Expo Doctor and production web export.
- Smoke test, acceptance matrix, deployment/rollback runbook and security policy.

## Validation

- `npm run check`
- `npm run build`
- `npx expo-doctor@latest` (20/20)
- Expo production web export
- Docker image build when Docker is available
- `git diff --check`

