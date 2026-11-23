# SCRUM-191: queue-to-consultation verification

Date: 14 November 2026 (Asia/Colombo).
Owner: Teammate 2.
Implementation revision: `3b3870a` on `feat/intake-consultation`.

**Status: automated verification passed; full cross-track acceptance is pending.**
Do not close SCRUM-191 from this report alone.

> Current-context note (23 November 2026): this is immutable historical evidence
> for revision `3b3870a`. Clinical-note, prescription and audit work mentioned as
> missing below now exists in later code, but the 519-test run was not repeated on
> that later combined revision. The retained current suite has 16 tests. Final
> cross-track browser acceptance remains pending.

## Executed checks

| Check                                                                       | Result                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Full Vitest suite, including PostgreSQL and the new workflow check          | **519 passed, 0 failed, 0 skipped; 43 files passed**                                                   |
| Existing PostgreSQL integration suites, run separately before the new check | **82 passed across 5 suites**                                                                          |
| TypeScript, `--noEmit --incremental false`                                  | Passed                                                                                                 |
| ESLint on the new verification test                                         | Passed                                                                                                 |
| Application production build                                                | Passed during Task 6 on this implementation revision; not repeated for test/documentation-only changes |

The full suite includes 83 PostgreSQL tests: the existing 82 plus the new
service-path check in `tests/verification/queue-to-consultation.test.ts`.

## Database isolation

Verification used the already installed PostgreSQL 18 binaries to initialize a
temporary cluster under the ignored `.next/verification/` directory. It listened
only on `127.0.0.1:55439` and used a test-only role. Both test environment variables
pointed explicitly to that cluster's `postgres` database. Each database suite
created, migrated and dropped its own uniquely named database.

The application `DATABASE_URL` and application database were not used. No Docker
commands, application migrations, demo seeds or authentication emails were needed.
After the tests, the temporary cluster contained no remaining `carely*` test
databases. The temporary server was stopped and its data/log removed. The existing
PostgreSQL service was not stopped.

## Implemented path verified

The new check exercises these services against real PostgreSQL:

1. Receptionist checks in today's booked appointment; retry returns the same entry.
2. Nurse finds the waiting encounter and records vitals plus preliminary notes.
3. The nurse queue no longer includes the handed-off visit; the nurse's own saved
   confirmation is available.
4. The assigned doctor sees `intake_done` and opens the consultation.
5. Completion without a clinical note returns 409.
6. A clinical note **fixture** is inserted using the shared writable-encounter lock.
7. The doctor completes the encounter and queue; the patient sees completed status
   with no queue position, and appointment number 17 is preserved throughout.
8. Later guarded clinical writes return 409. Eight implemented audit events exist,
   including all three queue transitions, without clinical text in metadata.

The fixture in step 6 is deliberately not a substitute for Teammate 3's note API.
It proves the current service path and shared locking contract, not completion of
the clinical-note, clinical-history or prescription stories.

## Recovery-plan acceptance matrix

| Acceptance area        | Evidence and current result                                                                                                                              | Remaining verification                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Check-in               | Queue database tests and route tests pass: valid appointment, retries, closed/future dates, cancellation races and role restrictions.                    | Browser check-in walkthrough.                                                                                                       |
| Queue order and tokens | Database tests pass for check-in ordering, ID tie-breaker and unchanged appointment numbers.                                                             | Browser ordering check.                                                                                                             |
| Nurse intake           | Persistence, authors/timestamps, handoff, own receipt, invalid values, concurrency and rollback tests pass. Nurse render and form-conversion tests pass. | Browser save/reload walkthrough; clinical read-route permissions after Teammate 3 integrates those routes.                          |
| Transitions            | State guards, wrong-doctor denials, simultaneous opens/completions, audit rollback and shared write locks pass against PostgreSQL.                       | Browser error feedback across real sessions.                                                                                        |
| Patient queue          | Own-status isolation and completed-position behavior pass against PostgreSQL; visibility/focus polling unit tests pass.                                  | Browser hidden-tab/focus check and network inspection.                                                                              |
| Doctor workflow        | Open/complete, same-encounter note prerequisite and late-write restrictions pass.                                                                        | Teammate 3's real note creation and intake/history review APIs, then a complete browser flow.                                       |
| Prescriptions          | Foundation foreign-key and access-policy tests pass; simulated guarded writes are blocked after completion.                                              | Actual prescription creation, validation and patient/pharmacist reads; receptionist denial through the real APIs.                   |
| Patient updates        | Permitted-field, persistence, ownership and unknown-field checks pass in unit/database suites.                                                           | Browser profile/reception update checks.                                                                                            |
| Deactivated staff      | Foundation tests exercise real Better Auth sign-in, session revocation, rejection and reactivation against PostgreSQL.                                   | Application-session walkthrough in the browser.                                                                                     |
| Audit                  | Teammate 2 events, transaction rollback and database audit-retention protections pass.                                                                   | Complete the recovery plan's catalog, including lead-owned authentication/staff events and Teammate 3 clinical/prescription events. |

## Dependencies confirmed

After fetching `origin`, `origin/dev` remained at `6ad04c0`. There was no remote
`feat/clinical-record` branch. The expected clinical-note, record-review/history
and prescription services/routes were absent from the feature checkout and the
remote main tree inspected for this run.

The feature branch was already synchronized with `origin` at `3b3870a`; no push
was needed to begin verification. This report and the new test are additional
local work and need their own commit/push.

Outstanding items:

- **Teammate 3:** integrate clinical-note creation/reads, doctor intake/history
  review, prescription creation and patient/pharmacist prescription reads. All
  clinical writers must use the shared writable-encounter lock in their transaction.
- **Team leader:** finish the audit catalog for SCRUM-171. In the inspected code,
  staff creation and authentication still lack the required audit writes.
- **Teammate 2:** run the browser checklist after those features are integrated,
  attach this report and final browser results to SCRUM-191, and close the story
  only when all required acceptance checks are satisfied.

The Task 6 production build also emitted a Next.js security-version warning.
The recommended dependency upgrade remains a separate follow-up; no dependencies
were changed during this verification.

## Repeating the automated checks

Use a dedicated PostgreSQL test service with a role able to create databases.
Set both variables explicitly; do not substitute the application `DATABASE_URL`.
The temporary cluster from this run has been removed, so its old address is not
a running test service.

```powershell
$env:FOUNDATION_TEST_DATABASE_URL = "postgresql://TEST_ROLE:TEST_PASSWORD@TEST_HOST:TEST_PORT/postgres"
$env:BOOKING_TEST_DATABASE_URL = $env:FOUNDATION_TEST_DATABASE_URL
pnpm exec vitest run --configLoader native --no-cache --no-fsModuleCache --maxWorkers=4
pnpm exec tsc --noEmit --incremental false
```

Without those variables, the database checks skip by design. A green unit-only
run must not be reported as a repeat of the 519-test PostgreSQL-backed result.
