# Security policy

Report suspected vulnerabilities privately to the project owner. Do not include credentials, personal data or exploit details in public issues.

## Implemented controls

- bcrypt password hashing, short-lived issuer/audience-bound JWTs and hashed rotating refresh tokens
- OTP expiry/one-time consumption and production webhook enforcement
- role and ownership checks for every mutation
- Zod input validation, request/body limits and layered rate limits
- MIME/size/count checks plus server-side image transcoding
- exact-location privacy, safe error envelopes, security headers and CORS allowlists
- moderation/audit records, suspension, stale-listing maintenance and least-data public responses

## Dependency review

Expo Doctor is the compatibility authority for the native dependency matrix and must pass before release. `npm audit` currently reports advisories in the Expo/Metro build toolchain whose automatic fix recommends incompatible downgrades to old Expo/React Native releases. The workspace-scoped production API audit reports zero vulnerabilities, and the production container installs only the API and shared-contract workspaces. Re-evaluate advisories on every dependency update and upgrade to patched Expo SDK releases when available; never apply `npm audit fix --force` without validating Expo compatibility.

## Production requirements

Use HTTPS, secret management, encrypted managed PostgreSQL, automatic backups, protected CI environments, short-lived deployment credentials, signed mobile builds, provider-side OTP throttling, malware-aware object storage and central log/alert retention. Rotate secrets after suspected exposure.
