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
        <p className="booking-page__eyebrow">Consultations with Nilima Sawane</p>
        <h1>Choose what you would like to explore.</h1>
        <p className="booking-page__lede">
          Each reading is prepared personally from the birth details and context you share. Select
          one to view available times.
        </p>
      </div>
      <div className="container booking-page__services">
        <ServiceSelector bookingUrlForService={bookingUrlForService} />
      </div>
    </section>
  );
}
