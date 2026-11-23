# Nurse guide

## Record intake

1. Open **Nurse Intake** (`/nurse/vitals`).
2. Select a waiting checked-in visit.
3. Enter at least one valid measurement.
4. Enter the initial complaint and nursing observations.
5. Submit once and wait for the saved confirmation.

Blood-pressure fields must be supplied together and systolic must exceed diastolic.
Other numeric limits are validation bounds, not clinical guidance.

## Drafts and handoff

Clinical drafts remain in the browser form only. Changing patient or leaving with
unsaved edits produces a warning. After successful submission, the visit leaves
the waiting nurse queue and a nurse-owned confirmation is available for that date.
The nurse cannot reopen general clinical history through the receipt.

## Access rules

Only active nurses can write intake. Missing/unrelated records return not-found
behavior and completed/wrong-state encounters reject further writes. Nurses do not
have general doctor-note, prescription, pharmacy or admin access.

The complete check-in-to-intake browser path remains part of final verification.
