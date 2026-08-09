# PR: Implement the complete marketplace API

## Summary

Implements all supply, discovery, interaction, moderation and analytics domains from the SRS across both demo and PostgreSQL modes.

## What changed

- Geographic university-radius search with filters, sorting, pagination, availability rules and approximate public markers.
- Property, image, amenity and multi-unit management with ownership enforcement and moderation states.
- Local image validation, resize and WebP optimization plus a managed-storage URL path.
- One-action availability confirmation, configurable stale-unit downgrading and daily maintenance.
- Favourites, native contact intent, reporting and analytics events.
- Owner dashboard and administrator listing/report/user/university/statistics workflows.
- Full REST reference and cross-role integration tests.

## Impact

The API is feature-complete for the V1 mobile app. It can be reviewed immediately in demo mode and switched to PostgreSQL/PostGIS without changing routes or business behavior.

## Validation

- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`

