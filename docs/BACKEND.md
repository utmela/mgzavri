# Application structure and backend

For the newer launch safeguards and current verification, read [security and operations](OPERATIONS.md). The later hosted upgrade adds quotas, durable booking request IDs, audit events and verified-email/MFA admin enforcement. The earlier verification notes below are retained as the initial backend milestone.

Next.js Route Handlers provide the application API; Supabase provides PostgreSQL and authentication. Pages use `lib/api.ts` for marketplace data. Only sign-in, sign-out and browser session storage use Supabase directly.

```text
app/                      Pages and navigation
app/api/                  HTTP endpoints
lib/api.ts                Shared browser transport and typed errors
lib/bookings.ts            Booking operations used by components
lib/server/context.ts      Per-request database client, verified identity and roles
lib/server/validation.ts   Input allowlists, bounds and timezone handling
lib/server/errors.ts       Safe business errors and HTTP status mapping
lib/ride-columns.ts        Public trip projection, excluding phone numbers
supabase/migrations/       Schema, authorization and transactional inventory
tests/backend.test.ts      Validation, authentication and error tests
scripts/smoke-api.mjs       Read-only checks against a running application
```

## Website areas

- Public: home, route search and trip details.
- Passenger: bookings, request creation and request management.
- Driver: trip creation/editing, availability, external reservations and passenger demand.
- Admin: protected marketplace overview and moderation.

New passenger requests lead to `/my-requests`, where their owner can review and remove them. Navigation exposes account tools according to the database role. Server checks and database permissions independently enforce roles.

## API contract

Success responses contain `{ "data": ... }`. Errors contain `{ "error": { "code": "...", "message": "..." } }`. Responses use `Cache-Control: no-store`. Protected routes require a Supabase access token in `Authorization: Bearer <token>`; the server calls `auth.getUser(token)` before accessing private data. Each request gets its own public-key client with that same token, retaining row-level and column-level permissions. No service-role credential is needed.

| Endpoint | Methods | Access and behavior |
| --- | --- | --- |
| `/api/health` | GET | Read-only database connectivity probe |
| `/api/rides` | GET, POST | Public upcoming trips; creation requires approved driver/admin |
| `/api/rides?scope=mine` | GET | Caller-owned trips and their bookings |
| `/api/rides/:id` | GET, PATCH, DELETE | Public details; changes require ownership/admin in the database |
| `/api/rides/:id?manage=true` | GET | Owner/admin editor access |
| `/api/rides/:id/contact` | GET | Owner/admin or confirmed passenger |
| `/api/rides/:id/availability` | PATCH | Owner/admin; body `{ "delta": -1 }` or `{ "delta": 1 }` |
| `/api/bookings` | GET, POST | Caller-owned bookings; authenticated reservations |
| `/api/bookings/:id` | DELETE | Authorized cancellation retaining history and restoring inventory once |
| `/api/bookings/external` | POST | Trip owner/admin external reservation |
| `/api/requests` | GET, POST | Demand visible to approved drivers/admins; signed-in passengers can create |
| `/api/requests?scope=mine` | GET | Caller-owned requests |
| `/api/requests/:id` | DELETE | Request owner/admin |
| `/api/profile` | GET | Caller profile only |
| `/api/admin` | GET | Database-admin role required |

Lists accept `limit` (1–100, default 100) and `offset`. Trip search accepts `from`, `to` and an optional `YYYY-MM-DD` date. Search boundaries use Georgia time (`Asia/Tbilisi`, UTC+04:00), regardless of the browser timezone, and exclude past/sold-out trips. Most existing dashboards display the first 100 records; the new request manager has a load-more control. Add pagination controls elsewhere before larger-scale use.

Write payloads have a 16 KiB streaming limit. Supported cities, distinct routes, seat bounds, prices, future departures, field lengths and accessory IDs are validated before writes. Client-supplied ownership, booking prices and initial inventory are discarded. Booking totals and inventory are calculated in database functions under a trip row lock. SQL errors and private details are never returned to the browser.

