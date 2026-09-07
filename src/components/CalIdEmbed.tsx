import { useState } from "react";
import { parseCalIdBookingUrl } from "../config/scheduling";

type CalIdEmbedProps = {
  bookingUrl: URL | null;
};

const embedTitle = "Book a private consultation with Celestial Guidance";

function validatedEmbedUrl(bookingUrl: URL | null): URL | null {
  return bookingUrl ? parseCalIdBookingUrl(bookingUrl.href) : null;
}

export default function CalIdEmbed({ bookingUrl }: CalIdEmbedProps) {
  const safeUrl = validatedEmbedUrl(bookingUrl);
  const [embedKey, setEmbedKey] = useState(0);
  const [hasEmbedError, setHasEmbedError] = useState(false);

  if (!safeUrl) {
    return (
      <section aria-live="polite" className="booking-embed booking-embed--unavailable">
        <p className="booking-embed__eyebrow">Booking update</p>
        <h2>Online booking is being connected</h2>
        <p>The consultation calendar will appear here once the Cal ID event is ready.</p>
      </section>
    );
  }

  const retryEmbed = () => {
    setHasEmbedError(false);
    setEmbedKey((currentKey) => currentKey + 1);
  };

  return (
    <section className="booking-embed" aria-label="Cal ID booking calendar">
      <iframe
        key={embedKey}
        className="booking-embed__frame"
        src={safeUrl.href}
        title={embedTitle}
        loading="lazy"
        onError={() => setHasEmbedError(true)}
      />
      <div className="booking-embed__fallback" aria-live="polite">
        <p>
          {hasEmbedError
            ? "The calendar could not be shown here."
            : "If the calendar does not appear, you can continue on Cal ID."}
        </p>
        {hasEmbedError ? (
          <button className="booking-embed__retry" type="button" onClick={retryEmbed}>
            Retry calendar
          </button>
        ) : null}
        <a href={safeUrl.href} target="_blank" rel="noopener noreferrer">
          Open Cal ID in a new tab
        </a>
      </div>
    </section>
  );
}
