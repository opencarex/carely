# Recovery traceability

This table maps recovery work to current repository locations. Jira status must be
checked in Jira; this repository does not prove ticket closure.

| Work item                         | Current implementation/evidence                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| SCRUM-155/158 catalogue and stock | `lib/services/stock.ts`, pharmacy medicine/batch routes and UI; historical P1 evidence             |
| SCRUM-157 dispensing              | `lib/services/dispensing.ts`, dispense route and pharmacy reader; historical P2 evidence           |
| SCRUM-151/152/P4 prescriptions    | `lib/services/prescription.ts`, doctor/patient/pharmacist routes and UI; historical P3/P4 evidence |
| SCRUM-168/169 specialties/reasons | `lib/services/specialty.ts`, `visit-reason.ts`, admin routes/config UI                             |
| SCRUM-170 reason-based finder     | patient doctor-finder route, booking browser and visit-reason booking field                        |
| SCRUM-189 settings                | `lib/services/settings.ts`, admin settings route/form                                              |
| SCRUM-171 audit catalog           | per-feature audit action files and transactional callers; final manual catalog check pending       |
| SCRUM-172 audit screen            | admin audit route, query service and screen; C1 evidence below                                     |
| SCRUM-173 deployment              | Docker/Compose files and `deployment.md`; runtime verification pending                             |
| SCRUM-196 backup/restore          | `backup-restore.md`; execution pending                                                             |
| SCRUM-197 documentation           | SRS, use cases, architecture, UI figures, acceptance, install and role guides in `docs/**`         |
| SCRUM-198 demo/viva               | `demo-guide.md`, `presentation.md`, `viva-rehearsal.md`; live rehearsal pending                    |
| SCRUM-194 final verification      | Recovery-plan section 9 and acceptance matrix; not completed                                       |

## Current automated evidence

- Permanent suite: 16 tests in 7 files; current coverage is in `testing.md`.
- C1/C2 temporary evidence: `verification/audit-c1-c2.md`.
- Pharmacy temporary/browser evidence: `verification/pharmacy-p1.md` through `pharmacy-p4.md`.
- Queue-to-consultation historical PostgreSQL evidence: `verification/scrum-191.md`.

Historical reports apply only to their named revisions. Removed tests are not
current regression protection.

## Repository references

- Recovery requirements: `docs/Carely Overdue Sprint Recovery Plan.md`
- Database migrations: `drizzle/`
- Route handlers: `app/api/`
- Services: `lib/services/`
- Validation: `lib/schemas/`
- Role navigation: `lib/config/navigation.ts`
- Environment examples: `.env.example`, `.env.docker.example`

No Jira URLs are stored in the repository. Add links to tickets in Jira/PR evidence,
not guessed URLs in these documents.
