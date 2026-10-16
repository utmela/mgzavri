-- Safe for an existing project: all fixtures and helper functions roll back.
-- Do NOT concatenate with bootstrap.sql. This uses real Supabase auth objects.
begin;
create function public.backend_smoke_assert(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end;
$$;
create function public.backend_smoke_throws(statement text, expected text) returns void language plpgsql as $$
declare caught boolean := false; begin
  begin execute statement;
  exception when others then
    caught := true;
    if sqlstate <> expected and position(expected in sqlerrm) = 0 then raise exception 'Unexpected failure: % (%)', sqlerrm, sqlstate; end if;
  end;
  if not caught then raise exception 'Expected rejection: %', statement; end if;
end;
$$;

select set_config('test.passenger', gen_random_uuid()::text, true);
select set_config('test.driver', gen_random_uuid()::text, true);
select set_config('test.outsider', gen_random_uuid()::text, true);
insert into auth.users(id, raw_user_meta_data) values
  (current_setting('test.passenger')::uuid, '{"name":"Backend test passenger","role":"admin"}'),
  (current_setting('test.driver')::uuid, '{"name":"Backend test driver"}'),
  (current_setting('test.outsider')::uuid, '{}');
select public.backend_smoke_assert((select role = 'passenger' from public.profiles where id = current_setting('test.passenger')::uuid), 'signup cannot assign admin');
update public.profiles set role = 'verified_driver' where id = current_setting('test.driver')::uuid;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.passenger'), true);
select public.backend_smoke_throws($q$update public.profiles set role = 'admin' where id = auth.uid()$q$, '42501');
select public.backend_smoke_throws($q$insert into public.rides(user_id,driver_name,phone,from_city,to_city,departure_time,vehicle_type,seats_total,seats_available,price_per_seat) values(auth.uid(),'Test','123','Tbilisi','Batumi',now()+interval '10 days','Van',3,3,20)$q$, '42501');
insert into public.requests(user_id,from_city,to_city,departure_date,passengers,phone)
values(auth.uid(),'Tbilisi','Batumi',current_date+10,2,'123');

select set_config('request.jwt.claim.sub', current_setting('test.driver'), true);
with created as (
  insert into public.rides(user_id,driver_name,phone,from_city,to_city,departure_time,vehicle_type,seats_total,seats_available,price_per_seat,allow_entire_van_booking,entire_van_price)
  values(auth.uid(),'Backend test driver','123','Tbilisi','Batumi',now()+interval '10 days','Van',3,3,20.50,true,50)
  returning id
) select set_config('test.ride', id::text, true) from created;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select public.backend_smoke_assert((select count(id)=1 from public.rides where id=current_setting('test.ride')::uuid), 'public trip read');
select public.backend_smoke_throws($q$select phone from public.rides$q$, '42501');
select public.backend_smoke_throws($q$select * from public.profiles$q$, '42501');
select public.backend_smoke_throws($q$select public.create_trip_booking(current_setting('test.ride')::uuid,'Test','123',1,'seat')$q$, '42501');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.passenger'), true);
select public.backend_smoke_assert(public.get_driver_phone(current_setting('test.ride')::uuid) is null, 'contact hidden before booking');
select set_config('test.booking', public.create_trip_booking(current_setting('test.ride')::uuid,'Backend test passenger','123',2,'seat')::text, true);
select public.backend_smoke_assert((select seats_available=1 from public.rides where id=current_setting('test.ride')::uuid), 'booking decrements inventory');
select public.backend_smoke_assert((select total_price=41 from public.bookings where id=current_setting('test.booking')::uuid), 'server computes decimal price');
select public.backend_smoke_assert(public.get_driver_phone(current_setting('test.ride')::uuid) = '123', 'confirmed passenger contact');
select public.backend_smoke_throws($q$select public.create_trip_booking(current_setting('test.ride')::uuid,'Test','123',2,'seat')$q$, 'NOT_ENOUGH_SEATS');

select set_config('request.jwt.claim.sub', current_setting('test.outsider'), true);
select public.backend_smoke_assert((select count(*)=0 from public.bookings where id=current_setting('test.booking')::uuid), 'other passenger cannot read booking');
select public.backend_smoke_assert((select count(*)=0 from public.requests where user_id=current_setting('test.passenger')::uuid), 'other passenger cannot read request');
select public.backend_smoke_throws($q$select public.cancel_trip_booking(current_setting('test.booking')::uuid)$q$, 'NOT_AUTHORIZED');

select set_config('request.jwt.claim.sub', current_setting('test.driver'), true);
select public.backend_smoke_assert((select count(*)=1 from public.requests where user_id=current_setting('test.passenger')::uuid), 'driver sees passenger request');
select public.backend_smoke_throws($q$delete from public.rides where id=current_setting('test.ride')::uuid$q$, 'TRIP_HAS_BOOKINGS');
select public.backend_smoke_throws($q$select public.adjust_ride_availability(current_setting('test.ride')::uuid,1)$q$, 'ABOVE_CAPACITY');

select set_config('request.jwt.claim.sub', current_setting('test.passenger'), true);
select public.cancel_trip_booking(current_setting('test.booking')::uuid);
select public.cancel_trip_booking(current_setting('test.booking')::uuid);
select public.backend_smoke_assert((select seats_available=3 from public.rides where id=current_setting('test.ride')::uuid), 'cancellation restores inventory exactly once');
select public.backend_smoke_assert(public.get_driver_phone(current_setting('test.ride')::uuid) is null, 'cancelled passenger contact revoked');
select set_config('test.full_booking', public.create_trip_booking(current_setting('test.ride')::uuid,'Test','123',1,'full_van')::text, true);
select public.backend_smoke_assert((select full_van_booked and seats_available=0 from public.rides where id=current_setting('test.ride')::uuid), 'full van reservation');
select public.cancel_trip_booking(current_setting('test.full_booking')::uuid);
reset role;
select jsonb_build_object('status','passed','checks',21,'fixtures','rolled back') as result;
rollback;
