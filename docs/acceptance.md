# MVP acceptance verification

| ID | Verification |
| --- | --- |
| AC-01 | Public university and radius-search integration test returns only active discoverable units. |
| AC-02 | Search integration test exercises maximum price, type and source; mobile exposes price, distance, type, source and amenity filters. |
| AC-03 | Property screen renders gallery, structured charges, source, privacy-aware location, amenities and last confirmation. |
| AC-04 | Property screen records an inquiry before opening WhatsApp or the phone dialer. |
| AC-05 | Cross-role test creates a property and unit; owner screen changes availability in one action. |
| AC-06 | Student role is rejected from administration; admin test approves a pending listing before it becomes public. |
| AC-07 | Report integration test creates and resolves a report; mobile report/admin screens expose the flow. |
| AC-08 | Repository maintenance downgrades stale available units; admin sweep and daily maintenance invoke it. |
| AC-09 | Screens use flexible layouts, wrapping controls and safe areas; production web export covers every route. Final 320-430 px signed-device visual QA remains a release gate. |
| AC-10 | Public routes require no session, Expo Image uses recycled low-bandwidth thumbnails, and full gallery images load only on details. |

Automated release gate: `npm run check`, `npm run build`, Expo Doctor, Expo export and `npm run smoke` against the deployed API. Manual release gate: Android and iOS preview builds on 320-430 px devices, camera/gallery/GPS permissions, WhatsApp/call deep links, airplane/slow-network states, and accessibility screen-reader traversal.

