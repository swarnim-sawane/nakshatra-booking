import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "db/migrations/202609090001_calid_admin_pipeline.sql",
  "utf8",
);

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

test("retention uses the exact seven-day customer and thirty-day delivery boundaries", () => {
  assert.match(migration, /cancelled_at <= p_now - interval '7 days'/i);
  assert.match(migration, /ends_at <= p_now - interval '7 days'/i);
  assert.match(
    migration,
    /delete from nakshatra_admin\.admin_push_outbox\s+where delivered_at is not null\s+and created_at <= p_now - interval '30 days'/i,
  );
  assert.match(migration, /calid_webhook_deliveries[\s\S]*received_at <= p_now - interval '30 days'/i);
  assert.match(migration, /expiration_time is not null and expiration_time <= p_now/i);
  assert.match(migration, /perform nakshatra_admin\.cleanup_retention\(p_received_at\)/i);
  assert.match(migration, /perform nakshatra_admin\.cleanup_retention\(p_now\)/i);
});

test("manual housekeeping permits cancelled or ended records and protects future active records", () => {
  const removal = migration.slice(migration.indexOf("create or replace function nakshatra_admin.remove_admin_booking"));
  assert.match(removal, /select lifecycle_status, ends_at[\s\S]*for update/i);
  assert.match(removal, /if v_status <> 'cancelled' and v_ends_at > p_now then[\s\S]*return 'active'/i);
  assert.match(removal, /delete from nakshatra_admin\.calid_booking_state/i);
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
    /p_trigger = 'BOOKING_CANCELLED'[\s\S]*p_occurred_at <= p_received_at - interval '7 days'/i,
  );
  assert.match(
    applyFunction,
    /p_trigger <> 'BOOKING_CANCELLED'[\s\S]*p_ends_at <= p_received_at - interval '7 days'/i,
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
