# Nakshatra Booking Communications and Policy Draft

Status: Draft for Nilima's approval. Do not publish or configure policy-specific promises until the decisions in the approval checklist are confirmed.

This pack covers the website and Cal.id phase only. It contains no WhatsApp or Meta automation. Cal.id remains responsible for booking, Razorpay payment, Google Meet, confirmation email, rescheduling, cancellation, and the one-hour reminder.

## Automation schedule

| Trigger | Recipient | Channel | Timing | Owner | Template |
| --- | --- | --- | --- | --- | --- |
| Confirmed paid booking | Customer | Email | Immediately after confirmation | Cal.id | Booking confirmation |
| Confirmed paid booking | Nilima | Email | Immediately after confirmation | Cal.id | Host notification |
| Upcoming consultation | Customer | Email | 1 hour before the start time | Cal.id | One-hour reminder |
| Booking rescheduled | Customer | Email | Immediately | Cal.id | Rescheduled booking |
| Booking cancelled | Customer | Email | Immediately | Cal.id | Cancellation acknowledgement |
| Payment captured but booking not confirmed | Customer and operator | Email | As soon as the failure is verified | Website backend | Booking recovery |
| Consultation completed | Customer | Email | 2 hours after the scheduled end | Cal.id, optional | Thank you |

There is deliberately no 24-hour reminder.

## Cal.id variables used

Use Cal.id's supported variables rather than manually copying booking information:

- `{{attendee_first_name}}`
- `{{event_type_name}}`
- `{{event_date}}`
- `{{event_time}}`
- `{{start_time_tz_booker}}`
- `{{attendee_timezone}}`
- `{{meeting_url}}`
- `{{reschedule_url}}`
- `{{cancel_url}}`
- `{{organizer_name}}`

Before configuring these messages, preview each workflow with representative values. Confirm that the date and time render in the customer's timezone and that Google Meet, reschedule, and cancellation links are populated.

## 1. Customer booking confirmation

**Trigger:** A paid booking is confirmed in Cal.id.

**Subject:** Your Nakshatra consultation is confirmed — `{{event_date}}`

**Body:**

> Namaste `{{attendee_first_name}}`,
>
> Your consultation with Nilima Sawane is confirmed.
>
> **Consultation:** `{{event_type_name}}`  
> **Date:** `{{event_date}}`  
> **Time:** `{{start_time_tz_booker}}`  
> **Your timezone:** `{{attendee_timezone}}`
>
> **Join the consultation:** `{{meeting_url}}`
>
> Before the consultation, please keep your birth details and the main questions you would like to discuss ready. Joining five minutes early will give you time to check your connection.
>
> **Manage your booking**  
> Reschedule: `{{reschedule_url}}`  
> Cancel: `{{cancel_url}}`
>
> If you need help, contact us at **[SUPPORT CONTACT TO BE CONFIRMED]**.
>
> Warm regards,  
> Nakshatra  
> Consultations by Nilima Sawane

### Confirmation safety rule

Send this only after Cal.id has created a confirmed booking. A browser redirect or Razorpay checkout-success callback is not sufficient proof.

## 2. Host booking notification

**Trigger:** A paid booking is confirmed in Cal.id.

**Subject:** New Nakshatra booking — `{{event_type_name}}` on `{{event_date}}`

**Body:**

> A new consultation has been confirmed.
>
> **Customer:** `{{attendee_first_name}}`  
> **Consultation:** `{{event_type_name}}`  
> **Date:** `{{event_date}}`  
> **Time:** `{{event_time}}`
>
> Open the booking securely in Cal.id to review the information supplied by the customer. Do not forward birth details or consultation questions through ordinary email.

## 3. One-hour reminder

**Trigger:** One hour before a confirmed consultation begins.

**Subject:** Your Nakshatra consultation begins in one hour

**Body:**

> Namaste `{{attendee_first_name}}`,
>
> Your `{{event_type_name}}` consultation with Nilima begins in one hour.
>
> **Time:** `{{start_time_tz_booker}}`  
> **Join here:** `{{meeting_url}}`
>
> Please join five minutes early and keep your main questions nearby.
>
> Warm regards,  
> Nakshatra

## 4. Rescheduled booking

**Trigger:** Cal.id confirms a rescheduled booking.

**Subject:** Your Nakshatra consultation has been rescheduled

**Body:**

> Namaste `{{attendee_first_name}}`,
>
> Your consultation has been moved to the following time:
>
> **Consultation:** `{{event_type_name}}`  
> **New date:** `{{event_date}}`  
> **New time:** `{{start_time_tz_booker}}`  
> **Your timezone:** `{{attendee_timezone}}`
>
> **Join the consultation:** `{{meeting_url}}`
>
> Reschedule again: `{{reschedule_url}}`  
> Cancel: `{{cancel_url}}`
>
> If you did not request this change, contact us promptly at **[SUPPORT CONTACT TO BE CONFIRMED]**.
>
> Warm regards,  
> Nakshatra

The old reminder job must be cancelled and a new one-hour reminder created for the updated time.

## 5. Cancellation acknowledgement

**Trigger:** Cal.id confirms cancellation.

**Subject:** Your Nakshatra consultation has been cancelled

**Body:**

> Namaste `{{attendee_first_name}}`,
>
> Your `{{event_type_name}}` consultation scheduled for `{{event_date}}` at `{{start_time_tz_booker}}` has been cancelled.
>
> If a refund is due under the policy accepted during booking, it will be returned through the original payment method. The time taken to appear in your account depends on Razorpay, your bank, and the payment method used.
>
> If you did not request this cancellation, or need help understanding the refund status, contact us at **[SUPPORT CONTACT TO BE CONFIRMED]**.
>
> Warm regards,  
> Nakshatra

