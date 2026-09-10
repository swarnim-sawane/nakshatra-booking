begin;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'nakshatra_runtime') then
    raise exception 'Create the nakshatra_runtime login role before running this migration';
  end if;

  -- Console/API-created Neon roles inherit neon_superuser. The runtime role
  -- must instead be created with SQL so it starts without administrative access.
  if pg_has_role('nakshatra_runtime', 'neon_superuser', 'member') then
    raise exception 'nakshatra_runtime must not inherit neon_superuser';
  end if;
end;
$$;

create schema if not exists nakshatra_admin;
revoke all on schema nakshatra_admin from public;
revoke all on schema public from nakshatra_runtime;

create table if not exists nakshatra_admin.calid_webhook_deliveries (
  event_id text primary key,
  trigger text not null check (trigger in (
    'BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'
  )),
  booking_uid text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null,
  retain_until timestamptz not null default (statement_timestamp() + interval '30 days'),
  inserted_at timestamptz not null default statement_timestamp()
);

alter table nakshatra_admin.calid_webhook_deliveries
  add column if not exists retain_until timestamptz;
update nakshatra_admin.calid_webhook_deliveries
set retain_until = coalesce(received_at, inserted_at, statement_timestamp()) + interval '30 days'
where retain_until is null;
alter table nakshatra_admin.calid_webhook_deliveries
  alter column retain_until set default (statement_timestamp() + interval '30 days'),
  alter column retain_until set not null;

create index if not exists calid_webhook_deliveries_booking_uid_idx
  on nakshatra_admin.calid_webhook_deliveries (booking_uid);
create index if not exists calid_webhook_deliveries_retain_until_idx
  on nakshatra_admin.calid_webhook_deliveries (retain_until);

