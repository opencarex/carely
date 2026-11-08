# Carely: Overdue Sprint Recovery Plan (Queue, Clinical and Staff Admin)

Prepared 8 Nov 2026 | Sprint 4, Queue and Clinical (ended 1 Nov 2026, still marked active in Jira) | Hard date for audit integration: 15 Nov 2026 (SCRUM-171)

Sprint goal (from Jira): patient check-in, queue, nurse intake, clinical notes and prescription creation work with role permissions.

## 1. Sprint snapshot

23 issues are in the sprint: 9 are Done, SCRUM-160, 162 and 188 are being closed with a hardening follow-up, and 11 are open.

Done: SCRUM-132, 133, 135, 138, 139, 140, 163, 187, 190. Closing with a follow-up: SCRUM-160, 162, 188 (the happy paths work, the guards and audit do not).

| Key       | Open story                                               | Owner                                            |
| --------- | -------------------------------------------------------- | ------------------------------------------------ |
| SCRUM-141 | Staff can check in patients and manage the queue         | Teammate 1                                       |
| SCRUM-142 | Patient can view queue status and position               | Teammate 1                                       |
| SCRUM-134 | Authorized users can update permitted patient details    | Teammate 1                                       |
| SCRUM-145 | Nurse can view intake queue and record patient intake    | Teammate 2                                       |
| SCRUM-144 | Doctor can complete a consultation                       | Teammate 2                                       |
| SCRUM-191 | Verify queue-to-consultation workflow                    | Teammate 2 (last)                                |
| SCRUM-146 | Doctor can record clinical notes                         | Teammate 3                                       |
| SCRUM-148 | Doctor can review clinical information and visit history | Teammate 3                                       |
| SCRUM-150 | Doctor can create a prescription                         | Teammate 3                                       |
| SCRUM-161 | Admin can update staff details                           | You                                              |
| SCRUM-171 | System records important audit events                    | You, with every teammate adding their own events |

Verification of the staff stories (agent report, 8 Nov): the happy paths work. The gaps: no audit table or helper exists anywhere, deactivated users keep working because the auth guard ignores banned and sessions are not revoked, Better Auth admin endpoints under /api/auth/admin bypass the custom rules, and nothing edits doctor fields for SCRUM-161. All of it is in your task list in section 3.

Definition of Done (from the Jira descriptions): persisted data, applicable server-side permission checks, input validation, and verification of the main and error paths. Frontend UI completion is tracked separately, so everything below is backend-first. UI wiring happens after the API merges.

## 2. Ground rules carried over

- The ERD is the source of truth and no synthetic tables are added. If a story needs a column or table the ERD lacks, stop and raise it with the schema owner.
- Business logic lives in lib/services/\*, route handlers stay thin.
- Every notion of today or current time uses Asia/Colombo, reusing lib/clinic-time.ts.
- Zod schemas in lib/schemas/\* are the contract. Write bodies use .strict() so unknown fields are rejected (this also keeps NIC out for good).
- No patient data values in audit metadata or logs. Record which fields changed, not what they changed to (PDPA).
- Every state-changing service call writes its audit row inside the same DB transaction as the change.
- Role check on every route through requireRole, then a record-level policy check. Wrong role returns 403. A record the caller is not allowed to see returns 404 so existence is not leaked.
- Appointment tokens (appointment\_no) are never renumbered by anything in this sprint.

## 3. Your tasks as lead (foundation first, then your own fixes)

Everything in this section is yours, not a teammate task. Teammates cannot start building until F1 to F5 and F7 are merged to dev, so do those first. S1 (ban enforcement/session revocation) and S2 (generic admin API isolation) are included in the foundation before handover. S3 to S7 remain separate lead follow-ups.

| Teammate                            | Blocked until you merge                                                      | Can start meanwhile                               |
| ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| 1, Queue and Front Desk             | F1, F2, F3, F4, F5                                                           | Zod request and response schemas, route skeletons |
| 2, Intake and Consultation          | F1, F2, F3, F4, F5, F7 (plus the Teammate 1 check-in PR for end-to-end runs) | Zod schemas, vitals validation ranges             |
| 3, Clinical Record and Prescription | F1, F2, F4, F5, F7 and decisions D3, D4, D5                                  | Zod schemas, prescription item validation         |

