-- Apply with the matching application release after reviewing the staging schema.
begin;

-- An old signup trigger could assign roles from untrusted metadata. Review it first.
do $$ begin
  if exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass
      and not tgisinternal and (tgtype & 4) <> 0) then
    raise exception 'Review existing auth.users INSERT triggers before applying the security migration';
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Profile metadata is untrusted. Never accept a role from signup metadata.
create or replace function private.create_marketplace_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (new.id, left(new.raw_user_meta_data->>'name', 120),
          left(new.raw_user_meta_data->>'phone', 32), 'passenger')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_marketplace_profile() from public, anon, authenticated;
create trigger marketplace_profile_created after insert on auth.users
for each row execute function private.create_marketplace_profile();

insert into public.profiles (id, role)
select id, 'passenger' from auth.users on conflict (id) do nothing;

alter function public.is_marketplace_admin() set search_path = '';
alter table public.profiles enable row level security;
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop execute format('drop policy %I on public.profiles', p.policyname); end loop;
end $$;
create policy profiles_self_read on public.profiles for select to authenticated
using (id = auth.uid() or public.is_marketplace_admin());
create policy profiles_self_update on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

-- Clear legacy column grants as well as table grants; either can allow access.
do $$ declare t text; c record; begin
  foreach t in array array['profiles', 'rides', 'bookings', 'requests'] loop
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    for c in select column_name from information_schema.columns
      where table_schema = 'public' and table_name = t loop
      execute format('revoke all (%I) on public.%I from public, anon, authenticated', c.column_name, t);
    end loop;
  end loop;
end $$;
grant select on public.profiles to authenticated;
grant update (name, phone) on public.profiles to authenticated;

-- Only explicitly listed columns are public. Adding a column will not expose it.
grant select (id, user_id, driver_name, from_city, to_city, departure_time,
  vehicle_type, seats_total, seats_available, price_per_seat, accessories, notes,
  created_at, plate_number, vehicle_color, entire_van_price,
  allow_entire_van_booking, full_van_booked, pickup_point, dropoff_point)
on public.rides to anon, authenticated;
grant insert (user_id, driver_name, phone, from_city, to_city, departure_time,
  vehicle_type, seats_total, seats_available, price_per_seat, accessories, notes,
  plate_number, vehicle_color, entire_van_price, allow_entire_van_booking,
  pickup_point, dropoff_point) on public.rides to authenticated;
grant delete on public.rides to authenticated;
grant select on public.bookings to authenticated;
grant select, insert, update, delete on public.requests to authenticated;

create function private.validate_new_trip()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.user_id is null or new.seats_total is null or new.seats_total not between 1 and 30
    or new.seats_available is distinct from new.seats_total or new.full_van_booked
    then raise exception 'INVALID_SEAT_COUNT'; end if;
  if new.departure_time is null or new.departure_time <= now() then raise exception 'RIDE_DEPARTED'; end if;
  if new.price_per_seat is null or new.price_per_seat not between 0 and 100000
    or (new.allow_entire_van_booking and (new.entire_van_price is null or new.entire_van_price not between 0 and 100000))
    then raise exception 'INVALID_PRICE'; end if;
  if nullif(trim(new.from_city), '') is null or nullif(trim(new.to_city), '') is null
    or new.from_city = new.to_city then raise exception 'INVALID_ROUTE'; end if;
  if nullif(trim(new.driver_name), '') is null or length(new.driver_name) > 120
    or nullif(trim(new.phone), '') is null or length(new.phone) > 32
    or nullif(trim(new.vehicle_type), '') is null or length(new.vehicle_type) > 120
    then raise exception 'INVALID_TRIP_DETAILS'; end if;
  return new;
end;
$$;
create trigger validate_new_trip before insert on public.rides
for each row execute function private.validate_new_trip();
revoke all on function private.validate_new_trip() from public, anon, authenticated;

create or replace function public.can_view_passenger_requests()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid()
    and role in ('driver', 'verified_driver', 'admin'));
$$;
drop policy requests_public_read on public.requests;
create policy requests_authorized_read on public.requests for select to authenticated
using (user_id = auth.uid() or public.can_view_passenger_requests());

