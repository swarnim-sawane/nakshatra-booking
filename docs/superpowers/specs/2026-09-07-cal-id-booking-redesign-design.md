# Cal ID booking redesign design

Date: 7 September 2026
Status: Ready for user review
Selected visual direction: Option 3, Booking-First Concierge

## 1. Objective

Rebuild the existing astrology consultation prototype as a polished, responsive web application for one paid one-to-one consultation. The visual language will adapt the restraint of Voicenotes—editorial typography, warm neutral surfaces, strong imagery, generous whitespace and simple black actions—without copying its branding, content or artwork.

Cal ID will own scheduling and the initial Razorpay pay-to-book flow. Google Calendar will provide conflict checking, and Google Meet will be the consultation location. The website will own the brand, explanation, policy content and route into booking.

The design must also leave a clean boundary for a later WhatsApp-first journey in which WhatsApp supplies a short-lived booking link and receives booking confirmations.

## 2. Decisions already approved

The approved initial integration is Cal ID's responsive inline embed on a dedicated `/book` page.

For the first release:

- Cal ID owns live availability, attendee questions, Google Meet creation, Razorpay payment, confirmation, cancellation, rescheduling and refunds.
- The website does not recreate Cal ID's calendar or Razorpay Checkout.
- The existing custom Cal.com, Calendly, browser-only payment and client-only administrator flows will not be part of the new application.
- The site launches with one flagship consultation rather than four competing services.
- The first release does not implement Meta WhatsApp Cloud API automation, a booking database, custom slot reservation or a background job system.

This chooses the lowest-risk commercial path while preserving a later headless Cal ID integration.

## 3. Product scope

### Included

- Premium landing page based on approved Option 3.
- Dedicated `/book` page containing the Cal ID inline embed.
- One consultation offer with one duration.
- Clear Google Meet and Razorpay reassurance.
- About, consultation method, how it works, preparation, FAQ and policy-link sections.
- Responsive navigation and always-visible mobile booking action.
- Safe failure states when Cal ID is unavailable or not configured.
- Provider-neutral configuration boundary for the Cal ID booking URL.
- Documented future WhatsApp session and webhook contracts.
- Production build, basic automated checks and browser validation.

### Excluded from this release

- Live WhatsApp messaging or Meta account setup.
- A custom customer inbox.
- A custom calendar, slot picker or payment form.
- A custom booking administrator; the astrologer will use Cal ID and Google Calendar.
- Collecting or storing birth details in this application's browser storage.
- Publishing, deploying or switching Razorpay to live mode.
- Claims, ratings, customer counts or testimonials that have not been verified.

## 4. Technology and repository structure

The new site will use Astro with TypeScript and minimal client JavaScript. This matches the existing package scripts, suits a content-led marketing site and keeps the booking embed isolated.

Proposed active structure:

```text
src/
  components/
    Header.astro
    Hero.astro
    TrustRow.astro
    ConsultationOverview.astro
    HowItWorks.astro
    AboutPractice.astro
    Preparation.astro
    FAQ.astro
    Footer.astro
    CalIdEmbed.astro
  layouts/
    BaseLayout.astro
  pages/
    index.astro
    book.astro
  styles/
    global.css
    tokens.css
  config/
    site.ts
public/
  images/
tests/
  site-config.test.mjs
legacy/
  calcom-prototype/
docs/
```

Because this folder is not a Git repository, the old prototype will be preserved under `legacy/calcom-prototype/` until the new build passes visual and functional acceptance. Nothing will be deleted during the redesign.

## 5. Visual system

### Color

```text
paper          #F7F3EA
surface        #FFFDF8
surface-muted  #EFE8DD
ink            #1C1915
text-muted     #6D675F
border         #D8CEC0
forest         #2F5D50
ochre          #A97835
error          #A34A43
```

The interface will remain approximately 85% neutral. Forest and ochre will be used for selected states, focus indicators and small factual accents. Purple gradients, glowing borders and celestial background effects will be removed.

### Typography

