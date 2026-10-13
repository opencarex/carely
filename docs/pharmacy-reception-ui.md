# Pharmacy and reception UI

These screens follow the shared mobile-first AppShell and UI components used by nurse and admin. Pages compose layouts; interactive forms, lists and dialogs live in root components/pharmacy and components/reception folders. Mock data is kept in lib/mock/pharmacy.ts and lib/mock/reception.ts.

## Routes

| Role         | Route                   | UI                                                           |
| ------------ | ----------------------- | ------------------------------------------------------------ |
| Pharmacist   | /pharmacy               | Inventory with search and stock-edit dialog                  |
| Pharmacist   | /pharmacy/stock         | Stock selector, edit form, health and recent changes         |
| Pharmacist   | /pharmacy/prescriptions | Prescription search, review and full-dispensing confirmation |
| Receptionist | /reception/register     | Existing-patient lookup and walk-in registration             |
| Receptionist | /reception/channeling   | Patient selection and slot-booking confirmation              |
| Receptionist | /reception/appointments | Booking lookup and arrival/check-in confirmation             |
| Receptionist | /reception/queue        | Queue overview and queue-management dialog                   |

The hidden, out-of-scope Stock Requests design has been removed from pharmacy navigation and routes.

## Dialogs

components/ui/dialog.tsx uses the shadcn Dialog composition backed by the already installed Base UI primitives. Dialogs include a title, description and close control, trap focus while open, restore focus on close, dismiss with Escape, and scroll when content exceeds the viewport.

## Demo behavior

- PharmacyDemoProvider shares inventory and prescriptions between pharmacy pages. Stock edits update inventory and recent changes. Confirming a complete pending prescription reduces its medicine quantities and marks it dispensed once. Insufficient or expired stock blocks confirmation.
- ReceptionDemoProvider shares patients, bookings, doctor-slot availability and queues between reception pages. Registration creates a demo patient ID. Booking reserves a slot without entering a queue. Separate check-in creates one queue token; checked-in and cancelled bookings cannot be checked in again.
- Queue actions update the demo queue and its counts. Wait estimates and the initial data are fixtures, not live hospital readings. Booking dates use the Figma sample date, 12 October 2026.
- All edits remain in React memory while navigating within the same role layout. Reloading or leaving that role resets the session. The providers do not persist to localStorage or a database and do not sync to patient, nurse, doctor or admin screens.

## Temporary provider removal

The providers exist because these prototype workflows share state across several pages. They are not the intended persistence layer. Remove them once backend integration replaces all their current responsibilities:

1. Server-side reads load inventory, prescriptions, patients, bookings and queue entries.
2. Validated and authorized server-side writes handle stock changes, dispensing, registration, booking and check-in. Dispensing must update quantities and prescription status atomically; booking and check-in must prevent duplicates and assign IDs/tokens on the server.
3. URLs identify the selected patient, booking, medicine or doctor where selection must survive refresh/navigation.
4. Successful writes refresh affected screens; forms keep only drafts, validation and feedback in local state.

No backend fetching, server actions, real dispensing, clinical writes or audit persistence were added by this UI update.