## Existing database upgraded on 2026-10-16

The configured project `jruuspmvdfngthclxzso` (`poti-haul`) was resumed from its inactive state. Its live schema already contained legacy marketplace functions and records, without migration history. It was inspected before upgrading; the fresh-install baseline and marketplace migration were not replayed.

One atomic hosted migration, `20261016175728_marketplace_backend_alignment`, applied these local sources in order:

1. `supabase/upgrades/reviewed_legacy_signup.sql`: remove only the inspected legacy signup trigger, which assigned every new user the driver role.
2. `supabase/migrations/202609060001_security_foundation.sql`: secure profiles, protect contact information, create passenger profiles, restrict request access and harden transactional RPCs.
3. `supabase/migrations/20261016175559_backend_alignment.sql`: align timestamps/prices, enforce driver-only trip creation and close the retired listings API while retaining its records.

Their transaction delimiters were removed and the combined SQL ran in one transaction. Timestamp-without-time-zone values were interpreted as UTC because the previous app wrote ISO UTC strings. Existing profile roles were preserved; no account was promoted or demoted.

Record counts before and after: 10 auth users, 10 profiles, 1 ride, 2 bookings, 1 passenger request and 9 legacy listings. No test fixtures remain. Legacy listings remain available through privileged database access; the current website uses rides and requests.

**Do not run a blanket `supabase db push` against this project yet.** Its historical schema was installed outside migrations, and the hosted upgrade is a combined migration. Reconcile local/remote history against the inspected definitions first; replaying old marketplace SQL would undo security rules. Fresh projects should apply all local migrations in filename order. The reviewed legacy adapter is exclusively for the inspected older signup trigger.

## Verification

On 2026-10-16:

- `npm run check`: ESLint, TypeScript, 9 backend tests and the production build passed.
- `npm run test:api`: 13 HTTP checks passed against the running production build and real Supabase project, including database health, public search, input rejection and protected-route denial.
- `supabase/tests/hosted-smoke.sql`: 21 database assertions passed during a rollback-only upgrade rehearsal and again after applying the migration. They cover signup roles, role escalation, public/private reads, driver posting, decimal totals, overselling rejection, contact access, other-passenger isolation, request permissions, protected deletion, cancellation and full-van inventory. Each run rolls back every fixture and helper function.
- Browser: Georgian/English home and route pages render; route search reaches its empty-results state; signed-out request management requires sign-in. These checks produced no browser warnings/errors.
- Privilege queries confirmed profile RLS is enabled, anonymous users cannot read driver phones, authenticated users cannot update profile roles, and retired listings are no longer publicly accessible.

The isolated local PostgreSQL/CI suite has not run on this machine: PostgreSQL is unavailable and Docker is not running. Hosted smoke checks use real Supabase objects and are separate from `test:db`'s mock-auth bootstrap. Google/email sign-in, simultaneous HTTP booking clients and hosted frontend deployment have not been verified. Frontend changes are local.

Security advisors no longer report disabled profile RLS. Remaining notices cover intentional API schema visibility and authenticated SECURITY DEFINER entrypoints guarded by database authorization. Leaked-password protection remains disabled; see [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Performance advisors flag existing policy initialization costs and retired-listings policies; see [RLS performance guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select). Existing privileged accounts should be reviewed separately because their roles predate these protections.

## Commands

```powershell
npm run check
npm run start
# In another terminal with the app running:
npm run test:api
```

`APP_URL` can target another running environment for the read-only HTTP checks. Never use mock-auth database fixtures on a hosted project. Read the complete hosted-smoke script before running it with privileged SQL access; preserve its transaction and rollback.

Implementation references: [Supabase tokens and RLS](https://supabase.com/docs/guides/functions/auth-legacy-jwt), [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).
