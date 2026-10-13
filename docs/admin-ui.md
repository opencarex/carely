# Admin UI

The admin screens use the shared AppShell, PageTitle, Panel, Input, Select, Checkbox and Button components. Layouts stack on small screens and expand into columns or directory rows when space allows.

## Structure

```text
app/(authenticated)/admin/
  page.tsx                 # Dashboard layout and navigation actions
  staff/page.tsx           # Staff Management layout
  settings/page.tsx        # Hospital Details and Role Permissions layout
  audit/page.tsx           # Read-only Audit Trail layout
  doctor-finder/page.tsx   # Doctor Finder layout

components/admin/
  staff-directory.tsx         # Search, add and manage demo staff
  hospital-details-form.tsx   # Hospital details form
  role-permissions-form.tsx   # Editable role permission checkboxes
  doctor-reason-config.tsx    # Doctor selection and visit-reason assignments
  audit-trail.tsx             # Filters, event details and filtered CSV export

lib/mock/
  admin.ts                   # Demo staff, hospital details, permissions, reasons and audit events
```

Pages compose the UI. Interactive controls live in client components under the root components/admin folder. No local route component folder or admin state provider is needed. Existing page metadata remains in server modules; client components do not export server-only route settings.

## Demo behavior and future integration

This update adds UI behavior only. It does not add database reads, server actions, staff authentication provisioning, or permission enforcement.

- Staff edits, role permissions and Doctor Finder changes live in each component's React state. They reset on reload or when the component unmounts during navigation.
- Hospital details remain in the form during the current mount. Saving displays demo feedback; it does not update the shared hospital configuration or database.
- Adding a staff member adds a directory entry only; it does not create a working login account.
- Doctor Finder assignments do not yet change the patient-facing doctor search.
- Audit events are static fixtures. Filtering and event details are read-only; CSV export downloads the currently filtered fixture rows. These are not live security records.

When the backend is added, move validated record types into the schema/data layer, fetch initial values on the server, and replace demo save handlers with authorized server-side writes. Refresh the affected data after saving. Keep unsaved inputs and feedback local to the forms. Do not introduce a shared provider unless a concrete cross-page requirement remains.
