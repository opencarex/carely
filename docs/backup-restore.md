# Backup and restore rehearsal (SCRUM-196)

The backup and restore procedure remains **unverified**. Record a backup, a restore into a throwaway database, and the evidence below for SCRUM-196.

These PowerShell commands target the Compose-managed Carely database from [deployment.md](deployment.md). They do not back up the separate Supabase development database automatically. For that database, use an installed PostgreSQL client with its connection settings; use the same archive options and a separate, empty restore database. Select only the Carely `public` and Drizzle migration schemas, not Supabase's platform schemas.

Use PostgreSQL client tools matching the server major version (the reference Compose service is PostgreSQL 17). The archive includes application records, sessions and credentials; store it privately. `/backups/` is ignored by Git and Docker. The SQL checks below show counts and schema definitions, not patient values.

## Back up

Start from a running, migrated Compose installation and run from the repository root. Use a brief maintenance window: stop app writes before the dump and source counts, and ensure no other clients write in between. This helper stops at the first native command failure:

```powershell
function Invoke-CarelyCompose {
    & docker compose --env-file .env.docker @args
    if ($LASTEXITCODE -ne 0) { throw "Compose command failed; stop this procedure." }
}
New-Item -ItemType Directory -Force -Path backups | Out-Null
$backupStamp = Get-Date -Format yyyyMMddHHmmss
$backupPath = Join-Path (Resolve-Path backups).Path "carely-$backupStamp.dump"

Invoke-CarelyCompose stop app
Invoke-CarelyCompose exec -T postgres sh -c 'pg_dump --username=$POSTGRES_USER --dbname=$POSTGRES_DB --format=custom --no-owner --no-acl --schema=public --schema=drizzle --file=/tmp/carely-backup.dump'
Invoke-CarelyCompose cp postgres:/tmp/carely-backup.dump $backupPath
Get-FileHash -LiteralPath $backupPath -Algorithm SHA256
```

Use `pg_dump --file` plus `compose cp` to keep the custom-format binary intact, including on older Windows PowerShell versions. Do not redirect the binary archive through `>`.

With the app still stopped, capture source counts:

```powershell
$spotCheckSql = @'
SELECT 'users' AS table_name, count(*) AS rows FROM public."user"
UNION ALL SELECT 'patients', count(*) FROM public.patient
UNION ALL SELECT 'appointments', count(*) FROM public.appointment
UNION ALL SELECT 'medicines', count(*) FROM public.medicine
UNION ALL SELECT 'batches', count(*) FROM public.stock_batch
UNION ALL SELECT 'visit_reasons', count(*) FROM public.visit_reason
UNION ALL SELECT 'audit_events', count(*) FROM public.audit_log
UNION ALL SELECT 'migrations', count(*) FROM drizzle.__drizzle_migrations
ORDER BY table_name;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid='public.prescription_item'::regclass
AND conname='prescription_item_medicine_source_check';
SELECT tgname FROM pg_trigger
WHERE tgrelid='public.audit_log'::regclass AND NOT tgisinternal;
'@
$spotCheckSql | docker compose --env-file .env.docker exec -T postgres sh -c 'psql --username=$POSTGRES_USER --dbname=$POSTGRES_DB --set=ON_ERROR_STOP=1'
if ($LASTEXITCODE -ne 0) { throw "Spot-check query failed." }
Invoke-CarelyCompose start app
```

The `postgres` service stays running throughout. If a command fails while the app is stopped, investigate and restart it with `Invoke-CarelyCompose start app`. `pg_dump` itself takes a consistent snapshot; matching comparison counts also require that no other client writes in between.

## Restore only into a new throwaway database

The following creates a uniquely named test database. Do not substitute the live database name. Stop if `createdb` fails; never reuse an existing database for this rehearsal. Do not run migrations in the target before restoring the archive.

```powershell
$restoreDb = "carely_restore_$(Get-Date -Format yyyyMMddHHmmss)"
if ($restoreDb -notmatch '^carely_restore_[0-9]{14}$') { throw 'Unexpected restore database name.' }
Invoke-CarelyCompose exec -T postgres sh -c 'createdb --username=$POSTGRES_USER --template=template0 $1' sh $restoreDb
Invoke-CarelyCompose cp $backupPath postgres:/tmp/carely-backup.dump
Invoke-CarelyCompose exec -T postgres sh -c 'pg_restore --username=$POSTGRES_USER --dbname=$1 --clean --if-exists --no-owner --no-acl --exit-on-error --single-transaction /tmp/carely-backup.dump' sh $restoreDb
$spotCheckSql | docker compose --env-file .env.docker exec -T postgres sh -c 'psql --username=$POSTGRES_USER --dbname=$1 --set=ON_ERROR_STOP=1' sh $restoreDb
if ($LASTEXITCODE -ne 0) { throw "Spot-check query failed." }
```

`--clean` is used only in the freshly created throwaway database so existing default schema objects do not conflict with those in the archive. Source application records are not modified by this procedure. Compare every source/restored count and confirm the exactly-one medicine constraint and audit trigger are present.

After recording evidence, remove only that throwaway database:

```powershell
if ($restoreDb -notmatch '^carely_restore_[0-9]{14}$') { throw 'Unexpected restore database name.' }
Invoke-CarelyCompose exec -T postgres sh -c 'dropdb --username=$POSTGRES_USER $1' sh $restoreDb
```

## Evidence to complete the ticket

Record the date, PostgreSQL version, archive filename and SHA-256, successful `pg_dump`/`pg_restore` exit codes, the matching counts, and a screenshot showing the restored checks. Keep the archive private; attach only the count output and screenshot to the ticket. Actual results: **not run**.

References: [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).
