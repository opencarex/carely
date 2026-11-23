# System administrator guide

## Staff

Open `/admin/staff` to list/create staff, maintain supported details/status and
resend invitations. Deactivation revokes existing sessions. Admin targets are
restricted by server policy. Verify invitation delivery and single-use behavior
with the configured mail service before claiming success.

## Doctor finder configuration

Open `/admin/doctor-finder` to create/update/delete visit reasons and map each to
one specialty. The patient finder uses these mappings. Specialty and doctor-
specialty APIs exist, but not every administrative operation has a complete
dedicated UI on this page.

## Hospital settings

Open `/admin/settings` to save hospital name, address, phone and email. There is no
custom Role Permissions editor. Confirm persistence after reload; confirm email
branding separately during SMTP verification.

## Audit trail

Open `/admin/audit`. Filter by user (ID/name/email), action and inclusive Colombo
date range. Choose 10, 20, 50 or 100 rows per page. Newest events appear first.
The detail view shows actor, target and structural metadata. The UI/API cannot edit
or delete audit rows.

## Known limitation

The `/admin` dashboard metrics and recent activity are fixtures. Do not quote them
as database counts or audit evidence. Use the staff, settings, doctor-finder and
audit pages for current API-backed behavior.
