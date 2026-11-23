# Doctor guide

## Availability

Open `/doctor/availability`, configure recurring weekday sessions, capacity and
enabled state, then save. Times are Asia/Colombo local clinic times. Reload to
confirm persistence during manual verification.

## Consultation queue

1. Open the doctor dashboard (`/doctor`).
2. Wait for nurse intake to move an assigned visit to `intake_done`.
3. Open the consultation.
4. Move to **Clinical Notes** (`/doctor/notes`) and select the active encounter.
5. Save at least one clinical note.
6. Create a prescription if required.
7. Return to the queue and complete the consultation.

Completion is blocked until a note exists. The doctor must be assigned to the
appointment; unrelated records are hidden.

## Prescriptions

Each line uses either an active catalogue medicine or a typed medicine name, never
both. Typed medicines are labelled as outside the catalogue and are not dispensed
from hospital stock. Dosage, frequency, duration and quantity are manually entered;
Carely provides no clinical recommendation.

## Known limitation

The separate `/doctor/patients` page contains fixture patient/condition/allergy/
medication content. Do not use it as saved-record evidence. Use the active queue,
notes and prescription workflow for the current implementation.