**Foundation implementation and handover contract:** see [Sprint recovery foundation](sprint-recovery-foundation.md). This branch is not merged yet; do not treat this document as deployment evidence.

**F0. Recon first.** Run the 8-point repo recon prompt before F1. The clinical tables may not exist yet, and the staff report found no authorship foreign keys on notes, intake or prescriptions, so F1 may be bigger than the list below.

**F1. Schema reconciliation (one migration, one owner).** Compare the Drizzle schema with the ERD for queue\_entry, encounter, vitals, preliminary\_note, clinical\_note, prescription, prescription\_item and audit\_log, and fix the gaps in a single migration. What the stories need at minimum:

- queue\_entry: appointment\_id (unique, so check-in is idempotent), status, checked\_in\_at and called\_at. The actor is recorded in audit\_log. Order by checked\_in\_at then id; manual reordering is deferred because the ERD has no ordering column.
- encounter: one per appointment (unique), patient\_id, doctor\_id, status, started\_at and ended\_at. Completion actor is recorded in audit\_log.
- vitals: encounter\_id, the typed columns for fixed vitals, a JSONB column for extra vitals, recorded\_by, recorded\_at.
- preliminary\_note: encounter\_id, author\_id, content and created\_at. Put the initial complaint in content; there is no separate complaint column.
- clinical\_note: encounter\_id, author\_id, content, created\_at and updated\_at (append-only, see D3).
- medicine, prescription and prescription\_item: ERD medicine catalog, prescription header (encounter\_id, doctor\_id, status, created\_at) and items referencing medicine\_id with dosage, frequency, duration\_days, quantity and optional instructions.
- audit\_log: id, user\_id, action, entity\_type, entity\_id, metadata JSONB and created\_at. The helper maps actorId/targetType/targetId to these ERD names.

The ERD column names win over anything written here. After F1, schema changes go through one designated person only.

**F2. Audit helper (SCRUM-171 foundation).** lib/services/audit.ts exposing recordAudit(tx, { actorId, action, targetType, targetId, metadata }). It takes the transaction handle so the audit row commits or rolls back with the change. There is no update or delete path for audit rows anywhere in the app. To avoid merge conflicts, each track adds its action names in its own file under lib/audit/actions/ (auth.ts, staff.ts, patient.ts, queue.ts, intake.ts, consultation.ts, clinical-note.ts, prescription.ts) and nobody edits a shared constants file.

**F3. Queue contract (types only).** lib/schemas/queue.ts with the status enum waiting, intake\_done, with\_doctor, completed, plus typed signatures for checkInAppointment and transitionQueueEntry (it accepts an optional transaction handle, so callers can change status in the same transaction as their own write). ReorderQueue reserves a future contract pending an ERD ordering field. Teammate 1 implements the active contracts; Teammates 2 and 3 code against the signatures. Transition rules:

| Transition                   | Who             | Triggered by                                 |
| ---------------------------- | --------------- | -------------------------------------------- |
| (new) to waiting             | receptionist    | check-in of a booked appointment dated today |
| waiting to intake\_done      | nurse           | saving the intake record (SCRUM-145)         |
| intake\_done to with\_doctor | treating doctor | opening the visit (SCRUM-144)                |
| with\_doctor to completed    | treating doctor | completing the consultation (SCRUM-144)      |

Skipping a state returns 409. Going backwards is not supported this sprint. Receptionists perform check-in but cannot make clinical transitions. Manual reordering is deferred until an ERD ordering field is approved.

**F4. Access policy helper.** lib/services/access-policy.ts with canViewPatientAdmin(actor, patientId), canViewClinical(actor, patientId) and isTreatingDoctor(actorUserId, appointmentId). One shared definition of authorized so three tracks do not invent three. Foundation access matrix (implemented by the shared policy helper):

