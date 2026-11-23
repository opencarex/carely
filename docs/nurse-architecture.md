# Nurse intake interface

The nurse workspace now uses the PostgreSQL-backed intake APIs rather than a
temporary provider or fixture records. The signed-in nurse's actual name appears
in the application shell, and the layout redirects other roles to their own
workspaces.

## Selection and saving

`/nurse/vitals?encounterId=<UUID>` identifies the selected visit. The server loads
today's authorized waiting queue, and the client refreshes it with the existing
visibility-aware polling hook. Search matches patient name, patient number or
appointment number. Selection is restored on reload while the visit is still
waiting. Clinical drafts stay only in the form; no draft data is placed in browser
storage or URL parameters. Changing the selected patient prompts before discarding
unsaved changes. Closing/reloading the tab or following an application link also
warns about unsaved input.

Vitals and preliminary records are sections of one form, because intake saving
and handoff must be atomic. The previous preliminary-records URL redirects to
the preliminary section of this form, preserving an encounter selection. The
nurse navigation has one Nurse Intake entry.

Numeric fields convert to typed values and pass through the same Zod contract
as the server. Optional additional measurements have bounded name/value rows.
Both initial complaint and nursing observations are required. Validation messages
use form labels, and an API failure retains the current draft whenever the visit
remains in the waiting queue. Pending saves and selection changes disable the form
and selector. A ref prevents simultaneous submits.

Saving sends one `POST /api/encounters/:id/intake`. The server writes vitals and
preliminary notes, records authors/timestamps, advances the queue and writes audit
events in one transaction. On success, the form closes and the URL becomes
`/nurse/vitals?receipt=<encounter UUID>`.

## Access after handoff

The owner selected **waiting-only nurse access with a saved confirmation** for
this implementation. This replaces the earlier prototype plan for nurses to
reopen saved clinical values after handoff.

The server verifies a receipt using the current nurse's `intake.recorded` audit
event and today's appointment date. The receipt returns only the encounter ID
and recording timestamp. It exposes neither patient details nor clinical values,
doctor notes, prescriptions or general audit history. Another nurse's receipt
and a receipt for another date return 404. A forged query parameter cannot make
the page claim a successful save. Confirmation remains available after reload
on the appointment date.

The old provider, its wrapper, dependent `VisitRecord` types and nurse fixture
file were removed. Request, queue and receipt types live in `lib/schemas/intake.ts`.
All current nurse screens are free of mock patients, diagnoses and allergy fields.

## Main files

- `components/nurse/intake-workspace.tsx`: selection, draft, submission and receipt UI.
- `components/nurse/vitals-form.tsx`: typed measurements and optional extra rows.
- `components/nurse/preliminary-form.tsx`: complaint and observations fields.
- `components/nurse/patient-context.tsx`: current waiting visit context.
- `lib/intake-form.ts`: form conversion and shared validation messages.
- `lib/services/intake.ts`: waiting queue, own-action receipt and atomic save.

See [Nurse intake APIs](nurse-intake.md) for the input contract and database test
requirements. Frontend unit coverage verifies form conversion, selection reload,
receipt verification and rendered states. A browser/database walkthrough remains
part of SCRUM-191.

The older Task 6 and [SCRUM-191](verification/scrum-191.md) counts are historical
evidence for their stated revisions. The approved cleanup replaced those suites
with 16 permanent focused tests; current coverage is listed in [testing](testing.md).
The cross-track browser walkthrough remains pending.
