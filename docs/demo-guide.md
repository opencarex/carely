# Synthetic demo guide

This is a preparation and rehearsal script, not a recorded successful run.

## Synthetic account plan

Use only synthetic identities. The addresses below are reserved examples; this
file does not claim that the accounts exist.

| Role         | Suggested email               | Creation path                                    |
| ------------ | ----------------------------- | ------------------------------------------------ |
| Admin        | `demo.admin@example.test`     | `seed:admin` with environment credentials        |
| Patient      | `demo.patient@example.test`   | Public signup and OTP in the chosen mail service |
| Receptionist | `demo.reception@example.test` | Admin staff creation/invitation                  |
| Nurse        | `demo.nurse@example.test`     | Admin staff creation/invitation                  |
| Doctor       | `demo.doctor@example.test`    | Admin staff creation with specialty/invitation   |
| Pharmacist   | `demo.pharmacy@example.test`  | Admin staff creation/invitation                  |

Never commit passwords or OTPs. Mailpit is suitable for an isolated demo; real SMTP
has not been verified by this documentation task.

## Data prerequisites

Before rehearsal, create and record synthetic IDs for:

1. One specialty and one active doctor assigned to it.
2. One visit reason mapped to that specialty.
3. A doctor clinic session on the rehearsal date with capacity.
4. Two active catalogue medicines.
5. Usable stock batches plus a deliberately short-stock scenario.

There is no general demo seed. Enter data through the current authorized UI/API
and record what was actually created. Do not describe planned records as seeded.

## Full hospital journey

Record pass/fail and evidence for every step:

1. Admin creates staff and visit-reason mapping; invited staff claim accounts.
2. Patient signs up, verifies email and signs in.
3. Patient selects the reason, sees the matched active doctor and books an open date.
4. Reception finds the appointment and checks in the patient.
5. Patient queue shows the owned position/status.
6. Nurse records intake and hands the visit to the doctor.
7. Doctor opens the consultation, records a note and creates a mixed prescription containing catalogue and typed medicine items.
8. Doctor completes the consultation.
9. Patient sees the prescription and outside-catalogue label.
10. Pharmacist finds and fully dispenses the prescription; catalogue stock falls and typed items do not consume stock.
11. Admin filters audit events and checks metadata for patient values.

## Required negative demonstrations

- Second dispense is blocked.
- Insufficient stock leaves stock/status/dispense/audit state unchanged.
- Patient cannot see another patient's appointments or prescriptions.
- Receptionist receives 403 on clinical and pharmacy routes.
- Reason with no active doctor produces the no-match message.
- Deactivated staff are rejected on the next request.
- Reset/invitation link reuse and expiry are rejected during the real SMTP/Mailpit run.

## Known presentation risks

The reception appointment/check-in screen, admin dashboard, doctor patient page and
parts of the patient dashboard still contain fixture-derived content. Resolve
release-blocking cases with the owning track or disclose them; never use fixture
cards as proof of saved state.

Docker fresh install, backup/restore and the final journey remain unverified until
results are attached to the relevant tickets.
