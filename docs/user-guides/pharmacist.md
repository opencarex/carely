# Pharmacist guide

## Medicine catalogue

Open `/pharmacy` to load real medicines and usable stock totals. Create or edit a
medicine with name, form, strength and active state. Inactive medicines cannot be
used for new catalogue prescriptions or stock receipt as allowed by service rules.

## Receive stock

1. Open `/pharmacy/stock` and select a medicine.
2. Enter batch number, expiry date and whole quantity.
3. Submit and review batch history.

Usable totals include unexpired batches; stock expiring today is eligible. There
is no stock-request workflow.

## Dispense

1. Open `/pharmacy/prescriptions`.
2. Enter the prescription UUID.
3. Review items and eligibility.
4. If **Ready to dispense**, confirm full dispensing.

Insufficient stock disables dispensing and names short catalogue medicines.
Typed items show “outside catalogue” and do not consume stock. A typed-only
prescription has nothing to dispense. Repeated dispensing must be blocked.

The pharmacy shell currently displays a hardcoded example pharmacist name; it is
not proof of the authenticated identity. Use server authorization results during
verification.
