# Security and operations

## Release status

The current stack is Next.js, Supabase Auth and PostgreSQL. Java is not required for the implemented controls. Docker build/runtime configuration is included, with an optional local reverse proxy. Hosting and a production domain have not been selected.

On 2026-10-16, hosted migration `20261016183258_launch_safeguards_and_verified_admins` applied both new migration files in one transaction and seeded the two owner-approved emails privately. The four legacy admin assignments were removed as approved. Verification found 2 eligible emails, 0 unapproved admin roles and 0 currently active admin roles, because the approved emails have not registered. Existing counts remain 10 auth users, 10 profiles, 1 ride, 2 bookings and 1 request. With specific owner approval, the application records were exported to `backups/application-20261016-launch-safeguards.dpapi`, encrypted for the current Windows user, and decrypted in memory to verify the format and counts. No plaintext copy was written. This is a local application rollback aid; a complete offsite backup and hosted restore remain launch gates.

Verified locally: lint, TypeScript, 14 backend/security tests, the production build, PostgreSQL migration/security/quota/concurrency and synthetic encrypted-restore checks, Windows DPAPI writer/decryption using synthetic data, and 17 live HTTP/security checks. Browser sign-in/security pages render without console warnings/errors. HTTP checks verify unique CSP nonces on SSR scripts and reject cross-site writes. Hosted post-upgrade rollback-only checks also verified email/MFA authorization, retries, inventory, quotas and the database write pause; all fixtures rolled back. `npm audit` reports 0 known vulnerabilities across production and development dependencies. Compose and optional proxy configuration validate. Real user email delivery/MFA enrollment, container execution, GitHub workflow execution and full hosted backup/restoration are not claimed as tested.

Implemented controls (frontend changes remain local until deployed):

- Next.js 16.4.2, React 19.3.1 and Supabase JS 2.118.0; exact versions and a committed lockfile.
- Per-request script nonces and an enforced Content Security Policy, safe redirect destinations, same-origin write checks, and private API responses.
- Authenticated write attempts limited to 30 per minute per account. Database triggers independently cap committed writes at 120/minute, new rides/requests at 6/hour each and bookings at 12/minute. Quotas persist in PostgreSQL and cannot be bypassed by using another application instance.
- Durable idempotency for passenger and external bookings. The same request ID returns the original reservation. Reusing it with changed details fails. One active platform booking per passenger/trip prevents accidental duplicates with different keys.
- Admin privileges require a verified allowlisted email, a database admin role and an MFA `aal2` session. The two owner-approved addresses are private database configuration, not frontend code. Legacy admin assignments are revoked by the allowlist rollout.
- Authenticator enrollment/challenge at `/security`, password recovery, confirmation resend, and safe OAuth/email completion routes. Authenticator QR codes and passwords are never logged.
- Private transaction audit events contain actor/record UUIDs, action, entity and timestamp; no passenger names, phones, passwords or tokens. MFA admins can query `/api/admin/audit`.
- API responses carry `X-Request-ID`. Structured logs contain request ID, method, status and duration; no bodies, query strings or tokens.
- Separate liveness (`/api/live`) and database readiness (`/api/health`) checks, plus prepared GitHub monitoring and encrypted-backup workflows.

The PostgreSQL migration and concurrency suite runs in an isolated PostgreSQL 17 process in `.test-data/`; it never targets a hosted project. It tests authorization, quotas, admin eligibility/MFA, concurrent last-seat reservations, concurrent retries/cancellations, encrypted snapshot integrity and restoration into an empty local database. Test clusters are removed after the process stops. Test logs contain no real customer records.

## Admin setup

Only the two explicitly approved addresses may receive admin roles. Neither was registered when reviewed. Each owner must:

1. Register with the approved address and confirm the email, or use a provider that verifies ownership of that exact address.
2. Sign in and visit `/security`.
3. Scan the private QR code with an authenticator and verify a code.
4. Continue to `/admin`. Future password-only sessions must pass the authenticator challenge again.

Enrollment must be completed by the owner; nobody should scan or save another owner's QR code. Recovery from a lost device requires operator identity verification and a privileged factor reset; no public recovery bypass exists. Supabase organization/dashboard MFA is separate and must also be enabled by the account owner.

The rollout creates `private.admin_allowlist`, seeds the two approved addresses through privileged SQL, demotes older admin assignments to passenger, and promotes an eligible identity only after email confirmation. Changing its email away from the allowlist revokes its admin role. Accounts and booking histories are retained. Adding more admins is a deliberate operator task, never a signup metadata field.

## Supabase settings requiring owner access

The connected database tools do not expose Auth configuration updates. Before public launch, verify in the project's Auth settings:

- Email confirmation is enabled; allow only the actual production domain and the staging/local callback URLs you use.
- Set the site URL and allow `/auth/complete` and `/auth/reset-password` redirects. Do not use broad wildcard production callbacks.
- Enable TOTP enrollment and verification. Enable leaked-password protection if supported by the project's plan, and set a minimum password length of 12. Client-side checks supplement the provider's policy.
- Configure custom SMTP for reliable confirmation/recovery delivery. Test actual delivery and expiry with consenting test accounts.
- Enable the provider's bot protection using its CAPTCHA integration and corresponding frontend widget before high-volume public signup. Keys/provider selection are not configured by this change; do not enable a CAPTCHA requirement without adding the matching widget.
- Review the remaining legacy driver identities and confirm they are approved drivers. Only admin assignments were explicitly reset.

No paid plan, SMTP vendor, CAPTCHA service or hosting subscription has been purchased. Do not paste database passwords, SMTP credentials, authenticator secrets or backup keys into chat or source control.

