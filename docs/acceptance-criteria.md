# Acceptance criteria and release status

Status terms:

- **Code present:** implementation exists in the current repository.
- **Evidence recorded:** a linked test report exists for a stated revision.
- **Pending manual:** no final browser/deployment result is claimed.

| Area           | Acceptance criterion                                                         | Current evidence                                                  | Remaining work                                   |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Authentication | Patient verification, staff claim, reset, role redirect, deactivation        | Code present; focused auth/guard tests in 16-test suite           | Real SMTP single-use/expiry walkthrough          |
| Doctor finder  | Reason maps to one specialty; only active matching doctors; no-match message | Code present                                                      | Final browser journey                            |
| Booking        | Capacity-safe booking, visit reason saved, ownership and cancellation        | Code present; focused booking/access tests                        | Combined PostgreSQL/browser run                  |
| Reception      | Search/register, assisted booking, check-in, queue                           | Server paths present; registration/channeling/queue UI API-backed | Remove/replace demo check-in UI and verify       |
| Nurse          | Intake values and notes saved atomically; handoff and audit                  | Code present; historical SCRUM-191 evidence                       | Current combined browser run                     |
| Doctor         | Open, note, prescribe, complete; no late writes                              | Code present; focused consultation tests                          | Doctor patient page fixture cleanup; browser run |
| Pharmacy       | Catalogue, batches, eligibility, full dispense, rollback/double-block        | Code present; historical P1-P4 evidence                           | Final combined browser run                       |
| Settings       | Four fields persist                                                          | Code present                                                      | Reload and email-name manual check               |
| Audit          | Catalog writes, admin filters/paging, no patient values, append-only         | C1/C2 evidence recorded; code present                             | Complete catalog/database/manual inspection      |
| Deployment     | Fresh Compose install                                                        | Files and instructions prepared                                   | Not run                                          |
| Backup         | Dump, throwaway restore, matching checks                                     | Procedure prepared                                                | Not run                                          |
| Release        | Six-role journey and known limitations attached to SCRUM-194                 | Not completed                                                     | Run section 9 recovery checklist                 |

## Known UI limitations

- Admin dashboard metrics/recent activity are fixtures.
- Patient dashboard latest-prescription/count/profile summaries contain fixture/static content.
- Doctor patient-profile page contains fixture clinical data.
- Reception appointments/check-in screen uses `ReceptionDemoProvider`.
- Reception and pharmacy shells display hardcoded example identities.

These limitations block a claim that every screen is fixture-free. They are not
new feature requests; final verification should either fix release-blocking cases
within the responsible track or record them as known limitations.

## Evidence rules

Do not convert implementation presence into a “passed” result. Record the command,
revision, date, counts and synthetic cases for automated runs. Record screenshots
and observed results for manual checks. Docker, backup/restore and SMTP remain
pending until actually executed.
