begin;
create function public.test_assert(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end;
$$;
create function public.test_throws(statement text, expected text) returns void language plpgsql as $$
declare caught boolean := false; begin
  begin execute statement;
  exception when others then
    caught := true;
    if sqlstate <> expected and position(expected in sqlerrm) = 0 then
      raise exception 'Unexpected failure: % (%)', sqlerrm, sqlstate;
    end if;
  end;
  if not caught then raise exception 'Expected rejection: %', statement; end if;
end;
$$;

insert into auth.users(id, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000001', '{"name":"Passenger", "role":"admin"}'),
 ('00000000-0000-0000-0000-000000000002', '{"name":"Driver"}'),
 ('00000000-0000-0000-0000-000000000003', '{}'),
 ('00000000-0000-0000-0000-000000000004', '{}');
select public.test_assert((select role = 'passenger' from public.profiles where id = '00000000-0000-0000-0000-000000000001'), 'signup metadata cannot promote to admin');
update public.profiles set role = 'verified_driver' where id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000004';
insert into private.admin_allowlist(email) values('admin@example.invalid');
update auth.users set email='admin@example.invalid',email_confirmed_at=now() where id='00000000-0000-0000-0000-000000000004';
select set_config('request.jwt.claims','{"aal":"aal2"}',true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
insert into public.rides(user_id, driver_name, phone, from_city, to_city, departure_time,
  vehicle_type, seats_total, seats_available, price_per_seat, allow_entire_van_booking, entire_van_price)
values (auth.uid(), 'Driver', '+995555000002', 'Tbilisi', 'Batumi', now() + interval '10 days', 'Van', 8, 8, 20, true, 140);
select public.test_assert((select count(id) = 1 from public.rides), 'driver can post using column grants');
delete from public.rides where user_id = auth.uid();
reset role;

insert into public.rides(id, user_id, driver_name, phone, from_city, to_city, departure_time,
  vehicle_type, seats_total, seats_available, price_per_seat, allow_entire_van_booking, entire_van_price)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
  'Driver', '+995555000002', 'Tbilisi', 'Batumi', now() + interval '10 days', 'Van', 8, 8, 20, true, 140);
insert into public.requests(user_id, from_city, to_city, departure_date, passengers, phone)
values ('00000000-0000-0000-0000-000000000001', 'Tbilisi', 'Batumi', current_date + 10, 2, '+995555000001');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select public.test_assert((select count(id) = 1 from public.rides), 'anonymous route browsing works');
select public.test_throws('select phone from public.rides', '42501');
select public.test_throws('select * from public.rides', '42501');
select public.test_throws('select * from public.requests', '42501');
select public.test_throws('select * from public.profiles', '42501');
select public.test_throws('select * from public.bookings', '42501');
select public.test_throws($q$select public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Bot', '123', 1, 'seat')$q$, '42501');
select public.test_throws($q$select public.get_driver_phone('10000000-0000-0000-0000-000000000001')$q$, '42501');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select public.test_assert((select count(*) = 0 from public.requests), 'unrelated passenger cannot read requests');
select public.test_assert((select count(*) = 1 from public.profiles), 'only own profile visible');
select public.test_assert(not public.can_view_passenger_requests(), 'passenger cannot open driver requests');
select public.test_assert(public.get_driver_phone('10000000-0000-0000-0000-000000000001') is null, 'contact hidden before booking');
select public.test_throws('select phone from public.rides', '42501');
select public.test_throws($q$update public.profiles set role = 'admin' where id = auth.uid()$q$, '42501');
select public.test_throws($q$update public.rides set seats_available = 8$q$, '42501');
select public.test_throws($q$select public.adjust_ride_availability('10000000-0000-0000-0000-000000000001', -1)$q$, 'NOT_AUTHORIZED');
select public.test_throws($q$select private.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Bot', '123', 1, 'seat')$q$, '42501');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.test_assert((select count(*) = 1 from public.requests), 'passenger can read own request');
select public.test_throws($q$select public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Passenger', '+995555000001', null, 'seat')$q$, 'INVALID_SEAT_COUNT');
select public.test_throws($q$select public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Passenger', '+995555000001', 9, 'seat')$q$, 'NOT_ENOUGH_SEATS');
select set_config('test.booking_id', public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Passenger', '+995555000001', 3, 'seat')::text, true);
select public.test_assert((select seats_available = 5 from public.rides), 'booking consumes three seats');
select public.test_assert((select total_price = 60 from public.bookings), 'database calculates price');
select public.test_assert(public.get_driver_phone('10000000-0000-0000-0000-000000000001') = '+995555000002', 'confirmed passenger can get driver contact');
select public.test_throws($q$select public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Passenger', '+995555000001', 1, 'full_van')$q$, 'FULL_VAN_UNAVAILABLE');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select public.test_assert((select count(*) = 0 from public.bookings), 'unrelated passenger cannot read bookings');
select public.test_throws($q$select public.cancel_trip_booking(current_setting('test.booking_id')::uuid)$q$, 'NOT_AUTHORIZED');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select public.test_assert(public.can_view_passenger_requests(), 'approved driver can view requests');
select public.test_assert((select count(*) = 1 from public.requests), 'driver sees request');
select public.test_assert((select count(*) = 1 from public.bookings), 'driver sees own passengers');
select public.test_throws($q$select public.adjust_ride_availability('10000000-0000-0000-0000-000000000001', 1)$q$, 'ABOVE_CAPACITY');
select public.test_throws($q$delete from public.rides where id = '10000000-0000-0000-0000-000000000001'$q$, 'TRIP_HAS_BOOKINGS');
select public.update_trip_details('10000000-0000-0000-0000-000000000001', 'Van', now() + interval '10 days', 9, 20, null, null, true, 140);
select public.test_assert((select seats_available = 6 from public.rides), 'capacity edit preserves occupied seats');
select public.test_throws($q$select public.update_trip_details('10000000-0000-0000-0000-000000000001', 'Van', now() + interval '10 days', 2, 20, null, null, true, 140)$q$, 'INVALID_SEAT_COUNT');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.cancel_trip_booking(current_setting('test.booking_id')::uuid);
select public.cancel_trip_booking(current_setting('test.booking_id')::uuid);
select public.test_assert((select seats_available = 9 from public.rides), 'repeated cancellation restores seats only once');
select public.test_assert(public.get_driver_phone('10000000-0000-0000-0000-000000000001') is null, 'cancelled passenger loses contact access');
select set_config('test.full_booking_id', public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Passenger', '+995555000001', 1, 'full_van')::text, true);
select public.test_assert((select full_van_booked and seats_available = 0 from public.rides), 'full van reserves entire inventory');
select public.test_throws($q$select public.create_trip_booking('10000000-0000-0000-0000-000000000001', 'Passenger', '+995555000001', 1, 'seat')$q$, 'TRIP_FULLY_BOOKED');
select public.cancel_trip_booking(current_setting('test.full_booking_id')::uuid);
select public.test_assert((select not full_van_booked and seats_available = 9 from public.rides), 'full van cancellation restores inventory');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
select public.test_assert(public.is_marketplace_admin(), 'admin role recognized by database');
select public.test_assert((select count(*) = 4 from public.profiles), 'admin sees profiles');
select public.test_assert(public.get_driver_phone('10000000-0000-0000-0000-000000000001') is not null, 'admin contact lookup allowed');
reset role;
rollback;