| Role         | Can access                                                                                     | Cannot access                |
| ------------ | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| patient      | own record, own appointments, own queue entry, own prescriptions                               | anything of another patient  |
| receptionist | patient administrative details, queue operations, check-in                                     | vitals, notes, prescriptions |
| nurse        | intake queue, recording intake for waiting patients                                            | doctor notes, prescriptions  |
| doctor       | own appointments, clinical data of patients they treat (an appointment or encounter with them) | other doctors patients       |
| pharmacist   | prescriptions (read only)                                                                      | everything else              |
| admin        | staff management                                                                               | clinical data                |

**F5. Test factories.** tests/helpers/factories.ts creating user, patient, doctor, appointment and queue rows inside tests. This lets Teammates 2 and 3 build and test before check-in lands, and gives SCRUM-191 repeatable setup. It is test-only and does not bring back seed:demo.

**F6. Visibility-aware polling hook (small, not blocking).** lib/hooks/use-visible-polling.ts using native fetch only: poll while the tab is visible, pause when hidden, refresh immediately on focus. Teammate 1 builds and owns it, everyone else imports it. It blocks nobody.

**F7. Encounter helper.** lib/services/encounter.ts with getOrCreateEncounter(appointmentId, actor, tx?) (idempotent, one encounter per checked-in appointment) and assertEncounterWritable(encounterId, actor, tx), which holds a row lock through the caller transaction and rejects completed visits or the wrong queue phase. Always pass the server-session actor. Three teammates need both, so it lives with you, not in one track.

**Your own stories and fixes (parallel, they block nobody).**

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Why                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| S1  | SCRUM-188 gap: add a banned check to requireAuth and requireRole in lib/auth-guard.ts, and delete the target sessions in toggleStaffStatus. Test with an already signed-in user.                                                                                                                                                                                                                                                                                                                                                                                                    | Today a deactivated user keeps working until the session expires.                             |
| S2  | Block the Better Auth admin endpoints under /api/auth/admin in app/api/auth/\[...all\]/route.ts (at least create-user, set-user-password, remove-user, set-role, update-user). Confirm the UI does not call them first.                                                                                                                                                                                                                                                                                                                                                             | They bypass the role allowlist, the zero-knowledge password flow and the no-hard-delete rule. |
| S3  | SCRUM-161: PATCH /api/admin/staff/:userId for name and the doctor fields (specialty\_id, reg\_no, consultation\_fee, bio). Strict schema, staff targets only, reject email, role and password.                                                                                                                                                                                                                                                                                                                                                                                      | No staff-detail edit path exists today.                                                       |
| S4  | SCRUM-171: once F2 is in, retrofit audit events onto staff creation, update, status toggle and sign-in and sign-out, then check every row of the catalog in section 8 before closing.                                                                                                                                                                                                                                                                                                                                                                                               | The staff code writes no audit rows, and the admin audit screen shows fixture data.           |
| S5  | Create a follow-up ticket, Staff admin hardening, then close SCRUM-160, 162 and 188. Put in it: .strict() on createStaffSchema, 409 for concurrent duplicate emails, 400 for malformed JSON, accurate invite-failure reporting plus the unrendered inviteWarning banner, role-change guards (allowlist, no self, no other admin, no last admin) and doctor lifecycle on role change, staff-only targets and a last-active-admin guard on the status toggle, behavioral tests, and where the department field for non-doctors is stored (the ERD does not seem to have that column). | Keeps the known gaps visible after the tickets close.                                         |
| S6  | Run the 44 skipped integration tests against the test database, especially the booking concurrency ones.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | The Done booking tickets rest on them.                                                        |
| S7  | Complete Sprint 4 on the board and drag the open items into the next sprint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Sprint changes are a board drag.                                                              |

## 4. Decisions to lock before kickoff

Each has a recommended default so nobody is blocked waiting.

