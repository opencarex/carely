# Carely: Sprint 5 and 6 Recovery Plan (Pharmacy, Doctor Finder, Audit and Release)

Prepared 16 Nov 2026 | Sprint 5, Pharmacy and Finish, and Sprint 6, UAT and Release | Sprints 1 to 4 are Done | The 15 Nov feature freeze in the Jira descriptions has already passed, so this plan replaces it

Sprint goal: pharmacy stock and dispensing work for real, patients can find a doctor by reason for visit, admins can configure the system and review audit records, and the project can be deployed, verified and demonstrated.

## 1. Snapshot

19 issues are open: 13 in Sprint 5 and 6 in Sprint 6. Only SCRUM-171 is In Progress and nobody is assigned to anything. SCRUM-175 (password reset and staff first-password setup) already exists in the code, so it is not a task: close it as Done after one manual run (see section 9). After the merges below there are 14 work items.

Jira housekeeping before kickoff (do in the board):

- Merge SCRUM-158 into SCRUM-155. Stock levels and stock management are the same screen.
- Merge SCRUM-169 into SCRUM-168. Specialties and reason mapping are one admin area.
- Merge SCRUM-192 and SCRUM-195 into SCRUM-194. One final verification and fixes task.
- Shrink SCRUM-196 to one documented backup and restore run.
- Keep SCRUM-189 but limit it to the four fields that already exist: hospital name, address, phone, email.

| Key | Work item | Owner |
| --- | --- | --- |
| SCRUM-171 | Audit events: close the gaps | You, with every teammate adding their own events |
| SCRUM-173 | Docker Compose deployment | You (late) |
| SCRUM-196 | Backup and restore, one run | You (late) |
| (no key) | ~~Test deletion and docs/testing.md~~ - 16 core tests kept; temporary feature verification pending | You |
| SCRUM-155 (+158) | Medicine catalogue and stock | Teammate 1 |
| SCRUM-157 | Dispense prescriptions | Teammate 1 |
| SCRUM-151, 152 | Prescription views: check and finish, plus medicines typed by the doctor (P4) | Teammate 1 |
| SCRUM-168 (+169) | Specialties and reason-to-specialty mapping | Teammate 2 |
| SCRUM-170 | Patient finds a doctor by reason | Teammate 2 |
| SCRUM-189 | Basic hospital settings | Teammate 2 |
| SCRUM-172 | Admin audit screen | Teammate 3 |
| SCRUM-197 | SRS, diagrams, user guides | Teammate 3 |
| SCRUM-198 | Demo data, presentation, viva rehearsal | Teammate 3 |
| SCRUM-194 (+192, 195) | Final verification and fixes | Teammate 3 (last) |

What repo recon (16 Nov) found, and what it means for the plan:

- Audit helper recordAudit(tx, event) exists with 8 callers, but there are no auth events, the staff created, updated and role-changed events are declared and never called, patient registration and booking never write audit rows, and the admin audit screen still reads fixtures.
- Prescriptions are real (create, patient list, pharmacist read). There is no stock table, no dispense record and no stock or dispensing API. The pharmacy stock screens run on in-memory demo state.
- The specialty table exists and is seeded. Each doctor has one specialty\_id column. There is no visit\_reason table yet (the ERD has it, with a specialty\_id), and appointment.visit\_reason\_id has no foreign key.
- hospital\_settings exists with a singleton row. The admin settings form runs on fixtures, saves nothing, and the Role Permissions toggles on the same page change nothing on the server.
- The doctor finder for patients is real but only filters by name and specialty.

Definition of Done (relaxed on purpose, this is a second-year project): a server-side permission check, validated input, one temporary happy-path test and one temporary failure-path test (run, record passing evidence, then remove the temporary files), an audit event on every write, and no screen left running on fixtures. Cap each story at about 8 tests. Frontend UI completion is tracked separately, so everything below is backend first and UI wiring happens after the API merges.

## 2. Ground rules carried over

