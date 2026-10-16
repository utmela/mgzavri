-- Read-only, single-row report for the Supabase SQL Editor.
-- No passenger records or credential values are selected. Review schema text
-- for any previously hard-coded secrets before sharing it.
select jsonb_pretty(jsonb_build_object(
  'columns', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns where table_schema = 'public'
      and table_name in ('profiles', 'rides', 'bookings', 'requests')
    order by table_name, ordinal_position
  ) x),
  'rls', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select c.relname, c.relrowsecurity, c.relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ) x),
  'policies', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select tablename, policyname, roles, cmd, qual, with_check
    from pg_policies where schemaname = 'public' order by tablename, policyname
  ) x),
  'table_grants', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select table_name, grantee, privilege_type from information_schema.table_privileges
    where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
  ) x),
  'column_grants', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select table_name, column_name, grantee, privilege_type from information_schema.column_privileges
    where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
  ) x),
  'functions', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
      p.prosecdef, p.proconfig, p.proacl
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
  ) x),
  'triggers', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select c.relname, t.tgname, pg_get_triggerdef(t.oid) as definition
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and n.nspname in ('public', 'auth')
  ) x),
  'constraints', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
    from pg_constraint where connamespace = 'public'::regnamespace
  ) x),
  'views', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select c.relname, c.reloptions, pg_get_viewdef(c.oid) as definition
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm')
  ) x)
)) as schema_report;