- Display: Newsreader with Georgia fallback, normal and occasional italic styles.
- Body and interface: Manrope with system sans fallback.
- Devanagari-ready fallbacks: Noto Serif Devanagari and Noto Sans Devanagari.
- Maximum body-copy line length: 65 characters.
- Minimum default body size: 16px.

### Layout

- Maximum content width: 1240px.
- Desktop gutters: 40px; mobile gutters: 24px.
- Primary spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128px.
- Buttons: 50–52px high, pill radius, 24px horizontal padding.
- Functional panels may use a 24px radius and one-pixel border; decorative card grids will be avoided.
- Desktop hero: editorial introduction on the left and one booking preview/visual object on the right.
- Below 960px: copy appears first, followed by the visual; the booking action remains visible.

### Imagery

The approved visual uses a warm editorial photograph of hands working with a printed birth chart. A new fitted image asset will be generated for its exact slot; the concept screenshot will not be cropped and reused as an asset.

No fictional portrait will represent the astrologer. Until a real approved portrait is supplied, the site will use the consultation still life and truthful text. A real portrait can later replace the About-section image without changing layout.

## 6. Landing-page journey

### Header

The header contains the current brand name, About, The consultation, FAQs and one “Book a consultation” button. On mobile, a compact menu and booking button remain available; primary actions are never hidden by breakpoint rules.

### Hero

The left side introduces one private consultation with a calm decision-focused headline. The reassurance list states only verifiable mechanics:

- Private one-to-one session.
- Google Meet from anywhere.
- Secure payment through Razorpay.

The right side shows a non-interactive booking preview derived from Option 3. It communicates timezone, calendar and session structure without pretending to be live. The primary action opens `/book`, where the actual Cal ID embed lives.

### Consultation overview

One offer explains duration, intended outcomes, what is included and what astrology guidance does not replace. Price is not hardcoded until the owner confirms the amount and tax treatment. The Cal ID event remains the authoritative displayed checkout price.

### How it works

Three steps:

1. Choose a time.
2. Share the requested details and pay securely.
3. Receive the Google Meet invitation and meet privately.

### About and preparation

The copy describes the practice without inventing credentials. A preparation section explains which birth details may be requested inside Cal ID and why. The web application will not store those values itself in this release.

### FAQ and policies

Questions cover booking confirmation, timezone, Google Meet, preparation, rescheduling, cancellations, refunds, privacy and support. Policy links may use concise interim pages only when the corresponding business policy has been supplied; no policy will be invented.

## 7. Booking page and Cal ID boundary

`/book` is a full page, not a modal. It provides a short context header, the actual Cal ID inline embed and a compact support/fallback area.

Public configuration contains only:

```ts
type SchedulingConfig = {
  provider: "cal-id";
  bookingUrl: string;
  defaultTimeZone: "Asia/Kolkata";
  sessionMinutes: number;
};
```

No Cal ID API key, Razorpay secret, webhook secret or Meta token may enter client code.

If `bookingUrl` is missing, the page shows a safe configuration message and does not fabricate availability. If the inline embed fails after configuration, a standard link opens the same Cal ID event page in a new tab.

The booking route accepts an optional future opaque session token:

```text
/book?s=<random-token>
```

The current release will never decode customer data from this parameter, persist it in browser storage or forward it to third parties. This keeps the public route stable for the future WhatsApp bridge.

## 8. Cal ID account configuration

The external Cal ID event must be configured with:

- One 60-minute personal event type.
- The owner's actual availability, buffers and booking limits.
- Google Calendar connected for conflicts.
- Google Meet selected as the meeting location.
- Required booking questions and consent text.
- Razorpay installed and the exact price/currency configured.
- Cancellation, rescheduling and refund rules.
- Confirmation and reminder workflows.

Cal ID's Razorpay integration requires an activated, KYC-complete Live Mode account and does not support Razorpay Test Mode. No live payment will be attempted as part of local development.

## 9. Future WhatsApp compatibility

The user's supplied WhatsApp-first architecture is preserved as the next integration phase, not mixed into the first UI release.

### Stable ownership boundaries