- The ERD is the source of truth. The new tables in F1 must match the ERD names and columns. The ERD defines stock\_batch, dispense\_record and visit\_reason (with specialty\_id), so use those names and columns exactly. If something is missing from the ERD, stop and raise it with the schema owner.
- Business logic lives in lib/services/\*, route handlers stay thin.
- Every notion of today or current time uses Asia/Colombo through lib/clinic-time.ts.
- Zod schemas in lib/schemas/\* are the contract. Write bodies use .strict() so unknown fields are rejected.
- No patient data values in audit metadata or logs. Record which fields changed, not what they changed to. Medicine ids and stock quantities are fine because they are not patient data.
- Every state-changing service call writes its audit row inside the same DB transaction as the change.
- Role check on every route through requireRole, then a record-level policy check. Wrong role returns 403. A record the caller is not allowed to see returns 404 so existence is not leaked.
- ~~Keep the full test suite until the end.~~ On 17 Nov, the user explicitly moved the cleanup forward: keep the 16 focused tests documented in [testing.md](testing.md). Teammates create temporary feature tests, run them, record successful results, then delete only their temporary tests and fixtures. This overrides the original timing below.

### Teammate testing workflow (updated at the user's request)

For code changes in every teammate track:

1. Write small temporary tests alongside the feature: one happy path and one failure path, plus the relevant permission, ownership and rollback cases below. Keep each story to about 8 tests at most.
2. Keep temporary feature tests separate from the existing 16 core tests, for example `tests/temporary/pharmacy.test.ts`. Do not replace or delete the core tests or shared Vitest configuration.
3. Run the temporary tests and `pnpm test`; fix failures and rerun until all relevant checks pass. A skipped test is not a pass. If implementation changes again, rerun the relevant tests before recording success.
4. Record the tested revision, command, date, pass/fail counts and a short description of the cases in the PR or Jira ticket. Use synthetic data and keep patient values and secrets out of evidence.
5. Only after successful runs and recording the evidence, delete the temporary test files and fixtures created for that feature. Do not delete a failing test to make the suite green, or remove another track's files.
6. Run `pnpm test` once more after cleanup; the 16 core tests must still pass. The final feature handover contains implementation code and a short verification note, without the temporary tests or unused test dependencies.

This keeps the repository small, but removed checks no longer protect against future regressions. Recreate the relevant temporary tests when changing those features later. Tests are already excluded from the Docker build context; this cleanup affects repository size, not deployed application size.

## 3. Your tasks as lead (foundation first, then your own stories)

Progress on branch `feat/sprint-foundation`: ~~strikethrough~~ marks completed code, file preparation or code review. **The F1 migration and one-time sample insertion were applied and verified on 17 Nov 2026.** The foundation seed code and command were then removed as requested; `seed:admin` remains. This branch has not been merged. Diagram edits, F2 manual checks and the late tasks remain pending. Current suite: 16 tests passed, with none skipped; TypeScript and lint passed (two existing lint warnings). Details: [lead handover](../lib/audit/README.md).

Teammates 1 and 2 cannot start the database-backed parts until F1 is merged to dev. Push it on day one. Teammate 3 has no blocker at the start.

| Teammate | Blocked until you merge | Can start meanwhile |
| --- | --- | --- |
| 1, Pharmacy | F1 | Zod schemas, route skeletons, reading the prescription read path |
| 2, Doctor finder and admin config | F1 (reason tables only) | Specialty management, hospital settings, Zod schemas |
| 3, Audit screen, wiring, finish | Nothing | Audit read API and screen, docs outline |

**F0. Recon first (about an hour).** The ERD has been checked: it defines stock\_batch, dispense\_record and visit\_reason (with specialty\_id), and F1 follows it. ~~Confirm in the repo what status values prescription.status already has, and whether lib/audit/actions/ exists as a folder of per-feature files.~~ Confirmed in code: `issued` is the existing prescription status, and per-feature audit action files already exist. Database preflight found no existing prescriptions.

**F1. One migration, one owner.** The schema and migration are applied and verified in PostgreSQL, including the revised prescription item fields. Merging F1 to dev and updating the diagrams remain pending. Applied in a single migration:

- ~~stock\_batch, exactly as in the ERD: id, medicine\_id, batch\_no, expiry\_date, quantity\_on\_hand (check >= 0), received\_at.~~
- ~~dispense\_record, exactly as in the ERD: id, prescription\_id, dispensed\_by, dispensed\_at. No unique constraint, because the ERD allows many records per prescription.~~ Dispensing once is enforced in the service by locking the prescription row and checking its status.
- ~~visit\_reason, exactly as in the ERD: id, name (unique), specialty\_id (foreign key to specialty, required), is\_active.~~
- ~~The missing foreign key from appointment.visit\_reason\_id to visit\_reason.~~
- ~~prescription\_item: make medicine\_id nullable and add medicine\_name (text), with a check that exactly one of the two is set.~~ This allows a doctor to prescribe a medicine outside the catalogue once Teammate 1 implements P4. Update the ERD and class diagram to match (source files still needed).
- ~~Make prescription.status a database enum with the values it uses today plus dispensed (check the current values first), and use that enum in the Drizzle schema.~~
- ~~Insert sample medicines and visit reasons once, outside the migration.~~ Completed: 10 medicines, one batch of 100 units each with expiry 2028-12-31, and six visit reasons across five specialties. At the user's request, the foundation seed implementation and command were deleted after the successful run. Future data will be entered manually; fresh installs start with an empty catalogue, stock and visit reasons.

