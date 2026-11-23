# Patient UI

Task 8.3 responsibility 5 connects patient booking, confirmation, appointment
history, and cancellation to PostgreSQL. The patient demo booking provider and
the frozen doctor/appointment fixtures have been removed.

## Data flow

- The patient layout checks the session, rejects banned users, redirects other
  roles to their workspace, and provisions the linked patient profile idempotently.
- `/patient/book` reads active visit reasons and uses the selected reason to call
  the patient doctor-finder API. The API returns active doctors whose specialty
  matches the persisted reason-to-specialty mapping.
- Selecting a doctor loads the [open-dates API](open-dates.md). The booking widget
  shows clinic sessions, remaining capacity, and the consultation fee. It keeps
  only draft selections, loading state, and dialogs in the browser.
- Booking submits `doctorId`, `date` and the selected `visitReasonId`. The server
  derives patient ID and actor from the authenticated session, verifies that the
  doctor's specialty matches the reason, then calls the transactional service.
- The confirmation URL includes the saved appointment UUID:
  `/patient/appointments/confirmed?id=...`. The server reads that patient-owned
  record, so refreshes and direct links work. Missing, malformed, and foreign
  references produce a not-found page without revealing another patient's details.
- `/patient/appointments` loads the authenticated user's appointments on the server
  and passes serializable records to the interactive list. Upcoming and history
  filters include the saved date, appointment number, doctor, status and fee.
  Past booked visits appear in history without changing their stored status.
- Cancellation refreshes the server-rendered data. The dashboard and queue guidance
  read the same saved appointments rather than keeping a second booking store.
- Page failures show a generic retry view; API failures do not expose database details.

The appointment number determines order within a clinic session, not an exact
consultation time. Current clinic hours come from the recurring availability rule;
the schema does not snapshot historical session times. The appointment date,
number, status and fee are saved on the booking itself.

## API contracts

### `GET /api/patient/appointments`

Patient-only, authenticated, uncached. Returns `{ appointments: [...] }` scoped in
SQL to the session user's linked profile. Query parameters cannot choose a different
patient. Each record includes `isUpcoming` and `canCancel`, computed using Colombo
date/time and current session hours. Current database role and banned status are
checked before reading records.

### `POST /api/patient/appointments`

Patient-only. Accepts exactly:

```json
{
  "doctorId": "11111111-1111-4111-8111-111111111111",
  "date": "2026-11-07",
  "visitReasonId": "22222222-2222-4222-8222-222222222222"
}
```

Unknown fields (including `patientId`, `actor`, `appointmentNo` and `source`) are
rejected. Malformed JSON, invalid UUIDs and impossible dates return `400` before
provisioning or booking. Successful creation returns `201` with the existing
`BookAppointmentResult`, including the saved appointment and appointment number.
Expected booking failures preserve their service status, including `409` for full
sessions. The widget refreshes dates after a rejected booking and tells the patient
to check My Appointments before retrying when the network result is uncertain.

### `POST /api/appointments/:id/cancel`

Patients can cancel only their own appointments. Receptionists and admins can cancel
on behalf of any patient, including walk-ins. Other roles receive `403`.
The appointment ID comes from the route and the actor comes from the session;
request JSON cannot substitute either.

The service rechecks the actor's database role and banned status, locks the relevant
availability row and then the appointment row, and changes only `status` and
`updated_at`. This lock order matches booking. Repeated cancellation is idempotent.
Cancelled numbers are never reused, and capacity becomes available again.

Missing or foreign appointments return `404`. Malformed IDs return `400`. Only
`booked` appointments can transition to `cancelled`; completed and any in-progress
status are rejected with `409`, as are past dates and today's session at/after its
end time. Future bookings can still be cancelled if the weekly rule was removed.

All API responses send `Cache-Control: no-store`. Mutations reject a supplied Origin
header that does not match the request origin. They still require an authenticated
session when the header is absent, such as for a server client.

## Current mixed-state screens

The patient queue screen polls the real `/api/patient/queue` endpoint and shows an
owned checked-in visit, workflow status and position. Reception check-in UI still
contains prototype state, so the complete patient-arrival browser journey remains
pending final verification.

Profile editing and patient prescription listing are API-backed. The patient
dashboard itself still renders a fixture-derived latest-prescription card, pending
count and static profile-status text. Those dashboard cards must not be used as
evidence of prescription or profile state; use the dedicated profile and
prescription pages.

## Verification

The current permanent suite has 16 focused tests; it covers booking capacity and
patient access policy but not the complete patient browser journey or PostgreSQL
concurrency. Older verification text and removed temporary suites are historical
evidence only. See [testing](testing.md) for current coverage.
No migration is required.

For a manual browser check:

1. Activate a doctor and save a clinic session within the next 14 days.
2. Sign in as a patient, select that doctor, choose a date, and confirm the booking.
3. Check the saved number and reference. Reload the confirmation URL.
4. Open My Appointments and the dashboard; confirm the saved appointment appears.
5. Cancel it and reload; confirm it appears in history and capacity has reopened.
6. Book again and confirm the new number increases rather than reusing the cancelled one.
7. Sign in as another patient; verify the original reference cannot be viewed or cancelled.
