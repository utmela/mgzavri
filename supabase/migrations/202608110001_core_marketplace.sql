begin;

alter table public.rides
  add column if not exists entire_van_price numeric,
  add column if not exists allow_entire_van_booking boolean not null default false,
  add column if not exists full_van_booked boolean not null default false,
  add column if not exists pickup_point text,
  add column if not exists dropoff_point text;

alter table public.bookings
  add column if not exists booking_type text not null default 'seat',
  add column if not exists source text not null default 'platform',
  add column if not exists status text not null default 'confirmed';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rides_entire_van_price_nonnegative') then
    alter table public.rides
      add constraint rides_entire_van_price_nonnegative
      check (entire_van_price is null or entire_van_price >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rides_seat_inventory_valid') then
    alter table public.rides
      add constraint rides_seat_inventory_valid
      check (seats_total > 0 and seats_available between 0 and seats_total);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_booking_type_valid') then
    alter table public.bookings
      add constraint bookings_booking_type_valid
      check (booking_type in ('seat', 'full_van'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_source_valid') then
    alter table public.bookings
      add constraint bookings_source_valid
      check (source in ('platform', 'external'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_status_valid') then
    alter table public.bookings
      add constraint bookings_status_valid
      check (status in ('confirmed', 'cancelled'));
  end if;
end $$;

create index if not exists rides_route_departure_idx
  on public.rides (from_city, to_city, departure_time);
create index if not exists bookings_ride_id_idx on public.bookings (ride_id);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

create or replace function public.is_marketplace_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.create_trip_booking(
  p_ride_id uuid,
  p_passenger_name text,
  p_passenger_phone text,
  p_seats integer,
  p_booking_type text default 'seat'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.rides%rowtype;
  v_booking_id uuid;
  v_seats integer;
  v_total numeric;
begin
  if nullif(trim(p_passenger_name), '') is null or nullif(trim(p_passenger_phone), '') is null then
    raise exception 'PASSENGER_DETAILS_REQUIRED';
  end if;

  select * into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then raise exception 'RIDE_NOT_FOUND'; end if;
  if v_ride.departure_time <= now() then raise exception 'RIDE_DEPARTED'; end if;
  if v_ride.full_van_booked then raise exception 'TRIP_FULLY_BOOKED'; end if;

  if p_booking_type = 'full_van' then
    if not v_ride.allow_entire_van_booking or v_ride.entire_van_price is null then
      raise exception 'FULL_VAN_UNAVAILABLE';
    end if;
    if v_ride.seats_available <> v_ride.seats_total then
      raise exception 'FULL_VAN_UNAVAILABLE';
    end if;
    v_seats := v_ride.seats_total;
    v_total := v_ride.entire_van_price;
  elsif p_booking_type = 'seat' then
    if p_seats < 1 then raise exception 'INVALID_SEAT_COUNT'; end if;
    if v_ride.seats_available < p_seats then raise exception 'NOT_ENOUGH_SEATS'; end if;
    v_seats := p_seats;
    v_total := v_ride.price_per_seat * p_seats;
  else
    raise exception 'INVALID_BOOKING_TYPE';
  end if;

  update public.rides
  set seats_available = seats_available - v_seats,
      full_van_booked = (p_booking_type = 'full_van')
  where id = p_ride_id;

  insert into public.bookings (
    ride_id, passenger_name, passenger_phone, seats_booked, total_price,
    payment_status, user_id, booking_type, source, status
  ) values (
    p_ride_id, trim(p_passenger_name), trim(p_passenger_phone), v_seats, v_total,
    'pending', auth.uid(), p_booking_type, 'platform', 'confirmed'
  ) returning id into v_booking_id;

  return v_booking_id;
end;
$$;

create or replace function public.adjust_ride_availability(
  p_ride_id uuid,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.rides%rowtype;
  v_next integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then raise exception 'RIDE_NOT_FOUND'; end if;
  if v_ride.user_id <> auth.uid() and not public.is_marketplace_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if v_ride.full_van_booked then raise exception 'TRIP_FULLY_BOOKED'; end if;

  v_next := v_ride.seats_available + p_delta;
  if v_next < 0 then raise exception 'NOT_ENOUGH_SEATS'; end if;
  if v_next > v_ride.seats_total then raise exception 'ABOVE_CAPACITY'; end if;

  update public.rides set seats_available = v_next where id = p_ride_id;
  return v_next;
end;
$$;

create or replace function public.create_external_booking(
  p_ride_id uuid,
  p_seats integer,
  p_passenger_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.rides%rowtype;
  v_booking_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_seats < 1 then raise exception 'INVALID_SEAT_COUNT'; end if;

  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then raise exception 'RIDE_NOT_FOUND'; end if;
  if v_ride.user_id <> auth.uid() and not public.is_marketplace_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if v_ride.full_van_booked then raise exception 'TRIP_FULLY_BOOKED'; end if;
  if v_ride.seats_available < p_seats then raise exception 'NOT_ENOUGH_SEATS'; end if;

  update public.rides
  set seats_available = seats_available - p_seats
  where id = p_ride_id;

  insert into public.bookings (
    ride_id, passenger_name, seats_booked, total_price, payment_status,
    user_id, booking_type, source, status
  ) values (
    p_ride_id, nullif(trim(p_passenger_name), ''), p_seats, v_ride.price_per_seat * p_seats,
    'external', null, 'seat', 'external', 'confirmed'
  ) returning id into v_booking_id;

  return v_booking_id;
end;
$$;

create or replace function public.cancel_trip_booking(p_booking_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_ride public.rides%rowtype;
  v_seats_available integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;

  select * into v_ride from public.rides where id = v_booking.ride_id for update;
  if v_booking.user_id is distinct from auth.uid()
     and v_ride.user_id <> auth.uid()
     and not public.is_marketplace_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if v_booking.status = 'cancelled' then return v_ride.seats_available; end if;

  update public.bookings set status = 'cancelled' where id = p_booking_id;
  update public.rides
  set seats_available = least(seats_total, seats_available + v_booking.seats_booked),
      full_van_booked = case when v_booking.booking_type = 'full_van' then false else full_van_booked end
  where id = v_booking.ride_id
  returning seats_available into v_seats_available;

  return v_seats_available;
end;
$$;

alter table public.rides enable row level security;
alter table public.bookings enable row level security;
alter table public.requests enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('rides', 'bookings', 'requests')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

create policy rides_public_read on public.rides for select using (true);
create policy rides_owner_insert on public.rides for insert to authenticated
  with check (auth.uid() = user_id);
create policy rides_owner_update on public.rides for update to authenticated
  using (auth.uid() = user_id or public.is_marketplace_admin())
  with check (auth.uid() = user_id or public.is_marketplace_admin());
create policy rides_owner_delete on public.rides for delete to authenticated
  using (auth.uid() = user_id or public.is_marketplace_admin());

create policy bookings_parties_read on public.bookings for select to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.rides where rides.id = bookings.ride_id and rides.user_id = auth.uid())
    or public.is_marketplace_admin()
  );

create policy requests_public_read on public.requests for select using (true);
create policy requests_owner_insert on public.requests for insert to authenticated
  with check (auth.uid() = user_id);
create policy requests_owner_update on public.requests for update to authenticated
  using (auth.uid() = user_id or public.is_marketplace_admin())
  with check (auth.uid() = user_id or public.is_marketplace_admin());
create policy requests_owner_delete on public.requests for delete to authenticated
  using (auth.uid() = user_id or public.is_marketplace_admin());

grant execute on function public.create_trip_booking(uuid, text, text, integer, text) to anon, authenticated;
grant execute on function public.adjust_ride_availability(uuid, integer) to authenticated;
grant execute on function public.create_external_booking(uuid, integer, text) to authenticated;
grant execute on function public.cancel_trip_booking(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_marketplace_admin',
    'create_trip_booking',
    'adjust_ride_availability',
    'create_external_booking',
    'cancel_trip_booking'
  )
order by routine_name;
