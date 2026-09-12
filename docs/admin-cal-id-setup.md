# Cal ID to Nakshatra Admin setup

The production admin pipeline is deployed at `https://nilimasawane.vercel.app/admin/`. Neon, the database migration, Vercel secrets, and the account-level Cal ID webhook are active. None of the server values may use a `PUBLIC_` or `VITE_` prefix.

## 1. Add the free Neon database through Vercel

1. Open the `nilima` project in Vercel.
2. Open **Storage** or **Marketplace**, select **Neon — Serverless Postgres**, and choose the plan that starts at **$0**.
3. Connect the resource to the Production environment. Preview can be enabled later if isolated preview databases are wanted.
4. Open the created project in Neon and use its SQL Editor to create the restricted application role. Replace the placeholder with a generated password kept in the owner's password manager:

   ```sql
   create role nakshatra_runtime login password '<strong-generated-password>';
   ```

   Create this role with SQL, not the Neon Console's **New role** button. Do not grant it table, schema-owner, database-owner or administrative privileges.
5. In the Neon/Vercel integration settings, select `nakshatra_runtime` as the role for the application connection and select the production database. The integration should inject one server-only variable named `DATABASE_URL`.
6. Confirm the hostname in `DATABASE_URL` contains `-pooler` and redeploy after all setup steps are complete. Do not copy this variable into frontend code.

Neon roles made through the Console/API inherit `neon_superuser`, while SQL-created roles do not. The migration refuses to continue if `nakshatra_runtime` has that membership, then grants only permission to execute the narrow `nakshatra_admin` functions used by the application. It grants no direct table access.

## 2. Apply the database migration

Run the migration as the Neon database owner, not as `nakshatra_runtime`. In the Neon SQL Editor, open and run:

`db/migrations/202609090001_calid_admin_pipeline.sql`

For WhatsApp booking automation, run this follow-up migration after it:

`db/migrations/202609110001_whatsapp_automation.sql`

To show the customer's Kundli preparation details in the protected admin app, run this migration last:

`db/migrations/202609120001_admin_customer_details.sql`

With `psql` on PowerShell, the equivalent command is:

```powershell
$env:NEON_OWNER_DATABASE_URL = "<temporary owner connection string>"
psql "$env:NEON_OWNER_DATABASE_URL" -v ON_ERROR_STOP=1 -f ".\db\migrations\202609090001_calid_admin_pipeline.sql"
Remove-Item Env:NEON_OWNER_DATABASE_URL
```

`NEON_OWNER_DATABASE_URL` is temporary local migration access. Do not add it to Vercel. The deployed application uses only the pooled, restricted `DATABASE_URL` injected by the integration.

The migrations create private tables and security-definer functions for atomic webhook deduplication, lifecycle ordering, manual deletion, retention cleanup and notification outboxes. The customer-details migration stores only the named fields needed to prepare the consultation: full name, email, phone, WhatsApp number and consent status, preferred language, birth date/time/accuracy/place, consultation questions and additional notes. Arbitrary answers, rendered notifications, inbound WhatsApp text and the raw webhook body are not stored.

## 3. Create the owner sign-in and notification keys

Run locally:

```bash
npm run setup:admin
```

Store the generated password in the owner's password manager. Add these server-only values to the Vercel Production environment:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `ADMIN_RATE_LIMIT_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` — a monitored owner email in `mailto:` form
- `CALID_WEBHOOK_SECRET`
- `CALID_API_KEY`
- `CALID_PERSONAL_EVENT_TYPE_ID`
- `CALID_RELATIONSHIP_EVENT_TYPE_ID`
- `CALID_MUHURAT_EVENT_TYPE_ID`

`DATABASE_URL` is supplied by the Neon Marketplace integration. Do not create a second browser-visible database variable.

The admin session uses a signed `Secure`, `HttpOnly`, `SameSite=Strict` cookie. Before password verification, every sign-in attempt is checked against atomic Neon-backed limits of five attempts per source and 30 attempts account-wide within 15 minutes. The source address is HMAC-hashed with `ADMIN_RATE_LIMIT_SECRET`; the database never stores the raw address. If Neon or the rate limiter is unavailable, sign-in fails closed without running PBKDF2. Passwords, session secrets, database credentials and private VAPID keys are never sent to the frontend or stored in browser storage.

## 4. Configure the Cal ID webhook

In Cal ID, open **Settings → Webhooks** at `/settings/webhooks` and create one account-level webhook:

- Subscriber URL: `https://nilimasawane.vercel.app/api/cal-id-webhook`
- Secret: the same random value stored in Vercel as `CALID_WEBHOOK_SECRET`
- Triggers: `BOOKING_CREATED`, `BOOKING_PAID`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`
- Active: enable only after the Neon migration and all Vercel variables are ready

The verified event IDs are safe defaults. They may be set explicitly as `CALID_PERSONAL_EVENT_TYPE_ID=108657`, `CALID_RELATIONSHIP_EVENT_TYPE_ID=108655` and `CALID_MUHURAT_EVENT_TYPE_ID=108656`.

Cal ID signs the exact request body with HMAC-SHA256 in `X-Cal-Signature-256`. The receiver rejects an oversized declared body before reading it and stops a streamed body as soon as it exceeds 256 KiB. The exact accepted bytes are then used for signature verification. Invalid signatures, unsupported event types and unavailable durable storage fail closed.

## 5. Retention and manual removal

- Customer-bearing appointment rows, including Kundli preparation details, are removed seven days after the appointment ends.
- Cancelled appointment rows are removed seven days after cancellation, even if the former appointment date is later.
- A signed-in owner can remove a completed or cancelled appointment immediately from its details. Active future appointments cannot be removed through this housekeeping control; Postgres rechecks this rule.
- Minimal webhook delivery IDs remain while their appointment record exists, then for at least 30 days after the appointment record is removed. This prevents a Cal ID retry from recreating a customer record or resending an already handled alert after the visible appointment was removed.
- Push subscriptions expire after 30 days without authenticated use, at their declared provider expiry, or when the push service rejects them as expired. Opening the signed-in admin app renews the current device. Use **Disable alerts on every device** to revoke all registered phones and browsers after a device is lost, shared or replaced.

Cleanup is idempotent and runs opportunistically during a valid webhook ingestion or authenticated admin schedule read. No paid cron or scheduler is required. If the site receives no legitimate request at the exact deadline, cleanup occurs on the next legitimate request.

## 6. Configure customer reminders

For each event type, keep the Cal ID confirmation/management email. Remove any old 24-hour WhatsApp workflow. The approved WhatsApp automation sends only one booking confirmation and one reminder one hour before the current appointment. Follow [the WhatsApp setup guide](whatsapp-cloud-api-setup.md) for the exact consent fields, server variables and external dispatcher.

## 7. Owner activation check

After deployment over HTTPS:

1. Open `/admin/` and sign in.
2. Install the PWA on the owner's Android phone.
3. Select **Enable alerts**, then **Send private test**.
4. Create one controlled test booking without completing an unnecessary real payment.
5. Confirm one appointment appears with the customer's preparation details inside the signed-in app, while the lock-screen alert contains no name, birth detail or private question.
6. Reschedule and cancel the controlled booking, checking that the record advances without duplication or regression.
7. Remove the cancelled test booking in the admin app and confirm it disappears while a future active booking cannot be removed.

Do not expose `/admin/` credentials, `DATABASE_URL`, migration-owner access, VAPID private keys or Cal ID webhook secrets in screenshots, browser storage, public environment variables or client bundles.