Do not promise that a refund has been issued unless the refund request has actually been accepted by Razorpay. When available, send the verified refund reference in a separate operational message.

## 6. Payment received but booking not confirmed

**Trigger:** Razorpay payment is verified but Cal.id has not produced a confirmed booking after the defined retry period.

**Subject:** We received your payment and are checking your booking

**Body:**

> Namaste `{{customer_first_name}}`,
>
> We received your payment for the Nakshatra consultation, but the appointment has not yet been confirmed.
>
> You do not need to make another payment. We are checking the booking and will contact you with either a confirmed appointment or a full refund.
>
> **Payment reference:** `{{payment_reference}}`
>
> If you need help, contact us at **[SUPPORT CONTACT TO BE CONFIRMED]**.
>
> Warm regards,  
> Nakshatra

### Internal operator alert

The backend must alert the operator with the internal booking-session ID, Cal.id event type, selected slot, Razorpay order ID, Razorpay payment ID, retry status, and safe error category. Do not include birth details, consultation questions, API keys, signatures, or payment secrets.

## 7. Optional post-consultation thank-you

**Trigger:** Two hours after the scheduled consultation ends, provided it was not cancelled or marked as a no-show.

**Subject:** Thank you for speaking with Nilima

**Body:**

> Namaste `{{attendee_first_name}}`,
>
> Thank you for choosing Nakshatra and speaking with Nilima today. We hope the consultation helped you understand your chart and the questions you brought to the conversation more clearly.
>
> If there is an agreed follow-up from the consultation, Nilima will share it through the contact method discussed with you.
>
> Warm regards,  
> Nakshatra

This message must not promise written notes, a recording, remedies, or continuing support unless Nilima has explicitly approved those deliverables.

## Proposed booking policy

The following rules are a recommended starting point and require Nilima's approval before publication.

### Rescheduling

- One reschedule is allowed without an additional charge when requested at least 12 hours before the consultation.
- The customer must choose from currently available times.
- Requests made less than 12 hours before the consultation are reviewed individually and are not automatically guaranteed.
- The new appointment is not confirmed until Cal.id records the reschedule.

### Cancellation and refunds

- Cancellation at least 24 hours before the consultation: full refund to the original payment method.
- Cancellation less than 24 hours before the consultation: no automatic refund; an exceptional reschedule may be considered.
- If Nilima cancels and the customer does not want another time: full refund.
- If payment succeeds but the booking cannot be confirmed: offer another suitable time or a full refund.
- Payment-processing charges, if any are non-refundable, must be disclosed before payment; do not add this rule until Razorpay and Cal.id behaviour is verified.
- Refund timing must be described as an estimate, not a guarantee, and confirmed against the actual Razorpay account behaviour.

### Late arrival

- The consultation still ends at the originally scheduled time so later appointments are not affected.
- If the customer is delayed, they should use the confirmed support contact as soon as possible.
- A customer who has not joined or contacted Nakshatra within 15 minutes may be treated as a no-show.

### No-show

- No automatic refund for a customer no-show.
- A new appointment requires a new booking unless Nilima approves an exception.
- If Nilima is unavailable or does not join, offer a priority reschedule or full refund.

### Scope and privacy

- Astrology consultations provide personal guidance and do not replace medical, legal, financial, or mental-health advice.
- No specific outcome is guaranteed.
- Customers should share only information relevant to the consultation.
- Birth details and consultation questions must remain in the secure booking record and must not be copied into marketing systems, ordinary email alerts, URLs, or logs.

## Owner approval checklist

Nilima should confirm each item before policy text is added to the website or customer emails:

- [ ] Support email address or WhatsApp number customers may contact.
- [ ] Whether one free reschedule is correct.
- [ ] Whether the rescheduling cutoff is 12 hours.
- [ ] Whether the full-refund cancellation cutoff is 24 hours.
- [ ] Whether late cancellations may receive a discretionary reschedule.
- [ ] Whether 15 minutes is the correct no-show threshold.
- [ ] Whether customer no-shows receive no refund.
- [ ] Whether payment-processing charges are refundable in the actual Cal.id/Razorpay setup.
- [ ] The realistic refund-processing estimate shown by Razorpay.
- [ ] Whether the post-consultation thank-you email should be enabled.
- [ ] Whether any written notes, recording, remedy list, or follow-up is included.
- [ ] How long Nilima and the booking provider retain birth details and consultation questions.

## Configuration and verification checklist

- [ ] Keep Cal.id's default confirmation enabled until the replacement confirmation is active and tested.
- [ ] Attach each approved workflow to Personal Consultation, Relationship Consultation, and Muhurat.
- [ ] Configure only one reminder: one hour before the start time.
- [ ] Confirm all emails use the attendee's timezone.
- [ ] Confirm every Google Meet link is present and opens the correct event.
- [ ] Confirm rescheduling cancels the old reminder and creates a new one.
- [ ] Confirm cancellation suppresses the pending reminder.
- [ ] Confirm duplicate webhooks do not send duplicate recovery messages.
- [ ] Complete one owner-approved controlled paid booking before launch.
- [ ] Reconcile the booking in Cal.id, Razorpay, Google Calendar, Google Meet, and the customer inbox.
- [ ] Test rescheduling, cancellation, and the verified refund path separately.

