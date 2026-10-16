begin;

create table private.marketplace_settings (
  singleton boolean primary key default true check(singleton),
  writes_enabled boolean not null default true
);
insert into private.marketplace_settings(singleton,writes_enabled) values(true,true);
alter table private.marketplace_settings enable row level security;
revoke all on private.marketplace_settings from public,anon,authenticated;

create table private.rate_limits (
  actor uuid not null, action text not null, period_seconds integer not null,
  window_start timestamptz not null, requests integer not null,
  primary key(actor, action, period_seconds)
);
create table private.booking_requests (
  actor uuid not null, request_id uuid not null, fingerprint text not null,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  created_at timestamptz not null default now(), primary key(actor,request_id)
);
create table private.audit_events (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, entity text not null, record_id uuid,
  created_at timestamptz not null default now()
);
create index audit_events_created_idx on private.audit_events(created_at desc);
alter table private.rate_limits enable row level security;
alter table private.booking_requests enable row level security;
alter table private.audit_events enable row level security;
revoke all on all tables in schema private from public,anon,authenticated;

create function private.consume_budget(p_action text,p_limit integer,p_period integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_count integer; bucket timestamptz; begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  bucket := to_timestamp(floor(extract(epoch from clock_timestamp())/p_period)*p_period);
  insert into private.rate_limits(actor,action,period_seconds,window_start,requests)
  values(auth.uid(),p_action,p_period,bucket,1)
  on conflict(actor,action,period_seconds) do update set
    requests=case when private.rate_limits.window_start < bucket then 1 else least(private.rate_limits.requests+1,p_limit+1) end,
    window_start=bucket
  returning requests into current_count;
  return current_count<=p_limit;
end;
$$;
revoke all on function private.consume_budget(text,integer,integer) from public,anon,authenticated;

-- Separate committed API call counts failed write attempts as well as successes.
create function public.consume_api_write_budget()
returns boolean language sql security definer set search_path='' as $$
  select private.consume_budget('api_write',30,60);
$$;
revoke all on function public.consume_api_write_budget() from public,anon,authenticated;
grant execute on function public.consume_api_write_budget() to authenticated;

create function private.enforce_write_budget()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null then
    if not (select writes_enabled from private.marketplace_settings where singleton) then raise exception 'MAINTENANCE'; end if;
    if not private.consume_budget('database_write',120,60) then raise exception 'RATE_LIMITED'; end if;
    if TG_OP='INSERT' and TG_TABLE_NAME in ('rides','requests')
      and not private.consume_budget(TG_TABLE_NAME||'_created',6,3600) then raise exception 'RATE_LIMITED'; end if;
    if TG_OP='INSERT' and TG_TABLE_NAME='bookings'
      and not private.consume_budget('bookings_created',12,60) then raise exception 'RATE_LIMITED'; end if;
  end if;
  if TG_OP='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.enforce_write_budget() from public,anon,authenticated;
create trigger enforce_ride_write_budget before insert or update or delete on public.rides
for each row execute function private.enforce_write_budget();
create trigger enforce_booking_write_budget before insert or update on public.bookings
for each row execute function private.enforce_write_budget();
create trigger enforce_request_write_budget before insert or update or delete on public.requests
for each row execute function private.enforce_write_budget();

-- One active platform reservation per passenger/trip. The booked seat count
-- represents the whole group. Historical/cancelled bookings remain intact.
create unique index bookings_one_active_passenger_trip on public.bookings(user_id,ride_id)
where user_id is not null and source='platform' and status='confirmed';

create function public.reserve_trip_booking(p_request_id uuid,p_ride_id uuid,
  p_passenger_name text,p_passenger_phone text,p_seats integer,
  p_booking_type text default 'seat',p_source text default 'platform')
returns uuid language plpgsql security definer set search_path='' as $$
declare previous private.booking_requests%rowtype; fingerprint text; booking uuid; begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_request_id is null then raise exception 'INVALID_REQUEST_ID'; end if;
  if p_source not in ('platform','external') or p_source is null then raise exception 'INVALID_BOOKING_SOURCE'; end if;
  fingerprint := encode(sha256(convert_to(jsonb_build_array(p_ride_id,trim(p_passenger_name),trim(p_passenger_phone),p_seats,p_booking_type,p_source)::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||p_request_id::text,0));
  select * into previous from private.booking_requests where actor=auth.uid() and request_id=p_request_id;
  if found then
    if previous.fingerprint<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    if exists(select 1 from public.bookings where id=previous.booking_id and status='cancelled') then raise exception 'BOOKING_CANCELLED'; end if;
    return previous.booking_id;
  end if;
  if p_source='external' then
    if p_booking_type<>'seat' then raise exception 'INVALID_BOOKING_TYPE'; end if;
    booking := public.create_external_booking(p_ride_id,p_seats,p_passenger_name);
  else
    booking := public.create_trip_booking(p_ride_id,p_passenger_name,p_passenger_phone,p_seats,p_booking_type);
  end if;
  insert into private.booking_requests(actor,request_id,fingerprint,booking_id)
  values(auth.uid(),p_request_id,fingerprint,booking);
  return booking;
end;
$$;
revoke all on function public.reserve_trip_booking(uuid,uuid,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.reserve_trip_booking(uuid,uuid,text,text,integer,text,text) to authenticated;

create function private.audit_marketplace_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='DELETE' then
    insert into private.audit_events(actor,action,entity,record_id) values(auth.uid(),TG_OP,TG_TABLE_NAME,old.id);
    return old;
  end if;
  insert into private.audit_events(actor,action,entity,record_id) values(auth.uid(),TG_OP,TG_TABLE_NAME,new.id);
  return new;
end;
$$;
revoke all on function private.audit_marketplace_change() from public,anon,authenticated;
create trigger audit_ride_change after insert or update or delete on public.rides
for each row execute function private.audit_marketplace_change();
create trigger audit_booking_change after insert or update on public.bookings
for each row execute function private.audit_marketplace_change();
create trigger audit_request_change after insert or update or delete on public.requests
for each row execute function private.audit_marketplace_change();
create trigger audit_profile_change after update on public.profiles
for each row execute function private.audit_marketplace_change();

-- Admin policies require a server-verified MFA session, including direct RPCs.
create or replace function public.is_marketplace_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((auth.jwt()->>'aal')='aal2',false) and exists(
    select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create or replace function public.can_view_passenger_requests()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('driver','verified_driver'))
    or public.is_marketplace_admin();
$$;

create function public.get_admin_audit(p_limit integer default 50)
returns table(id bigint,actor uuid,action text,entity text,record_id uuid,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_marketplace_admin() then raise exception 'NOT_AUTHORIZED'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'INVALID_LIMIT'; end if;
  return query select a.id,a.actor,a.action,a.entity,a.record_id,a.created_at from private.audit_events a order by a.created_at desc,a.id desc limit p_limit;
end;
$$;
revoke all on function public.get_admin_audit(integer) from public,anon,authenticated;
grant execute on function public.get_admin_audit(integer) to authenticated;

-- Use cached per-statement auth lookups for common ownership policies.
alter policy profiles_self_read on public.profiles using(id=(select auth.uid()) or (select public.is_marketplace_admin()));
alter policy profiles_self_update on public.profiles using(id=(select auth.uid())) with check(id=(select auth.uid()));
alter policy rides_owner_delete on public.rides using(user_id=(select auth.uid()) or (select public.is_marketplace_admin()));
alter policy requests_authorized_read on public.requests using(user_id=(select auth.uid()) or (select public.can_view_passenger_requests()));
alter policy requests_owner_insert on public.requests with check(user_id=(select auth.uid()));
alter policy requests_owner_update on public.requests using(user_id=(select auth.uid()) or (select public.is_marketplace_admin())) with check(user_id=(select auth.uid()) or (select public.is_marketplace_admin()));
alter policy requests_owner_delete on public.requests using(user_id=(select auth.uid()) or (select public.is_marketplace_admin()));

notify pgrst,'reload schema';
commit;
