# Doctor availability

This feature originated on `feat/doctor-booking` for SCRUM-163. The recurring
weekly schedule is now part of the current application.

## Behavior

- `/doctor/*` requires a signed-in doctor and displays that user's name.
- `/doctor/availability` loads the saved schedule on the server and offers all seven weekdays. A failed load offers a retry through the GET API.
- Each weekday has at most one session: start time, end time, maximum patients, and an enabled toggle.
- Missing weekdays initially appear disabled with draft defaults of 09:00–12:00 and 10 patients. Loading the screen does not write these defaults.
- The form saves all seven weekdays together. Disabled days retain their settings and are saved with `is_active = false`.
- Saving persists the schedule. Reloading retrieves it again. Discard changes restores the last loaded or saved values.
- Times describe the clinic's local time in `Asia/Colombo`. Sessions must end later on the same day.

## API

Both methods use `/api/doctor/availability` and require the `doctor` role.
The doctor profile is resolved from the authenticated user's ID; a client cannot select a different doctor.
Missing profiles return `404`. Inactive doctors, banned users, and users whose database role is no longer `doctor` receive `403`.

`GET` returns all saved rules for that doctor, ordered Sunday (`0`) through Saturday (`6`):

```json
{
  "availability": []
}
```

`POST` accepts one to seven distinct weekdays. Only submitted weekdays are updated; omitting a weekday does not delete or disable it. Disable a day explicitly using `isActive: false`.

```json
{
  "sessions": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "12:00",
      "maxPatients": 10,
      "isActive": true
    }
  ]
}
```

The response contains the saved rows under `availability`, including their IDs and doctor ID. PostgreSQL returns times with seconds; the form displays hours and minutes.

Validation rejects invalid JSON, unknown fields (including supplied doctor IDs), duplicate weekdays, invalid `HH:MM` times, end times at or before start times, and capacities outside integer range 1–32,767. Invalid requests return `400` without writing.

One PostgreSQL upsert saves all submitted rules atomically using the existing `(doctor_id, day_of_week)` unique constraint. Existing row IDs are preserved so the future booking engine can lock those rows. This slice does not change the database schema or introduce migrations.

## Validation and manual review

The tests described by the original handover were removed during the approved
test cleanup. The current 16-test suite does not directly cover availability.
The walkthrough below is a procedure, not a recorded passing result.

To check the complete flow with the configured database:

1. Create and activate a doctor through admin staff management, then sign in as that doctor.
2. Open `/doctor/availability`. Enable Monday, set hours and capacity, and save.
3. Reload and confirm Monday's values persist.
4. Change the hours and discard changes; confirm the saved values return.
5. Disable Monday, save, and reload; confirm it stays disabled and retains its settings.
6. Try an end time earlier than the start and a capacity of zero; verify validation prevents saving.
7. Sign in as another doctor and confirm they have an independent schedule.
8. Verify signed-out API requests return `401`, and patient/reception/admin requests return `403`.

The [transactional booking service](booking-service.md), [open-date discovery API](open-dates.md), and [patient booking integration and cancellation](patient-ui.md) are now implemented. Active doctors with enabled sessions and remaining capacity can be booked through the patient portal.