- **D1. Queue order.** Locked for this foundation: order by checked_in_at, then id as a stable tie-breaker. No manual override or move endpoint until an ERD change adds an ordering field. Never rewrite check-in timestamps or appointment tokens to reorder.
- **D2. How status changes.** Default: statuses move as a side effect of domain actions (save intake, open visit, complete) through one service function, never through a free-form status PATCH.
- **D3. Clinical notes.** Default: append-only. Each save inserts a new row with author and timestamp, the latest is current, and no PUT or DELETE route exists. That satisfies no silent overwrites with the least code to verify. If the ERD has one note row per encounter, use a version column and reject stale writes instead.
- **D4. Prescriptions.** Default: create-only. A correction is a new prescription. Edit and cancel flows are out of scope for this sprint.
- **D5. History source.** NIC and allergies are excluded by the owner. Do not add identity-document or allergy columns, request fields, UI fields or audit values. History means prior encounters, notes and prescriptions.
- **D6. Doctor opening a visit.** Default: a doctor can only open entries in intake\_done that belong to them. One active with\_doctor entry per doctor is optional hardening.

## 5. Teammate 1: Queue and Front Desk

Branch: feat/queue-front-desk. Stories: SCRUM-141, 142, 134. Ship the queue service first (B1), because Teammate 2 cannot run end-to-end without it.

Needs from you before starting: F1 (queue\_entry), F2, F3, F4, F5.

**B1. SCRUM-141, queue service and check-in (first PR, merge within a day or two).** lib/services/queue.ts implementing the F3 contract.

- POST /api/queue/check-in with an appointment id. Receptionist only.
- Rules: the appointment must be booked, dated today in Asia/Colombo, and not cancelled. One queue entry per appointment (unique constraint), so repeating the call returns the existing entry instead of duplicating. Creates the entry as waiting.
- transitionQueueEntry uses a conditional update (UPDATE ... WHERE id and status equal the expected from-state, RETURNING) so two simultaneous transitions produce one success and one 409.
- Audit in the same transaction: queue.checked\_in and queue.status\_changed.

**B2. SCRUM-141, queue management.**

- GET /api/queue?doctorId=&date= returns the queue for staff, filtered by role (a receptionist sees administrative fields only, never clinical data).
- Manual reordering and POST /api/queue/:id/move are deferred until an ERD ordering column is approved. The ReorderQueue type reserves the future contract; it has no runtime implementation.
- Nurse and doctor transitions are not endpoints here. Teammate 2 calls transitionQueueEntry from the intake and consultation actions.

**B3. SCRUM-142, patient queue status.** GET /api/patient/queue.

- Returns only the caller own entry for today: status and position.
- Position is the number of entries ahead of it for the same doctor and date that are not yet completed, plus one. Never expose other patients identities, only the count.
- Polling follows F6. No WebSockets, no offline clinical data.

**B4. SCRUM-134, update patient details.**

- Receptionist: PATCH /api/reception/patients/:id for demographic and contact fields. patient\_no and user\_id are immutable.
- Patient: PATCH /api/patient/profile for phone, address and emergency contact only.
- Strict schema, so any identity-document field is rejected.
- Audit: patient.updated with changed field names only.

File boundaries (exclusive): `lib/services/queue.ts`, `app/api/queue/**`, `app/api/patient/queue/**`, `app/api/patient/profile/**`, `app/api/reception/patients/[id]/**`, `lib/schemas/queue.ts`, `lib/schemas/patient-update.ts`, `lib/hooks/use-visible-polling.ts`, `components/reception/queue-management.tsx`, `lib/audit/actions/queue.ts` and `patient.ts`.

## 6. Teammate 2: Nurse Intake and Consultation

Branch: feat/intake-consultation. Stories: SCRUM-145, 144, then SCRUM-191 once everything is merged.

Needs from you before starting: F1 (encounter, vitals, preliminary\_note), F2, F3, F4, F5, F7. Needs from Teammate 1: the check-in and transitionQueueEntry PR for end-to-end runs. Until it lands, build and test against the F5 factories.

**I1. SCRUM-145, nurse intake.**

