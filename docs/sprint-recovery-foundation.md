# Sprint recovery foundation handover

> Historical handover: this file describes the foundation branch at the revision
> named below. Later migrations and teammate branches added visit reasons, stock
> batches, dispensing, typed medicines and the feature APIs that this document
> calls outstanding. Use [architecture](architecture.md) and the recovery plan for
> the current system; do not treat the remaining-work section as current status.

Branch: `feat/sprint-recovery-foundation`, based on `dev` at `8061177`.
Scope: F0?F5, F7, and security prerequisites S1/S2. No teammate feature APIs or UI are implemented here. Nothing is merged or deployed by this branch.

## Recon and schema decisions

The base had authentication, patient, doctor, availability, appointment, specialty and hospital-settings schemas, three migrations, and no clinical/queue/audit persistence. Existing booking already uses transactional token allocation and Asia/Colombo time. Existing admin UI calls custom staff APIs, not Better Auth admin methods.

Migration `0003_sprint_recovery_foundation.sql` adds only nine ERD tables:
queue_entry, encounter, vitals, preliminary_note, clinical_note, medicine, prescription, prescription_item and audit_log.

- NIC and allergies are excluded. No identity-document, allergy or extra history columns are added. Existing demo allergy labels in the nurse/doctor mock UI must be removed by those UI owners when they wire their features; do not turn those fixture fields into API or database contracts.
- Preserve ERD names: encounter.ended_at; preliminary_note.content; audit_log.user_id/entity_type/entity_id.
- Check-in and completion actors are recorded by audit events, not invented checked_in_by/completed_by columns.
- Queue and encounter each have a unique appointment_id. Appointment token numbers are unchanged.
- Queue status: waiting -> intake_done -> with_doctor -> completed. Encounter status: in_progress -> completed, with ended_at required on completion.
- Queue ordering is checked_in_at ascending, then id ascending. Manual reordering is deferred: no ERD sort field exists. The ReorderQueue type reserves a future contract only; do not expose a move endpoint or mutate arrival timestamps.
- Preliminary-note content includes the initial complaint. Clinical notes are append-only at the feature-service/API boundary; updated_at remains in the schema because the ERD includes it.
- Prescriptions are create-only this sprint. Items require real medicine_id foreign keys and positive quantity/duration_days. There is no fallback free-text medicine.
- Existing clinical authors and audit actors have restrictive foreign keys. Audit UPDATE, DELETE and TRUNCATE are rejected by a PostgreSQL trigger. The SQL-only trigger is intentionally not represented in Drizzle snapshots; use migrations rather than db:push to install it.
- visit_reason, stock_batch and dispense_record remain outside this foundation. No dispensing or inventory workflow is implemented.
- No medicine catalog seed or medicine-management API is added. Teammate 3 needs real catalog entries in development; tests create their own medicine rows.

## Shared files and contracts

| Foundation                 | Files                                       | Use                                                                                                                                                     |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database transaction types | lib/db/types.ts                             | DbTransaction and DbExecutor; runtime DB stays in lib/db/index.ts                                                                                       |
| Audit                      | lib/services/audit.ts, lib/schemas/audit.ts | recordAudit(tx, event), in the SAME transaction as the domain mutation                                                                                  |
| Audit action names         | lib/audit/actions/staff.ts, encounter.ts    | Each teammate creates their own feature action file                                                                                                     |
| Queue contracts            | lib/schemas/queue.ts                        | CheckInAppointment, TransitionQueueEntry, ReorderQueue types and strict body schemas                                                                    |
| Access                     | lib/services/access-policy.ts               | Actor, isActiveActor, assertActiveActor, canViewPatientAdmin, canViewClinical, canViewPrescription, isTreatingDoctor                                    |
| Encounter                  | lib/services/encounter.ts                   | getOrCreateEncounter(appointmentId, actor, tx?), assertEncounterWritable(encounterId, actor, tx)                                                        |
| Errors                     | lib/services/service-error.ts               | ServiceError has statusCode and code; thin routes map it to HTTP                                                                                        |
| Fixtures                   | tests/helpers/factories.ts                  | createUser, createPatient, createDoctor, createAppointment, createQueueEntry, createQueuedVisit, createEncounter; explicit test DB/transaction required |

Actors always come from the server session: `{ userId: session.user.id, role: session.user.role }`. Never parse an actor from request JSON. Route guards perform role checks; services also check the current DB role and ban. Policy functions return false for inaccessible/missing records; callers return 404 for record-level denial. Validate UUIDs in route schemas before calling policies.

canViewClinical grants a current active treating doctor access to the history of patients with a non-cancelled appointment or encounter with that doctor. It denies nurses, receptionists, patients, pharmacists and admins. Nurses access only the current waiting intake context, not general history. canViewPatientAdmin permits the patient owner, receptionist, treating doctor, or nurse for today's waiting appointment. canViewPrescription permits the patient owner, pharmacist, or treating doctor; it never returns notes or vitals.

## Transaction and locking rules

