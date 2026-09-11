import { useCallback, useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import {
  consultationServices,
  type ConsultationService,
} from "../config/services";
import BookingModal, { shouldOpenBookingModal } from "./BookingModal";
import {
  navigateToBookingConfirmation,
  type BookingConfirmation,
} from "../pages/BookingConfirmationPage";

type ServiceSelectorProps = {
  bookingUrlForService: (service: ConsultationService) => URL | null;
};

function formatPrice(priceInr: ConsultationService["priceInr"]) {
  return `₹${priceInr.toLocaleString("en-IN")}`;
}

export default function ServiceSelector({
  bookingUrlForService,
}: ServiceSelectorProps) {
  const [activeBooking, setActiveBooking] = useState<{
    serviceName: string;
    url: URL;
  } | null>(null);

  const finishBooking = useCallback((confirmation: BookingConfirmation) => {
    navigateToBookingConfirmation(confirmation);
  }, []);

  function openBooking(
    event: MouseEvent<HTMLAnchorElement>,
    service: ConsultationService,
    bookingUrl: URL | null,
  ) {
    if (!bookingUrl || !shouldOpenBookingModal(event)) return;
    event.preventDefault();
    setActiveBooking({ serviceName: service.name, url: bookingUrl });
  }

  return (
    <>
      <section className="service-selector" aria-label="Available consultations">
        <nav className="service-selector__catalogue" aria-label="Available readings">
          {consultationServices.map((service, index) => {
            const bookingUrl = bookingUrlForService(service);

            return (
              <a
                href={bookingUrl?.href ?? `/book/${service.hash}`}
                className="service-selector__card"
                key={service.slug}
                onClick={(event) => openBooking(event, service, bookingUrl)}
              >
                <span className="service-selector__visual" aria-hidden="true">
                  <img
                    alt=""
                    className="service-selector__image"
                    loading={index === 0 ? "eager" : "lazy"}
                    src={service.imageSrc}
                  />
                  <span className="service-selector__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="service-selector__content">
                  <span className="service-selector__name">{service.name}</span>
                  <span className="service-selector__description">
                    {service.purpose}
                  </span>
                  <span className="service-selector__footer">
                    <span className="service-selector__action-window">
                      <span className="service-selector__action-track">
                        <span className="service-selector__meta">
                          {service.durationMinutes} min · {formatPrice(service.priceInr)}
                        </span>
                        <span className="service-selector__choose">
                          View times and book
                        </span>
                      </span>
                    </span>
                    <span className="service-selector__cue" aria-hidden="true">
                      <ArrowRight size={19} strokeWidth={1.7} />
                    </span>
                  </span>
                </span>
              </a>
            );
          })}
        </nav>
        <p className="service-selector__guidance">
          Not sure which one? Start with a Personal Consultation — Nilima can guide the rest from
          there.
        </p>
      </section>
      {activeBooking ? (
        <BookingModal
          bookingUrl={activeBooking.url}
          onClose={() => setActiveBooking(null)}
          onBookingComplete={finishBooking}
          serviceName={activeBooking.serviceName}
        />
      ) : null}
    </>
  );
}
