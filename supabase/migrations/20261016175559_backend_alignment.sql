begin;

-- Align the inspected legacy schema with the types the API accepts. The previous
-- app wrote ISO UTC strings into timestamp columns, so preserve those instants.
do $$
declare col record;
begin
  for col in select table_name, column_name from information_schema.columns
    where table_schema = 'public' and table_name in ('rides', 'bookings')
      and column_name in ('departure_time', 'created_at') and data_type = 'timestamp without time zone'
  loop
    execute format('alter table public.%I alter column %I type timestamptz using %I at time zone ''UTC''', col.table_name, col.column_name, col.column_name);
  end loop;
end;
$$;

alter table public.rides alter column price_per_seat type numeric(10,2);
alter table public.bookings alter column total_price type numeric(12,2);
alter table public.requests alter column budget type numeric(10,2);
alter table public.profiles alter column role set default 'passenger';

-- Enforce the same driver access rule at both the API and the direct Data API.
drop policy rides_owner_insert on public.rides;
create policy rides_owner_insert on public.rides for insert to authenticated
with check (user_id = (select auth.uid()) and public.can_view_passenger_requests());

-- The retired listings endpoint contains contact details and permissive writes.
-- Retain all records but remove it from browser-facing access.
do $$
declare col record;
begin
  if to_regclass('public.listings') is not null then
    revoke all on table public.listings from public, anon, authenticated;
    for col in select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'listings'
    loop
      execute format('revoke all (%I) on public.listings from public, anon, authenticated', col.column_name);
    end loop;
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
