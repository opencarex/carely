# Nurse intake APIs (SCRUM-145)

This document began as the `feat/intake-consultation` API handover. The described
intake route and service are present in the current application.

## Implemented: GET /api/nurse/queue

The endpoint requires a nurse session and rechecks the current database account's
role and deactivation status. It needs no query parameters: today is calculated
on the server using `Asia/Colombo`.

The response is `{ entries: NurseQueueEntry[] }`, defined in
`lib/schemas/intake.ts`. Each entry contains the queue ID, encounter ID, appointment
ID and unchanged appointment number, check-in timestamp in ISO format, doctor ID
and name, and patient ID, patient number and name. An empty queue returns
`{ entries: [] }`. No clinical history, notes, prescriptions or contact details
are included.

Entries must have a booked appointment dated today, a waiting queue entry and an
in-progress encounter. They are ordered by check-in timestamp, then queue ID.
Both successful and error responses use `Cache-Control: no-store`.

The route returns 401 without a session, 403 for other roles or an unavailable
account, and a generic 500 response for unexpected failures. It does not write
records or advance workflow state.

## Implemented: POST /api/encounters/:id/intake

Only an active nurse may submit intake for today's booked, checked-in appointment
while the queue entry is `waiting` and the encounter remains in progress. The
encounter UUID comes from the URL, and author IDs and timestamps come from the
server. Other roles receive 403, missing encounters receive 404, and encounters
outside the writable workflow receive 409. Repeated saves after handoff return
409 rather than creating duplicate records.

Example request body:

```json
{
  "vitals": {
    "bpSystolic": 128,
    "bpDiastolic": 82,
    "heartRate": 82,
    "respiratoryRate": 18,
    "temperatureC": 36.9,
    "spo2": 97,
    "weightKg": 68.3,
    "heightCm": 170.5,
    "additional": { "glucose": 5.4, "fasting": false }
  },
  "complaint": "Initial complaint text",
  "preliminaryNote": "Nursing observations"
}
```

At least one measurement and both text fields are required. Unrecorded typed
measurements may be omitted or null. Complaint and preliminary-note text are
trimmed and limited to 2,000 and 5,000 characters respectively. Blood pressure
requires both values, with systolic greater than diastolic. All request objects
have strict fields; callers cannot supply authors, timestamps or workflow state.

Prototype input bounds are listed below. These are validation limits, not normal
ranges or clinical guidance; the API performs no clinical scoring.

| Measurement        | Accepted values                    | Unit        |
| ------------------ | ---------------------------------- | ----------- |
| Systolic pressure  | Integer 20–300                     | mmHg        |
| Diastolic pressure | Integer 10–200                     | mmHg        |
| Heart rate         | Integer 1–300                      | beats/min   |
| Respiratory rate   | Integer 1–100                      | breaths/min |
| Temperature        | 25–45, at most one decimal place   | °C          |
| SpO2               | Integer 0–100                      | %           |
| Weight             | 0.1–500, at most one decimal place | kg          |
| Height             | 10–300, at most one decimal place  | cm          |

Additional measurements accept at most 20 keys and 4,096 serialized UTF-8 bytes.
Keys start with a letter and contain letters, digits or underscores, with a
40-character limit. Values are finite numbers, booleans, null, or non-empty strings
of at most 200 characters; nested structures are rejected. Reserved identity,
allergy, prototype and fixed-measurement keys are rejected. Empty measurements or
null-only extras cannot complete intake.

The service uses the shared appointment → encounter lock order. It inserts one
vitals record and one preliminary-note record, transitions `waiting → intake_done`
through `transitionQueueEntry`, and records `intake.recorded` in the same
transaction. The queue helper also writes `queue.status_changed` in that
transaction. Audit metadata contains no clinical values. The complaint and note
are stored together in `preliminary_note.content` under explicit text labels;
no schema changes are needed. The encounter remains in progress for the doctor.

Success returns 201 with `{ intake: RecordedIntake }`: encounter and queue IDs,
`status: "intake_done"`, saved vitals/note IDs, and the ISO recording timestamp.
No clinical text is echoed in the acknowledgement. Malformed JSON, invalid UUIDs
and invalid bodies return 400; cross-origin writes return 403. All responses use
`Cache-Control: no-store`. Unexpected failures return a generic 500 response and
are logged without database-error details or clinical values.

## Verification boundary

The unit and integration files named in the original handover were removed during
the approved cleanup. The current permanent suite does not directly exercise the
full nurse API. Historical PostgreSQL evidence is recorded in
[SCRUM-191](verification/scrum-191.md), while the current browser journey remains
pending. See [testing](testing.md) and the [demo guide](demo-guide.md).