- GET /api/nurse/queue lists today waiting entries (nurse only).
- POST /api/encounters/:id/intake saves vitals (typed columns plus JSONB extras), the initial complaint and a preliminary note, with author and timestamp.
- Validation: plausible numeric ranges for the typed vitals, bounded size and key count for JSONB extras. No automated clinical score.
- Saving the intake and moving waiting to intake\_done happen in one transaction, by passing the transaction handle to transitionQueueEntry. Only for waiting entries, otherwise 409.
- Audit: intake.recorded.

**I2. SCRUM-144, open and complete.**

- POST /api/doctor/queue/:entryId/open moves intake\_done to with\_doctor for the treating doctor only (D6).
- POST /api/encounters/:id/complete requires at least one clinical note (Teammate 3 writes them, read the clinical\_note table), then in one transaction marks the encounter completed with author and timestamp and moves with\_doctor to completed.
- After completion, clinical writes are rejected through assertEncounterWritable (F7).
- Audit: consultation.opened and consultation.completed.

**I3. SCRUM-191, verification (last).** Run the checklist in section 9 after all PRs are merged, fix or file what fails, and attach the results to the ticket.

File boundaries (exclusive): `lib/services/intake.ts`, `lib/services/consultation.ts`, `app/api/nurse/**`, `app/api/encounters/[id]/intake/**`, `app/api/encounters/[id]/complete/**`, `app/api/doctor/queue/**`, `lib/schemas/intake.ts`, `lib/schemas/consultation.ts`, `components/nurse/**`, doctor consultation components, `tests/verification/**`, `lib/audit/actions/intake.ts` and `consultation.ts`.

## 7. Teammate 3: Doctor Clinical Record and Prescription

Branch: feat/clinical-record. Stories in order: SCRUM-146, 148, 150.

Needs from you before starting: F1 (clinical\_note, prescription, prescription\_item), F2, F4, F5, F7, and decisions D3, D4, D5. Nothing blocks you from Teammate 2, but SCRUM-148 displays data written by intake and consultation, so build it against the F5 factories and integrate once their PR is on dev.

**R1. SCRUM-146, clinical notes.**

- POST /api/encounters/:id/notes appends a note with the session doctor as author and a server timestamp. GET lists the notes in order.
- No PUT or DELETE routes (D3). Accepted only while the queue entry is with\_doctor and only from the treating doctor, enforced with assertEncounterWritable (F7) and isTreatingDoctor (F4).
- Audit: clinical\_note.created.

**R2. SCRUM-148, doctor review.**

- GET /api/doctor/visits/:queueEntryId returns intake, vitals and notes for the visit.
- GET /api/doctor/patients/:patientId/history returns prior encounters, notes and prescriptions (history is prior encounters, notes and prescriptions; NIC and allergies are excluded).
- Treating doctors only, enforced through isTreatingDoctor. Anyone else gets 404. No AI recap.

**R3. SCRUM-150, create prescription.**

- POST /api/encounters/:id/prescriptions. Doctor only, only the treating doctor, only while the encounter is writable.
- Body: at least one item, each with medicine, dosage, frequency and duration, all required, with length limits and a cap on item count. Medicine must be an existing active medicine_id from the ERD medicine table. Free-text substitution is not supported. Quantity is also required and positive.
- Header stores doctor, encounter and timestamp. Immutable after creation (D4).
- Reads: GET /api/patient/prescriptions (own only) and GET /api/prescriptions/:id for the pharmacist (read only, no dispensing this sprint).
- Audit: prescription.created.

File boundaries (exclusive): `lib/services/clinical-notes.ts`, `lib/services/record-review.ts`, `lib/services/prescription.ts`, `app/api/encounters/[id]/notes/**`, `app/api/encounters/[id]/prescriptions/**`, `app/api/doctor/visits/**`, `app/api/doctor/patients/**`, `app/api/prescriptions/**`, `app/api/patient/prescriptions/**`, `lib/schemas/clinical-note.ts`, `lib/schemas/prescription.ts`, doctor review components, `lib/audit/actions/clinical-note.ts` and `prescription.ts`.

