# Cal ID webhook foundation

Status: implemented and locally tested, but intentionally inactive until durable storage is selected and connected.

## Verified Cal ID catalogue

Read-only checks on 9 September 2026 confirmed the public pages and authenticated event-type API agree:

| Event type | Cal ID ID | Duration | Price |
| --- | ---: | ---: | ---: |
| Personal Consultation | 108657 | 30 minutes | ₹1,099 |
| Relationship Consultation (Kundli Milan) | 108655 | 20 minutes | ₹1,499 |
| Muhurat (`best-date-analysis`) | 108656 | 10 minutes | ₹499 |

The website catalogue, direct-event URLs and local public environment overrides use the same durations and prices. No Cal ID event type was modified during this audit.

All three live event types also currently have a 48-hour minimum booking notice, no before-event buffer, a 15-minute after-event buffer, no manual confirmation requirement and no custom success redirect. These were observed read-only and were not changed.

## Receiver contract

The proposed production subscriber URL is:

`https://<production-domain>/api/cal-id-webhook`

The receiver:

- accepts only `POST`;
- verifies `x-cal-signature-256` as HMAC-SHA256 over the exact raw request bytes;
- accepts only `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_RESCHEDULED`, and `BOOKING_CANCELLED`;
- filters to the three Nakshatra event types by slug or configured Cal ID event-type ID;
- derives a deterministic SHA-256 delivery ID from the raw body;
- projects only booking UID, service, trigger and timestamps;
- drops attendee email, name, birth details, notes, questions, meeting links and provider metadata before storage;
- uses a pure lifecycle reducer that cannot be regressed by a late booking-created or booking-paid delivery;
- returns `503` when durable storage is missing or unavailable so Cal ID can retry rather than losing the event.

Cal.com documents the signed header and raw-body verification method here: [Cal.com webhooks](https://cal.com/docs/developing/guides/automation/webhooks).

## Required durable store

The Vercel function must not use process memory. A serverless instance may disappear between deliveries and cannot provide deduplication.

The smallest production schema is two tables:

```sql
create table calid_webhook_events (
  event_id text primary key,
  booking_uid text not null,
  trigger text not null,
  event_type_slug text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null
);

create table calid_booking_state (
  booking_uid text primary key,
  event_type_slug text not null,
  status text not null,
  created_at timestamptz,
  paid_at timestamptz,
  rescheduled_at timestamptz,
  cancelled_at timestamptz,
  rescheduled_from_uid text,
  last_event_at timestamptz not null,
  updated_at timestamptz not null
);
```

`applyEvent` must run in one database transaction:

1. Insert `event_id` with a unique constraint.
2. If it already exists, return `duplicate` without changing the booking state.
3. Lock or atomically read the booking row.
4. Apply `transitionBookingLifecycle`.
5. Upsert the booking projection and commit.

### Decision needed

Choose the existing durable store, or approve a new one. Supabase/Postgres is the smallest straightforward option because the required unique constraint and transaction are native. No database, account or paid service has been created.

Until that decision is made, the Vercel adapter deliberately returns `503` and the Cal ID webhook must not be registered.

## Activation steps after storage approval

1. Implement and test the selected `CalIdWebhookStore` adapter.
2. Generate a new random webhook secret in the deployment secret manager.
3. Set `CALID_WEBHOOK_SECRET` in Vercel; never prefix it with `PUBLIC_` or `VITE_`.
4. Set the three verified event IDs in `CALID_PERSONAL_EVENT_TYPE_ID`, `CALID_RELATIONSHIP_EVENT_TYPE_ID`, and `CALID_MUHURAT_EVENT_TYPE_ID`.
5. Deploy and verify that the HTTPS endpoint can atomically persist a signed synthetic payload with no customer data.
6. In Cal ID developer webhook settings, add the production subscriber URL, the four triggers, the same secret, and the default payload format.
7. Complete one owner-approved controlled paid booking and reconcile Cal ID, Razorpay, Google Calendar, Google Meet and the stored lifecycle.
8. Exercise reschedule and cancellation separately and confirm duplicate deliveries do not duplicate state changes or messages.

Do not paste the secret into source, chat, screenshots or a public environment variable.

## Branded confirmation page decision

Do not add a Nakshatra success page in phase 1.

Cal ID can forward `uid` and attendee information to a custom success URL, but query parameters are browser-controlled and are not proof that payment or booking succeeded. Its default forward-parameters mode also places attendee email and other optional personal fields in the URL. The three live event types currently have no custom success redirect configured, although forward-parameters is enabled and would apply if a redirect were added. Reference: [Cal.com booking success redirect parameters](https://cal.com/help/event-types/booking-success-page-query-params).

A trustworthy branded page requires all of the following:

- durable webhook state;
- a `BOOKING_PAID` event correlated to the same booking UID;
- a confirmed booking state from Cal ID;
- a server-issued, short-lived lookup token that reveals no attendee data;
- a generic pending state while webhook delivery is still in flight.

Those conditions are not available yet, so Cal ID's own confirmation screen remains the authoritative phase-1 experience.
