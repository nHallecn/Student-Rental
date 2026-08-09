# Mobile application

The Expo SDK 57 app targets Android, iOS and a responsive web fallback from one React Native codebase.

## Student journey

Public visitors select or search for a university, browse paginated active units, switch between native map and list views without losing filters, inspect complete rental conditions and availability freshness, and contact the source by WhatsApp or phone. Signed-in students can save homes. Anyone can share or report a property.

## Supply journey

Landlords and agents see property, available-unit, occupied-unit, inquiry and reconfirmation counts. They can create/edit a property, capture GPS coordinates, choose approximate/exact public visibility, select structured amenities, upload optimized photos, add multiple independently priced units, submit for review and update availability with one action.

## Administration journey

Administrators see marketplace health, moderate all listings, edit or verify properties, approve/request changes/reject/suspend, resolve reports, create/edit/disable universities, and suspend or restore users.

## Configuration

Set `EXPO_PUBLIC_API_URL` to the reachable `/api/v1` URL. A physical device cannot use the computer's `localhost`; use the computer's LAN address during local development. Configure the EAS project ID, bundle identifiers, store credentials, app icons and splash assets before store submission.

Run locally with `npm run dev:mobile`. Create preview or production binaries with `eas build --profile preview` or `eas build --profile production` after signing into Expo.

