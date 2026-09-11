begin;

alter table nakshatra_admin.calid_booking_state
  add column if not exists whatsapp_recipient_e164 text,
  add column if not exists whatsapp_transactional_consent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calid_booking_state_whatsapp_e164_check'
      and conrelid = 'nakshatra_admin.calid_booking_state'::regclass
  ) then
    alter table nakshatra_admin.calid_booking_state
      add constraint calid_booking_state_whatsapp_e164_check
      check (
        whatsapp_recipient_e164 is null
        or whatsapp_recipient_e164 ~ '^\+[1-9][0-9]{7,14}$'
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'calid_booking_state_whatsapp_consent_pair_check'
      and conrelid = 'nakshatra_admin.calid_booking_state'::regclass
  ) then
    alter table nakshatra_admin.calid_booking_state
      add constraint calid_booking_state_whatsapp_consent_pair_check
      check (
        (whatsapp_recipient_e164 is null) =
        (whatsapp_transactional_consent_at is null)
      );
  end if;
end;
$$;

create table if not exists nakshatra_admin.whatsapp_outbox (
  delivery_id bigint generated always as identity primary key,
  booking_uid text not null references nakshatra_admin.calid_booking_state(booking_uid)
    on delete cascade,
  message_kind text not null check (message_kind in (
    'booking_confirmation', 'appointment_reminder_1h'
  )),
  due_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  dispatch_started_at timestamptz,
  sent_at timestamptz,
  terminal_at timestamptz,
  suppressed_at timestamptz,
  provider_message_id_hash text check (
    provider_message_id_hash is null or provider_message_id_hash ~ '^[a-f0-9]{64}$'
  ),
  last_error_code text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (booking_uid, message_kind)
);

create index if not exists whatsapp_outbox_due_idx
  on nakshatra_admin.whatsapp_outbox (due_at, delivery_id)
  where sent_at is null and terminal_at is null and suppressed_at is null;

create table if not exists nakshatra_admin.whatsapp_inbound_deliveries (
  event_id_hash text primary key check (event_id_hash ~ '^[a-f0-9]{64}$'),
  claimed_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  failed_at timestamptz,
  last_error_code text,
  retain_until timestamptz not null default (statement_timestamp() + interval '30 days')
);

create index if not exists whatsapp_inbound_deliveries_retain_idx
  on nakshatra_admin.whatsapp_inbound_deliveries (retain_until);

create or replace function nakshatra_admin.apply_calid_webhook_event_with_whatsapp(
  p_event_id text,
  p_trigger text,
  p_booking_uid text,
  p_event_type_slug text,
  p_customer_first_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_meeting_url text,
  p_occurred_at timestamptz,
  p_rescheduled_from_uid text default null,
  p_whatsapp_recipient_e164 text default null,
  p_whatsapp_transactional_consent boolean default false
) returns text
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_result text;
  v_now constant timestamptz := statement_timestamp();
  v_last_event_at timestamptz;
  v_paid_at timestamptz;
  v_rescheduled_at timestamptz;
  v_status text;
  v_recipient text;
  v_consent_at timestamptz;
  v_old_paid_at timestamptz;
  v_old_recipient text;
  v_old_consent_at timestamptz;
