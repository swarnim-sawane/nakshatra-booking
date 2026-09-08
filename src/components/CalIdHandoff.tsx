import { ArrowRight, CalendarDays, CreditCard, Video } from "lucide-react";
import { parseCalIdBookingUrl } from "../config/scheduling";

type CalIdHandoffProps = {
  bookingUrl: URL | null;
  serviceName: string;
};

function validatedBookingUrl(bookingUrl: URL | null): URL | null {
  return bookingUrl ? parseCalIdBookingUrl(bookingUrl.href) : null;
}

export default function CalIdHandoff({
  bookingUrl,
  serviceName,
}: CalIdHandoffProps) {
  const safeUrl = validatedBookingUrl(bookingUrl);

  if (!safeUrl) {
    return (
      <section
        className="booking-handoff booking-handoff--unavailable"
        aria-live="polite"
      >
        <p className="booking-handoff__eyebrow">Booking update</p>
        <h2>Online booking is being connected</h2>
        <p>
          Please check back shortly. No booking or payment details have been
          collected.
        </p>
      </section>
    );
  }

  return (
    <section className="booking-handoff" aria-labelledby="booking-handoff-title">
      <div className="booking-handoff__copy">
        <p className="booking-handoff__eyebrow">Next step</p>
        <h2 id="booking-handoff-title">Continue with {serviceName}</h2>
        <p className="booking-handoff__lede">
          Cal ID will handle availability, your booking details, and Razorpay
          payment in one secure flow.
        </p>
        <ul className="booking-handoff__steps" aria-label="What happens next">
          <li>
            <CalendarDays aria-hidden="true" size={18} strokeWidth={1.8} />
            Choose an available time
          </li>
          <li>
            <Video aria-hidden="true" size={18} strokeWidth={1.8} />
            Receive your Google Meet details
          </li>
          <li>
            <CreditCard aria-hidden="true" size={18} strokeWidth={1.8} />
            Pay securely with Razorpay
          </li>
        </ul>
      </div>
      <div className="booking-handoff__action-group">
        <a
          className="button button--primary booking-handoff__action"
          href={safeUrl.href}
        >
          Continue to secure booking
          <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
        </a>
        <p>You’ll continue in this tab and can return at any time.</p>
      </div>
    </section>
  );
}
