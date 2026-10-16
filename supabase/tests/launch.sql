begin;
create function public.launch_assert(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; end;
$$;
create function public.launch_throws(statement text,expected text) returns void language plpgsql as $$
declare caught boolean:=false; begin
  begin execute statement; exception when others then caught:=true;
    if position(expected in sqlerrm)=0 and sqlstate<>expected then raise exception 'Unexpected failure: % (%)',sqlerrm,sqlstate; end if;
  end;
  if not caught then raise exception 'Expected rejection: %',statement; end if;
end;
$$;
select set_config('test.owner',gen_random_uuid()::text,true);
select set_config('test.passenger',gen_random_uuid()::text,true);
select set_config('test.admin',gen_random_uuid()::text,true);
insert into private.admin_allowlist(email) values('launch-admin@example.invalid');
insert into auth.users(id,email,raw_user_meta_data) values
 (current_setting('test.owner')::uuid,'launch-driver@example.invalid','{}'),
 (current_setting('test.passenger')::uuid,'launch-passenger@example.invalid','{"role":"admin"}'),
 (current_setting('test.admin')::uuid,'launch-admin@example.invalid','{}');
select public.launch_assert((select role='passenger' from public.profiles where id=current_setting('test.admin')::uuid),'unverified allowlisted email has no admin role');
update auth.users set email_confirmed_at=now() where id=current_setting('test.admin')::uuid;
select public.launch_assert((select role='admin' from public.profiles where id=current_setting('test.admin')::uuid),'verified allowlisted email receives admin role');
update public.profiles set role='verified_driver' where id=current_setting('test.owner')::uuid;
with created as(insert into public.rides(user_id,driver_name,phone,from_city,to_city,departure_time,vehicle_type,seats_total,seats_available,price_per_seat)
 values(current_setting('test.owner')::uuid,'Test driver','123','Tbilisi','Batumi',now()+interval '10 days','Van',4,4,20) returning id)
select set_config('test.ride',id::text,true) from created;

set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
select set_config('request.jwt.claims','{"aal":"aal1"}',true);
select public.launch_assert(not public.is_marketplace_admin(),'admin password-only session is denied');
select public.launch_throws('select public.get_admin_audit(10)','NOT_AUTHORIZED');
select set_config('request.jwt.claims','{"aal":"aal2"}',true);
select public.launch_assert(public.is_marketplace_admin(),'verified allowlisted admin with MFA is accepted');
select public.launch_assert((select count(*)>0 from public.get_admin_audit(10)),'MFA admin can review private audit records');
select public.launch_throws('select * from private.admin_allowlist','42501');

select set_config('request.jwt.claim.sub',current_setting('test.passenger'),true);
select set_config('request.jwt.claims','{"aal":"aal1"}',true);
select set_config('test.key',gen_random_uuid()::text,true);
select set_config('test.booking',public.reserve_trip_booking(current_setting('test.key')::uuid,current_setting('test.ride')::uuid,'Test','123',2,'seat','platform')::text,true);
select public.launch_assert(public.reserve_trip_booking(current_setting('test.key')::uuid,current_setting('test.ride')::uuid,'Test','123',2,'seat','platform')=current_setting('test.booking')::uuid,'retry returns original booking');
select public.launch_assert((select seats_available=2 from public.rides where id=current_setting('test.ride')::uuid),'retry does not consume more inventory');
select public.launch_throws($q$select public.reserve_trip_booking(current_setting('test.key')::uuid,current_setting('test.ride')::uuid,'Test','123',1,'seat','platform')$q$,'IDEMPOTENCY_CONFLICT');
select public.launch_throws($q$select public.reserve_trip_booking(gen_random_uuid(),current_setting('test.ride')::uuid,'Test','123',1,'seat','platform')$q$,'23505');
select public.cancel_trip_booking(current_setting('test.booking')::uuid);
select public.launch_throws($q$select public.reserve_trip_booking(current_setting('test.key')::uuid,current_setting('test.ride')::uuid,'Test','123',2,'seat','platform')$q$,'BOOKING_CANCELLED');
select public.launch_throws('select * from private.audit_events','42501');
select public.launch_throws('select * from private.booking_requests','42501');
do $$ declare i integer; begin
 for i in 1..30 loop perform public.launch_assert(public.consume_api_write_budget(),'write budget available'); end loop;
 perform public.launch_assert(not public.consume_api_write_budget(),'write budget blocks excess attempts');
end; $$;
reset role;
update private.marketplace_settings set writes_enabled=false where singleton;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.passenger'),true);
select public.launch_throws($q$select public.reserve_trip_booking(gen_random_uuid(),current_setting('test.ride')::uuid,'Test','123',1,'seat','platform')$q$,'MAINTENANCE');
reset role;
update private.marketplace_settings set writes_enabled=true where singleton;
update auth.users set email='launch-former-admin@example.invalid' where id=current_setting('test.admin')::uuid;
select public.launch_assert((select role='passenger' from public.profiles where id=current_setting('test.admin')::uuid),'changing away from approved email revokes admin');
select jsonb_build_object('status','passed','fixtures','rolled back') as launch_result;
rollback;