begin
  v_result := nakshatra_admin.apply_calid_webhook_event(
    p_event_id,
    p_trigger,
    p_booking_uid,
    p_event_type_slug,
    p_customer_first_name,
    p_starts_at,
    p_ends_at,
    p_meeting_url,
    p_occurred_at,
    p_rescheduled_from_uid
  );
  if v_result <> 'applied' then
    return v_result;
  end if;

  delete from nakshatra_admin.whatsapp_inbound_deliveries
  where retain_until <= v_now;

  if p_whatsapp_transactional_consent
    and p_whatsapp_recipient_e164 ~ '^\+[1-9][0-9]{7,14}$' then
    update nakshatra_admin.calid_booking_state
    set
      whatsapp_recipient_e164 = p_whatsapp_recipient_e164,
      whatsapp_transactional_consent_at = coalesce(
        whatsapp_transactional_consent_at,
        v_now
      )
    where booking_uid = p_booking_uid
      and last_event_at = p_occurred_at;
  end if;

  if p_trigger = 'BOOKING_RESCHEDULED'
    and p_rescheduled_from_uid is not null
    and p_rescheduled_from_uid <> p_booking_uid then
    select paid_at, whatsapp_recipient_e164, whatsapp_transactional_consent_at
    into v_old_paid_at, v_old_recipient, v_old_consent_at
    from nakshatra_admin.calid_booking_state
    where booking_uid = p_rescheduled_from_uid;

    update nakshatra_admin.whatsapp_outbox
    set suppressed_at = v_now, updated_at = v_now
    where booking_uid = p_rescheduled_from_uid
      and message_kind = 'appointment_reminder_1h'
      and sent_at is null
      and terminal_at is null;

    update nakshatra_admin.whatsapp_outbox
    set booking_uid = p_booking_uid, updated_at = v_now
    where booking_uid = p_rescheduled_from_uid
      and message_kind = 'booking_confirmation'
      and sent_at is null
      and terminal_at is null
      and suppressed_at is null
      and not exists (
        select 1 from nakshatra_admin.whatsapp_outbox current_confirmation
        where current_confirmation.booking_uid = p_booking_uid
          and current_confirmation.message_kind = 'booking_confirmation'
      );

    update nakshatra_admin.calid_booking_state
    set
      whatsapp_recipient_e164 = coalesce(
        whatsapp_recipient_e164,
        case when v_old_consent_at is not null then v_old_recipient end
      ),
      whatsapp_transactional_consent_at = coalesce(
        whatsapp_transactional_consent_at,
        v_old_consent_at
      )
    where booking_uid = p_booking_uid
      and last_event_at = p_occurred_at;
  end if;

  select
    last_event_at,
    paid_at,
    rescheduled_at,
    lifecycle_status,
    whatsapp_recipient_e164,
    whatsapp_transactional_consent_at
  into
    v_last_event_at,
    v_paid_at,
    v_rescheduled_at,
    v_status,
    v_recipient,
    v_consent_at
  from nakshatra_admin.calid_booking_state
  where booking_uid = p_booking_uid;

  if p_trigger = 'BOOKING_PAID'
    and v_last_event_at = p_occurred_at
    and v_paid_at = p_occurred_at
    and v_status <> 'cancelled'
    and v_recipient is not null
    and v_consent_at is not null then
    insert into nakshatra_admin.whatsapp_outbox (
      booking_uid, message_kind, due_at
    ) values (
      p_booking_uid, 'booking_confirmation', v_now
    ) on conflict (booking_uid, message_kind) do nothing;

    insert into nakshatra_admin.whatsapp_outbox (
      booking_uid, message_kind, due_at
    ) values (
      p_booking_uid, 'appointment_reminder_1h', p_starts_at - interval '1 hour'
    ) on conflict (booking_uid, message_kind) do nothing;
  end if;

  if p_trigger = 'BOOKING_RESCHEDULED'
    and v_last_event_at = p_occurred_at
    and v_rescheduled_at = p_occurred_at
    and v_status <> 'cancelled'
    and coalesce(v_paid_at, v_old_paid_at) is not null
    and v_recipient is not null
    and v_consent_at is not null then
    insert into nakshatra_admin.whatsapp_outbox (
      booking_uid, message_kind, due_at
    ) values (
      p_booking_uid, 'appointment_reminder_1h', p_starts_at - interval '1 hour'
    ) on conflict (booking_uid, message_kind) do update set
      due_at = excluded.due_at,
      dispatch_started_at = null,
      suppressed_at = null,
      last_error_code = null,
      updated_at = v_now
    where whatsapp_outbox.sent_at is null
      and whatsapp_outbox.terminal_at is null;
  end if;

  if p_trigger = 'BOOKING_CANCELLED'
    and v_last_event_at = p_occurred_at
    and v_status = 'cancelled' then
    update nakshatra_admin.whatsapp_outbox
    set suppressed_at = v_now, updated_at = v_now
    where booking_uid = p_booking_uid
      and message_kind in ('booking_confirmation', 'appointment_reminder_1h')
      and sent_at is null
      and terminal_at is null;
  end if;

  return v_result;
end;
$$;

create or replace function nakshatra_admin.claim_due_whatsapp_messages(
  p_limit integer default 10
) returns table (
  delivery_id bigint,
  message_kind text,
  whatsapp_recipient_e164 text,
  customer_first_name text,
  event_type_slug text,
  starts_at timestamptz,
  meeting_url text
)
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
begin
  return query
  with due as (
    select o.delivery_id
    from nakshatra_admin.whatsapp_outbox o
    join nakshatra_admin.calid_booking_state b on b.booking_uid = o.booking_uid
    where o.due_at <= v_now
      and o.attempt_count < 5
      and o.dispatch_started_at is null
      and o.sent_at is null
      and o.terminal_at is null
      and o.suppressed_at is null
      and b.lifecycle_status <> 'cancelled'
      and b.replaced_by_uid is null
      and b.ends_at > v_now
      and b.whatsapp_recipient_e164 is not null
      and b.whatsapp_transactional_consent_at is not null
      and b.meeting_url is not null
    order by o.due_at, o.delivery_id
    for update of o skip locked
    limit least(25, greatest(1, coalesce(p_limit, 10)))
  ), claimed as (
    update nakshatra_admin.whatsapp_outbox o
    set
      dispatch_started_at = v_now,
      attempt_count = o.attempt_count + 1,
      updated_at = v_now
    from due
    where o.delivery_id = due.delivery_id
    returning o.delivery_id, o.booking_uid, o.message_kind
  )
  select
    c.delivery_id,
    c.message_kind,
    b.whatsapp_recipient_e164,
    b.customer_first_name,
    b.event_type_slug,
    b.starts_at,
    b.meeting_url
  from claimed c
  join nakshatra_admin.calid_booking_state b on b.booking_uid = c.booking_uid
  order by c.delivery_id;
