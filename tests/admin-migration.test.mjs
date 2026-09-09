import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/202609090001_calid_admin_pipeline.sql",
  "utf8",
);

test("Cal ID storage is durable, atomic and private", () => {
  assert.match(migration, /calid_webhook_deliveries/);
  assert.match(migration, /event_id text primary key/);
  assert.match(migration, /apply_calid_webhook_event/);
  assert.match(migration, /on conflict \(event_id\) do nothing/);
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /revoke all .* from public, anon, authenticated/g);
  assert.match(migration, /grant execute .* to service_role/g);
});

test("booking state preserves ordering and durable push retry", () => {
  assert.match(migration, /greatest\(calid_booking_state\.last_event_at/);
  assert.match(migration, /replaced_by_uid/);
  assert.match(migration, /admin_push_outbox/);
  assert.match(migration, /claim_admin_push_delivery/);
  assert.match(migration, /complete_admin_push_delivery/);
});

test("schema does not create columns for high-sensitivity intake data", () => {
  assert.doesNotMatch(migration, /birth_date|birth_time|birth_place|attendee_email|phone_number|raw_payload/i);
});
