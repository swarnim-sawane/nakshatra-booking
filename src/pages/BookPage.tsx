import ServiceSelector from "../components/ServiceSelector";
import {
  getCalIdUrlForService,
  type CalIdServiceEnvironment,
} from "../config/scheduling";
import type { ConsultationService } from "../config/services";
import "../styles/booking.css";

type BookPageProps = {
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

export default function BookPage({
  serviceEnvironment = publicServiceEnvironment,
}: BookPageProps) {
  const bookingUrlForService = (service: ConsultationService) =>
    getCalIdUrlForService(service, serviceEnvironment);

  return (
    <section className="booking-page">
      <div className="container booking-page__intro">
        <p className="booking-page__eyebrow">Get in Touch</p>
        <h1>Book a Consultation</h1>
        <p className="booking-page__lede">
          To book a reading, share your birth details and a short note on what you'd like the
          session to cover.
        </p>
      </div>
      <div className="container booking-page__services">
        <ServiceSelector bookingUrlForService={bookingUrlForService} />
      </div>
    </section>
  );
}
