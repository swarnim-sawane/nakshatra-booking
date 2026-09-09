begin;

create table if not exists public.calid_webhook_deliveries (
  event_id text primary key,
  trigger text not null check (trigger in (
    'BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'
  )),
  booking_uid text not null,
  event_type_slug text not null check (event_type_slug in (
    'personal-consultation', 'relationship-consultation', 'best-date-analysis'
  )),
  occurred_at timestamptz not null,
  received_at timestamptz not null,
  rescheduled_from_uid text,
  inserted_at timestamptz not null default now()
);

create table if not exists public.calid_booking_state (
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
  on public.calid_booking_state (starts_at);

create table if not exists public.admin_push_subscriptions (
  endpoint_hash text primary key,
  endpoint text not null check (endpoint ~ '^https://'),
  expiration_time timestamptz,
  p256dh text not null,
  auth text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_push_outbox (
  event_id text primary key references public.calid_webhook_deliveries(event_id) on delete cascade,
  trigger text not null check (trigger in (
    'BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'
  )),
  attempts integer not null default 0,
  locked_until timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now()
);

alter table public.calid_webhook_deliveries enable row level security;
alter table public.calid_booking_state enable row level security;
alter table public.admin_push_subscriptions enable row level security;
alter table public.admin_push_outbox enable row level security;

revoke all on public.calid_webhook_deliveries from public, anon, authenticated;
revoke all on public.calid_booking_state from public, anon, authenticated;
revoke all on public.admin_push_subscriptions from public, anon, authenticated;
revoke all on public.admin_push_outbox from public, anon, authenticated;

grant select, insert, update, delete on public.calid_webhook_deliveries to service_role;
grant select, insert, update, delete on public.calid_booking_state to service_role;
grant select, insert, update, delete on public.admin_push_subscriptions to service_role;
grant select, insert, update, delete on public.admin_push_outbox to service_role;

create or replace function public.apply_calid_webhook_event(
  p_event_id text,
  p_trigger text,
  p_booking_uid text,
  p_event_type_slug text,
  p_customer_first_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_meeting_url text,
  p_occurred_at timestamptz,
  p_received_at timestamptz,
  p_rescheduled_from_uid text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  if p_trigger not in (
    'BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'
  ) or p_event_type_slug not in (
    'personal-consultation', 'relationship-consultation', 'best-date-analysis'
  ) then
    raise exception 'Unsupported Cal ID event';
  end if;

  insert into public.calid_webhook_deliveries (
    event_id, trigger, booking_uid, event_type_slug, occurred_at, received_at,
    rescheduled_from_uid
  ) values (
    p_event_id, p_trigger, p_booking_uid, p_event_type_slug, p_occurred_at,
    p_received_at, p_rescheduled_from_uid
  ) on conflict (event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 'duplicate';
  end if;

  insert into public.calid_booking_state (
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
    p_received_at
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

  update public.calid_booking_state
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
    update public.calid_booking_state
    set
      rescheduled_at = greatest(rescheduled_at, p_occurred_at),
      replaced_by_uid = p_booking_uid,
      last_event_at = greatest(last_event_at, p_occurred_at),
      updated_at = greatest(updated_at, p_received_at),
      lifecycle_status = case
        when cancelled_at is not null and cancelled_at >= p_occurred_at then 'cancelled'
        else 'rescheduled'
      end
    where booking_uid = p_rescheduled_from_uid;
  end if;

  insert into public.admin_push_outbox (event_id, trigger)
  values (p_event_id, p_trigger)
  on conflict (event_id) do nothing;

  return 'applied';
end;
$$;

create or replace function public.claim_admin_push_delivery(p_event_id text)
returns table(trigger text)
language sql
security definer
set search_path = public
as $$
  update public.admin_push_outbox
  set locked_until = now() + interval '2 minutes', attempts = attempts + 1
  where event_id = p_event_id
    and delivered_at is null
    and (locked_until is null or locked_until < now())
  returning admin_push_outbox.trigger;
$$;

create or replace function public.complete_admin_push_delivery(
  p_event_id text,
  p_delivered boolean,
  p_error_code text default null
) returns void
language sql
security definer
set search_path = public
as $$
  update public.admin_push_outbox
  set
    delivered_at = case when p_delivered then now() else delivered_at end,
    locked_until = null,
    last_error_code = case when p_delivered then null else left(p_error_code, 80) end
  where event_id = p_event_id;
$$;

revoke all on function public.apply_calid_webhook_event(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, timestamptz, text
) from public, anon, authenticated;
revoke all on function public.claim_admin_push_delivery(text) from public, anon, authenticated;
revoke all on function public.complete_admin_push_delivery(text, boolean, text) from public, anon, authenticated;

grant execute on function public.apply_calid_webhook_event(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, timestamptz, text
) to service_role;
grant execute on function public.claim_admin_push_delivery(text) to service_role;
grant execute on function public.complete_admin_push_delivery(text, boolean, text) to service_role;

commit;
