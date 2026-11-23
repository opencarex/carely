# Receptionist guide

## Register or find a patient

1. Open `/reception/register`.
2. Search by patient number, phone or name before creating a record.
3. Review any duplicate warning.
4. Enter only the supported demographic/contact fields and submit.

Walk-in records may have no portal account. Government identity numbers are not
collected in the committed scope.

## Channel a patient

1. Open `/reception/channeling` and select/search the patient.
2. Choose a doctor and an open clinic date.
3. Confirm the assisted booking and record its UUID/number.
4. Use the cancellation action only if the booking policy allows it.

## Review queues

Open `/reception/queue`, select a doctor and review today's checked-in entries.
The view polls the real queue API and does not allow manual reordering.

## Check-in limitation

The active `/reception/appointments` screen still uses `ReceptionDemoProvider`
fixtures. Although a real server check-in route/service exists, this screen is not
valid release evidence until wired and verified. The reception shell also displays
a hardcoded example identity. Disclose this limitation during rehearsal.

Receptionists must receive 403 on clinical and pharmacy routes during final checks.