create table if not exists nakshatra_admin.calid_booking_state (
  booking_uid text primary key,
  event_type_slug text not null check (event_type_slug in (
    'personal-consultation', 'relationship-consultation', 'best-date-analysis'
  )),
  customer_first_name text not null check (
    char_length(customer_first_name) between 1 and 80
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  lifecycle_status text not null check (lifecycle_status in (
    'confirmed', 'paid', 'rescheduled', 'cancelled'
  )),
  meeting_url text check (meeting_url is null or meeting_url ~ '^https://'),
  created_at timestamptz,
  paid_at timestamptz,
  rescheduled_at timestamptz,
  cancelled_at timestamptz,
  rescheduled_from_uid text,
  replaced_by_uid text,
  last_event_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists calid_booking_state_starts_at_idx
  on nakshatra_admin.calid_booking_state (starts_at);
create index if not exists calid_booking_state_retention_idx
  on nakshatra_admin.calid_booking_state (ends_at, cancelled_at);

create table if not exists nakshatra_admin.admin_push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://'),
  expiration_time timestamptz,
  p256dh text not null,
  auth text not null,
  enabled boolean not null default true,
  last_confirmed_at timestamptz not null default statement_timestamp(),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

alter table nakshatra_admin.admin_push_subscriptions
  add column if not exists last_confirmed_at timestamptz not null default statement_timestamp();

create table if not exists nakshatra_admin.admin_login_rate_limits (
  scope text not null check (scope in ('source', 'account')),
  limiter_key text not null check (char_length(limiter_key) between 1 and 128),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  last_attempt_at timestamptz not null,
  primary key (scope, limiter_key)
);

create index if not exists admin_login_rate_limits_last_attempt_idx
  on nakshatra_admin.admin_login_rate_limits (last_attempt_at);

create table if not exists nakshatra_admin.admin_push_outbox (
  event_id text primary key references nakshatra_admin.calid_webhook_deliveries(event_id) on delete cascade,
  trigger text not null check (trigger in (
    'BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'
  )),
  attempts integer not null default 0,
  locked_until timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default statement_timestamp()
);

-- Remove the older caller-clock overloads if this hardening is applied to a
-- database that already received an earlier revision of this migration.
drop function if exists nakshatra_admin.apply_calid_webhook_event(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, timestamptz, text
);
drop function if exists nakshatra_admin.list_admin_bookings(timestamptz);
drop function if exists nakshatra_admin.remove_admin_booking(text, timestamptz);
drop function if exists nakshatra_admin.get_admin_push_subscription(text, timestamptz);
drop function if exists nakshatra_admin.list_admin_push_subscriptions(timestamptz);
drop function if exists nakshatra_admin.claim_admin_push_delivery(text, timestamptz);
drop function if exists nakshatra_admin.complete_admin_push_delivery(
  text, boolean, text, timestamptz
);
drop function if exists nakshatra_admin.cleanup_retention(timestamptz);

create or replace function nakshatra_admin.cleanup_retention()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
  v_bookings integer := 0;
  v_booking_uid text;
  v_removed integer := 0;
  v_outbox integer := 0;
  v_deliveries integer := 0;
  v_subscriptions integer := 0;
begin
  -- Use the same deterministic per-booking locks as webhook ingestion and
  -- manual removal. Re-check eligibility after locking so a concurrent
  -- lifecycle event cannot be deleted or recreated across the retention edge.
  for v_booking_uid in
    select b.booking_uid
    from nakshatra_admin.calid_booking_state b
    where (
      b.lifecycle_status = 'cancelled'
      and b.cancelled_at is not null
      and b.cancelled_at <= v_now - interval '7 days'
    ) or (
      b.lifecycle_status <> 'cancelled'
      and b.ends_at <= v_now - interval '7 days'
    )
    order by b.booking_uid collate "C"
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_booking_uid, 137));

    if exists (
      select 1
      from nakshatra_admin.calid_booking_state b
      where b.booking_uid = v_booking_uid
        and (
          (
            b.lifecycle_status = 'cancelled'
            and b.cancelled_at is not null
            and b.cancelled_at <= v_now - interval '7 days'
          ) or (
            b.lifecycle_status <> 'cancelled'
            and b.ends_at <= v_now - interval '7 days'
          )
        )
    ) then
      -- Extend replay protection before removing the customer-bearing row.
      update nakshatra_admin.calid_webhook_deliveries
      set retain_until = greatest(retain_until, v_now + interval '30 days')
      where booking_uid = v_booking_uid;

      delete from nakshatra_admin.calid_booking_state
      where booking_uid = v_booking_uid;
      get diagnostics v_removed = row_count;
      v_bookings := v_bookings + v_removed;
    end if;
  end loop;

  update nakshatra_admin.admin_push_outbox o
  set
    delivered_at = v_now,
    locked_until = null,
    last_error_code = 'customer-record-removed'
  from nakshatra_admin.calid_webhook_deliveries d
  where o.event_id = d.event_id
    and o.delivered_at is null
    and not exists (
      select 1 from nakshatra_admin.calid_booking_state b
      where b.booking_uid = d.booking_uid
    );

  delete from nakshatra_admin.admin_push_outbox
  where delivered_at is not null
    and created_at <= v_now - interval '30 days';
  get diagnostics v_outbox = row_count;

  delete from nakshatra_admin.calid_webhook_deliveries d
  where d.retain_until <= v_now
    and not exists (
      select 1 from nakshatra_admin.calid_booking_state b
      where b.booking_uid = d.booking_uid
    );
  get diagnostics v_deliveries = row_count;

  delete from nakshatra_admin.admin_push_subscriptions
  where (expiration_time is not null and expiration_time <= v_now)
    or last_confirmed_at <= v_now - interval '30 days';
  get diagnostics v_subscriptions = row_count;

  delete from nakshatra_admin.admin_login_rate_limits
  where last_attempt_at <= v_now - interval '1 day';

  return jsonb_build_object(
    'bookings', v_bookings,
    'outbox', v_outbox,
    'deliveries', v_deliveries,
    'subscriptions', v_subscriptions
  );
end;
$$;

