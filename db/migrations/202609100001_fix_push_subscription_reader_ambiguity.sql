begin;

create or replace function nakshatra_admin.get_admin_push_subscription(
  p_endpoint text
) returns table(endpoint text, expiration_time timestamptz, p256dh text, auth text)
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
begin
  delete from nakshatra_admin.admin_push_subscriptions s
  where (s.expiration_time is not null and s.expiration_time <= v_now)
    or s.last_confirmed_at <= v_now - interval '30 days';
  return query
  select s.endpoint, s.expiration_time, s.p256dh, s.auth
  from nakshatra_admin.admin_push_subscriptions s
  where s.endpoint = p_endpoint and s.enabled = true;
end;
$$;

create or replace function nakshatra_admin.list_admin_push_subscriptions()
returns table(endpoint text, expiration_time timestamptz, p256dh text, auth text)
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
begin
  delete from nakshatra_admin.admin_push_subscriptions s
  where (s.expiration_time is not null and s.expiration_time <= v_now)
    or s.last_confirmed_at <= v_now - interval '30 days';
  return query
  select s.endpoint, s.expiration_time, s.p256dh, s.auth
  from nakshatra_admin.admin_push_subscriptions s
  where s.enabled = true;
end;
$$;

commit;