After F1, schema changes go through one designated person only. Also remove nic from patient in the ERD and the class diagram, so the diagrams match the code (the app never stores NIC). **Pending:** the ERD and class-diagram source files were not found in this checkout.

**F2. Audit completion (SCRUM-171).** Lead implementation is complete; SCRUM-171 remains open for teammate events and manual database verification.

- ~~Add auth.sign\_in, auth.sign\_out and auth.sign\_in\_failed through Better Auth hooks.~~ Implemented with hooks and an adapter wrapper so successful session changes and their audit records share a transaction.
- ~~Add staff.created, staff.updated and staff.role\_changed calls in the staff service (the constants already exist).~~ Staff creation, name updates and role changes now record events; changing a role also revokes existing sessions.
- ~~Publish a short note for teammates: every new write calls recordAudit(tx, ...) and each track adds its action names in its own file, never a shared constants file.~~ Written in [lib/audit/README.md](../lib/audit/README.md).
- ~~Spot-check the existing audit callers listed in section 8.~~ Code review confirmed they use the mutation transaction and structural metadata; live database verification remains pending.
- Verify the append-only trigger once by hand: try an UPDATE and a DELETE on an audit\_log row in psql and confirm both are rejected. **Pending:** `scripts/verify-audit-retention.sql` is prepared but has not been run.

SCRUM-171 closes when the catalog in section 8 is fully written and the required manual checks pass.

**F3. Deployment/backup preparation and test cleanup brought forward; Docker and restore runtime verification remain pending.**

On 17 Nov, the user requested Docker/deployment preparation now, then explicitly prohibited running Docker. No Docker command or container was run after that restriction. See [deployment](deployment.md) and [backup/restore](backup-restore.md). Local standalone build, TypeScript, lint and documentation syntax checks passed. The build reported a Next.js security advisory; update the dependency before deployment. Docker installation and backup/restore evidence remain pending.

- SCRUM-173: ~~Docker Compose for Next.js and PostgreSQL, environment-only configuration, migrate and administrator-seed commands, setup instructions.~~ Prepared. **Pending:** build the images and verify one install on a fresh instance; Docker execution was prohibited.
- SCRUM-196: ~~Document pg\_dump, throwaway restore and record-count/schema spot-check commands.~~ **Pending:** run the actual backup and restore, compare records and capture a screenshot. No run or evidence is claimed.
- ~~Reduce the tests and write docs/testing.md (section 10).~~ Completed early at the user's request: 16 tests pass, none skipped. Teammate 1 must temporarily test dispensing, record successful results and remove those temporary files after the run.

## 4. Decisions to lock before kickoff

Each has a recommended default so nobody is blocked waiting.

- **D1. One specialty per doctor.** No junction table. "Doctor specialties" in the old SCRUM-169 means editing that one field.
- **D2. Reason mapping.** Each visit reason belongs to exactly one specialty (visit\_reason.specialty\_id), never straight to doctors. A reason without a specialty is rejected.
- **D3. Stock model.** Stock is kept as stock\_batch rows (batch number, expiry date, quantity on hand). The UI shows one total per medicine, and the pharmacist adds stock by receiving a batch. No partial dispensing or stock requests. The Jira text saying no batches is out of date because the ERD has them.
- **D4. Dispensing.** Full dispense only, in one transaction. A prescription can be dispensed once (enforced by the row lock and status check). Only catalogue items are dispensed; items the doctor typed are for the patient to buy outside. Failure leaves stock and prescription status unchanged.
- **D5. Settings.** Only name, address, phone and email. The Role Permissions toggles on the settings page are deleted because they are fake and the Jira description rules out a custom permission designer.
- **D6. Finder results.** Active doctors only, ordered by soonest open date. No match shows a plain message and no clinical advice.

## 5. Teammate 1: Pharmacy

Branch: feat/pharmacy. Stories: SCRUM-155 (with 158), 157, then the check of 151 and 152.