create or replace function nakshatra_admin.apply_calid_webhook_event(
  p_event_id text,
  p_trigger text,
  p_booking_uid text,
  p_event_type_slug text,
  p_customer_first_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_meeting_url text,
  p_occurred_at timestamptz,
  p_rescheduled_from_uid text default null
) returns text
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_received_at constant timestamptz := statement_timestamp();
  v_inserted integer;
  v_lock_uid text;
begin
  if p_trigger not in (
    'BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'
  ) or p_event_type_slug not in (
    'personal-consultation', 'relationship-consultation', 'best-date-analysis'
  ) then
    raise exception 'Unsupported Cal ID event';
  end if;

  perform nakshatra_admin.cleanup_retention();

  -- Lock every booking identity touched by this event in bytewise order.
  -- Manual deletion and retention cleanup use the same lock namespace.
  for v_lock_uid in
    select uid
    from unnest(array[p_booking_uid, p_rescheduled_from_uid]) as lock_ids(uid)
    where uid is not null
    group by uid
    order by uid collate "C"
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_lock_uid, 137));
  end loop;

  insert into nakshatra_admin.calid_webhook_deliveries (
    event_id, trigger, booking_uid, occurred_at, received_at, retain_until
  ) values (
    p_event_id, p_trigger, p_booking_uid, p_occurred_at,
    v_received_at, v_received_at + interval '30 days'
  ) on conflict (event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 'duplicate';
  end if;

  -- If the customer row was removed but another delivery is still retained,
  -- keep this minimal delivery ID without reconstructing customer data.
  if not exists (
    select 1 from nakshatra_admin.calid_booking_state
    where booking_uid = p_booking_uid
  ) and exists (
    select 1 from nakshatra_admin.calid_webhook_deliveries
    where booking_uid = p_booking_uid and event_id <> p_event_id
  ) then
    return 'suppressed';
  end if;

  -- Never reintroduce customer data that is beyond its retention boundary.
  if (
    p_trigger = 'BOOKING_CANCELLED'
    and p_occurred_at <= v_received_at - interval '7 days'
  ) or (
    p_trigger <> 'BOOKING_CANCELLED'
    and p_ends_at <= v_received_at - interval '7 days'
  ) then
    return 'suppressed';
  end if;

  insert into nakshatra_admin.calid_booking_state (
    booking_uid, event_type_slug, customer_first_name, starts_at, ends_at,
    lifecycle_status, meeting_url, created_at, paid_at, rescheduled_at,
    cancelled_at, rescheduled_from_uid, last_event_at, updated_at
  ) values (
    p_booking_uid,
    p_event_type_slug,
    p_customer_first_name,
    p_starts_at,
    p_ends_at,
    case p_trigger
      when 'BOOKING_PAID' then 'paid'
      when 'BOOKING_RESCHEDULED' then 'rescheduled'
      when 'BOOKING_CANCELLED' then 'cancelled'
      else 'confirmed'
    end,
    p_meeting_url,
    case when p_trigger = 'BOOKING_CREATED' then p_occurred_at end,
    case when p_trigger = 'BOOKING_PAID' then p_occurred_at end,
    case when p_trigger = 'BOOKING_RESCHEDULED' then p_occurred_at end,
    case when p_trigger = 'BOOKING_CANCELLED' then p_occurred_at end,
    p_rescheduled_from_uid,
    p_occurred_at,
    v_received_at
  )
  on conflict (booking_uid) do update set
    event_type_slug = case
      when excluded.last_event_at >= calid_booking_state.last_event_at
        then excluded.event_type_slug
      else calid_booking_state.event_type_slug
    end,
    customer_first_name = case
      when excluded.last_event_at >= calid_booking_state.last_event_at
        then excluded.customer_first_name
      else calid_booking_state.customer_first_name
    end,
    starts_at = case
      when excluded.last_event_at >= calid_booking_state.last_event_at then excluded.starts_at
      else calid_booking_state.starts_at
    end,
    ends_at = case
      when excluded.last_event_at >= calid_booking_state.last_event_at then excluded.ends_at
      else calid_booking_state.ends_at
    end,
    meeting_url = case
      when excluded.last_event_at >= calid_booking_state.last_event_at
        then coalesce(excluded.meeting_url, calid_booking_state.meeting_url)
      else calid_booking_state.meeting_url
    end,
    created_at = greatest(calid_booking_state.created_at, excluded.created_at),
    paid_at = greatest(calid_booking_state.paid_at, excluded.paid_at),
    rescheduled_at = greatest(calid_booking_state.rescheduled_at, excluded.rescheduled_at),
    cancelled_at = greatest(calid_booking_state.cancelled_at, excluded.cancelled_at),
    rescheduled_from_uid = coalesce(
      calid_booking_state.rescheduled_from_uid,
      excluded.rescheduled_from_uid
    ),
    last_event_at = greatest(calid_booking_state.last_event_at, excluded.last_event_at),
    updated_at = greatest(calid_booking_state.updated_at, excluded.updated_at);

  update nakshatra_admin.calid_booking_state
  set lifecycle_status = case
    when cancelled_at is not null
      and (rescheduled_at is null or cancelled_at >= rescheduled_at) then 'cancelled'
    when rescheduled_at is not null then 'rescheduled'
    when paid_at is not null then 'paid'
    else 'confirmed'
  end
  where booking_uid = p_booking_uid;

  if p_trigger = 'BOOKING_RESCHEDULED'
    and p_rescheduled_from_uid is not null
    and p_rescheduled_from_uid <> p_booking_uid then
    update nakshatra_admin.calid_booking_state
    set
      rescheduled_at = greatest(rescheduled_at, p_occurred_at),
      replaced_by_uid = p_booking_uid,
      last_event_at = greatest(last_event_at, p_occurred_at),
      updated_at = greatest(updated_at, v_received_at),
      lifecycle_status = case
        when cancelled_at is not null and cancelled_at >= p_occurred_at then 'cancelled'
        else 'rescheduled'
      end
    where booking_uid = p_rescheduled_from_uid;
  end if;

  insert into nakshatra_admin.admin_push_outbox (event_id, trigger)
  values (p_event_id, p_trigger)
  on conflict (event_id) do nothing;

  return 'applied';
end;
$$;

create or replace function nakshatra_admin.list_admin_bookings()
returns table (
  booking_uid text,
  event_type_slug text,
  customer_first_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  lifecycle_status text,
  meeting_url text
)
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
begin
  perform nakshatra_admin.cleanup_retention();
  return query
  select
    b.booking_uid,
    b.event_type_slug,
    b.customer_first_name,
    b.starts_at,
    b.ends_at,
    case
      when b.lifecycle_status <> 'cancelled' and b.ends_at <= v_now then 'completed'
      else b.lifecycle_status
    end,
    b.meeting_url
  from nakshatra_admin.calid_booking_state b
  where b.replaced_by_uid is null
  order by b.starts_at asc;
end;
$$;

create or replace function nakshatra_admin.remove_admin_booking(
  p_booking_uid text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
  v_status text;
  v_ends_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_booking_uid, 137));

  select lifecycle_status, ends_at
  into v_status, v_ends_at
  from nakshatra_admin.calid_booking_state
  where booking_uid = p_booking_uid
  for update;

  if not found then
    return 'not_found';
  end if;
  if v_status <> 'cancelled' and v_ends_at > v_now then
    return 'active';
  end if;

  update nakshatra_admin.calid_webhook_deliveries
  set retain_until = greatest(retain_until, v_now + interval '30 days')
  where booking_uid = p_booking_uid;

  delete from nakshatra_admin.calid_booking_state
  where booking_uid = p_booking_uid;

  update nakshatra_admin.admin_push_outbox o
  set
    delivered_at = v_now,
    locked_until = null,
    last_error_code = 'customer-record-removed'
  from nakshatra_admin.calid_webhook_deliveries d
  where o.event_id = d.event_id
    and d.booking_uid = p_booking_uid
    and o.delivered_at is null;
  return 'deleted';
