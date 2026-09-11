# Cal ID email configuration

Status: configuration-ready, awaiting Nilima's approval and an owner-controlled test booking. No Cal ID workflow was changed from this document.

This setup uses `docs/content/2026-09-09-booking-communications-policy-draft.md` as input, but the policy language in that file remains a draft. Cal ID stays responsible for confirmation, Google Meet delivery, rescheduling, cancellation and the single reminder.

## Approved automation shape for this phase

| Customer message | Owner | Configuration |
| --- | --- | --- |
| Booking confirmation | Cal ID | Keep the default attendee confirmation enabled. |
| Reminder | Cal ID workflow | Exactly one email, 1 hour before the consultation. |
| Rescheduled booking | Cal ID | Keep the default reschedule notification. |
| Cancelled booking | Cal ID | Keep the default cancellation notification. |

There is deliberately no 24-hour reminder. Do not create one.

Do not disable Cal ID's default confirmation until a replacement confirmation has been enabled for all three event types and verified with an owner-approved paid test. Creating an additional custom confirmation now would risk duplicate emails, so phase 1 retains the default.

## Cal ID variable compatibility

The draft uses placeholder names that do not match the current Cal.com workflow syntax. The workflow editor documents uppercase variables in single braces.

| Draft placeholder | Cal ID workflow variable |
| --- | --- |
| `{{attendee_first_name}}` | `{ATTENDEE_FIRST_NAME}` |
| `{{event_type_name}}` | `{EVENT_NAME}` |
| `{{event_date}}` | `{EVENT_DATE}` |
| `{{event_time}}` | `{EVENT_TIME}` |
| `{{start_time_tz_booker}}` | `{EVENT_START_TIME_IN_ATTENDEE_TIMEZONE_VARIABLE}` |
| `{{attendee_timezone}}` | `{ATTENDEE_TIMEZONE}` |
| `{{meeting_url}}` | `{MEETING_URL}` |
| `{{reschedule_url}}` | `{RESCHEDULE_URL}` |
| `{{cancel_url}}` | `{CANCEL_URL}` |
| `{{organizer_name}}` | `{ORGANIZER_NAME}` |

`{{customer_first_name}}` and `{{payment_reference}}` are future website-backend variables, not Cal ID workflow variables. The website does not yet own payment recovery, so that recovery email must not be enabled in this phase.

Reference: [Cal.com workflow triggers, actions and variables](https://cal.com/help/workflows/workflowsoverview).

## Account-side steps

### 1. Verify the default messages

For Personal Consultation, Relationship Consultation (Kundli Milan), and Muhurat:

1. Open the event type in Cal ID.
2. Open **Booking experience → Confirmation**.
3. Keep **Disable default confirmation emails for attendees** switched off.
4. Confirm Google Meet is the location and the attendee email field is required.
5. Save only if the screen already matches this state; otherwise stop for owner approval.

Cal.com requires a working replacement workflow before its default confirmation is disabled: [confirmation email safety requirement](https://cal.com/help/event-types/disable-confirmation).

### 2. Create the one-hour reminder

In **Workflows → New**:

- Name: `Nakshatra — one-hour consultation reminder`
- Trigger: **Before the event starts**
- Timing: `1 hour`
- Action: **Send email to attendees**
- Event types: Personal Consultation, Relationship Consultation (Kundli Milan), and Muhurat
- Subject: `Your Nakshatra consultation begins in one hour`
- Body:

```text
Namaste {ATTENDEE_FIRST_NAME},

Your {EVENT_NAME} consultation with Nilima begins in one hour.

Time: {EVENT_START_TIME_IN_ATTENDEE_TIMEZONE_VARIABLE}
Your timezone: {ATTENDEE_TIMEZONE}
Join here: {MEETING_URL}

Please join five minutes early and keep your main questions nearby.

Warm regards,
Nakshatra
```

Preview the message before saving. The preview must show the attendee's timezone and a populated Google Meet link.

### 3. Reschedule and cancellation

Do not add custom reschedule or cancellation workflows yet. Keep Cal ID's default messages so the customer receives one authoritative update and Cal ID can cancel the old reminder or schedule a new reminder against the updated time.

After Nilima approves the policy draft, test whether adding branded workflow messages causes duplicate default emails. Replace defaults only where Cal ID provides a verified disable control and only after the replacement has been tested.

## Required controlled verification

Use one owner-approved paid booking, not a synthetic success redirect:

1. Confirm exactly one booking confirmation is received.
2. Confirm the Google Meet link opens the same calendar event.
3. Reschedule the booking and confirm the old reminder is removed and a new one is scheduled.
4. Confirm exactly one reminder arrives 1 hour before the new start time.
5. Cancel the booking and confirm no pending reminder is sent.
6. Confirm no email contains birth details, consultation questions, API keys or webhook signatures.