## Docker

Use Node 22.18+ for development. Public Supabase configuration is required at container build time because it is embedded in browser assets. A public key is not a database password.

```powershell
docker compose --env-file .env.local config --quiet
docker compose --env-file .env.local up --build -d
```

The app runs as UID 1001, with a read-only root filesystem, bounded writable caches, dropped capabilities, a memory/process limit and a liveness check. `.dockerignore` excludes environment files, backups, Git history and local test clusters. Only public Supabase values are build arguments. Rebuild for another Supabase environment; do not reuse a production image's embedded public configuration for staging.

Optional proxy with per-IP API limits:

```powershell
docker compose --env-file .env.local -f compose.yaml -f compose.proxy.yaml up --build -d
```

The proxy listens only at `127.0.0.1:8080`; the app only at `127.0.0.1:3000`. Put the chosen host's HTTPS termination in front of the proxy and set `SITE_URL=https://your-real-domain`. Configure trusted proxy IP handling deliberately if using a load balancer; otherwise its IP will share a quota. Do not expose these HTTP ports publicly. Keep the database managed by Supabase rather than replacing live data with a local Docker database.

Docker Desktop did not start an engine successfully on this Windows machine. Compose configuration validation passes, and a separate CI job is prepared to build/run the container, check its UID and probe liveness. Container execution still needs verification on an operational Docker host. The PostgreSQL tests do not depend on Docker.

## Backups and restore

There are two distinct backup formats:

- A Windows DPAPI application snapshot contains approved profiles, trips, bookings, requests and placeholder auth UUIDs. It is a local rollback aid encrypted for the current Windows user/machine. It excludes authentication passwords/tokens, does not restore login credentials, and is not an offsite or complete disaster-recovery backup. Private contact data export requires specific owner approval.
- `npm run backup:full` streams a PostgreSQL custom archive through AES-256-GCM encryption. It creates no plaintext dump. Supply `DATABASE_URL` and a 32-byte hexadecimal `BACKUP_ENCRYPTION_KEY` through a secret store. Use PostgreSQL 17+ `pg_dump`, or `PG_DUMP_VIA_DOCKER=true` with a working Docker engine. TLS hostname/certificate validation is mandatory. The encrypted archive and its `.json` authentication-tag manifest must be retained together. `BACKUP_DIRECTORY` defaults to ignored `backups/`.

`npm run backup:verify` authenticates/decrypts an archive in memory and verifies the PostgreSQL archive header; provide `BACKUP_FILE` and the encryption key. This verifies file integrity, not recoverability of a full hosted Supabase project.

The full-backup workflow is inactive until a repository operator sets protected secrets `BACKUP_DATABASE_URL` and `BACKUP_ENCRYPTION_KEY` plus variable `ENABLE_DATABASE_BACKUPS=true`. It retains encrypted GitHub artifacts for seven days. Use a separate durable offsite location/retention policy for production; preserve the encryption key in an independent recovery vault. Rotating a key must not destroy keys needed by older archives. No actual full hosted backup or hosted restore has been claimed without credentials and a completed drill.

For full disaster recovery, use the provider's managed backup/PITR features and follow its restore guidance into a separate staging project. A clone must preserve compatible Supabase Auth schemas and required cluster roles. Restore database data and any independently stored files; verify account login, permissions, row counts, booking totals and inventory before a cutover. Never run `--clean`, reset or a restore against the live project as a test.

The isolated application restore helper refuses every database except local `mgzavri_restore_test`, and refuses nonempty target tables. During that disposable restore only, it suppresses trigger side effects within one transaction and verifies restored counts and trip references. Use `SNAPSHOT_FILE` to test an approved DPAPI snapshot; otherwise the suite uses synthetic fixtures.

Restoring a real snapshot creates temporary plaintext database files under `.test-data/`. That is a separate use of private data from approving an encrypted backup file. Obtain explicit approval for that destination, use appropriately protected/encrypted storage, and confirm cleanup before running a real-data drill. Only synthetic restoration has run in this work.

## Monitoring and incident response

Set repository variable `PRODUCTION_URL` to the chosen HTTPS origin to activate the prepared 15-minute health workflow. Workflow failure notification recipients/preferences are controlled in GitHub. These workflows are local files until published to the repository; no hosted monitor is active yet.

For an incident, pause writes at both layers:

1. Set `MARKETPLACE_WRITES_ENABLED=false` in the app runtime and restart/redeploy it.
2. Through trusted database access, run `update private.marketplace_settings set writes_enabled=false where singleton;`. This blocks direct authenticated database/RPC writes through mutation triggers as well. It does not prevent sign-in, read access, or trusted operator maintenance.
3. Preserve relevant audit events and request IDs. Investigate without copying passenger details into public logs.
4. Restore into staging, verify, then deliberately re-enable both controls. Do not weaken RLS or replay older permissive migrations to restore availability.

## Deployment gates

Run `npm run check`, `npm run test:db:local` and `npm audit`. CI also runs an independent PostgreSQL service test and container checks. Before publishing: select hosting/domain, set isolated staging/production configuration, reconcile the documented legacy migration history, complete Auth configuration and real login/email tests, confirm a complete offsite backup and restore, and configure production monitoring. No stack rewrite substitutes for these gates.

One development-only compatibility override maps the Next ESLint plugin's `fast-glob` dependency to `tinyglobby@0.2.17`. That plugin uses `globSync` with `onlyDirectories`, supported by the replacement and checked locally. This removes an unpatched `braces` advisory without downgrading Next. Review the override when upgrading the plugin.

References: [Supabase MFA enforcement](https://supabase.com/docs/guides/auth/auth-mfa), [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
