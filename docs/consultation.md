# Consultation API (SCRUM-144)

This document began as the `feat/intake-consultation` handover. Consultation,
clinical-note and prescription routes now coexist in the current application.

## Implemented: open a consultation

`POST /api/doctor/queue/:entryId/open` accepts an empty body or `{}`. The entry ID
must be a UUID. All JSON body fields are rejected: the caller cannot choose a
doctor, a timestamp, or a target status. Session authentication supplies the actor.
Cross-origin writes are rejected, and every response uses `Cache-Control: no-store`.

The service requires a current active doctor account and active doctor profile
assigned to the appointment. The appointment must be booked for today in
`Asia/Colombo`, the checked-in encounter must be in progress, and the queue entry
must be `intake_done`.

The service locks appointment → encounter → queue, then calls
`transitionQueueEntry` with the same transaction to change `intake_done` to
`with_doctor`. That helper sets `queue_entry.called_at` using server time and
writes `queue.status_changed`. The service writes `consultation.opened` against
the encounter in the same transaction. Its audit metadata contains only the old
and new statuses. If any part fails, the state, timestamp and audits roll back.

Opening checks `intake_done` itself; it cannot call `assertEncounterWritable`
before opening because that helper expects the doctor to be in `with_doctor`.
The encounter remains in progress, preserving its original `started_at`, and
appointment numbers and check-in timestamps remain unchanged. Reopening an
already-open visit returns a conflict. No limit of one active visit per doctor
is imposed; the sprint plan treats that rule as optional hardening.

Success returns 200:

```json
{
  "consultation": {
    "encounterId": "<encounter UUID>",
    "queueEntryId": "<queue UUID>",
    "status": "with_doctor",
    "calledAt": "<ISO timestamp>"
  }
}
```

Errors:

- 400: invalid queue UUID, malformed JSON, or unsupported body fields.
- 401: no authenticated session.
- 403: wrong role, unavailable current account, or cross-origin write.
- 404: missing entry/appointment, an unrelated doctor, an inactive doctor profile,
  or a cancelled appointment (excluded by the shared treating-doctor policy).
- 409: wrong queue phase, missing checked-in encounter, completed encounter,
  a non-booked or non-today appointment otherwise accessible to the doctor,
  or a concurrent transition conflict.
- 500: unexpected failure; response and logs omit database-error details.

## Implemented: complete a consultation

`POST /api/encounters/:id/complete` accepts an empty body or `{}`. The encounter
ID must be a UUID. Body fields are rejected, including supplied note IDs, actors,
timestamps and status values. The endpoint requires a doctor session and rejects
cross-origin writes. All responses use `Cache-Control: no-store`.

The service calls `assertEncounterWritable` inside its transaction. That helper
rechecks the live account, assigned active doctor, today's booked appointment,
in-progress encounter and `with_doctor` queue state. It holds the appointment and
encounter locks through the rest of the transaction, matching the contract for
every clinical-note and prescription writer.

Completion requires at least one existing `clinical_note` for that same encounter.
The query reads only its ID; note content does not appear in the response, audit
metadata or error logs. The note-creation service and API are now implemented;
the completion service reads the shared clinical-note table.

In the same transaction, completion:

1. Changes the encounter from `in_progress` to `completed` and sets `ended_at`
   using server time, with a conditional update to reject a stale state.
2. Calls `transitionQueueEntry` with that transaction to move `with_doctor` to
   `completed` and record `queue.status_changed`.
3. Records `consultation.completed` against the encounter, with the session
   doctor as actor and only the old/new statuses in metadata.

The completion actor is stored in the audit record, as specified by the ERD.
No new schema columns are needed. Existing appointment status, appointment number,
encounter start time, check-in time and called-at time are preserved. A failure
in the queue transition or either audit write rolls the entire completion back.

Success returns 200:

```json
{
  "consultation": {
    "encounterId": "<encounter UUID>",
    "queueEntryId": "<queue UUID>",
    "status": "completed",
    "endedAt": "<ISO timestamp>"
  }
}
```

Errors follow the authentication, origin and validation conventions above. An
unrelated doctor, inactive profile, missing encounter or cancelled appointment
returns 404 through the shared policy. A missing clinical note returns 409 with
`CLINICAL_NOTE_REQUIRED`; completed encounters return 409 with
`ENCOUNTER_COMPLETED`. Wrong workflow phase, non-today/non-booked appointments,
or conditional update/transition conflicts also return 409. Repeated completion
requests cannot change the end time or insert additional audit events.

After commit, `assertEncounterWritable` rejects further intake, clinical-note
and prescription writes with 409. The current note and prescription writers use
that shared writable-encounter contract.

## Connected doctor controls

The `/doctor` dashboard now renders the live consultation queue. It polls
`GET /api/doctor/queue`, which derives the active doctor profile from the session
and returns only that doctor's booked, checked-in visits dated today. Rows include
encounter and queue IDs, patient identification, queue status and a boolean for
whether a clinical note exists. Note text is not returned by this endpoint.

The dashboard offers opening only in `intake_done` and completion only in
`with_doctor`. Completion stays disabled until a clinical note exists. State
changes call the open/complete APIs above, disable controls while pending and
refresh the queue on success or failure. Polling errors disable actions until a
fresh read succeeds. Waiting and completed entries have no transition controls.

Doctor clinical-note and prescription creation are connected to active
consultations. Record-review routes also exist. The separate `/doctor/patients`
page still contains fixture clinical content and must not be used as evidence.

## Current verification boundary

The permanent suite retains focused consultation open/completion tests. The
[SCRUM-191 report](verification/scrum-191.md) records a historical 519-test run
for its stated revision; those tests are no longer present in the retained suite.
The complete browser workflow remains pending. Follow the manual sequence in the
[demo guide](demo-guide.md) and record actual results rather than treating this
implementation description as verification evidence.
