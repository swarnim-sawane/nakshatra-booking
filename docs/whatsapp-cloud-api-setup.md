# WhatsApp Cloud API setup

This release adds consent-gated transactional WhatsApp messages to the signed Cal ID and Meta webhook foundation. Activation is deliberately separate from deployment: do not enable it until the database migration, permanent Meta credentials, approved templates and Cal ID questions are all verified.

## Customer messages

Only two approved utility templates are sent:

- `booking_confirmation` immediately after a current `BOOKING_PAID` event. Named body variables: `customer_name`, `consultation_name`, `appointment_date`, `appointment_time`, `meeting_link`.
- `appointment_reminder_1h` one hour before the current appointment. Named body variables: `customer_name`, `consultation_name`, `appointment_time`, `meeting_link`.

There is no 24-hour WhatsApp reminder and no WhatsApp reschedule or cancellation template. A pending one-hour reminder follows a reschedule and is suppressed by cancellation. The existing Cal ID email remains the customer's source for managing, rescheduling or cancelling the booking.

## Cal ID booking questions

Add these two required booking fields to every production event type. The field identifiers must match exactly because the signed webhook projection ignores every other answer:

1. Identifier `whatsapp_phone`; type Phone or Short text; label **WhatsApp number for booking updates (include country code, for example +91 98765 43210)**.
2. Identifier `whatsapp_transactional_opt_in`; type Checkbox; label **I agree to receive transactional WhatsApp messages about this booking, including a confirmation and a reminder one hour before the consultation.** The submitted value must be Boolean `true` (the receiver also accepts the explicit values `Yes`, `True` or `I agree`).

The automation fails closed if either field is absent, invalid or not explicitly agreed. It then stores neither field and sends no WhatsApp message. When both are valid, only the normalized E.164 number and a database-derived consent timestamp are retained with the temporary booking record. The receiver does not project the customer's other answers.

## Server-only environment

Add these to Vercel Production without a `PUBLIC_` or `VITE_` prefix:

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — random callback verification value.
- `META_APP_SECRET` — Meta App Settings secret used for `X-Hub-Signature-256`.
- `WHATSAPP_ACCESS_TOKEN` — permanent system-user token, never the temporary test token.
- `WHATSAPP_PHONE_NUMBER_ID` — the production sender phone-number ID.
- `WHATSAPP_BUSINESS_ACCOUNT_ID` — the subscribed WABA ID.
- `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE=booking_confirmation`.
- `WHATSAPP_APPOINTMENT_REMINDER_1H_TEMPLATE=appointment_reminder_1h`.
- `WHATSAPP_TEMPLATE_LANGUAGE=en` — exact code for the approved custom templates currently shown as **English** in WhatsApp Manager. Do not substitute `en_US`, which Meta labels **English (US)**.
- `WHATSAPP_DISPATCHER_SECRET` — a separate random value of at least 32 characters, shared only with the external dispatcher.
- `SITE_URL=https://nilimasawane.vercel.app` — canonical HTTPS website origin used for bot links.

The Meta access token, app secret and dispatcher secret must never appear in client code, logs, screenshots or worker command arguments.

## Database activation

As the Neon owner, run the existing admin migration first and then:

```powershell
psql "$env:NEON_OWNER_DATABASE_URL" -v ON_ERROR_STOP=1 -f ".\db\migrations\202609110001_whatsapp_automation.sql"
```

The new migration grants the restricted runtime role only function execution. The outbox has one row per booking/message kind, uses PostgreSQL time, and joins the current booking only at claim time. It stores no rendered template, inbound text or raw webhook body. Meta provider message IDs are stored only as SHA-256 hashes.

## Meta webhook

- Callback URL: `https://nilimasawane.vercel.app/api/whatsapp-webhook`
- Webhook field: `messages`
- Verify token: the value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

GET returns Meta's challenge only for a matching token. POST bodies are limited to 256 KiB and verified against the exact received bytes before parsing. Events for another WABA or phone-number ID are ignored. Incoming message IDs are hashed for 30-day deduplication; phone numbers and message content are not stored.

The deterministic menu offers **Book a consultation**, **Manage booking**, **Consultation information** and **Human help**. The first three direct the customer to the website or their confirmation email. Human help sends a content-free alert through the existing owner Web Push path. If Meta rejects the interactive list, the sender uses a deterministic numbered text menu; no AI or free-text interpretation is used.

## Northflank dispatcher

Do not configure a Vercel Hobby cron. Configure a small Northflank scheduled job to make one HTTPS POST every minute:

```text
POST https://nilimasawane.vercel.app/api/whatsapp-dispatch
Authorization: Bearer <WHATSAPP_DISPATCHER_SECRET>
```

Store the shared secret in Northflank's secret manager and inject it into the request header. A call claims at most ten due rows. HTTP 200 means every claimed row was accepted by Meta. HTTP 503 means at least one row received a definitive rejection that can be retried or an ambiguous transport result that was quarantined to prevent duplicate delivery. Do not add blind HTTP retries around a timed-out request; let the next scheduled invocation claim only rows the database marked safe to retry.

## Activation checklist

1. Confirm both templates show **Approved** in Meta with the exact names, language and named variables above.
2. Add both exact Cal ID fields to all three event types and make them required.
3. Apply the WhatsApp migration as the database owner.
4. Add the server-only Vercel variables and redeploy.
5. Confirm Meta still verifies the callback and the WABA remains subscribed to `messages`.
6. Configure the Northflank scheduled call, but keep it paused.
7. Create one controlled opt-in test booking, confirm the outbox contains one confirmation and one reminder, then enable one dispatcher run.
8. Verify the customer receives one confirmation, then reschedule/cancel a separate controlled booking and confirm only the current pending reminder remains eligible.
9. Test each inbound menu choice and confirm Human help produces only the privacy-safe owner alert.

No activation step should use a real customer's details or create an unnecessary paid booking.
