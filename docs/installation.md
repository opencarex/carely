# Installation guide

This guide describes the repository commands. Local development and local builds
have been exercised during development; a fresh Docker installation has **not**
been verified under the recovery plan.

## Local development

Requirements:

- Node.js 24 is recommended to match the Docker image (the repository does not enforce an `engines` field).
- Corepack with pnpm 11.20.0.
- A reachable PostgreSQL database.
- An SMTP service, or Mailpit, for email-flow testing.

From the repository root:

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Edit `.env.local`. At minimum, supply a real `DATABASE_URL`, a random
`BETTER_AUTH_SECRET` of at least 32 characters, matching `BETTER_AUTH_URL` and
`NEXT_PUBLIC_APP_URL`, SMTP settings, and synthetic admin credentials. Do not
commit the file.

Apply migrations and create the administrator explicitly:

```powershell
pnpm db:migrate
pnpm seed:admin
```

There is no general sample-data seed. A fresh database does not contain demo
patients, doctors, visit reasons, medicines or stock prepared for the full journey.

Start the application:

```powershell
pnpm dev
```

Open `http://localhost:3000`. To check code without claiming a browser journey:

```powershell
pnpm test
pnpm lint
pnpm build
```

The retained test suite is described in [testing](testing.md). The current Next.js
version reports a security advisory during builds; upgrade before deployment.

## Docker Compose reference

Copy and edit the Docker example:

```powershell
Copy-Item .env.docker.example .env.docker
```

When Docker execution is authorized, follow [deployment](deployment.md). The
prepared commands are:

```powershell
docker compose --env-file .env.docker up -d --build app
docker compose --env-file .env.docker --profile tools run --rm seed-admin
```

These commands are instructions, not recorded passing evidence. The fresh-install
check remains pending. Do not reuse a live database volume for verification.

## Backup and restore

Follow [backup/restore](backup-restore.md) only against the intended deployment and
restore only into a new throwaway database. That procedure is prepared but has not
been executed. Do not claim recovery capability until counts, constraints, audit
trigger and evidence have been compared.

## Troubleshooting boundaries

- A green `pnpm test` does not prove PostgreSQL concurrency, SMTP or Docker.
- Changing `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` requires a matching rebuild.
- Changing Compose database credentials does not rewrite an existing volume's role.
- Keep patient values, passwords, tokens and connection strings out of logs/evidence.
