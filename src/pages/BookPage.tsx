import { useEffect, useState } from "react";
import CalIdHandoff from "../components/CalIdHandoff";
import ServiceSelector from "../components/ServiceSelector";
import {
  getCalIdUrlForService,
  type CalIdServiceEnvironment,
} from "../config/scheduling";
import {
  getServiceByHash,
  type ConsultationService,
} from "../config/services";
import "../styles/booking.css";

type BookPageProps = {
  bookingUrl?: URL | null;
  initialHash?: string;
  serviceEnvironment?: CalIdServiceEnvironment;
};

const publicServiceEnvironment: CalIdServiceEnvironment = {
  PUBLIC_CAL_ID_BOOKING_URL: import.meta.env.PUBLIC_CAL_ID_BOOKING_URL,
  PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL:
    import.meta.env.PUBLIC_CAL_ID_PERSONAL_CONSULTATION_URL,
  PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL:
    import.meta.env.PUBLIC_CAL_ID_RELATIONSHIP_CONSULTATION_URL,
  PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL:
    import.meta.env.PUBLIC_CAL_ID_BEST_DATE_ANALYSIS_URL,
};

function serviceFromCurrentHash(initialHash?: string) {
  if (initialHash !== undefined) return getServiceByHash(initialHash);
  if (typeof window === "undefined") return getServiceByHash("");
  return getServiceByHash(window.location.hash);
}

function formatPrice(priceInr: ConsultationService["priceInr"]) {
  return `₹${priceInr.toLocaleString("en-IN")}`;
}

export default function BookPage({
  bookingUrl,
  initialHash,
  serviceEnvironment = publicServiceEnvironment,
}: BookPageProps) {
  const [activeService, setActiveService] = useState(() =>
    serviceFromCurrentHash(initialHash),
  );

  useEffect(() => {
    if (initialHash !== undefined || typeof window === "undefined") return;

    const selectFromHash = () => {
      setActiveService(getServiceByHash(window.location.hash));
    };

    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [initialHash]);

  const activeBookingUrl =
    bookingUrl !== undefined
      ? bookingUrl
      : getCalIdUrlForService(activeService, serviceEnvironment);

  return (
    <section className="booking-page">
      <div className="container booking-page__intro">
        <p className="booking-page__eyebrow">Readings with Nilima Sawane</p>
        <h1>Book a time that feels right.</h1>
        <p className="booking-page__lede">
          Choose the reading that fits your question, then select an available time.
        </p>
        <div className="booking-page__facts" aria-label="Booking details">
          <span>Times shown in your timezone</span>
          <span>Join privately through Google Meet</span>
          <span>Secure online payment through Razorpay</span>
        </div>
      </div>
      <div className="container booking-page__services">
        <ServiceSelector activeService={activeService} onSelect={setActiveService} />
        <section
          className="booking-page__selection"
          aria-atomic="true"
          aria-live="polite"
          aria-labelledby="selected-service-title"
        >
          <p className="booking-page__eyebrow">Selected reading</p>
          <h2 id="selected-service-title">{activeService.name}</h2>
          <dl className="booking-page__selection-facts">
            <div>
              <dt>Duration</dt>
              <dd>{activeService.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(activeService.priceInr)}</dd>
            </div>
          </dl>
          <p className="booking-page__preparation">
            <strong>Prepare:</strong> {activeService.preparation}
          </p>
        </section>
      </div>
      <div className="container booking-page__handoff">
        <CalIdHandoff
          bookingUrl={activeBookingUrl}
          serviceName={activeService.name}
        />
      </div>
    </section>
  );
}
