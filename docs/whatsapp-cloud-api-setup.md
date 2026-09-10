# WhatsApp Cloud API setup

The first Meta test message has been sent and its test webhook viewer recorded both `sent` and `delivered`. The production webhook foundation is implemented separately from outbound booking messages so Meta can verify the callback before customer automation is enabled.

## Webhook endpoint

- Callback URL: `https://nilimasawane.vercel.app/api/whatsapp-webhook`
- Verify token: a new random server-only value stored as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Signature secret: the Meta app secret stored as `META_APP_SECRET`
- Webhook field: `messages`

The GET callback returns Meta's exact `hub.challenge` only when `hub.mode=subscribe` and `hub.verify_token` matches. POST callbacks are limited to 256 KiB and must carry a valid `X-Hub-Signature-256` HMAC made with the Meta app secret. Unsupported signed events are acknowledged and ignored. Message text, phone numbers and raw payloads are not stored or returned.

## Activate in Vercel and Meta

1. Generate a new random verify token and keep it in the owner's password manager.
2. In the Vercel `nilima` project, add `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and `META_APP_SECRET` to Production only. Neither variable may use a `PUBLIC_` or `VITE_` prefix.
3. Deploy the version containing `api/whatsapp-webhook.ts`.
4. In the Meta app's **Step 2. Production setup → Configure Webhooks**, enter the callback URL and the same verify token, then select **Verify and save**.
5. Subscribe the WhatsApp Business Account to the `messages` field.
6. Use Meta's test-webhook control and confirm the endpoint returns success before registering the production phone number.

Do not add the temporary test access token to Vercel. Outbound booking messages require a separately approved permanent system-user token, approved utility templates, booking phone/consent capture, and idempotent delivery storage; those remain outside this webhook-only activation.