1. Lock the appointment before creating/checking in its queue entry. Check it is booked and dated today using colomboNow().
2. Insert/reuse the unique waiting queue entry, then call getOrCreateEncounter with the SAME transaction and server actor. Check-in must create an encounter before transitioning away from waiting.
3. All clinical writes and consultation completion must call assertEncounterWritable INSIDE their transaction. It locks appointment -> encounter. Transition the queue after these locks; do not acquire queue locks first.
4. assertEncounterWritable permits nurse writes only in waiting and doctor writes only in with_doctor, for today's booked appointment. A completed encounter returns 409; an unrelated doctor gets 404.
5. The doctor's open-visit action checks intake_done and treating-doctor ownership itself. It must NOT use the with_doctor write assertion before opening. Follow the same lock order.
6. transitionQueueEntry must accept an optional transaction and perform a conditional status update. When a caller supplies tx, do not open or commit a separate transaction. Check the allowed transition, current role, doctor ownership, and expected state.
7. Completion checks for a clinical note, writes status completed and ended_at, transitions the queue, and records its audit event in one transaction. All note/prescription writers must participate in the same lock convention so completion cannot race a late write.
8. recordAudit requires a transaction and accepts only structural metadata: changed field names, enumerated roles/statuses, and item counts. It maps actorId/targetType/targetId to the ERD columns. No patient names, phone numbers, note text, values or request bodies belong in audit metadata.

Example for the intake owner:

```ts
await db.transaction(async (tx) => {
  const visit = await assertEncounterWritable(encounterId, actor, tx);
  // Insert vitals + preliminary note using visit.id.
  // transitionQueueEntry({ entryId, from: "waiting", to: "intake_done", actor }, tx)
  await recordAudit(tx, {
    actorId: actor.userId,
    action: "intake.recorded",
    targetType: "encounter",
    targetId: visit.id,
  });
});
```

The queue transition in the example is supplied by Teammate 1, not a runtime stub in this foundation. Service implementations can declare `export const transitionQueueEntry: TransitionQueueEntry = async (...) => ...`.

## Security changes included

- requireAuth rejects banned users; requireRole inherits that check.
- A parent authenticated layout invokes the shared guard, including existing demo workspaces.
- Custom staff status changes accept the server actor, recheck its admin role/current account, restrict targets to supported staff, update doctor.is_active, revoke all sessions on deactivation, and audit an actual status change in one transaction. All admin targets are rejected, so this interface cannot deactivate self or the last admin.
- All HTTP requests to /api/auth/admin are rejected before the Better Auth handler. The known admin methods are also in Better Auth disabledPaths. Its admin plugin remains enabled to reject banned users when creating sessions at sign-in.
- Password reset/claim, ordinary authentication, and custom staff APIs remain available. Staff-detail editing and safe role-change services are still separate lead work.

## Verification

Checked 8 Nov 2026: 146 tests passed; 52 PostgreSQL tests skipped (44 existing, 8 foundation). TypeScript and repository ESLint passed; ESLint reported only the two pre-existing staff-directory warnings. The migration snapshot adds exactly nine tables and changes no existing table definitions. The production build was stopped after stalling in compilation, so it is not counted as passed. No migration was applied to an application database. No further Docker commands were run after the owner requested that Docker not be used.

Run without Docker:

```powershell
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm exec vitest run --configLoader native --no-cache --no-fsModuleCache
```

Database suites are explicit opt-in and never use the application's DATABASE_URL. With an already available dedicated PostgreSQL test role that can CREATE DATABASE:

```powershell
$env:FOUNDATION_TEST_DATABASE_URL = "postgresql://TEST_USER:TEST_PASSWORD@HOST:5432/postgres"
$env:BOOKING_TEST_DATABASE_URL = $env:FOUNDATION_TEST_DATABASE_URL
pnpm exec vitest run tests/integration --configLoader native --no-cache --no-fsModuleCache
```

Each suite creates a uniquely named database, runs every migration and drops only its own database afterwards. Factories never default to the application's DB. The new integration suite covers concurrent encounter retries, rollback with audit, access policies, completed-visit locking, audit retention, real sign-in/session revocation/reactivation, and medicine/authorship foreign keys. Do not claim these integration tests passed when their database variables are unset.

Before handover, review/apply the migration to the intended development database using `pnpm db:migrate`, verify the PostgreSQL suites, and merge the foundation to dev. No migration is applied automatically by this implementation.

## Remaining ownership

- Teammate 1: check-in/queue service and routes, patient updates/queue view, polling. Account for cancellation vs check-in under the appointment lock; do not allow a live queue entry to survive a cancellation.
- Teammate 2: intake, consultation open/complete, final workflow verification.
- Teammate 3: clinical notes, review/history, prescription writes/reads.
- Lead follow-ups: staff-detail editing (S3), remaining audit event retrofits (S4), staff hardening (S5), full PostgreSQL verification (S6), and board changes (S7). Audit foundation is not completion of SCRUM-171. Existing staff creation/sign-in/sign-out and older patient mutations still need their event retrofits.