Needs from you before starting: F1.

**Temporary tests for this track:** verify catalogue/stock writes and their validation or permission failures; successful dispensing; insufficient-stock rollback (stock, prescription status, dispense records and audit rows unchanged); double-dispense rejection; patient ownership; mixed catalogue/typed prescriptions; and typed-only "nothing to dispense". Follow the section 2 workflow: run, record evidence, delete only these temporary tests/fixtures, then rerun the 16 core tests. P1-P4 are not done until their checks have passed; no permanent pharmacy test suite is required by this plan.

**P1. SCRUM-155, catalogue and stock.**

- GET /api/pharmacy/medicines returns the catalogue with the total quantity on hand per medicine, summed over batches that have not expired (this also covers the old SCRUM-158 view).
- POST adds a medicine, PATCH edits its details, and POST /api/pharmacy/medicines/:id/batches receives a new stock batch (batch number, expiry date, quantity). Pharmacist only. Strict schema, quantity a non-negative integer.
- Replace the in-memory pharmacy provider with real fetches once the API merges.
- Audit: medicine.created, stock.received.

**P2. SCRUM-157, dispensing.** lib/services/dispensing.ts, one transaction:

- Lock the prescription row, reject if status is already dispensed (409) or the caller is not a pharmacist (403).
- For every catalogue item, take stock from the earliest-expiry batches that have not expired, using a conditional update on quantity\_on\_hand (decrement only where the batch has enough, RETURNING). If the total across batches is short for any item, roll back everything and return 409 with no partial change.
- Insert dispense\_record, set prescription status to dispensed, write the audit row. The row lock plus the status check is what blocks a double dispense.
- Audit: prescription.dispensed with the prescription id and item count only.

**P3. SCRUM-151 and 152, check and finish.** The patient list and pharmacist read already exist. Confirm both work end to end, patient sees only their own prescriptions, pharmacist search works, and the pharmacist view shows dispensing eligibility (not already dispensed and stock sufficient). Fix whatever is missing.

**P4. Medicines outside the catalogue (needed, small).** The prescription form lets the doctor either pick a catalogue medicine or type a medicine name. The create endpoint accepts exactly one of medicine\_id (an active catalogue medicine) or medicine\_name (1 to 100 characters), never both, and the Zod schema enforces it. The patient and pharmacist views show the name for both kinds and label typed ones "not in catalogue, patient buys outside". Dispensing ignores typed items and takes stock only for catalogue items. If a prescription has no catalogue items, dispensing returns 409 "nothing to dispense". When catalogue stock is short, the 409 names the short medicines so the pharmacist can tell the patient. Audit: prescription.created already exists. Extra files for this task: lib/services/prescription.ts, lib/schemas/prescription.ts, the doctor prescription form and the pharmacist reader.

