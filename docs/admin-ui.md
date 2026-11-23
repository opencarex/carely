# Admin UI

The admin workspace uses the shared `AppShell`, `PageTitle`, `Panel`, `Input`,
`Select` and `Button` components. It is a web interface; there is no separate
mobile application or installed-PWA requirement in the recovery scope.

## Current routes and data sources

| Route                  | Current behavior                                                                 | Data source                               |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| `/admin`               | Dashboard metrics and recent activity                                            | Fixture content; not operational evidence |
| `/admin/staff`         | Create staff, list staff, change supported details/status and resend invitations | Admin staff APIs and PostgreSQL           |
| `/admin/settings`      | Edit hospital name, address, phone and email                                     | `GET/PUT /api/admin/settings`             |
| `/admin/doctor-finder` | Maintain visit reasons and their one-specialty mapping                           | Specialty and visit-reason APIs           |
| `/admin/audit`         | Filter and page immutable audit records                                          | `GET /api/admin/audit`                    |

The old Role Permissions editor is not rendered. Carely uses fixed server-side
roles rather than a custom permission designer. The unused prototype component
may still exist in the source tree, but it is not part of the settings screen.

## Audit trail

The audit screen no longer imports `adminAuditEntries`. It requests the real
read-only audit API, supports user/action/Colombo-date filters, displays newest
events first, and pages by 10, 20, 50 or 100 rows. Actor identity is joined for
display; system events may have no actor. The detail view shows structural
metadata. No audit update or delete API is exposed.

`GET /api/admin/audit` requires the `admin` role. A signed-in non-admin receives
403 and unauthenticated callers receive 401. The route is uncached.

## Settings and doctor-finder configuration

Hospital settings persist only the four fields in the recovery plan. The settings
page does not prove that every email template reflects a changed name; that remains
part of final manual verification.

Each visit reason belongs to one specialty. Patient doctor finding uses that
mapping and returns active doctors in the mapped specialty. Specialty management
and doctor-specialty routes exist, but this document does not claim that every
administrative API has a complete dedicated UI workflow.

## Remaining fixture content and verification

The admin dashboard still uses fixture metrics and recent activity. Do not cite
those cards as database totals or audit evidence. The staff, settings,
doctor-finder and audit screens are API-backed.

Temporary C1 checks verified audit filtering/paging and non-admin denial on the
tested revision; see [audit verification](verification/audit-c1-c2.md). The
complete audit catalog and browser walkthrough remain part of final verification.
