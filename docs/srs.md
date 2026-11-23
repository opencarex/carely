# Carely software requirements specification

Version basis: repository state on 23 November 2026. This SRS describes the
course-release web application. It does not assert that final acceptance,
deployment or backup verification has passed.

## 1. Purpose and scope

Carely is a single-hospital, browser-based management application for a six-role
outpatient journey. One deployment owns its authentication context and PostgreSQL
database. It supports patient access, appointments, arrival queues, nurse intake,
doctor consultation records, prescriptions, pharmacy stock/dispensing and basic
administration.

Carely is an academic prototype, not production-certified medical software. It
does not diagnose, recommend medicines or replace clinical judgement.

## 2. User roles

| Role         | Authorized scope                                                                         |
| ------------ | ---------------------------------------------------------------------------------------- |
| Patient      | Own profile, doctor finding, own appointments/queue/prescriptions                        |
| Receptionist | Patient lookup/registration, assisted booking, arrival/check-in and queue operations     |
| Nurse        | Today's waiting intake context and intake recording                                      |
| Doctor       | Own availability, assigned consultation queue, relevant records, notes and prescriptions |
| Pharmacist   | Medicine catalogue, batches, stock, issued prescriptions and full dispensing             |
| System admin | Staff, specialties/reasons, hospital settings and audit review                           |

Every protected server route checks the authenticated role. Record-level policies
return 404 where revealing another patient's record would leak its existence.

## 3. Functional requirements

### Authentication and accounts

- FR-A1: Patients can register with email/password and complete email OTP verification.
- FR-A2: Staff accounts are created by an admin and claimed through the invitation/reset flow.
- FR-A3: Users can request password recovery; reset/invitation tokens expire and are single-use according to Better Auth behavior.
- FR-A4: Banned/deactivated accounts are rejected and staff sessions are revoked on deactivation.
- FR-A5: Sign-in, sign-out and failed sign-in actions are audited without credentials or submitted email values.

### Patient and appointments

- FR-P1: A patient profile receives a generated patient number; patients can edit permitted own fields.
- FR-P2: Receptionists can search or create walk-in patients using the permitted fields only.
- FR-P3: An admin maps each active visit reason to exactly one specialty.
- FR-P4: A patient selects a reason and sees active doctors in its specialty, ordered by available date behavior from the finder service.
- FR-P5: Patient/reception/admin booking uses a recurring doctor session, capacity lock and next appointment number.
- FR-P6: The selected visit reason is stored with patient bookings.
- FR-P7: Patients see only their appointments and can cancel permitted bookings; staff cancellation follows its server policy.

### Queue, intake and consultation

- FR-Q1: Reception can check in a valid current booking once; the server creates/reuses its queue and encounter records transactionally.
- FR-Q2: Queue order is arrival time then ID; patient queue polling exposes only the patient's visit and position.
- FR-Q3: A nurse records at least one measurement, complaint and preliminary note for a waiting encounter.
- FR-Q4: Intake, queue transition and audits commit or roll back together.
- FR-Q5: The assigned doctor opens an intake-complete consultation, records at least one clinical note, and completes it.
- FR-Q6: Completion blocks later guarded clinical writes.

### Prescriptions and pharmacy

- FR-M1: During an active consultation, a doctor creates a prescription with catalogue items, typed outside-catalogue items, or both.
- FR-M2: Each item has exactly one medicine source and validated dosage/frequency/duration/quantity data.
- FR-M3: Patients see only their prescriptions; pharmacists can retrieve an issued prescription and its dispensing eligibility.
- FR-M4: Pharmacists maintain medicines and receive stock as batches with expiry and quantity.
- FR-M5: Full dispensing consumes earliest-expiry eligible batches atomically, ignores typed items, and prevents double dispensing or partial stock changes on failure.

### Administration and audit

- FR-D1: Admins manage supported staff details/status and resend invitations.
- FR-D2: Admins maintain specialties, one specialty per doctor, visit reasons and four hospital-setting fields.
- FR-D3: Every state-changing service in the recovery catalog records its audit in the same database transaction.
- FR-D4: Audit metadata contains structural fields/IDs, not patient data values.
- FR-D5: Admins can read, filter and page newest-first audit events. The application exposes no audit update/delete route.

## 4. Non-functional requirements

- NFR-1: Server-side business logic lives in `lib/services`; route handlers remain thin.
- NFR-2: Write inputs use strict validation and reject unknown fields.
- NFR-3: Clinic date/time decisions use Asia/Colombo.
- NFR-4: Sensitive errors and logs omit patient values, credentials and database details.
- NFR-5: Mutations that require an audit record use one transaction.
- NFR-6: The UI is responsive for desktop and mobile web browsers.
- NFR-7: Configuration is supplied through environment variables; PostgreSQL is accessed through a standard `DATABASE_URL`.
- NFR-8: Docker Compose is the prepared reference packaging, but runtime installation remains unverified.

## 5. Explicit exclusions

- Native mobile applications and a PWA/offline guarantee
- AI diagnosis, symptom interpretation or medicine/dosage recommendations
- Custom role-permission designer
- Multiple specialties per doctor
- Partial dispensing, stock requests and manual queue reordering
- Cross-hospital shared accounts or records
- Production medical-device certification

## 6. Known implementation limitations

Some active screens still contain fixture-derived content: the admin dashboard,
patient dashboard summary/prescription card, doctor patient-profile page, reception
appointment/check-in screen, and hardcoded reception/pharmacy shell identities.
These are release limitations, not completed acceptance items. See
[acceptance criteria](acceptance-criteria.md).

## 7. Verification boundary

The permanent suite currently contains 16 focused tests. Historical and temporary
feature evidence is linked from [traceability](traceability.md). Docker installation,
backup/restore, real SMTP, and the final six-role browser journey are not claimed
as passed.
