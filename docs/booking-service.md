# Transactional appointment booking

Task 8.3 responsibility 3 is implemented in `lib/services/booking.ts`.
The [open-dates API](open-dates.md) (responsibility 4) is also implemented.
[Patient integration and cancellation](patient-ui.md) (responsibility 5) are also implemented.

## Server contract

Call `bookAppointment({ doctorId, patientId, date, visitReasonId?, actor })` from
trusted server code.
Construct `actor` from the authenticated session, never from request JSON.
For patient requests, resolve the patient's ID with `getOrCreatePatientForUser`
before calling the service. Authentication at the HTTP boundary remains the caller's responsibility.

The service rechecks the actor's current database role and banned status. Patients
can only book their linked profile. Receptionists and admins can book any existing
patient, including walk-ins with no portal account. Other roles are rejected.

Success returns `{ success: true, appointment, appointmentNo }` after committing.
Expected failures return `{ success: false, error, code, statusCode }`; future API
handlers must use `statusCode` for the HTTP response. Unexpected database errors
propagate after rollback and should be handled as server errors at the API boundary.

| Code                     | Status | Meaning                                                                         |
| ------------------------ | ------ | ------------------------------------------------------------------------------- |
| `INVALID_INPUT`          | 400    | Invalid UUID or calendar date                                                   |
| `UNAUTHORIZED`           | 401    | Missing actor user ID                                                           |
| `FORBIDDEN`              | 403    | Actor unavailable, role changed, role disallowed, or patient ownership mismatch |
| `PATIENT_NOT_FOUND`      | 404    | Staff selected a nonexistent patient                                            |
| `DOCTOR_NOT_FOUND`       | 404    | Doctor does not exist                                                           |
| `DOCTOR_INACTIVE`        | 400    | Doctor disabled, banned, or no longer assigned the doctor role                  |
| `REASON_DOCTOR_MISMATCH` | 400    | Visit reason does not match the selected doctor's specialty                     |
| `NO_ACTIVE_SESSION`      | 400    | Weekday rule missing or disabled                                                |
| `PAST_DATE`              | 400    | Date is before today in Colombo                                                 |
| `SESSION_ENDED`          | 400    | Today's session is at or past its end time                                      |
| `SESSION_FULL`           | 409    | Non-cancelled appointments have reached capacity                                |
| `TOKEN_CONFLICT`         | 409    | Unique token constraint rejected the insert; caller can retry                   |

## Transaction and clock behavior

- Uses the existing tables and constraints; no migration is required.
- Uses an explicit `READ COMMITTED` transaction and `SELECT ... FOR UPDATE` on the
  `(doctor_id, day_of_week)` availability row. All booking entrypoints must use
  this service so capacity checks share the same lock.
- Computes today and current time in `Asia/Colombo`, independent of the server's
  time zone. The weekday is calculated from the validated date label.
- Rechecks the clock after acquiring the lock, because a waiting request can
  cross midnight or session end. The exact session end is closed for booking.
  Booking before today's session starts is allowed.
- Counts every status except `cancelled` toward capacity, including completed visits.
- Allocates `MAX(appointment_no) + 1` across all statuses for that doctor/date.
  Cancellation frees capacity but never reuses a token. Tokens can exceed
  `max_patients` after cancellations; capacity limits the active count.
- Records `booked_by`, the consultation fee, and source (`online` for patients;
  `reception` for receptionist/admin bookings).
- Records `appointment.booked` in the same transaction as the appointment insert.
- Preserves the token uniqueness constraint as a final backstop. Insert failures
  roll back the whole transaction.

## Verification

The current permanent suite contains two focused booking-capacity tests. It does
not retain the earlier database integration suite. Run `pnpm test` and read
[testing](testing.md) for the current coverage boundary.

Historical reports may describe removed PostgreSQL suites. Recreate focused
temporary tests when changing booking, record their exact revision and result,
then remove them according to the recovery workflow. See [Patient UI](patient-ui.md)
for current API integration and remaining mixed-state UI limitations.
