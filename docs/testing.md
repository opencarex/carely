# Minimal test suite

The suite was reduced from 594 cases (505 passed and 89 database cases skipped) to **16 runnable tests in 7 files**, at the user's explicit request on 17 November 2026. There are no skipped cases. The reduction was brought forward before teammate features merged.

## Run

```powershell
pnpm test
```

Watch while editing with `pnpm test:watch`. No database, Docker, SMTP service or environment file is required. The test configuration uses Node's native config loader and thread workers so the same command also runs in the restricted Windows workspace.

## What each test proves

| #   | File                                                                                 | What it proves and why it matters                                                                                                                  |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [auth-guard](../tests/unit/auth-guard.test.ts)                                       | A banned user is rejected by both shared guards, so a disabled account cannot keep using protected features.                                       |
| 2   | auth-guard                                                                           | Anonymous users and the wrong role are rejected while the correct role is allowed, protecting role-specific features.                              |
| 3   | [patient-access](../tests/unit/patient-access.test.ts)                               | A patient can access their own patient record, keeping legitimate access available.                                                                |
| 4   | patient-access                                                                       | A patient is denied access to someone else's record, protecting patient privacy.                                                                   |
| 5   | [booking-service](../tests/unit/booking-service.test.ts)                             | An available clinic place receives the next appointment number, confirming normal booking works.                                                   |
| 6   | booking-service                                                                      | A full clinic returns 409 without inserting a booking, preventing capacity from being exceeded through this service path.                          |
| 7   | [consultation-open-service](../tests/unit/consultation-open-service.test.ts)         | A treating doctor opens an intake-complete visit with shared locks, handoff and audit, keeping the consultation transition together.               |
| 8   | consultation-open-service                                                            | A waiting visit cannot open before intake is finished, preventing a skipped workflow step.                                                         |
| 9   | [consultation-complete-service](../tests/unit/consultation-complete-service.test.ts) | A visit with a clinical note updates its encounter, queue and audit in the supplied transaction, keeping completion consistent.                    |
| 10  | consultation-complete-service                                                        | A visit without a clinical note makes no completion writes, preventing incomplete consultations from closing.                                      |
| 11  | [staff-audit](../tests/unit/staff-audit.test.ts)                                     | Creating staff writes its audit event in the same transaction before invitation dispatch, checking that a real write path creates an audit record. |
| 12  | staff-audit                                                                          | A non-admin cannot create staff, write an audit event or send an invitation, preventing unauthorized provisioning.                                 |
| 13  | [auth-audit](../tests/unit/auth-audit.test.ts)                                       | Successful sign-in records the actor/session ids without credentials, keeping the login trace useful and private.                                  |
| 14  | auth-audit                                                                           | Failed credentials create an anonymous event without a session or submitted email, tracing failures without exposing account data.                 |
| 15  | auth-audit                                                                           | Logout revokes and audits a session once even when retried, keeping logout safe to repeat.                                                         |
| 16  | auth-audit                                                                           | A failed audit insert rolls back a newly created session in the test transaction, checking the authentication failure path.                        |

## Scope and deliberate omissions

These focused behavior checks call the real guards and services. Database queries and transaction callbacks use small doubles; auth-audit uses real Better Auth HTTP dispatch with its in-memory adapter. They do not prove PostgreSQL locking, transaction rollback, concurrency or the complete browser journey. The patient checks exercise the access policy, and the workflow checks exercise consultation handoff/completion rather than the entire queue/intake journey.

Schema-only unit checks, snapshots, UI-rendering checks and the opt-in database suites were intentionally removed to keep the viva suite small. Historical verification results and retired commands in older feature documents refer to the earlier suite. The current command and coverage are the ones listed here.

## Temporary tests for teammate features

At the user's request, each teammate creates focused temporary feature tests, runs them alongside the 16 core tests, records the tested revision/command/date/results in the PR or Jira ticket, then deletes only their temporary test files and fixtures after successful runs. Fix failures before cleanup; skipped tests are not passing evidence. Run `pnpm test` again after deletion. Keep the 16 core tests and Vitest configuration. Removed temporary checks provide evidence of that revision only; recreate relevant checks when changing the feature later.

The dispensing checks cover successful dispensing, insufficient-stock rollback, duplicate requests and competing prescriptions. See the [SCRUM-157 verification record](verification/pharmacy-p2.md). The full six-role journey remains part of the manual release checks after the features merge. Tests are already excluded from the Docker build context, so test cleanup does not shrink the deployed app.

C1/C2 audit filter, paging, authorization and transactional event evidence is
recorded in [audit verification](verification/audit-c1-c2.md). Those temporary
tests were removed and are not part of the 16-test regression suite.

Result after cleanup: `pnpm test` - **16 passed, 0 skipped**. No database or Docker command was run for this cleanup.
