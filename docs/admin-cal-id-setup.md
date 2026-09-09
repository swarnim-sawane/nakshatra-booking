# Cal ID to Nakshatra Admin setup

The code is complete locally, but the live connection remains deliberately inactive until the owner supplies the server credentials and applies the database migration. None of these values may use a `PUBLIC_` or `VITE_` prefix.

## 1. Create the private database

1. Create or select a Supabase project.
2. Run `supabase/migrations/202609090001_calid_admin_pipeline.sql` in the SQL editor.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel.

The migration enables row-level security, grants access only to `service_role`, deduplicates webhook deliveries, applies lifecycle changes in one transaction and keeps a durable push-delivery outbox. It does not create columns for birth details, private questions, attendee email, phone number or raw webhook payloads.

## 2. Create the owner sign-in and notification keys

Run:

```bash
npm run setup:admin
```

Store the generated password in the owner's password manager. Add the printed `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` values to Vercel. Replace `VAPID_SUBJECT` with a monitored owner email in `mailto:` form.

The admin session uses a signed `Secure`, `HttpOnly`, `SameSite=Strict` cookie. No password, session secret or service-role key is sent to the frontend or stored in local storage.

## 3. Configure the Cal ID webhook

In Cal ID, open **Settings → Webhooks** at `/settings/webhooks` and create one account-level webhook:

- Subscriber URL: `https://<production-domain>/api/cal-id-webhook`
- Secret: a new random secret also stored in Vercel as `CALID_WEBHOOK_SECRET`
- Triggers: `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`
- Active: enabled only after the Supabase migration and Vercel variables are ready

The verified event IDs are already safe defaults. They may be set explicitly as `CALID_PERSONAL_EVENT_TYPE_ID=108657`, `CALID_RELATIONSHIP_EVENT_TYPE_ID=108655` and `CALID_MUHURAT_EVENT_TYPE_ID=108656`.

Cal ID signs the exact request body with HMAC-SHA256 in `X-Cal-Signature-256`. The receiver rejects an invalid signature, an oversized body, unsupported event types and unavailable durable storage.

## 4. Keep customer reminders in Cal ID

For each of the three event types, keep exactly one customer email reminder scheduled **1 hour before** the consultation. Remove or disable any 24-hour reminder. Do not add a WhatsApp reminder in this release. The Nakshatra Web Push alerts are private owner notifications and do not replace the customer's Cal ID email.

## 5. Owner activation check

After deployment over HTTPS:

1. Open `/admin/` and sign in.
2. Install the PWA on the owner's Android phone.
3. Select **Enable alerts**, then **Send private test**.
4. Create one controlled test booking without completing an unnecessary real payment.
5. Confirm a single sanitized record appears, a privacy-safe alert arrives and no name or appointment detail appears on the lock screen.
6. Reschedule and cancel the controlled booking, checking that the record advances without duplicating or regressing.

Do not expose `/admin/` credentials, Supabase service-role credentials, VAPID private keys or Cal ID webhook secrets in screenshots, browser storage, public environment variables or client bundles.
