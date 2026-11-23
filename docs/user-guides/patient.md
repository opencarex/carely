# Patient guide

## Sign up and account recovery

1. Open `/signup`, enter your own synthetic/demo details, and submit.
2. Enter the email verification OTP before it expires.
3. Sign in at `/login`.
4. Use `/forgot-password` if recovery is needed.

Email delivery depends on configured SMTP/Mailpit. Do not claim the flow passed
until the message, expiry and reuse behavior are observed.

## Find and book a doctor

1. Open **Find a Doctor** (`/patient/book`).
2. Choose a visit reason. Carely shows active doctors in that reason's specialty.
3. Select a doctor, review open dates and remaining capacity, and choose a date.
4. Confirm the booking and keep the appointment UUID and number.

A no-match message means no active matching doctor is available; it is not medical
advice. Booking may fail if capacity or the clinic session changed since discovery.

## Appointments and queue

- **Appointments** shows only the signed-in patient's saved bookings. Cancel only
  when the button is available.
- **Live Queue** polls the signed-in patient's checked-in visit and shows position
  or workflow status. Reception must check the patient in first.

## Prescriptions and profile

- **Prescriptions** lists saved prescriptions and labels typed items as outside the
  catalogue. Those items must be obtained outside the hospital pharmacy.
- **Profile** edits only permitted patient fields. Email/account changes are not
  implied by every profile field.

## Known limitation

The main patient dashboard still contains a fixture-derived latest-prescription
card, pending count and static profile-status summary. Use the dedicated pages as
the source of truth.
