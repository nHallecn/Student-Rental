# PR: Add database foundation, authentication, roles, and universities

## Summary

Adds the complete PostgreSQL/PostGIS V1 schema, dual demo/PostgreSQL repositories, password and OTP authentication, rotating refresh sessions, JWT access tokens, role authorization, public university search, and administrator university CRUD.

## Why

Every supply and discovery flow depends on trusted identities, role boundaries, and a canonical university search context. The database migration also freezes the relationships and geographic indexes required by later stages.

## Security and behavior

- Passwords use bcrypt with a work factor of 12.
- Refresh tokens are random, stored only as SHA-256 hashes, rotated on use, and revocable.
- Access tokens are short-lived, issuer/audience checked JWTs.
- Auth endpoints are rate limited and suspended accounts are rejected.
- Public registration cannot create administrator accounts.
- Demo mode supplies one account per role; production uses PostgreSQL through the same interface.

## Validation

- `npm run typecheck`
- `npm test`
- Authentication, authorization, public university and administrator university API tests
- `git diff --check`