File boundaries (exclusive): lib/services/dispensing.ts, lib/services/stock.ts, app/api/pharmacy/**, lib/schemas/pharmacy.ts, components/pharmacy/**, lib/audit/actions/pharmacy.ts.

## 6. Teammate 2: Doctor Finder and Admin Config

Branch: feat/admin-config. Stories: SCRUM-168 (with 169), 170, 189.

Needs from you before starting: F1 for the reason tables. Specialty management and settings can start immediately.

**Temporary tests for this track:** verify successful specialty/reason/settings writes and admin-only access; rejection of a reason without a specialty; finder results containing only active doctors of the mapped specialty; the no-active-doctor result; and the chosen reason being stored during booking. Follow the section 2 workflow: run, record evidence, delete only these temporary tests/fixtures, then rerun the 16 core tests.

**B1. Specialties.** Admin-only routes under app/api/admin/specialties to create and rename (the list route exists). Block delete when doctors reference the specialty. Add PATCH /api/admin/doctors/:userId/specialty to change a doctor's one specialty. Audit: specialty.created, specialty.updated, doctor.specialty\_changed.

**B2. SCRUM-168, reason mapping.** CRUD for visit\_reason under app/api/admin/visit-reasons, where each reason has one specialty\_id. Reject a reason with no specialty. Replace the fixture-based DoctorReasonConfig screen with a reason list that has a specialty dropdown per reason. Audit: visit\_reason.created, visit\_reason.updated (changing the specialty is an update).

**B3. SCRUM-170, patient doctor finder.**

- GET /api/patient/doctor-finder?reasonId= returns active doctors whose specialty is the reason's specialty, ordered by soonest open date (reuse the existing open-dates service).
- No match returns an empty list and a plain message.
- The chosen reason continues into booking and is stored in appointment.visit\_reason\_id. Keep the change to the booking service minimal and rebase on Teammate 3's audit calls (section 9).

**B4. SCRUM-189, settings.**

- GET and PUT /api/admin/settings for the four fields, admin only, strict schema, singleton row.
- Replace the fixture form and delete the Role Permissions section.
- Audit: settings.updated with changed field names only.

File boundaries (exclusive): app/api/admin/specialties/**, app/api/admin/doctors/**, app/api/admin/visit-reasons/**, app/api/admin/settings/**, app/api/patient/doctor-finder/\*\*, lib/services/specialty.ts, lib/services/visit-reason.ts, lib/services/settings.ts, lib/schemas/admin-config.ts, components/admin/doctor-reason-config.tsx, components/admin/hospital-details-form.tsx, lib/audit/actions/admin-config.ts and settings.ts.

## 7. Teammate 3: Audit Screen, Wiring and Finish

Branch: feat/audit-and-finish. Stories: SCRUM-172, the audit wiring below, 197, 198, then 194 once everything is merged.

Needs from you before starting: nothing. The audit table and helper already exist.

**Temporary tests for this track:** for C1/C2 and release fixes, verify audit filters/paging and non-admin denial, patient registration/booking/cancellation audit events, transaction failure paths and metadata containing no patient values. For each code fix, add a focused temporary regression check, run it, record successful evidence and remove that temporary check. Rerun the 16 core tests after cleanup. C3's document/presentation tasks do not need artificial automated tests; C4 still requires the section 9 manual journey and saved evidence after all tracks merge.

**C1. SCRUM-172, audit screen.**

- GET /api/admin/audit with filters for user, action and date range, newest first, paged. System admin only (403 for everyone else).
- Read-only. No route may update or delete audit rows.
- Replace the fixtures in components/admin/audit-trail.tsx with real data.

**C2. Audit wiring for earlier features (merge this PR early).** Add recordAudit calls inside the existing transactions for patient registration, appointment booking and appointment cancellation. Actions: patient.registered, appointment.booked, appointment.cancelled. Metadata holds ids only.

**C3. SCRUM-197 and 198, docs and demo.**

- Align the SRS, use cases, architecture diagram, UI figures and acceptance criteria with the web-only scope, and finish the installation guide and six-role user guides.
- Prepare synthetic accounts and the full hospital journey for the demo, a short presentation, and viva rehearsal. Check that the repository and Jira references are accurate.

**C4. SCRUM-194, final verification and fixes (last).** Run the checklist in section 9 after all PRs are merged. It absorbs the old SCRUM-192 and 195: fix release-blocking defects only, record known limitations, no new features. Attach results to the ticket.

File boundaries (exclusive): app/api/admin/audit/**, lib/services/audit-query.ts, components/admin/audit-trail.tsx, docs/**, the audit calls inside lib/services/patient.ts and the booking services, lib/audit/actions/patient.ts and appointment.ts.

## 8. Audit event catalog (SCRUM-171)

| Area | Actions | Owner |
| --- | --- | --- |
| Authentication | ~~auth.sign\_in, auth.sign\_out, auth.sign\_in\_failed~~ (implemented; live verification pending) | You |
| Staff | ~~staff.created, staff.updated, staff.role\_changed~~ (implemented; live verification pending; staff.deactivated and staff.reactivated already exist) | You |
| Patient and booking | patient.registered, appointment.booked, appointment.cancelled | Teammate 3 |
| Pharmacy | medicine.created, stock.received, prescription.dispensed | Teammate 1 |
| Specialties and reasons | specialty.created, specialty.updated, doctor.specialty\_changed, visit\_reason.created, visit\_reason.updated | Teammate 2 |
| Settings | settings.updated | Teammate 2 |
| Already in place, ~~verify~~ (code spot-check complete; live verification pending) | patient.updated, queue.checked\_in, queue.status\_changed, encounter.created, intake.recorded, consultation.opened, consultation.completed, clinical\_note.created, prescription.created | You (spot check) |

SCRUM-171 closes when every row above writes an audit\_log row with actor, action, target and timestamp, the metadata holds no patient data values, the append-only trigger has been checked by hand, and the app exposes no way to edit or delete audit rows.

## 9. Branches, merge order and the final verification checklist

Branches: feat/pharmacy (Teammate 1), feat/admin-config (Teammate 2), feat/audit-and-finish (Teammate 3). File boundaries do not overlap, with one exception: the booking service. Teammate 3's audit wiring PR (C2) is small, so it merges first. Teammate 2's finder change to booking (B3) rebases on it.

Merge order: your F1 first, then C2, then everything else in any order. lib/auth.ts and lib/auth-guard.ts are yours only. Schema and migrations belong to the one schema owner. Audit action names live in per-feature files, never a shared one.

Checklist for SCRUM-194 (done by Teammate 3 with the whole team around for fixes):

- [ ] Full six-role journey on seeded accounts: register, book, check in, intake, consult with a note, prescribe, dispense.
- [ ] Dispensing: dispense the same prescription twice (second attempt blocked), dispense with too little stock (rejected, stock and status unchanged). Do this by hand, it is your evidence for the old SCRUM-192. Also prescribe a medicine that is not in the catalogue: it shows as "not in catalogue" and does not block dispensing the rest.
- [ ] Pharmacist cannot see anything outside prescriptions and stock. Patient sees only own prescriptions and appointments. Receptionist gets 403 on clinical and pharmacy routes.
- [ ] Doctor finder: pick a reason, see only active doctors of the reason's specialty, book from the result, and a reason whose specialty has no active doctors shows the no-match message.
- [ ] Admin: staff creation sends the password-set email, password reset link works once and then expires, specialty and reason changes show up in the patient finder.
- [ ] Settings: saved values persist after reload, and the hospital name appears in emails.
- [ ] Deactivated staff are rejected on the next request.
- [ ] Audit: each event in section 8 has a row, the admin audit screen filters work, no patient data values appear in metadata, and no screen anywhere still uses fixtures.
- [ ] Fresh install from the Docker Compose instructions works, and the backup restore run has evidence.

**SCRUM-175 (password reset and staff first-password setup).** Already built, so no code. Close it as Done after one manual run with real SMTP: create a staff account, open the invite email, set a password, sign in, reuse the same link (it must be rejected), and request a patient forgot-password code. Repeat the run the day before the demo. Known limitations to record: if the email fails to send, the admin is not told (the Resend Invite button is the workaround), and fixing a typo in a staff email may mean creating a new account (test this during the run).

## 10. Test cleanup (completed early at the user's request)

~~Reduce the large suite and write docs/testing.md.~~ Done on 17 Nov 2026, before teammate merges, following the user's explicit instruction to keep only a minimal number. The suite is now **16 tests in 7 files; all 16 pass with no skips**. The previous 594 cases included 89 skipped database tests. Schema-only tests, snapshots, UI checks, old integration suites and unused fixtures have been removed.

Run `pnpm test`. [docs/testing.md](testing.md) gives one plain-language line per test explaining what it proves and why, how to run the suite, which services are doubled, and what is not covered.

Current coverage: role guards, patient ownership, booking capacity, consultation opening/completion, a staff write with its audit record, and basic authentication audit behavior. These are focused behavior checks; PostgreSQL concurrency and the full browser journey still need manual verification.

**Still pending:** Teammate 1 must create and run temporary happy-path and insufficient-stock rollback tests when dispensing is implemented, record the passing results and delete those temporary files afterwards. Follow the same process for the other teammate code changes. The retained core suite stays at 16; temporary checks are not counted as permanent coverage. Teammate work and the manual release checklist remain open.

## 11. Suggested timeline

These are targets, not promises, and the viva date is not confirmed. Keep the last 5 to 7 days free for verification and the demo. If the viva is sooner than late November, tell me and the plan gets compressed.

- Mon 16 to Tue 17 Nov: you run F0 and merge F1. Teammates read their section and write Zod schemas. Teammate 3 starts C1 and C2. Teammate 2 starts specialties and settings.
- Wed 18 to Sat 21 Nov: Teammates 1 and 2 build against the migration. You finish F2 and do the one SCRUM-175 manual run. C2 merges first, then the rest as they are ready.
- Sun 22 Nov: all feature PRs merged. Jira statuses updated.
- Mon 23 to Wed 25 Nov: Teammate 3 runs SCRUM-194 and everyone fixes what fails. You do Docker Compose and the backup run.
- Thu 26 Nov: ~~you cut the tests and write docs/testing.md~~ (completed early on 17 Nov at the user's request). Docs finalised.
- Fri 27 to Sun 29 Nov: demo data, presentation and viva rehearsal.
