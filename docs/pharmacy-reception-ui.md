# Pharmacy and reception UI

The pharmacy and reception workspaces share the responsive Carely shell, but they
are not in the same integration state. The descriptions below distinguish live
API-backed screens from remaining prototype state.

## Pharmacy

| Route                     | Current behavior                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/pharmacy`               | Loads the medicine catalogue and usable stock totals from the pharmacy API; supports medicine creation/editing |
| `/pharmacy/stock`         | Receives stock batches and shows batch history, expiry and quantity                                            |
| `/pharmacy/prescriptions` | Finds a prescription by UUID, shows dispensing eligibility and performs full dispensing                        |

Stock is stored in `stock_batch` rows. Totals exclude expired batches. Full
dispensing consumes eligible catalogue stock transactionally, blocks shortages
and duplicate dispensing, and ignores typed outside-catalogue items. Partial
dispensing and stock requests are not implemented.

The active pharmacy pages do not mount `PharmacyDemoProvider`. Prototype provider
and workbench files may remain unused in the source tree; they are not the current
route implementation. The pharmacy layout still displays a hardcoded example
name rather than the authenticated user's name, so do not present that label as
identity verification.

Historical automated and browser evidence is recorded in
`docs/verification/pharmacy-p1.md` through `pharmacy-p4.md`. Those reports apply to
their stated revisions. The current permanent suite does not retain those
temporary feature cases.

## Reception

| Route                     | Current behavior                                       | Integration state                           |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `/reception/register`     | Search existing patients and create a walk-in patient  | API-backed                                  |
| `/reception/channeling`   | Select a patient, doctor and open date; book or cancel | API-backed                                  |
| `/reception/queue`        | Poll a selected doctor's current queue                 | API-backed read                             |
| `/reception/appointments` | Search and check in appointments                       | Still uses `ReceptionDemoProvider` fixtures |

The reception layout still mounts `ReceptionDemoProvider` and displays a hardcoded
example receptionist identity. The provider is currently required by the
appointments/check-in screen even though registration, channeling and queue views
use real APIs. Therefore the reception workflow must not be described as fully
fixture-free or fully verified end to end.

The server has real queue/check-in services and routes, but the active check-in
screen is not wired to them. Final release verification must use the implemented
server path and confirm the UI that will be demonstrated after all branches merge.

## Verification status

No new Docker, deployment, backup, SMTP or full six-role browser result is claimed
by this document. See [acceptance criteria](acceptance-criteria.md) and
[demo guide](demo-guide.md) for the remaining manual work.