end;
$$;

create or replace function nakshatra_admin.complete_whatsapp_message_delivery(
  p_delivery_id bigint,
  p_outcome text,
  p_provider_message_id_hash text default null,
  p_error_code text default null
) returns void
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
  v_attempts integer;
begin
  if p_outcome not in ('sent', 'retry', 'ambiguous') then
    raise exception 'Unsupported WhatsApp delivery outcome';
  end if;
  select attempt_count into v_attempts
  from nakshatra_admin.whatsapp_outbox
  where delivery_id = p_delivery_id
  for update;
  if not found then return; end if;

  if p_outcome = 'sent' then
    if p_provider_message_id_hash !~ '^[a-f0-9]{64}$' then
      raise exception 'Invalid provider message identifier hash';
    end if;
    update nakshatra_admin.whatsapp_outbox
    set
      sent_at = v_now,
      provider_message_id_hash = p_provider_message_id_hash,
      last_error_code = null,
      updated_at = v_now
    where delivery_id = p_delivery_id
      and sent_at is null
      and terminal_at is null;
  elsif p_outcome = 'retry' and v_attempts < 5 then
    update nakshatra_admin.whatsapp_outbox
    set
      dispatch_started_at = null,
      last_error_code = left(coalesce(p_error_code, 'meta-rejected'), 80),
      updated_at = v_now
    where delivery_id = p_delivery_id
      and sent_at is null
      and terminal_at is null;
  else
    update nakshatra_admin.whatsapp_outbox
    set
      terminal_at = v_now,
      last_error_code = left(coalesce(p_error_code, 'delivery-ambiguous'), 80),
      updated_at = v_now
    where delivery_id = p_delivery_id
      and sent_at is null
      and terminal_at is null;
  end if;
end;
$$;

create or replace function nakshatra_admin.claim_whatsapp_inbound_delivery(
  p_event_id_hash text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_inserted integer;
  v_now constant timestamptz := statement_timestamp();
begin
  if p_event_id_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid inbound delivery identifier hash';
  end if;
  delete from nakshatra_admin.whatsapp_inbound_deliveries
  where retain_until <= v_now;
  insert into nakshatra_admin.whatsapp_inbound_deliveries (
    event_id_hash, claimed_at, retain_until
  ) values (
    p_event_id_hash, v_now, v_now + interval '30 days'
  ) on conflict (event_id_hash) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

create or replace function nakshatra_admin.complete_whatsapp_inbound_delivery(
  p_event_id_hash text,
  p_delivered boolean,
  p_error_code text default null
) returns void
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_now constant timestamptz := statement_timestamp();
begin
  update nakshatra_admin.whatsapp_inbound_deliveries
  set
    completed_at = case when p_delivered then v_now else completed_at end,
    failed_at = case when p_delivered then failed_at else v_now end,
    last_error_code = case
      when p_delivered then null
      else left(coalesce(p_error_code, 'delivery-failed'), 80)
    end,
    retain_until = greatest(retain_until, v_now + interval '30 days')
  where event_id_hash = p_event_id_hash;
end;
$$;

revoke all on all tables in schema nakshatra_admin from public, nakshatra_runtime;
revoke all on all sequences in schema nakshatra_admin from public, nakshatra_runtime;
revoke all on function nakshatra_admin.apply_calid_webhook_event_with_whatsapp(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, text, text, boolean
) from public, nakshatra_runtime;
revoke all on function nakshatra_admin.claim_due_whatsapp_messages(integer)
  from public, nakshatra_runtime;
revoke all on function nakshatra_admin.complete_whatsapp_message_delivery(
  bigint, text, text, text
) from public, nakshatra_runtime;
revoke all on function nakshatra_admin.claim_whatsapp_inbound_delivery(text)
  from public, nakshatra_runtime;
revoke all on function nakshatra_admin.complete_whatsapp_inbound_delivery(
  text, boolean, text
) from public, nakshatra_runtime;
grant usage on schema nakshatra_admin to nakshatra_runtime;
grant execute on function nakshatra_admin.apply_calid_webhook_event_with_whatsapp(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, text, text, boolean
) to nakshatra_runtime;
grant execute on function nakshatra_admin.claim_due_whatsapp_messages(integer)
  to nakshatra_runtime;
grant execute on function nakshatra_admin.complete_whatsapp_message_delivery(
  bigint, text, text, text
) to nakshatra_runtime;
grant execute on function nakshatra_admin.claim_whatsapp_inbound_delivery(text)
  to nakshatra_runtime;
grant execute on function nakshatra_admin.complete_whatsapp_inbound_delivery(
  text, boolean, text
) to nakshatra_runtime;

commit;
