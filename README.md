# Mgzavri

Intercity minivan bookings for Georgia. Next.js App Router, React, TypeScript and Supabase PostgreSQL/Auth.

Server APIs handle trips, bookings, passenger requests, profiles and administration. See [backend architecture and verification](docs/BACKEND.md) for the endpoint contract and existing database upgrade applied on 2026-10-16. Passengers can manage their requests at `/my-requests`.

Read [security and operations](docs/OPERATIONS.md) for MFA, booking retry protection, quotas, Docker, backups, monitoring and the remaining production configuration gates. `npm run test:db:local` runs the database/concurrency/restore suite without Docker or a hosted database.

## Local development

Use Node.js 22.18+ and the checked-in package lock. Copy `.env.example` to `.env.local` and fill in the **staging** Supabase URL and public key. Never use production credentials in preview builds.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. The public Supabase key is intended for the browser; database permissions enforce access. Never put service-role keys or database passwords into `NEXT_PUBLIC_*` variables.

## Release checks

```powershell
npm run check
```

This runs lint, TypeScript, backend tests and a production build. With the app running, `npm run test:api` checks the real HTTP API without creating records. `.github/workflows/checks.yml` also defines an isolated PostgreSQL migration/security test job. CI jobs do not access production.

Database tests require `psql` and a **fresh disposable** local PostgreSQL 17 server/database. Do not use a Supabase database for these fixtures: they create a minimal mock `auth.users` table and `auth.uid()` function. The runner refuses nonlocal hosts and databases not named `mgzavri_test`.

```powershell
$env:PGHOST = '127.0.0.1'
$env:PGPORT = '5432'
$env:PGUSER = 'postgres'
$env:PGDATABASE = 'mgzavri_test'
# Configure the disposable test database password in PGPASSWORD locally.
npm run test:db
```

Recreate the disposable server/database before rerunning. The tests validate SQL and grants against PostgreSQL; they do not replace Supabase Auth, PostgREST API, or simultaneous-client tests against staging.

## Database rollout

Read [the launch checklist](docs/LAUNCH.md) before running SQL. The application now requires the security migration and new RPCs. Old app deployments using `rides.select('*')` will fail after the phone column is protected. A release must coordinate the application and database.

For a fresh Supabase staging project, review and apply migrations in filename order:

1. `202608100001_baseline.sql`
2. `202608110001_core_marketplace.sql`
3. `202609060001_security_foundation.sql`
4. `20261016175559_backend_alignment.sql`

For an existing database, first run `supabase/preflight.sql` and compare schema, grants, policies, trigger definitions and migration history. Do not rerun the legacy marketplace migration on an already hardened database. Never run a database reset against a hosted environment.

Current contact access rules:

- Visitors can read explicitly allowed public ride columns, including route, price and vehicle details.
- Driver phone numbers can be retrieved only by the trip owner, an admin or a passenger with a confirmed booking.
- Requests are visible to their owner and accounts assigned `driver`, `verified_driver` or `admin` by a trusted operator.
- Only an operator with privileged database access can assign those roles. Browser users can update only their own name and phone.
- Approved driver/admin accounts can post trips. Signed-in passengers can book seats and manage their own requests. Only a trusted operator can assign driver/admin roles; a role label alone is not proof of identity.
- Writes affecting existing inventory go through database functions. Trips with booking history cannot be deleted.

Track the rollout and remaining work in [docs/LAUNCH.md](docs/LAUNCH.md).
