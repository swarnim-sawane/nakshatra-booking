import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "db/migrations/202609090001_calid_admin_pipeline.sql",
  "utf8",
);
const whatsappMigrationPath = "db/migrations/202609110001_whatsapp_automation.sql";
const whatsappMigration = existsSync(whatsappMigrationPath)
  ? readFileSync(whatsappMigrationPath, "utf8")
  : "";

test("Neon storage is atomic, idempotent and restricted to database functions", () => {
  assert.match(migration, /create schema if not exists nakshatra_admin/i);
  assert.match(migration, /event_id text primary key/i);
  assert.match(migration, /apply_calid_webhook_event/i);
  assert.match(migration, /on conflict \(event_id\) do nothing/i);
  assert.match(migration, /if pg_has_role\('nakshatra_runtime', 'neon_superuser', 'member'\)/i);
  assert.match(migration, /raise exception 'nakshatra_runtime must not inherit neon_superuser'/i);
  assert.match(migration, /revoke all on all tables in schema nakshatra_admin from public, nakshatra_runtime/i);
  assert.match(migration, /grant execute on function nakshatra_admin\.apply_calid_webhook_event/i);
  assert.doesNotMatch(migration, /grant (select|insert|update|delete) on/i);
});

test("retention uses database time and preserves replay IDs through the booking lifetime", () => {
  assert.doesNotMatch(migration, /\bp_now\b|\bp_received_at\b/i);
  assert.match(migration, /statement_timestamp\(\)/i);
  assert.match(migration, /cancelled_at <= v_now - interval '7 days'/i);
  assert.match(migration, /ends_at <= v_now - interval '7 days'/i);
  assert.match(
    migration,
    /retain_until = greatest\([\s\S]*v_now \+ interval '30 days'/i,
  );
  assert.match(migration, /delete from nakshatra_admin\.calid_webhook_deliveries d[\s\S]*d\.retain_until <= v_now[\s\S]*not exists[\s\S]*calid_booking_state/i);
  assert.match(migration, /perform nakshatra_admin\.cleanup_retention\(\)/i);
});

test("manual housekeeping permits cancelled or ended records and protects future active records", () => {
  const removal = migration.slice(migration.indexOf("create or replace function nakshatra_admin.remove_admin_booking"));
  assert.match(removal, /select lifecycle_status, ends_at[\s\S]*for update/i);
  assert.match(removal, /if v_status <> 'cancelled' and v_ends_at > v_now then[\s\S]*return 'active'/i);
  assert.match(removal, /delete from nakshatra_admin\.calid_booking_state/i);
  assert.match(removal, /retain_until = greatest\([\s\S]*v_now \+ interval '30 days'/i);
});

test("retained delivery IDs prevent customer-row recreation after removal", () => {
  const start = migration.indexOf("create or replace function nakshatra_admin.apply_calid_webhook_event");
  const end = migration.indexOf("create or replace function nakshatra_admin.list_admin_bookings");
  const applyFunction = migration.slice(start, end);
  const deliveryInsert = applyFunction.indexOf("insert into nakshatra_admin.calid_webhook_deliveries");
  const duplicateReturn = applyFunction.indexOf("return 'duplicate'");
  const suppression = applyFunction.indexOf("return 'suppressed'");
  const customerInsert = applyFunction.indexOf("insert into nakshatra_admin.calid_booking_state");
  assert.ok(deliveryInsert >= 0);
  assert.ok(duplicateReturn > deliveryInsert);
  assert.ok(suppression > duplicateReturn);
  assert.ok(customerInsert > suppression);
  assert.match(migration, /last_error_code = 'customer-record-removed'/i);
  assert.match(
    applyFunction,
    /p_trigger = 'BOOKING_CANCELLED'[\s\S]*p_occurred_at <= v_received_at - interval '7 days'/i,
  );
  assert.match(
    applyFunction,
    /p_trigger <> 'BOOKING_CANCELLED'[\s\S]*p_ends_at <= v_received_at - interval '7 days'/i,
  );
});

test("booking state preserves lifecycle ordering and durable push retry", () => {
  assert.match(migration, /greatest\(calid_booking_state\.last_event_at/i);
  assert.match(migration, /replaced_by_uid/i);
  assert.match(migration, /admin_push_outbox/i);
  assert.match(migration, /claim_admin_push_delivery/i);
  assert.match(migration, /complete_admin_push_delivery/i);
});

test("schema never stores intake answers or notification content", () => {
  assert.doesNotMatch(
    migration,
    /birth_date|birth_time|birth_place|attendee_email|phone_number|raw_payload|notification_body|private_answer/i,
  );
});

test("login throttling is durable, atomic, source-hashed and account-wide", () => {
  assert.match(migration, /create table if not exists nakshatra_admin\.admin_login_rate_limits/i);
  assert.match(migration, /create or replace function nakshatra_admin\.consume_admin_login_attempt/i);
  assert.match(migration, /p_source_key text/i);
  assert.match(migration, /'source'/i);
  assert.match(migration, /'account'/i);
  assert.match(migration, /for update|on conflict/i);
  assert.match(migration, /grant execute on function nakshatra_admin\.consume_admin_login_attempt\(text\)/i);
  assert.doesNotMatch(migration, /remote_ip|raw_ip|ip_address/i);
});

test("a source blocked at its own limit cannot consume the account-wide quota", () => {
  const start = migration.indexOf(
    "create or replace function nakshatra_admin.consume_admin_login_attempt",
  );
  const end = migration.indexOf(
    "revoke all on all tables in schema nakshatra_admin",
    start,
  );
  const limiter = migration.slice(start, end);
  const sourceResult = limiter.indexOf(
    "into v_source_attempts, v_source_started_at",
  );
  const sourceDenial = limiter.indexOf("if v_source_attempts > 5 then");
  const accountIncrement = limiter.indexOf(
    "'account', 'owner', v_now, 1, v_now",
  );

  assert.ok(sourceResult >= 0);
  assert.ok(sourceDenial > sourceResult);
  assert.ok(accountIncrement > sourceDenial);
  assert.match(
    limiter.slice(sourceDenial, accountIncrement),
    /allowed := false;[\s\S]*return next;/i,
  );
});

test("booking mutations serialize on deterministic per-booking advisory locks", () => {
  const applyStart = migration.indexOf(
    "create or replace function nakshatra_admin.apply_calid_webhook_event",
  );
  const applyEnd = migration.indexOf(
    "create or replace function nakshatra_admin.list_admin_bookings",
    applyStart,
  );
  const applyFunction = migration.slice(applyStart, applyEnd);
  const applyLock = applyFunction.indexOf("pg_advisory_xact_lock");
  const stateCheck = applyFunction.indexOf("if not exists (");
  const customerInsert = applyFunction.indexOf(
    "insert into nakshatra_admin.calid_booking_state",
  );

  assert.match(
    applyFunction,
    /unnest\(array\[p_booking_uid, p_rescheduled_from_uid\]\)[\s\S]*order by uid collate "C"/i,
  );
  assert.ok(applyLock >= 0);
  assert.ok(stateCheck > applyLock);
  assert.ok(customerInsert > applyLock);

  const removalStart = migration.indexOf(
    "create or replace function nakshatra_admin.remove_admin_booking",
  );
  const removalEnd = migration.indexOf(
    "create or replace function nakshatra_admin.upsert_admin_push_subscription",
    removalStart,
  );
  const removal = migration.slice(removalStart, removalEnd);
  assert.ok(removal.indexOf("pg_advisory_xact_lock") >= 0);
  assert.ok(
    removal.indexOf("pg_advisory_xact_lock") <
      removal.indexOf("select lifecycle_status, ends_at"),
  );

  const cleanupStart = migration.indexOf(
    "create or replace function nakshatra_admin.cleanup_retention",
  );
  const cleanupEnd = migration.indexOf(
    "create or replace function nakshatra_admin.apply_calid_webhook_event",
    cleanupStart,
  );
  const cleanup = migration.slice(cleanupStart, cleanupEnd);
  assert.match(cleanup, /order by b\.booking_uid collate "C"/i);
  assert.ok(cleanup.indexOf("pg_advisory_xact_lock") >= 0);
  assert.ok(
    cleanup.indexOf("pg_advisory_xact_lock") <
      cleanup.indexOf("delete from nakshatra_admin.calid_booking_state"),
  );
});

test("push subscriptions expire, renew and can all be revoked", () => {
  assert.match(migration, /last_confirmed_at timestamptz not null/i);
  assert.match(migration, /last_confirmed_at <= v_now - interval '30 days'/i);
  assert.match(migration, /last_confirmed_at = statement_timestamp\(\)/i);
  assert.match(migration, /create or replace function nakshatra_admin\.delete_all_admin_push_subscriptions/i);
  assert.match(migration, /grant execute on function nakshatra_admin\.delete_all_admin_push_subscriptions\(\)/i);
  const renewalStart = migration.indexOf("create or replace function nakshatra_admin.renew_admin_push_subscription");
  const renewalEnd = migration.indexOf("create or replace function nakshatra_admin.delete_admin_push_subscription");
  assert.ok(renewalStart >= 0);
  const renewal = migration.slice(renewalStart, renewalEnd);
  assert.match(renewal, /update nakshatra_admin\.admin_push_subscriptions/i);
  assert.doesNotMatch(renewal, /insert into/i);
  assert.match(migration, /grant execute on function nakshatra_admin\.renew_admin_push_subscription/i);
});

test("push subscription readers qualify cleanup columns that shadow table-return fields", () => {
  for (const functionName of [
    "get_admin_push_subscription",
    "list_admin_push_subscriptions",
  ]) {
    const start = migration.indexOf(
      `create or replace function nakshatra_admin.${functionName}`,
    );
    const end = migration.indexOf("$$;", start);
    const functionSql = migration.slice(start, end);

    assert.match(
      functionSql,
      /delete from nakshatra_admin\.admin_push_subscriptions\s+s/i,
    );
    assert.match(
      functionSql,
      /where \(s\.expiration_time is not null and s\.expiration_time <= v_now\)/i,
    );
    assert.match(
      functionSql,
      /or s\.last_confirmed_at <= v_now - interval '30 days'/i,
    );
  }
});

test("WhatsApp automation is consent-gated, idempotent and uses database time", () => {
  assert.match(whatsappMigration, /whatsapp_recipient_e164/i);
  assert.match(whatsappMigration, /whatsapp_transactional_consent_at/i);
  assert.match(whatsappMigration, /unique \(booking_uid, message_kind\)/i);
  assert.match(whatsappMigration, /booking_confirmation/i);
  assert.match(whatsappMigration, /appointment_reminder_1h/i);
  assert.match(whatsappMigration, /statement_timestamp\(\)/i);
  assert.doesNotMatch(whatsappMigration, /\bp_now\b|\bp_received_at\b/i);
  assert.doesNotMatch(
    whatsappMigration,
    /birth_date|birth_time|birth_place|attendee_email|raw_payload|message_body|inbound_body|consultation_question/i,
  );
});

test("WhatsApp lifecycle moves reminders on reschedule and suppresses them on cancellation", () => {
  assert.match(whatsappMigration, /p_trigger = 'BOOKING_RESCHEDULED'[\s\S]*appointment_reminder_1h/i);
  assert.match(whatsappMigration, /p_trigger = 'BOOKING_CANCELLED'[\s\S]*appointment_reminder_1h/i);
  assert.match(whatsappMigration, /claim_due_whatsapp_messages/i);
  assert.match(whatsappMigration, /complete_whatsapp_message_delivery/i);
  assert.match(whatsappMigration, /claim_whatsapp_inbound_delivery/i);
  assert.match(whatsappMigration, /revoke all on all tables[\s\S]*grant execute/i);
});
