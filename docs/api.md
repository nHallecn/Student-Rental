# REST API

Base path: `/api/v1`. Successful collections use `{ items }` or the pagination envelope. Errors always use `{ error: { code, message, details, requestId } }`.

## Public discovery

- `GET /universities`, `/universities/search?q=`, `/universities/:id`
- `GET /universities/:id/rentals` with price, type, distance, source, amenities, availability, sort and pagination parameters
- `GET /properties/:id`, `GET /properties/:id/units`, `GET /amenities`
- `POST /units/:id/contact`, `POST /properties/:id/report`, `POST /analytics/events`

## Authentication and student actions

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/request-otp`, `/auth/verify-otp`
- `GET /auth/me`
- `GET /favourites`, `POST /favourites/:unitId`, `DELETE /favourites/:unitId`

## Landlord and agent supply

- `GET /properties/mine`, `POST /properties`, `PATCH/DELETE /properties/:id`, `POST /properties/:id/submit`
- `POST /properties/:id/images` for optimized multipart upload; `/images/remote` for managed object-storage URLs
- `POST /properties/:id/units`, `PATCH/DELETE /units/:id`, `PATCH /units/:id/availability`
- `GET /dashboard/owner`

## Administration

- University list/create/update under `/admin/universities`
- Listing queue and decisions under `/admin/properties`
- Report workflow under `/admin/reports`
- User suspension under `/admin/users`
- Marketplace statistics and stale-availability sweep under `/admin`

Bearer access tokens are required where indicated by role. Refresh tokens are sent only in request bodies to the refresh and logout endpoints and are rotated on every refresh.