- WhatsApp/Meta: conversation and message-delivery authority.
- Website/backend: opaque booking sessions and orchestration authority.
- Cal ID: slot and booking authority.
- Razorpay: payment authority.

### Future session record

```text
booking_sessions
- id
- public_token_hash
- whatsapp_id
- phone_e164
- preferred_language
- selected_service_id
- selected_slot
- cal_event_type_id
- cal_reservation_uid
- razorpay_order_id
- razorpay_payment_id
- cal_booking_uid
- status
- expires_at
- created_at
- updated_at
```

Statuses:

```text
LINK_SENT
SERVICE_SELECTED
SLOT_HELD
PAYMENT_PENDING
PAID
BOOKING_CONFIRMED
PAYMENT_FAILED
EXPIRED
CANCELLED
REFUNDED
```

### Future endpoint boundary

```text
GET  /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
POST /api/webhooks/cal-id
POST /api/webhooks/razorpay
```

All future webhooks must use raw-body signature verification, event deduplication, idempotent state transitions, fast acknowledgement and queued retries. Booking tokens will be random, hashed at rest and expire after 24 hours. URLs, WhatsApp messages and Razorpay metadata will never carry birth details.

### Future headless upgrade

If WhatsApp orchestration later requires tighter payment/session correlation, the booking page may switch from the Cal ID embed to the provider-neutral API adapter without changing the site design or route. That phase will use Cal ID's verified `GET /slots/`, `POST /slots/reserve`, `POST /booking/` and reservation-release endpoints, plus server-created Razorpay orders.

The slot reservation does not guarantee final availability, so the later workflow must still handle a paid-but-unbookable recovery state and automatic refund path.

## 10. Accessibility and responsive acceptance

- Semantic landmarks and heading order.
- Keyboard-accessible navigation and FAQ disclosures.
- Visible focus indicators with at least a two-pixel treatment.
- Touch targets at least 44px.
- No primary action hidden at any breakpoint.
- No horizontal scrolling at 390px width.
- Cal ID embed presented with an accessible title and fallback link.
- Reduced-motion support.
- Contrast measured for text, buttons, borders and status messages.
- Mobile validation at 390 × 844 and desktop validation at 1440 × 1024.

## 11. Error handling

- Missing Cal ID URL: explain that online booking is not configured and provide no fake slot or payment action.
- Embed load failure: show a retry control and direct event-page link.
- External confirmation: do not infer payment or booking success from a browser redirect alone.
- Support: provide one business contact path only after the real contact detail is confirmed.
- Console errors and third-party script failures must not break the informational content or navigation.

## 12. Verification

The implementation must pass:

- Astro production build.
- Configuration tests that reject malformed or non-HTTPS Cal ID booking URLs in production.
- Search confirming no Cal.com API version, test Razorpay key, hardcoded administrator password or browser-stored customer record is loaded by the new application.
- Desktop and mobile browser walkthrough of navigation, booking CTA, `/book`, embed fallback and FAQ controls.
- Visual comparison between the selected Option 3 concept and the rendered site at matching viewport sizes.
- No live booking, payment, cancellation or WhatsApp message during automated/local validation.

## 13. Delivery phases

### Current implementation

1. Preserve the legacy prototype.
2. Establish the Astro/TypeScript application.
3. Build the approved visual system and responsive landing page.
4. Build `/book` with Cal ID inline-embed configuration and safe fallback.
5. Add tests, build checks and visual QA.

### Later integrations

1. Signed Cal ID webhook record and durable booking audit.
2. WhatsApp “Hi” to opaque booking-link flow.
3. Template confirmations, reminders and delivery tracking.
4. Secure rescheduling, cancellation and refund management.
5. Optional headless Cal ID slot-reservation and custom Razorpay orchestration.

## 14. External information required before live activation

The local build can be completed safely without secrets. Live activation will require:

- The owner's Cal ID event URL or username/event slug.
- The confirmed consultation duration and price.
- Approved business name, biography and real portrait.
- Working business contact information.
- Cancellation, refund, privacy and consultation-scope policies.
- Connected Google Calendar and Google Meet.
- Activated Live Mode Razorpay account.

