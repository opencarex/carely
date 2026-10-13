# Patient UI

The patient screens follow the updated Carely Figma designs, including the guided doctor finder, queue before reception check-in, active queue, and Pending/History prescriptions. Layouts start with a single column and expand where there is enough space. Shared shadcn Select and Dialog controls handle selection, confirmation, cancellation, appointment details, and password editing.

## Current structure

```text
app/(authenticated)/patient/
  layout.tsx                    Shared shell and temporary booking state
  page.tsx                      Dashboard composition
  book/page.tsx                 Finder and booking layout
  appointments/page.tsx         Upcoming/history list and visit guidance
  appointments/confirmed/page.tsx
  appointments/empty/page.tsx   Standalone empty-state design preview
  queue/page.tsx                Queue status and reception guidance
  prescriptions/page.tsx        Pending/history prescription layout
  profile/page.tsx              Profile and account-security layout
components/patient/
  doctor-finder.tsx             Guided reasons and doctor search
  appointment-booking.tsx       Date/time selection and booking review
  appointment-card.tsx          Details and cancellation dialogs
  empty-appointments.tsx        Shared empty state
  queue-status.tsx              Before-check-in and checked-in states
  prescription-medicine.tsx     Read-only medicine item
  patient-profile.tsx           Personal-details form
  patient-password-dialog.tsx   Password form and validation
  patient-shared.tsx            Presentational patient primitives
  patient-demo-provider.tsx     Temporary cross-page booking store
lib/mock/patient.ts             Frozen doctors, availability, and bookings
```

Pages retain layout composition; interactive forms and focused widgets live in the root components directory. No route-local component folders, data-access layer, Server Actions, API handlers, or new fetching architecture are introduced by this UI update. Client pages use state and event handlers; existing static pages and the layout remain Server Components. The queue widget reads preview query parameters inside Suspense. Client pages do not export server-only route configuration.

## Demo behavior and limits

- Booking creates a reference and connects confirmation, appointments, dashboard counts, and queue appointment information during client navigation. Cancelled bookings move to Past. The same patient's already reserved slot cannot be booked again.
- The default queue state is not checked in. Patients cannot issue their own tokens. Use `/patient/queue?preview=checked-in` to review the active-queue Figma state; it is explicitly labelled as a design preview and does not alter booking state.
- Refresh now and the 30-second timer refresh the view timestamp only. They do not fetch reception updates, move queue positions, or estimate real waiting time. The timer is cleaned up when the widget unmounts.
- Fixtures use the frozen October 2026 design scenario. Available slots are sample data, not a live schedule. Reason matching reuses the initial admin reason/doctor fixtures; unsaved admin prototype edits are not connected across roles. There is no symptom analysis or diagnosis.
- Prescriptions are read-only doctor-issued examples. Pending is populated; History shows its empty state until real dispensing records exist. There are no refill requests or medication reminders. Printing uses the browser print dialog.
- Profile changes last while the profile page is mounted. Cancel restores the most recently saved form. Changing the demo email shows verification pending. Password editing validates fields and clears them on close; it never changes an account password. No email is sent, and the sign-in link is not a server session-revocation operation.
- Booking state resets on reload or when leaving the patient layout. It is separate from the receptionist prototype and is not persisted in browser storage or a database.

## Planned integration and provider removal

`PatientDemoProvider` exists only because several prototype pages need to agree about one booking. It is not an authentication provider, a production cache, or the future source of truth. Remove it, its hook, and the patient fixture imports when server-owned patient bookings are integrated; do not mirror fetched bookings back into this provider.

At that point, page loaders should read the authenticated patient's records on the server and pass serializable data into these widgets. Keep only drafts, open dialogs, and filters in local client state. Booking and cancellation must use validated, authorized server mutations, enforce slot availability atomically, and refresh affected page data. The server must prevent cancellation after reception check-in. Confirmation should load a patient-owned booking by reference rather than the temporary latest-booking ID. Profile/password changes should use the account service, and logout must revoke the authenticated session.

Replace queue fixtures and timestamp-only refresh with an authenticated polling hook using native fetch. Reception remains the owner of check-in/token creation. Return authoritative queue status and handle loading, stale data, errors, completion, and missed turns. Remove the checked-in preview URL before enabling real patient data. Fetch doctor-issued prescriptions and their actual dispensing history with patient ownership checks; never derive dispensing status from browser-only state.
