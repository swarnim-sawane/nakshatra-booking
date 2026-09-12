begin;

alter table nakshatra_admin.calid_booking_state
  add column if not exists customer_full_name varchar(160),
  add column if not exists customer_email varchar(254),
  add column if not exists customer_phone_number varchar(16),
  add column if not exists preferred_language varchar(40),
  add column if not exists date_of_birth varchar(40),
  add column if not exists time_of_birth varchar(80),
  add column if not exists birth_time_accuracy varchar(80),
  add column if not exists place_of_birth varchar(240),
  add column if not exists consultation_questions varchar(4000),
  add column if not exists additional_notes varchar(2000);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calid_booking_state_customer_phone_check'
      and conrelid = 'nakshatra_admin.calid_booking_state'::regclass
  ) then
    alter table nakshatra_admin.calid_booking_state
      add constraint calid_booking_state_customer_phone_check
      check (
        customer_phone_number is null
        or customer_phone_number ~ '^\+[1-9][0-9]{7,14}$'
      );
  end if;
end;
$$;

create or replace function nakshatra_admin.apply_calid_webhook_event_with_customer_details(
  p_event_id text,
  p_trigger text,
  p_booking_uid text,
  p_event_type_slug text,
  p_customer_first_name text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_meeting_url text,
  p_occurred_at timestamptz,
  p_rescheduled_from_uid text,
  p_whatsapp_recipient_e164 text,
  p_whatsapp_transactional_consent boolean,
  p_customer_full_name text,
  p_customer_email text,
  p_customer_phone_number text,
  p_preferred_language text,
  p_date_of_birth text,
  p_time_of_birth text,
  p_birth_time_accuracy text,
  p_place_of_birth text,
  p_consultation_questions text,
  p_additional_notes text
) returns text
language plpgsql
security definer
set search_path = pg_catalog, nakshatra_admin
as $$
declare
  v_result text;
begin
  v_result := nakshatra_admin.apply_calid_webhook_event_with_whatsapp(
    p_event_id,
    p_trigger,
    p_booking_uid,
    p_event_type_slug,
    p_customer_first_name,
    p_starts_at,
    p_ends_at,
    p_meeting_url,
    p_occurred_at,
    p_rescheduled_from_uid,
    p_whatsapp_recipient_e164,
    p_whatsapp_transactional_consent
  );

  if v_result <> 'applied' then
    return v_result;
  end if;

  update nakshatra_admin.calid_booking_state b
  set
    customer_full_name = coalesce(
      nullif(left(btrim(p_customer_full_name), 160), ''),
      b.customer_full_name,
      b.customer_first_name
    ),
    customer_email = coalesce(
      nullif(left(btrim(p_customer_email), 254), ''),
      b.customer_email
    ),
    customer_phone_number = coalesce(
      nullif(left(btrim(p_customer_phone_number), 16), ''),
      b.customer_phone_number
    ),
    preferred_language = coalesce(
      nullif(left(btrim(p_preferred_language), 40), ''),
      b.preferred_language
    ),
    date_of_birth = coalesce(
      nullif(left(btrim(p_date_of_birth), 40), ''),
      b.date_of_birth
    ),
    time_of_birth = coalesce(
      nullif(left(btrim(p_time_of_birth), 80), ''),
      b.time_of_birth
    ),
    birth_time_accuracy = coalesce(
      nullif(left(btrim(p_birth_time_accuracy), 80), ''),
      b.birth_time_accuracy
    ),
    place_of_birth = coalesce(
      nullif(left(btrim(p_place_of_birth), 240), ''),
      b.place_of_birth
    ),
    consultation_questions = coalesce(
      nullif(left(btrim(p_consultation_questions), 4000), ''),
      b.consultation_questions
    ),
    additional_notes = coalesce(
      nullif(left(btrim(p_additional_notes), 2000), ''),
      b.additional_notes
    )
  where b.booking_uid = p_booking_uid
    and b.last_event_at = p_occurred_at;

  if p_trigger = 'BOOKING_RESCHEDULED'
    and p_rescheduled_from_uid is not null
    and p_rescheduled_from_uid <> p_booking_uid then
    update nakshatra_admin.calid_booking_state current_booking
    set
      customer_full_name = coalesce(current_booking.customer_full_name, previous.customer_full_name),
      customer_email = coalesce(current_booking.customer_email, previous.customer_email),
      customer_phone_number = coalesce(current_booking.customer_phone_number, previous.customer_phone_number),
      preferred_language = coalesce(current_booking.preferred_language, previous.preferred_language),
      date_of_birth = coalesce(current_booking.date_of_birth, previous.date_of_birth),
      time_of_birth = coalesce(current_booking.time_of_birth, previous.time_of_birth),
      birth_time_accuracy = coalesce(current_booking.birth_time_accuracy, previous.birth_time_accuracy),
      place_of_birth = coalesce(current_booking.place_of_birth, previous.place_of_birth),
      consultation_questions = coalesce(current_booking.consultation_questions, previous.consultation_questions),
      additional_notes = coalesce(current_booking.additional_notes, previous.additional_notes)
    from nakshatra_admin.calid_booking_state previous
    where current_booking.booking_uid = p_booking_uid
      and current_booking.last_event_at = p_occurred_at
      and previous.booking_uid = p_rescheduled_from_uid;
  end if;

  return v_result;
end;
$$;

drop function if exists nakshatra_admin.list_admin_bookings();

create function nakshatra_admin.list_admin_bookings()
returns table (
  booking_uid text,
  event_type_slug text,
  customer_first_name text,
  customer_full_name text,
  customer_email text,
  customer_phone_number text,
  whatsapp_recipient_e164 text,
  whatsapp_consent boolean,
  preferred_language text,
  date_of_birth text,
  time_of_birth text,
  birth_time_accuracy text,
  place_of_birth text,
  consultation_questions text,
  additional_notes text,
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
    coalesce(b.customer_full_name, b.customer_first_name)::text,
    b.customer_email::text,
    b.customer_phone_number::text,
    b.whatsapp_recipient_e164,
    b.whatsapp_transactional_consent_at is not null,
    b.preferred_language::text,
    b.date_of_birth::text,
    b.time_of_birth::text,
    b.birth_time_accuracy::text,
    b.place_of_birth::text,
    b.consultation_questions::text,
    b.additional_notes::text,
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

revoke all on function nakshatra_admin.apply_calid_webhook_event_with_customer_details(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, text, text, boolean, text, text, text, text, text,
  text, text, text, text, text
) from public, nakshatra_runtime;
revoke all on function nakshatra_admin.list_admin_bookings()
  from public, nakshatra_runtime;

grant usage on schema nakshatra_admin to nakshatra_runtime;
grant execute on function nakshatra_admin.apply_calid_webhook_event_with_customer_details(
  text, text, text, text, text, timestamptz, timestamptz, text,
  timestamptz, text, text, boolean, text, text, text, text, text,
  text, text, text, text, text
) to nakshatra_runtime;
grant execute on function nakshatra_admin.list_admin_bookings()
  to nakshatra_runtime;

commit;
