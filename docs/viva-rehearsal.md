# Viva rehearsal

Use this as a question bank and responsibility check. Rehearsal has not yet been
recorded as completed.

## Core questions

**Why one web application?** The recovery scope prioritizes one deployable,
role-based system. Native mobile/offline PWA behavior is excluded.

**Where is authorization enforced?** Route handlers call shared session/role
guards; services recheck active accounts and record-level policies. UI hiding is
not a security control.

**Why 404 instead of 403 for some records?** To avoid revealing that another
patient's appointment, clinical record or prescription exists.

**How is overbooking prevented?** Booking locks the doctor's recurring availability
row, rechecks date/time/capacity and allocates the next appointment number inside a
transaction.

**How is dispensing safe?** The service locks/rechecks the prescription, consumes
eligible earliest-expiry batches conditionally, and updates dispense/status/audit
in one transaction. Any shortage rolls back the operation.

**Why typed medicines?** A doctor can prescribe an item outside the hospital
catalogue. It is shown to patient/pharmacist but is not dispensed from stock.

**How is audit privacy protected?** Per-feature actions record actor/action/target
and structural metadata only. Patient values and clinical text are excluded.

**Why only 16 permanent tests?** The user explicitly requested a reduced suite.
Feature tests are temporary evidence for a revision and must be recreated for later
changes. Manual/PostgreSQL risks remain.

**What is not verified?** Fresh Docker install, backup/restore, real SMTP and the
final combined six-role browser journey.

## Teammate 3 focus

- Explain `GET /api/admin/audit`, filters, pagination and admin authorization.
- Explain patient registration/booking/cancellation audit transaction boundaries.
- Identify remaining fixture screens without overstating completion.
- Point to exact evidence and revision rather than quoting retired suite totals as current.

## Rehearsal checklist

- Each teammate explains one success and one failure path.
- Practice the demo with synthetic accounts and a reset plan.
- Confirm who controls each role/session during the demo.
- Prepare for network/email/database failure without fabricating success.
- State the Next.js security advisory and pending deployment checks honestly.
