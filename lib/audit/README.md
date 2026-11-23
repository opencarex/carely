# Audit contract

Keep action names in the feature modules under [`actions/`](actions/). Derive the actor from the server session. Write the domain change and the audit event inside the same transaction, passing the transaction to [`recordAudit`](../services/audit.ts).

```ts
await db.transaction(async (tx) => {
  // Validate the actor and write the domain change with tx.
  await recordAudit(tx, {
    actorId: actor.userId,
    action: patientActions.updated,
    targetType: "patient",
    targetId: patientId,
    metadata: { changedFields: ["phone"] },
  });
});
```

The [audit schema](../schemas/audit.ts) permits structural metadata such as changed field names, roles, statuses, and counts. Keep patient values, clinical text, submitted email addresses, credentials, and raw session tokens out of audit metadata. The authentication adapter keeps session creation and sign-out audit writes atomic. Failed sign-ins record anonymous events without the submitted email address.

The administrative read endpoint is `GET /api/admin/audit`. PostgreSQL protects audit rows with an append-only trigger. Apply [migrations](../../drizzle/) with `pnpm db:migrate` so the SQL trigger is installed.

To verify the trigger in a test database, use the application role and run the [retention check](../../scripts/verify-audit-retention.sql). The script inserts a synthetic audit row, checks that updates and deletes fail, and rolls back.

```powershell
psql "$env:DATABASE_URL" -f scripts/verify-audit-retention.sql
```

## Historical migration note

The Sprint 5 foundation migration `0004_sprint5_lead_foundation.sql` was verified on the project database on 17 November 2026. The one-time seed added 10 medicines, 10 batches, and six visit reasons without adding patients or prescriptions. Fresh installs use the migration baseline, and the seed implementation was retired. A legacy `0001` ledger hash differed from the checked-in SQL during that check. The old migration was left in place, and the new migration was verified independently.

See the [workflow reference](../../docs/workflows.md) and [recovery plan](../../docs/Carely%20Overdue%20Sprint%20Recovery%20Plan.md).
