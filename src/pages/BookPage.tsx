import CalIdEmbed from "../components/CalIdEmbed";
import { schedulingConfig } from "../config/scheduling";
import "../styles/booking.css";

type BookPageProps = {
  bookingUrl?: URL | null;
};

export default function BookPage({ bookingUrl = schedulingConfig.bookingUrl }: BookPageProps) {
  return (
    <section className="booking-page">
      <div className="container booking-page__intro">
        <p className="booking-page__eyebrow">Private consultation</p>
        <h1>Book a time that feels right.</h1>
        <p className="booking-page__lede">
          Choose an available 60-minute consultation in Asia/Kolkata. The meeting is arranged on Google Meet.
        </p>
        <div className="booking-page__facts" aria-label="Booking details">
          <span>60 minutes</span>
          <span>Google Meet</span>
          <span>Razorpay in Cal ID</span>
        </div>
      </div>
      <div className="container booking-page__calendar">
        <CalIdEmbed bookingUrl={bookingUrl} />
      </div>
      <aside className="container booking-page__note">
        <p>
          Scheduling and payment happen within Cal ID. This website does not collect booking or payment details.
        </p>
      </aside>
    </section>
  );
}
