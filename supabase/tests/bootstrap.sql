-- Disposable plain PostgreSQL CI database only, never a Supabase project.
do $$ begin
  if current_database() not in ('mgzavri_test','mgzavri_restore_test') or to_regclass('public.rides') is not null
    or exists (select 1 from pg_namespace where nspname = 'auth') then
    raise exception 'Tests require a fresh mgzavri_test database';
  end if;
end $$;
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end; $$;
create schema auth;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''),'{}')::jsonb;
$$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant execute on function auth.jwt() to anon, authenticated;
-- Mirror Supabase's permissive defaults to prove that the migration revokes them.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
