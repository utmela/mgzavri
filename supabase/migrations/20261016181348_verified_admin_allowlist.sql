begin;
-- Entries are private operator configuration, seeded separately after deployment.
create table private.admin_allowlist (
  email text primary key check(email=lower(trim(email))),
  created_at timestamptz not null default now()
);
alter table private.admin_allowlist enable row level security;
revoke all on private.admin_allowlist from public,anon,authenticated;

create function private.sync_admin_identity()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.email_confirmed_at is not null and exists(
    select 1 from private.admin_allowlist where email=lower(trim(new.email))) then
    update public.profiles set role='admin' where id=new.id;
  else
    update public.profiles set role='passenger' where id=new.id and role='admin';
  end if;
  return new;
end;
$$;
revoke all on function private.sync_admin_identity() from public,anon,authenticated;
-- Runs after marketplace_profile_created during signup, including OAuth signup.
create trigger zz_marketplace_admin_identity after insert or update of email,email_confirmed_at on auth.users
for each row execute function private.sync_admin_identity();

create or replace function public.is_marketplace_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((auth.jwt()->>'aal')='aal2',false) and exists(
    select 1 from public.profiles p join auth.users u on u.id=p.id
    join private.admin_allowlist a on a.email=lower(trim(u.email))
    where p.id=auth.uid() and p.role='admin' and u.email_confirmed_at is not null);
$$;

-- Explicitly approved reset of legacy admin assignments. Passengers retain their
-- accounts and booking history. Eligible verified identities are reconciled below.
update public.profiles p set role='passenger' where p.role='admin' and not exists(
  select 1 from auth.users u join private.admin_allowlist a on a.email=lower(trim(u.email))
  where u.id=p.id and u.email_confirmed_at is not null);
update public.profiles p set role='admin' where exists(
  select 1 from auth.users u join private.admin_allowlist a on a.email=lower(trim(u.email))
  where u.id=p.id and u.email_confirmed_at is not null);
notify pgrst,'reload schema';
commit;