end;
$$;

create or replace function nakshatra_admin.upsert_admin_push_subscription(
  p_endpoint text,
  p_expiration_time timestamptz,
  p_p256dh text,
  p_auth text
) returns void
language sql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
  insert into nakshatra_admin.admin_push_subscriptions (
    endpoint, expiration_time, p256dh, auth, enabled,
    last_confirmed_at, updated_at
  ) values (
    p_endpoint, p_expiration_time, p_p256dh, p_auth, true,
    statement_timestamp(), statement_timestamp()
  )
  on conflict (endpoint) do update set
    expiration_time = excluded.expiration_time,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    enabled = true,
    last_confirmed_at = statement_timestamp(),
    updated_at = statement_timestamp();
$$;

create or replace function nakshatra_admin.renew_admin_push_subscription(
  p_endpoint text,
  p_expiration_time timestamptz,
  p_p256dh text,
  p_auth text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_updated integer;
begin
  update nakshatra_admin.admin_push_subscriptions
  set
    expiration_time = p_expiration_time,
    p256dh = p_p256dh,
    auth = p_auth,
    last_confirmed_at = statement_timestamp(),
    updated_at = statement_timestamp()
  where endpoint = p_endpoint
    and enabled = true
    and last_confirmed_at > statement_timestamp() - interval '30 days'
    and (expiration_time is null or expiration_time > statement_timestamp());
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function nakshatra_admin.delete_admin_push_subscription(
  p_endpoint text
) returns void
language sql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
  delete from nakshatra_admin.admin_push_subscriptions where endpoint = p_endpoint;
$$;

create or replace function nakshatra_admin.delete_all_admin_push_subscriptions()
returns void
language sql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
  delete from nakshatra_admin.admin_push_subscriptions;
$$;

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
  delete from nakshatra_admin.admin_push_subscriptions
  where (expiration_time is not null and expiration_time <= v_now)
    or last_confirmed_at <= v_now - interval '30 days';
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
  delete from nakshatra_admin.admin_push_subscriptions
  where (expiration_time is not null and expiration_time <= v_now)
    or last_confirmed_at <= v_now - interval '30 days';
  return query
  select s.endpoint, s.expiration_time, s.p256dh, s.auth
  from nakshatra_admin.admin_push_subscriptions s
  where s.enabled = true;
end;
$$;

create or replace function nakshatra_admin.claim_admin_push_delivery(
  p_event_id text
) returns table(trigger text)
language sql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
  update nakshatra_admin.admin_push_outbox
  set
    locked_until = statement_timestamp() + interval '2 minutes',
    attempts = attempts + 1
  where event_id = p_event_id
    and delivered_at is null
    and (locked_until is null or locked_until < statement_timestamp())
  returning admin_push_outbox.trigger;
$$;

create or replace function nakshatra_admin.complete_admin_push_delivery(
  p_event_id text,
  p_delivered boolean,
  p_error_code text default null
) returns void
language sql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
  update nakshatra_admin.admin_push_outbox
  set
    delivered_at = case when p_delivered then statement_timestamp() else delivered_at end,
    locked_until = null,
    last_error_code = case when p_delivered then null else left(p_error_code, 80) end
  where event_id = p_event_id;
$$;

create or replace function nakshatra_admin.consume_admin_login_attempt(
  p_source_key text
) returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
  v_window constant interval := interval '15 minutes';
  v_source_attempts integer;
  v_source_started_at timestamptz;
  v_account_attempts integer;
  v_account_started_at timestamptz;
  v_retry_until timestamptz;
begin
  if p_source_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid source key' using errcode = '22023';
  end if;

  delete from nakshatra_admin.admin_login_rate_limits
  where last_attempt_at <= v_now - interval '1 day';

  insert into nakshatra_admin.admin_login_rate_limits (
    scope, limiter_key, window_started_at, attempt_count, last_attempt_at
  ) values (
    'source', p_source_key, v_now, 1, v_now
  )
  on conflict (scope, limiter_key) do update set
    window_started_at = case
      when admin_login_rate_limits.window_started_at <= v_now - v_window then v_now
      else admin_login_rate_limits.window_started_at
    end,
    attempt_count = case
      when admin_login_rate_limits.window_started_at <= v_now - v_window then 1
      else least(admin_login_rate_limits.attempt_count::bigint + 1, 2147483647)::integer
    end,
    last_attempt_at = v_now
  returning attempt_count, window_started_at
  into v_source_attempts, v_source_started_at;

  -- Once this source is blocked it must not be able to exhaust the separate
  -- account-wide allowance for legitimate attempts from other sources.
  if v_source_attempts > 5 then
    allowed := false;
    retry_after_seconds := greatest(
      1,
      ceil(extract(epoch from (v_source_started_at + v_window - v_now)))::integer
    );
    return next;
    return;
  end if;

  insert into nakshatra_admin.admin_login_rate_limits (
    scope, limiter_key, window_started_at, attempt_count, last_attempt_at
  ) values (
    'account', 'owner', v_now, 1, v_now
  )
  on conflict (scope, limiter_key) do update set
    window_started_at = case
      when admin_login_rate_limits.window_started_at <= v_now - v_window then v_now
      else admin_login_rate_limits.window_started_at
    end,
    attempt_count = case
      when admin_login_rate_limits.window_started_at <= v_now - v_window then 1
      else least(admin_login_rate_limits.attempt_count::bigint + 1, 2147483647)::integer
    end,
    last_attempt_at = v_now
  returning attempt_count, window_started_at
  into v_account_attempts, v_account_started_at;

  allowed := v_source_attempts <= 5 and v_account_attempts <= 30;
  if allowed then
    retry_after_seconds := 0;
  else
    v_retry_until := greatest(
      case
        when v_source_attempts > 5 then v_source_started_at + v_window
        else v_now
      end,
      case
        when v_account_attempts > 30 then v_account_started_at + v_window
        else v_now
      end
    );
    retry_after_seconds := greatest(
      1,
      ceil(extract(epoch from (v_retry_until - v_now)))::integer
    );
  end if;
  return next;
end;
$$;

revoke all on all tables in schema nakshatra_admin from public, nakshatra_runtime;
revoke all on all sequences in schema nakshatra_admin from public, nakshatra_runtime;
revoke all on all functions in schema nakshatra_admin from public, nakshatra_runtime;
grant usage on schema nakshatra_admin to nakshatra_runtime;
grant execute on function nakshatra_admin.apply_calid_webhook_event(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, text
) to nakshatra_runtime;
grant execute on function nakshatra_admin.list_admin_bookings()
  to nakshatra_runtime;
grant execute on function nakshatra_admin.remove_admin_booking(text)
  to nakshatra_runtime;
grant execute on function nakshatra_admin.upsert_admin_push_subscription(
  text, timestamptz, text, text
) to nakshatra_runtime;
grant execute on function nakshatra_admin.renew_admin_push_subscription(
  text, timestamptz, text, text
) to nakshatra_runtime;
grant execute on function nakshatra_admin.delete_admin_push_subscription(text)
  to nakshatra_runtime;
grant execute on function nakshatra_admin.delete_all_admin_push_subscriptions()
  to nakshatra_runtime;
grant execute on function nakshatra_admin.get_admin_push_subscription(text)
  to nakshatra_runtime;
grant execute on function nakshatra_admin.list_admin_push_subscriptions()
  to nakshatra_runtime;
grant execute on function nakshatra_admin.claim_admin_push_delivery(text)
  to nakshatra_runtime;
grant execute on function nakshatra_admin.complete_admin_push_delivery(
  text, boolean, text
) to nakshatra_runtime;
grant execute on function nakshatra_admin.consume_admin_login_attempt(text)
  to nakshatra_runtime;

commit;
