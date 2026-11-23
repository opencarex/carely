# Docker deployment (SCRUM-173)

The files are prepared. A container build and fresh installation have **not** been run because the user requested that Docker not be run. Keep SCRUM-173 open until the verification below passes. This packages the existing application; teammate feature code is unchanged. Rebuild after merging their changes.

## Configuration

Use Docker Desktop with Linux containers on Windows, or Docker Engine with Compose v2 on a server. Run commands from the repository root. The examples below use PowerShell.

```powershell
Copy-Item .env.docker.example .env.docker
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

Edit `.env.docker` before continuing. Replace the PostgreSQL password and Better Auth secret with separate generated values, and choose a strong administrator password. Use URL-safe PostgreSQL user/database names and a hexadecimal password because Compose constructs the connection URL from them. The application container uses the Compose PostgreSQL service, not the Supabase URL in your developer `.env.local`.

Set `BETTER_AUTH_URL` to the URL used in the browser, including a non-default port. It also supplies the public auth-client URL at build time; rebuild when it changes. The other credentials and settings are supplied at runtime. Secrets and local backups are excluded from Git and the Docker build context. Build stages use disposable placeholder credentials, not deployment credentials.

By default, the app listens on localhost:3000, PostgreSQL on localhost:5432, and Mailpit's captured mail is at localhost:8025. Override the ports if they are occupied. For a server, configure `APP_BIND_ADDRESS` and put HTTPS in front of the app. Mailpit captures demo messages; configure your SMTP environment values for real delivery.

## Install and start

Run these only when Docker execution is authorized:

```powershell
docker compose --env-file .env.docker up -d --build app
docker compose --env-file .env.docker --profile tools run --rm seed-admin
docker compose --env-file .env.docker ps -a
```

The startup sequence waits for PostgreSQL's health check, runs the migration service to successful completion, then starts Next.js. The app image uses Next's standalone output as a non-root user and includes public/static assets and the email templates read at runtime. Database tools run in the separate `tooling` build target, not in the serving container.

The administrator command is explicit and can be repeated without replacing existing accounts. There is no sample-data seed. A fresh database starts with the five specialties from the historical migration and an empty medicine catalogue, stock and visit reasons. Add those through the pharmacist/admin features once those tracks are available. Existing database volumes retain their original credentials; changing the env file does not reset the database role password.

The usual `up` command includes the migration dependency. To explicitly rerun pending migrations:

```powershell
docker compose --env-file .env.docker run --rm migrate
```

After teammate changes merge, rebuild the application:

```powershell
docker compose --env-file .env.docker up -d --build app
```

Stop services while retaining the database volume:

```powershell
docker compose --env-file .env.docker down
```

## Fresh-install evidence still required

Use a distinct `COMPOSE_PROJECT_NAME` such as `carely-fresh-check` and unoccupied host ports in a separate ignored env file. This creates a new named volume without touching an existing deployment. Repeat the install commands with that env file, then record:

- Image build succeeds; the migration container exits 0; PostgreSQL and the app become healthy.
- `/login` returns 200; the seeded administrator can sign in; a protected page rejects an anonymous caller.
- The five specialties exist, and catalogue/stock/reason tables are empty on a fresh install.
- An invitation/reset message appears in Mailpit when the relevant flow is exercised.
- Restarting the services preserves the administrator account and database records.

Keep the command outputs, date and a screenshot with synthetic account details. Do not mark the full six-role journey passed until the teammate features merge. Diagnostics: `docker compose --env-file .env.docker logs --tail 100 app migrate postgres`. Do not publish logs containing credentials or patient values.

See [backup and restore](backup-restore.md) for SCRUM-196.

Reference: startup conditions follow the [Docker Compose startup-order documentation](https://docs.docker.com/compose/how-tos/startup-order/). Standalone packaging follows the installed Next.js guide at `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md`.

## Checks completed without Docker

The local Next.js production build completed successfully using disposable build credentials, and standalone output was generated. TypeScript, ESLint (two existing staff-directory warnings), YAML/Markdown formatting and PowerShell example syntax checks passed. No Docker command or container was run after the user's restriction. A local build does not verify the Linux image, service startup, database migration or fresh-install journey.

Next.js 16.4.0's build checker reported a known security vulnerability. The initial build stopped for its upgrade reminder; the same build succeeded on retry while retaining the warning. A security update is recommended before deployment. Dependency versions were not changed here. A later successful local build on 23 November logged prerender-interruption diagnostics from the patient doctor-finder route; that log is not Docker or deployment evidence.
