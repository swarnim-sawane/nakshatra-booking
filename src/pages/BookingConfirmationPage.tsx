import { CalendarCheck, Check, Mail, ShieldCheck } from "lucide-react";
import "../styles/booking-confirmation.css";

export type BookingConfirmation = Readonly<{
  serviceName: string;
  startsAt?: string;
  state: "confirmed" | "pending" | "received";
}>;

const HISTORY_KEY = "nakshatraBookingConfirmation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeTimestamp(value: unknown) {
  if (typeof value !== "string") return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function normalizeConfirmation(value: unknown): BookingConfirmation | null {
  if (!isRecord(value)) return null;
  const serviceName = typeof value.serviceName === "string"
    ? value.serviceName.trim().slice(0, 100)
    : "";
  const state = value.state;
  if (!serviceName || !["confirmed", "pending", "received"].includes(String(state))) {
    return null;
  }
  const startsAt = safeTimestamp(value.startsAt);
  return {
    serviceName,
    state: state as BookingConfirmation["state"],
    ...(startsAt ? { startsAt } : {}),
  };
}

export function createBookingConfirmation(
  event: unknown,
  serviceName: string,
): BookingConfirmation | null {
  if (!isRecord(event) || !isRecord(event.detail) || !isRecord(event.detail.data)) {
    return null;
  }
  const data = event.detail.data;
  const uid = typeof data.uid === "string" ? data.uid.trim() : "";
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(uid)) return null;

  const providerStatus = typeof data.status === "string"
    ? data.status.trim().toLowerCase()
    : "";
  const state: BookingConfirmation["state"] = ["accepted", "confirmed"].includes(providerStatus)
    ? "confirmed"
    : ["pending", "awaiting_host"].includes(providerStatus)
      ? "pending"
      : "received";
  const startsAt = safeTimestamp(data.startTime);

  return {
    serviceName: serviceName.trim().slice(0, 100) || "Consultation",
    state,
    ...(startsAt ? { startsAt } : {}),
  };
}

export function navigateToBookingConfirmation(confirmation: BookingConfirmation) {
  const state = {
    ...(isRecord(window.history.state) ? window.history.state : {}),
    [HISTORY_KEY]: confirmation,
  };
  window.history.pushState(state, "", "/booking-confirmed/");
  window.dispatchEvent(new PopStateEvent("popstate", { state }));
}

function readConfirmationFromHistory() {
  if (typeof window === "undefined" || !isRecord(window.history.state)) return null;
  return normalizeConfirmation(window.history.state[HISTORY_KEY]);
}

function formatAppointment(startsAt: string | undefined) {
  if (!startsAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(startsAt));
}

export default function BookingConfirmationPage({
  confirmation = readConfirmationFromHistory(),
}: {
  confirmation?: BookingConfirmation | null;
}) {
  const appointment = formatAppointment(confirmation?.startsAt);
  const confirmed = confirmation?.state === "confirmed";
  const pending = confirmation?.state === "pending";

  const eyebrow = confirmed
    ? "Booking confirmed"
    : pending
      ? "Request received"
      : "Booking status";
  const heading = confirmed
    ? "Your consultation is confirmed."
    : pending
      ? "Your booking request has been received."
      : "Please check your confirmation email.";
  const lede = confirmed
    ? "Your appointment with Nilima has been recorded. The confirmation email contains the meeting link and the options for managing your booking."
    : pending
      ? "Your request has reached Nilima, but it is not confirmed yet. You will receive an email when its status is final."
      : "For privacy, booking details are not kept on this page. Your Cal ID email is the reliable record of the appointment and its current status.";

  return (
    <section className="booking-confirmation">
      <div className="container booking-confirmation__shell">
        <div className="booking-confirmation__mark" aria-hidden="true">
          {confirmed ? <Check size={34} strokeWidth={1.7} /> : <Mail size={32} strokeWidth={1.55} />}
        </div>
        <p className="booking-confirmation__eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>
        <p className="booking-confirmation__lede">{lede}</p>

        {confirmation ? (
          <dl className="booking-confirmation__details">
            <div>
              <dt>Reading</dt>
              <dd>{confirmation.serviceName}</dd>
            </div>
            {appointment ? (
              <div>
                <dt>Date and time</dt>
                <dd>{appointment}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="booking-confirmation__next">
          <div>
            <CalendarCheck aria-hidden="true" size={23} strokeWidth={1.55} />
            <span>
              <strong>Keep the confirmation email</strong>
              <small>It contains the meeting link and any rescheduling or cancellation options.</small>
            </span>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" size={23} strokeWidth={1.55} />
            <span>
              <strong>Your information stays private</strong>
              <small>Birth details and private questions are not displayed or retained on this page.</small>
            </span>
          </div>
        </div>

        <div className="booking-confirmation__actions">
          <a className="button button--primary" href="/">Return to Nakshatra</a>
          <a className="button button--secondary" href="/book/">Book another reading</a>
        </div>
      </div>
    </section>
  );
}
