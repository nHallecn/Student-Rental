# Requirements traceability

This checklist maps the source SRS to the implementation and its verification. Status is updated as each development stage lands.

| Requirement group | Planned implementation | Status |
| --- | --- | --- |
| FR-001 to FR-013 Student discovery | Universities, public radius search, list/map, filters/sorts, details, contacts, favourites, share, reports | Planned |
| FR-020 to FR-029 Supply | Properties, uploads, units, charges, amenities, statuses, confirmation, dashboard, source/fee disclosure | Planned |
| FR-040 to FR-045 Administration | University/listing/report/user moderation, verification and statistics | Planned |
| NFR-001 to NFR-012 | Password hashing, HTTPS posture, RBAC, schemas, safe uploads, privacy, performance, low bandwidth, atomic updates, logs, metadata | Planned |
| AC-01 to AC-10 | Automated API tests plus mobile acceptance checklist | Planned |

All V1 enumerations and state transitions are centralized in `@student-rental/contracts` so the client, API, database schema, and tests cannot silently diverge.

