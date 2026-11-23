# Carely workflows and APIs

This guide describes the live application. See [deployment](deployment.md) for setup and [testing](testing.md) for current verification commands.

## Authentication and access

- Patients register with email verification. **Forgot password** uses an emailed code. Signed-in patients change their password in Profile through Better Auth, which revokes their other sessions.
- Admins provision staff through Staff Management. The invitation lets staff claim the account and set their password.
- The server takes the actor from the session and checks role, account status, and record access. Patients see their own records. Doctors can review patients with a non-cancelled appointment or an encounter with them. Nurses can read the current waiting intake context. Reception and pharmacy have access scoped to their workflows.
- Use the shared [access policy](../lib/services/access-policy.ts) for record authorization and the [audit contract](../lib/audit/README.md) for writes.

## Doctor availability and booking

| Screen or API | Behavior |
| --- | --- |
| `/doctor/availability` and `GET/POST /api/doctor/availability` | Doctors view and update their own weekly sessions. A write updates only submitted weekdays. Disable a day explicitly with `isActive: false`. |
| `/patient/book` and `GET /api/patient/doctor-finder?reasonId=…` | Select an active visit reason. The finder lists active doctors in the mapped specialty, ordered by earliest open clinic date. |
| `GET /api/appointments/open-dates?doctorId=…` | Returns sessions with remaining capacity for today and the following 13 calendar days in `Asia/Colombo`. |
| `GET/POST /api/patient/appointments` | Lists the signed-in patient's appointments or books with `doctorId`, `date`, and `visitReasonId`. The server resolves the patient and actor. |
| `/reception/channeling` and `POST /api/reception/appointments` | Staff can select an existing patient, including a walk-in, and book an open clinic date. The request includes `patientId`, `doctorId`, and `date`. |
| `POST /api/appointments/:id/cancel` | Patients can cancel their own bookings. Receptionists and admins can cancel for a patient. The service rejects past, checked-in, and completed visits. |

Availability rules use one session per weekday and same-day start and end times. The appointment number is an order within that session. It does not represent an individual appointment time. Current clinic hours come from the recurring rule. The recorded appointment retains its date, number, status, and fee.

The [booking service](../lib/services/booking.ts) locks the availability row and rechecks capacity at the time of booking. Cancelled appointments release capacity and their numbers remain reserved. A session closes at its end time. The selected reason is stored on the appointment. See [booking validation](../lib/schemas/booking.ts) and [availability validation](../lib/schemas/availability.ts) for the full input contracts.

## Reception and live queue

- `/reception/register` uses `POST /api/reception/patients` and `GET /api/reception/patients/search?q=…` to register and find patients.
- `/reception/appointments` uses receptionist-only `GET /api/reception/appointments`. Search today's paged results by booking reference, appointment number, patient identifier, or name.
- Confirm arrival with `POST /api/queue/check-in` and `{ "appointmentId": "…" }`. The service locks the booked appointment, verifies that it is dated today in Colombo, and creates or reuses the queue entry and encounter in one transaction.
- `/reception/queue` shows the live queue by doctor and date. `/patient/queue` uses `GET /api/patient/queue` for the patient's own position and status. The queue orders visits by check-in time and uses the entry ID to break ties.

The [queue schema](../lib/schemas/queue.ts) defines allowed transitions. The [queue service](../lib/services/queue.ts) rechecks the actor and expected state before a change.

## Intake, consultation, and history

The queue progresses through `waiting` → `intake_done` → `with_doctor` → `completed`. Clinical writes use the shared appointment → encounter → queue lock order.

| Screen or API | Behavior |
| --- | --- |
| `/nurse/vitals` and `GET /api/nurse/queue` | Shows today's waiting visits. The selected visit can be opened with an `encounterId` in the URL. |
| `POST /api/encounters/:id/intake` | Validates `vitals`, `complaint`, and `preliminaryNote`. It saves the measurements and observations, advances the queue, and records audit events in one transaction. |
| `/doctor` and `GET /api/doctor/queue` | Shows the active doctor's own checked-in appointments for today. |
| `POST /api/doctor/queue/:entryId/open` | Only the treating doctor can open an intake-complete visit. The request body can be empty or `{}`. |
| `GET /api/doctor/visits/:queueEntryId` | Returns the treating doctor's authorized view of intake, vitals, and clinical notes. |
| `POST /api/encounters/:id/notes` and `POST /api/encounters/:id/prescriptions` | Saves a clinical note or prescription while the encounter is writable by the treating doctor. |
| `POST /api/encounters/:id/complete` | Requires a clinical note on the encounter. It completes the encounter and queue entry in one transaction. The request body can be empty or `{}`. |
| `/doctor/patients` and `GET /api/doctor/patients/:patientId/history` | The page lists patients in the doctor's care. Completed visit history includes recorded vitals, notes, and prescriptions. |

Intake requires at least one measurement and both text fields. The [intake schema](../lib/schemas/intake.ts) defines measurement and field bounds. After handoff, a nurse can reload their own same-day receipt, which shows only the encounter ID and recorded time. The doctor workspace covers consultation and the later clinical workflow.

## Prescriptions and pharmacy

- Doctors can prescribe an active catalogue item or type an outside-catalogue medicine. Each item uses exactly one source. See the [prescription schema](../lib/schemas/prescription.ts).
- `/patient/prescriptions` calls `GET /api/patient/prescriptions`. The patient dashboard shows the latest prescription, prescriptions awaiting pharmacy dispensing, and the account's email verification status.
- `/pharmacy` and `/pharmacy/stock` use the [medicine and batch API](../app/api/pharmacy/medicines/) for live catalogue management and stock receipt.
- `/pharmacy/prescriptions` reads a prescription by ID with `GET /api/prescriptions/:id` and submits dispensing with `POST /api/pharmacy/prescriptions/:id/dispense`.
- Dispensing consumes eligible, unexpired stock from the earliest-expiring batches first. It records the dispense and updates stock, prescription status, and audit together. Insufficient stock rolls back the transaction. Outside-catalogue items consume no stock. A prescription with no catalogue items has nothing to dispense.

## Administration

| Screen | Data and actions |
| --- | --- |
| `/admin` | Shows active staff, doctors scheduled today, live queues with unfinished entries, and recent audit events. |
| `/admin/staff` | Manages staff accounts, roles, activation, and invitations through the admin staff API. |
| `/admin/settings` | Uses `GET/PUT /api/admin/settings` for the hospital name, address, phone, and email. The shared UI reads the saved hospital details. |
| `/admin/doctor-finder` | Manages visit reasons and their specialty mappings. Specialties and doctor reassignment use the admin specialty and doctor routes. |
| `/admin/audit` | Uses `GET /api/admin/audit` for read-only event history with user, action, date filters, and pagination. CSV export contains the current page. |

## Manual release walkthrough

Use synthetic accounts and a separate test database. Set up an active doctor with a clinic session and a mapped visit reason, plus medicines and stock. Walk a booking through patient signup, reception check-in, nurse intake, doctor consultation and prescription, patient prescription viewing, and pharmacy dispensing. Verify the live queue and audit entries, permissions for each role, stock-shortage rollback, and duplicate-dispense rejection. Record the tested revision, environment, and actual results.

The [test guide](testing.md) describes the current automated suite. The [recovery plan](Carely%20Overdue%20Sprint%20Recovery%20Plan.md) retains the original acceptance checklist.