## 8. Audit event catalog (SCRUM-171)

| Area                    | Actions                                                                                             | Owner      |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ---------- |
| Authentication          | auth.sign\_in, auth.sign\_out, auth.sign\_in\_failed                                                | You        |
| Staff                   | staff.created, staff.updated, staff.role\_changed, staff.deactivated, staff.reactivated             | You        |
| Patient                 | patient.updated (registration and booking events from earlier sprints should already exist, verify) | Teammate 1 |
| Queue                   | queue.checked\_in, queue.status\_changed (queue.reordered deferred with manual ordering)            | Teammate 1 |
| Intake and consultation | intake.recorded, consultation.opened, consultation.completed                                        | Teammate 2 |
| Clinical notes          | clinical\_note.created                                                                              | Teammate 3 |
| Prescription            | prescription.created                                                                                | Teammate 3 |

SCRUM-171 closes when every row above writes an audit\_log row with actor, action, target and timestamp, and the app exposes no way to edit or delete audit rows.

## 9. Branches, merge order and the SCRUM-191 acceptance checklist

Branches: feat/queue-front-desk (Teammate 1), feat/intake-consultation (Teammate 2), feat/clinical-record (Teammate 3). File boundaries do not overlap, so PRs can merge in any order, with two exceptions: your foundation lands first, and the Teammate 1 queue-service PR (B1) lands before Teammate 2 runs end-to-end.

Shared-file rules: `lib/auth-guard.ts` and `lib/auth.ts` are yours only (S1, S2). Schema and migrations belong to the one schema owner. Audit action names live in per-feature files, never a shared one. The folder `app/api/encounters/[id]/` is split by sub-folder: intake and complete are Teammate 2, notes and prescriptions are Teammate 3.

Acceptance checklist for SCRUM-191:

- [ ] Check-in: a booked appointment dated today becomes a waiting queue entry. Repeating the call returns the same entry. A future-dated or cancelled appointment is rejected. A patient calling the endpoint gets 403.
- [ ] Order: entries follow checked_in_at then id, and appointment token numbers are unchanged. Manual reordering is out of scope until an ERD change is approved.
- [ ] Intake: nurse saves vitals and a preliminary note, the entry moves to intake\_done, and the receptionist cannot read the vitals.
- [ ] Transitions: skipping a state returns 409, a wrong doctor gets 404, and two simultaneous transitions produce one success and one 409.
- [ ] Patient queue view: shows own status and position only, polling pauses when the tab is hidden and refreshes on focus, and no WebSocket is open.
- [ ] Doctor flow: open visit, review intake and history (treating doctor only), add a note, complete the consultation. Completion without a note is rejected, notes cannot be edited or deleted, and nothing can be added after completion.
- [ ] Prescription: a valid prescription saves, missing fields are rejected, the patient sees only their own, the pharmacist can read, the receptionist gets 403.
- [ ] Patient details: receptionist and patient updates follow the field rules, unknown fields (including any identity-document field) are rejected.
- [ ] Deactivated staff (your task S1): an already signed-in user is rejected on the next request and cannot sign in, reactivation restores access, history is preserved.
- [ ] Audit: each event in section 8 has a row, metadata holds no patient data values, and no route can modify audit rows.

## 10. Suggested timeline

These are targets, not promises. They work back from the 15 Nov audit date.

- Mon 9 to Tue 10 Nov: you run the recon, lock D1 to D6 and merge F1 to F5 and F7. Teammates read their section and write Zod schemas meanwhile.
- Wed 11 Nov: Teammate 1 merges the queue-service PR (B1). Teammates 2 and 3 build against the F5 factories. You do S1 and S2.
- Thu 12 to Fri 13 Nov: remaining PRs merged. You finish S3 and the S4 audit retrofit.
- Sat 14 Nov: Teammate 2 runs the SCRUM-191 checklist. You check the audit catalog for SCRUM-171 and run the S6 integration tests.
- Sun 15 Nov: buffer, plus the S5 and S7 Jira clean-up.
