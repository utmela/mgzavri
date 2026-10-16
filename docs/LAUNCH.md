# Mgzavri launch progress

Current security implementation and external setup gates are tracked in [OPERATIONS.md](OPERATIONS.md). The follow-up hosted safeguard migration is applied; local PostgreSQL concurrency and synthetic encrypted-restore tests now pass. Admin access is restricted to the two approved verified emails and MFA. Hosting, provider Auth settings, actual email delivery and full offsite backup/restore remain external release gates.

Status date: 2026-10-16. The configured Supabase project was resumed and its inspected legacy schema upgraded in one transaction. Existing records and profile roles were retained. The frontend has a connected server API and request-management area, prepared and tested locally; no hosted frontend deployment was performed. See [the backend report](BACKEND.md) for the migration sources, endpoint contract and verification evidence.

Verification: ESLint, TypeScript, 9 backend tests, the production build, 13 live HTTP checks and 21 rollback-only hosted database assertions pass. Georgian/English route browsing and signed-out dashboard access were checked in the browser. The isolated PostgreSQL/CI suite and real email/Google login have not run. GitHub Actions have not run or been published. The app uses system fonts and does not need a Google font download during builds.

## First batch: prepared locally

- [x] Add the missing fresh-database baseline before the existing marketplace migration.
- [x] Add a follow-up security migration; keep the old upgrade history intact.
- [x] Protect profile role changes and create new profiles without trusting signup roles.
- [x] Omit driver phones from public ride queries and enforce column privileges.
- [x] Retrieve driver contact through a database authorization check.
- [x] Restrict passenger-request reads to owners and approved driver/admin roles.
- [x] Require an account for booking; remove anonymous function execution.
- [x] Remove unsafe client inventory and schema fallback writes.
- [x] Preserve seat occupancy when capacity is edited under a database lock.
- [x] Prevent trip deletion from erasing booking history.
- [x] Replace the admin page's hard-coded account IDs with the database admin check.
- [x] Add environment documentation, basic security headers and CI checks.
- [x] Write PostgreSQL tests for access denial, role escalation, reservations, capacity changes and cancellation.
- [ ] Run database tests successfully; local PostgreSQL/Docker is unavailable.
- [ ] Compare the existing Supabase schema with the baseline.
- [x] Inspect the connected legacy schema and apply the reviewed security/backend upgrade without resetting records.
- [x] Add authenticated server APIs and connect all marketplace data operations.
- [x] Add owner-only passenger request management and navigation.
- [x] Run rollback-only tests using real hosted Supabase objects and read-only HTTP checks.
- [ ] Test the real Supabase REST API, Auth flows and concurrent booking clients in staging.
- [ ] Review and commit current work. Git history still contains the earlier version.

## Next operator steps

The numbered sequence below is the earlier staging/release checklist, retained for future deployments. The configured project's schema inspection and security upgrade are now complete. **Do not replay its legacy SQL**: hosted migration history contains the combined `marketplace_backend_alignment` upgrade. Reconcile migration history first as described in `BACKEND.md`. Frontend publication, staging login/concurrency checks and the other release gates remain outstanding.

1. Back up the existing database and create a separate Supabase staging project or restore a copy into staging. Never use production for resets or test fixtures.
2. Run `supabase/preflight.sql` with the SQL editor. It returns one `schema_report` cell containing schema information and grants, not passenger records. Export or copy that result for review. Review schema text for any previously hard-coded secrets before sharing.
3. Inspect existing profile creation triggers, overloaded/legacy RPCs, views and grants. `IF NOT EXISTS` does not reconcile an existing schema. An unknown view or legacy SECURITY DEFINER function could still expose protected data. The security migration deliberately stops if existing auth signup triggers need review. Replace reviewed conflicting triggers in staging and preserve any required behavior before proceeding.
4. On an empty staging project, review and apply all three migrations in filename order. On a copied existing project, reconcile migration history first; apply only genuinely missing changes. Do not rerun the old marketplace migration after the security migration: it recreates permissive policies.
5. Assign one test admin and one test driver using privileged staging access. Verify exact account UUIDs in Auth Users; assign `profiles.role = 'admin'` or `'verified_driver'` for those accounts only. Never infer privilege from signup metadata. Do not paste database passwords or secret keys into chat.
6. Set `.env.local` to the staging URL and public key. Run `npm run check`, then `npm run dev`. Existing local settings have not been changed automatically.
7. Put reviewed code in a private GitHub repository and let both release-check jobs run. Require both to pass before merging. Account creation, repo publication, role assignment and hosted SQL remain operator steps until the corresponding accounts are connected.
8. Test as visitor, passenger, another passenger, driver and admin using the Supabase Data API as well as the browser. Phone queries must fail directly, users must not edit roles, and unauthorized RPC calls must not change inventory.
9. Test signup with confirmation enabled: metadata must create a passenger profile even without an immediate session. Test Google signup separately. Review old trigger behavior if the database was copied.
10. Run simultaneous requests for the last seat and simultaneous edits/cancellations. These tests remain required after the single-session SQL suite passes. Verify failed requests cannot leave partially applied writes.
11. Coordinate the matching app and migration for production in a maintenance window after backup and staging acceptance. Old wildcard ride queries will fail; the new app requires the contact and edit RPCs. Confirm old clients cannot use insecure fallback writes.
12. Verify public search, bookings, driver contact, dashboard, requests, admin and auth on the production domain. On failure, keep writes closed while assessing recovery; do not undo privacy rules to make old clients work.

## Remaining launch phases

- [ ] Durable booking idempotency for retries and duplicate submissions; ownership/support policy for old guest bookings.
- [ ] Trip cancellation and notifications retaining booking history; booked trips currently cannot be deleted.
- [ ] Driver onboarding/verification, revocation and moderation. Posting and driver request access now require a trusted driver/admin role; onboarding itself remains an operator process.
- [ ] Booking/payment lifecycle, cancellation deadlines, no-shows, external-seat reconciliation and dispute handling.
- [ ] Database validation for legacy rows, phone normalization, cities, retention, nullability, foreign keys and unknown grants; the baseline does not repair existing tables.
- [ ] Georgia time zone rules for scheduling/display tested from other browser time zones. Server search date boundaries now use Georgia time.
- [ ] Password recovery, auth return-to flow, verification resend, session expiry, account deletion, custom SMTP, email tests, CAPTCHA and admin MFA.
- [ ] Rate limits on business RPCs and requests; Auth rate limits do not automatically protect booking RPCs.
- [ ] CSP tested with Next.js, Supabase and OAuth; HTTPS/HSTS after domain verification, dependency review and secret scanning.
- [ ] Audit logs, error tracking without passenger PII, uptime/budget/slow-query/email alerts.
- [ ] Backups/PITR and a successful restore exercise, recovery targets, incident response and production write-disable mechanism.
- [ ] Terms, privacy/cancellation policies, support contact, driver responsibilities, photo licenses and legal review.
- [ ] Accessibility, mobile and Georgian/English end-to-end tests, friendly errors, pagination and realistic data volumes.
- [ ] SEO, sitemap, robots rules, analytics/consent decisions and performance checks.
- [ ] Hosting, domain/DNS/HTTPS, preview isolation, OAuth allowlists and release/rollback procedures.
- [ ] Pilot with a small group before general promotion.

## References

- [Supabase function security](https://supabase.com/docs/guides/database/functions)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy)