create or replace function public.get_driver_phone(p_ride_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select r.phone from public.rides r where r.id = p_ride_id and auth.uid() is not null
    and (r.user_id = auth.uid() or public.is_marketplace_admin() or exists (
      select 1 from public.bookings b where b.ride_id = r.id
        and b.user_id = auth.uid() and b.status = 'confirmed'
    ));
$$;

-- Preserve the original locked booking transaction behind a validated entrypoint.
alter function public.create_trip_booking(uuid, text, text, integer, text) set schema private;
alter function private.create_trip_booking(uuid, text, text, integer, text) set search_path = '';
revoke all on function private.create_trip_booking(uuid, text, text, integer, text) from public, anon, authenticated;
create function public.create_trip_booking(p_ride_id uuid, p_passenger_name text,
  p_passenger_phone text, p_seats integer, p_booking_type text default 'seat')
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_seats is null or p_seats not between 1 and 30 then raise exception 'INVALID_SEAT_COUNT'; end if;
  if p_booking_type is null or p_booking_type not in ('seat', 'full_van') then raise exception 'INVALID_BOOKING_TYPE'; end if;
  if nullif(trim(p_passenger_name), '') is null or length(p_passenger_name) > 120
    or nullif(trim(p_passenger_phone), '') is null or length(p_passenger_phone) > 32
    then raise exception 'PASSENGER_DETAILS_REQUIRED'; end if;
  return private.create_trip_booking(p_ride_id, p_passenger_name, p_passenger_phone, p_seats, p_booking_type);
end;
$$;

create or replace function public.adjust_ride_availability(p_ride_id uuid, p_delta integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare r public.rides%rowtype; reserved integer; next_available integer; begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_delta is null or p_delta not in (-1, 1) then raise exception 'INVALID_SEAT_COUNT'; end if;
  select * into r from public.rides where id = p_ride_id for update;
  if not found then raise exception 'RIDE_NOT_FOUND'; end if;
  if r.user_id is distinct from auth.uid() and not public.is_marketplace_admin() then raise exception 'NOT_AUTHORIZED'; end if;
  if r.departure_time <= now() then raise exception 'RIDE_DEPARTED'; end if;
  if r.full_van_booked then raise exception 'TRIP_FULLY_BOOKED'; end if;
  select coalesce(sum(seats_booked), 0) into reserved from public.bookings
    where ride_id = p_ride_id and status = 'confirmed';
  next_available := r.seats_available + p_delta;
  if next_available < 0 then raise exception 'NOT_ENOUGH_SEATS'; end if;
  if next_available > r.seats_total - reserved then raise exception 'ABOVE_CAPACITY'; end if;
  update public.rides set seats_available = next_available where id = p_ride_id;
  return next_available;
end;
$$;

-- Capacity edits recalculate availability under the same lock used by bookings.
create function public.update_trip_details(p_ride_id uuid, p_vehicle_type text,
  p_departure_time timestamptz, p_seats_total integer, p_price_per_seat numeric,
  p_pickup_point text, p_dropoff_point text, p_allow_entire_van_booking boolean,
  p_entire_van_price numeric)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.rides%rowtype; begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into r from public.rides where id = p_ride_id for update;
  if not found then raise exception 'RIDE_NOT_FOUND'; end if;
  if r.user_id is distinct from auth.uid() and not public.is_marketplace_admin() then raise exception 'NOT_AUTHORIZED'; end if;
  if p_seats_total is null or p_seats_total not between 1 and 30
    or p_seats_total < r.seats_total - r.seats_available then raise exception 'INVALID_SEAT_COUNT'; end if;
  if r.full_van_booked and p_seats_total <> r.seats_total then raise exception 'TRIP_FULLY_BOOKED'; end if;
  if p_departure_time is null or p_departure_time <= now() then raise exception 'RIDE_DEPARTED'; end if;
  if p_price_per_seat is null or p_price_per_seat < 0 or p_price_per_seat > 100000
    or (p_allow_entire_van_booking and (p_entire_van_price is null or p_entire_van_price < 0 or p_entire_van_price > 100000)) then raise exception 'INVALID_PRICE'; end if;
  if nullif(trim(p_vehicle_type), '') is null or length(p_vehicle_type) > 120 then raise exception 'INVALID_VEHICLE'; end if;
  update public.rides set vehicle_type = trim(p_vehicle_type), departure_time = p_departure_time,
    seats_available = p_seats_total - (r.seats_total - r.seats_available), seats_total = p_seats_total,
    price_per_seat = p_price_per_seat, pickup_point = p_pickup_point, dropoff_point = p_dropoff_point,
    allow_entire_van_booking = coalesce(p_allow_entire_van_booking, false),
    entire_van_price = case when p_allow_entire_van_booking then p_entire_van_price else null end
    where id = p_ride_id;
end;
$$;

-- Even legacy ON DELETE CASCADE foreign keys must not erase booking history.
create function private.protect_booked_trip()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.bookings where ride_id = old.id) then
    raise exception 'TRIP_HAS_BOOKINGS';
  end if;
  return old;
end;
$$;
create trigger protect_booked_trip before delete on public.rides
for each row execute function private.protect_booked_trip();
revoke all on function private.protect_booked_trip() from public, anon, authenticated;

alter function public.create_external_booking(uuid, integer, text) set schema private;
alter function private.create_external_booking(uuid, integer, text) set search_path = '';
revoke all on function private.create_external_booking(uuid, integer, text) from public, anon, authenticated;
create function public.create_external_booking(p_ride_id uuid, p_seats integer, p_passenger_name text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.rides%rowtype; begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_seats is null or p_seats not between 1 and 30 then raise exception 'INVALID_SEAT_COUNT'; end if;
  if length(p_passenger_name) > 120 then raise exception 'PASSENGER_DETAILS_REQUIRED'; end if;
  select * into r from public.rides where id = p_ride_id and departure_time > now() for update;
  if not found then raise exception 'RIDE_DEPARTED'; end if;
  if r.user_id is distinct from auth.uid() and not public.is_marketplace_admin() then raise exception 'NOT_AUTHORIZED'; end if;
  return private.create_external_booking(p_ride_id, p_seats, p_passenger_name);
end;
$$;
create or replace function public.cancel_trip_booking(p_booking_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare b public.bookings%rowtype; r public.rides%rowtype; next_available integer; begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  select * into r from public.rides where id = b.ride_id for update;
  if not found then raise exception 'RIDE_NOT_FOUND'; end if;
  if b.user_id is distinct from auth.uid() and r.user_id is distinct from auth.uid()
    and not public.is_marketplace_admin() then raise exception 'NOT_AUTHORIZED'; end if;
  if b.status = 'cancelled' then return r.seats_available; end if;
  next_available := r.seats_available + b.seats_booked;
  if next_available > r.seats_total then raise exception 'INVENTORY_INCONSISTENT'; end if;
  update public.bookings set status = 'cancelled' where id = p_booking_id;
  update public.rides set seats_available = next_available,
    full_van_booked = case when b.booking_type = 'full_van' then false else full_van_booked end
    where id = b.ride_id;
  return next_available;
end;
$$;

create index if not exists rides_owner_departure_idx on public.rides(user_id, departure_time);
create index if not exists requests_route_date_idx on public.requests(from_city, to_city, departure_date);
create index if not exists requests_owner_idx on public.requests(user_id);

-- Explicit grants: new Postgres functions otherwise inherit PUBLIC execution.
revoke all on function public.is_marketplace_admin(), public.can_view_passenger_requests(),
  public.get_driver_phone(uuid), public.create_trip_booking(uuid, text, text, integer, text),
  public.adjust_ride_availability(uuid, integer), public.create_external_booking(uuid, integer, text),
  public.cancel_trip_booking(uuid), public.update_trip_details(uuid, text, timestamptz, integer, numeric, text, text, boolean, numeric)
from public, anon, authenticated;
grant execute on function public.is_marketplace_admin(), public.can_view_passenger_requests(),
  public.get_driver_phone(uuid), public.create_trip_booking(uuid, text, text, integer, text),
  public.adjust_ride_availability(uuid, integer), public.create_external_booking(uuid, integer, text),
  public.cancel_trip_booking(uuid), public.update_trip_details(uuid, text, timestamptz, integer, numeric, text, text, boolean, numeric)
to authenticated;

notify pgrst, 'reload schema';
commit;
