# Nurse UI and planned data integration

## Current UI structure

The nurse pages are client components for the UI prototype. They compose shared controls and focused nurse components; there is no database fetching or server action for nurse records yet.

```text
app/(authenticated)/nurse/
  layout.tsx                    # Shared AppShell and temporary provider
  page.tsx                      # Redirect to /nurse/vitals
  vitals/page.tsx                # Record Vitals layout
  preliminary-records/page.tsx   # Preliminary Records layout

components/nurse/
  vitals-form.tsx                # Measurements and demo save feedback
  preliminary-form.tsx          # Complaint, observations and demo save feedback
  patient-visit-picker.tsx       # Patient lookup and visit selection
  patient-context.tsx           # Condition, allergies and last-saved information
  nurse-workspace-provider.tsx  # TEMPORARY: selection and in-memory demo saves

lib/mock/
  nurse.ts                      # Demo patient and visit fixtures
```

## Temporary provider

`NurseWorkspaceProvider` preserves the selected patient, selected visit, and demo saves when navigating between the two nurse screens. Records are kept only in React memory. A full page reload clears saves; they are not written to a database or browser storage.

This is temporary support for the interactive prototype, not the intended persistence architecture.

## Planned structure after data integration

The following files and server responsibilities are planned, not implemented by the UI reorganization:

```text
app/(authenticated)/nurse/
  layout.tsx                    # Shared shell; provider removed
  page.tsx                      # Default nurse entry
  vitals/page.tsx                # Server page: fetch visit data and compose UI
  preliminary-records/page.tsx   # Server page: fetch visit data and compose UI

components/nurse/
  vitals-form.tsx                # Client form
  preliminary-form.tsx          # Client form
  patient-visit-picker.tsx       # Client search and selection
  patient-context.tsx           # Display fetched patient information

lib/
  data/nurse.ts                 # Server-only database reads
  actions/nurse.ts              # Authorized, validated server-side saves
  schemas/nurse.ts              # Input validation
  mock/nurse.ts                 # Demo fixtures only where still needed
```

## Provider removal conditions

Remove `nurse-workspace-provider.tsx`, its layout wrapper, and `useNurseWorkspace` consumers once all of the following are implemented:

- The URL identifies the selected patient and visit, and refresh or navigation restores the selection.
- Server-side reads load patient context and saved records for that visit.
- Authenticated and authorized server-side writes persist vitals and preliminary records, with validation and success/error feedback.
- Forms keep unsaved inputs, validation errors, and save status in local state, and display refreshed saved data after a successful write.

Move the shared record types to the data/schema layer before deleting the provider. The forms currently import `VisitRecord` from that file.

The migration is complete when selection survives a reload, saves remain available after a reload, and navigating between both nurse screens no longer requires the provider. Do not remove it before its current responsibilities have replacements.
