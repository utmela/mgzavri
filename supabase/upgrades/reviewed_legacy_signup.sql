-- Preflight adapter for the inspected legacy project. Run in the SAME transaction
-- as 202609060001_security_foundation.sql, with its BEGIN/COMMIT removed.
-- Stop on any unknown signup behavior; never drop unreviewed triggers.
do $$
declare trigger_function oid;
begin
  select tgfoid into trigger_function from pg_trigger
  where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created' and not tgisinternal;
  if trigger_function is not null then
    if trigger_function <> to_regprocedure('public.handle_new_user()')
      or pg_get_functiondef(trigger_function) not like '%VALUES (new.id, ''driver'', now())%'
    then raise exception 'Unknown legacy signup trigger; review before upgrading'; end if;
    drop trigger on_auth_user_created on auth.users;
    -- No remaining triggers may depend on this retired privilege-granting function.
    drop function public.handle_new_user();
  end if;
end;
$$;
