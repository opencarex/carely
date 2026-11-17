# Lead foundation and audit handover

Work branch: `feat/sprint-foundation`, based on `dev`. This covers F0, the applied F1 migration and the lead-owned portion of F2 in the 16 November recovery plan. Teammate APIs, screens, patient registration and booking audit calls remain with their assigned owners.

## Database migration and one-time sample data

On 17 November 2026, the user approved applying the database changes, inserting sample data once, and deleting the foundation seed implementation afterwards.

`0004_sprint5_lead_foundation.sql` was applied successfully using Drizzle's PostgreSQL migrator. It adds the three F1 tables, the appointment reason foreign key, the `prescription_status` enum (`issued`, `dispensed`), and the revised prescription item contract: nullable `medicine_id`, nullable `medicine_name`, and a database check requiring exactly one to be set. Its snapshot was generated from the updated Drizzle schema. Before applying, the configured database had no prescriptions and no non-null appointment reason ids. The migration ledger now matches the final 0004 SQL hash.

`dispense_record.prescription_id` is deliberately **not unique**. Single dispensing is enforced by the pharmacy service's prescription row lock and status check, as specified in the revised plan.

The sample insertion ran once and was verified: 10 medicines, 10 batches (100 units each, expiry 2028-12-31), six visit reasons linked across five specialties, and 26 `foundation.seeded` audit rows. No patient or prescription records were added. The foundation seed script, service, action file, tests and package command have been removed as requested. Future catalogue, stock and reason data are entered manually through the pharmacy/admin features when those are finished.

Sample data is not embedded in a migration, so a fresh install starts with an empty medicine catalogue, stock and visit reasons. The initial administrator bootstrap `pnpm seed:admin` remains. Existing specialty seed SQL in the historical migration remains unchanged.

For future installations, apply migrations with `pnpm db:migrate`. Do not run `db:push`; it does not install the existing append-only SQL trigger. The revised typed-medicine schema is ready for Teammate 1's P4; its prescription validation, create/read services and UI are still owned by that track.

No ERD or class-diagram source exists in this checkout, so the requested removal of NIC from those diagrams still needs their original files. The patient schema already excludes NIC; historical migrations must retain their original definitions.

## Audit contract for teammates

Every new write must call `recordAudit(tx, event)` inside the **same** transaction as the mutation. Import action names from your own feature file in `lib/audit/actions/`; never add a shared action constants file or edit another track's file.

```ts
await db.transaction(async (tx) => {
  // Validate permission and change domain rows using tx.
  await recordAudit(tx, {
    actorId: actor.userId, // Obtain actor from the server session.
    action: featureActions.updated,
    targetType: "patient",
    targetId: patientId,
    metadata: { changedFields: ["phone"] },
  });
});
```

Metadata is strict and permits structural field names, enumerated roles/statuses, item counts, medicine ids and stock quantities. It rejects patient data values and arbitrary bodies. Use the entity id as the target; do not log passwords, email addresses, raw session tokens, notes or vitals. Shared targets now include the F1 tables, specialty, doctor and hospital settings.

Lead events implemented here: `auth.sign_in`, `auth.sign_out`, `auth.sign_in_failed`, `staff.created`, `staff.updated`, `staff.role_changed`. Existing `staff.deactivated` and `staff.reactivated` are preserved. Name/role updates use PATCH `/api/admin/staff/:id`; `{active}` remains a separate strict body. Name changes record field names only. Role changes revoke sessions and preserve doctor rows and historical authorship. A new doctor needs a specialty; existing doctor specialty edits stay in the admin-config track. This work does not add staff email editing or UI.

Better Auth 1.7.7 defers database after-hooks until commit. Session creation uses an adapter wrapper for an atomic insert+audit, including sessions created by verification. Sign-out hooks wrap the per-request session deletion, keeping deletion+audit atomic. Failed email/password sign-ins produce anonymous events with target `unknown`, never the submitted email. Audit failures prevent session creation and roll back session deletion; sign-out reports a failure rather than falsely reporting revocation. See the [Better Auth hook documentation](https://better-auth.com/docs/concepts/hooks) and [1.5 transaction change](https://better-auth.com/blog/1-5).

Spot-check: existing patient update, queue check-in/status change, encounter create, intake, consultation open/complete, clinical note create and prescription create already call `recordAudit` using their mutation transaction. Their metadata contains field names, states or counts, not patient values. No HTTP route imports `auditLog` or exposes an audit update/delete operation in this checkout. Teammate 3 still owns the read screen and patient/booking events; the pharmacy and admin-config action catalogs remain with Teammates 1 and 2. SCRUM-171 therefore remains open until all tracks and the manual retention check are verified.

## Remaining manual checks and late work

The manual retention check is still pending. Run `psql "$env:DATABASE_URL" -f scripts/verify-audit-retention.sql` using the application role. Capture the two PASS notices as evidence. The script inserts a temporary non-patient audit record, attempts UPDATE and DELETE in exception blocks, and rolls everything back. This is a prepared procedure, not evidence that the trigger passed.

SCRUM-175 still needs the real SMTP invitation/password-reset manual run in section 9. No staff email was sent by this implementation.

F3 preparation was brought forward on 17 November at the user's request. Dockerfile, environment-only Compose configuration and deployment/backup guides are prepared; see [deployment](../../docs/deployment.md) and [backup/restore](../../docs/backup-restore.md). The user explicitly prohibited running Docker, so image build, fresh-install and backup/restore evidence are still pending. No Docker command was run after that restriction, and no container was started during this work. The user subsequently authorized section 10 cleanup early: 16 focused tests remain, all pass without skips; see [testing](../../docs/testing.md). Temporary dispensing checks remain pending the pharmacy service. Teammates run and record temporary feature tests, then remove only those files after success; the 16 core tests remain. Full workflow verification still waits for teammate merges.

## Checks performed on this branch

- `pnpm exec tsc --noEmit --incremental false`: passed.
- `pnpm lint`: passed with the two existing staff-directory warnings (unused invite warning and React Hook Form compiler compatibility).
- Before cleanup, the full suite had 505 passing and 89 skipped database cases. After the authorized cleanup, `pnpm test` passes all 16 remaining tests with no skips. Native configuration loading and thread workers avoid restricted Windows child-process startup.
- New tests exercise real Better Auth endpoint dispatch with an in-memory adapter and transaction simulation, staff permission/audit paths. They are not PostgreSQL transaction or migration evidence.
- Database verification: all three F1 tables exist, both prescription medicine-source columns are nullable, the exactly-one constraint exists, the status enum contains issued/dispensed, and the migration ledger hash matches. Sample counts and future batch expiry dates were verified after the single insertion.
- An older applied migration hash differs from the current 0001 SQL. That historical migration was not changed or rerun; the new 0004 migration was applied and verified independently.

F3 file checks: standalone local production build, TypeScript, lint and documentation syntax checks passed without Docker. The build reported a Next.js 16.4.0 security advisory; updating the dependency remains a separate follow-up before deployment. Container and restore runs remain unverified.
