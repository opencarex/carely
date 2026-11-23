# Carely use cases

These use cases describe current web scope. “Expected” means required behavior,
not a recorded manual pass.

## UC-01 Patient registers and books

**Actor:** Patient. **Preconditions:** visit reasons, matching active doctor and
availability exist.

1. Register, verify email and sign in.
2. Select a visit reason.
3. Review matching doctors and open dates.
4. Select a date and submit the booking.
5. View the saved appointment number and confirmation.

Alternates: no active doctor returns a plain no-match message; full/closed sessions
are rejected; foreign patient records are not exposed.

## UC-02 Reception registers and channels a walk-in

**Actor:** Receptionist.

1. Search by patient number, phone or name.
2. If needed, register a walk-in after reviewing duplicate warnings.
3. Select a doctor and open clinic date.
4. Create the assisted booking.

The registration and channeling screens are API-backed. The separate appointments
and check-in screen still uses fixture state and is not final browser evidence.

## UC-03 Reception checks in a patient

**Actor:** Receptionist. **Precondition:** today's booked appointment.

1. Find the appointment.
2. Check in once.
3. Confirm a queue entry and encounter exist.
4. Review the doctor queue.

The server path exists; active UI wiring and the browser flow require final
verification after fixture cleanup.

## UC-04 Nurse records intake

**Actor:** Nurse. **Precondition:** waiting checked-in encounter.

1. Select a waiting patient.
2. Record validated vitals, complaint and observations.
3. Submit once.
4. Receive a nurse-owned confirmation while the queue advances to `intake_done`.

Failures leave clinical and queue state unchanged.

## UC-05 Doctor consults and prescribes

**Actor:** Assigned doctor. **Precondition:** intake complete.

1. Open the consultation from the doctor queue.
2. Review relevant encounter context.
3. Record an append-only clinical note.
4. Create a prescription using catalogue and/or typed medicine names.
5. Complete the consultation after a note exists.

An unrelated doctor receives record-not-found behavior. Completed encounters reject
later guarded notes/prescriptions.

## UC-06 Pharmacist receives and dispenses stock

**Actor:** Pharmacist.

1. Create/edit a medicine or select an existing medicine.
2. Receive a batch with number, expiry and quantity.
3. Find an issued prescription by UUID.
4. Review ready/short/dispensed/nothing-to-dispense state.
5. Confirm full dispensing.

Short stock or a repeated request returns conflict without partial changes. Typed
outside-catalogue items are shown but do not consume stock.

## UC-07 Admin configures Carely

**Actor:** System admin.

1. Create/maintain staff and send/resend an invitation.
2. Maintain specialties, doctor specialty and visit-reason mappings.
3. Save hospital name, address, phone and email.
4. Review audit events by user, action and date range.

The old custom role-permission editor is excluded.

## UC-08 Password recovery and staff claim

**Actors:** Patient or invited staff member.

1. Request or open the appropriate email flow.
2. Use the OTP/link before expiry.
3. Set a password and sign in.
4. Reuse/expired attempts are rejected.

Real SMTP execution remains a manual verification item; prepared Mailpit/Docker
instructions are not evidence that this use case passed.
