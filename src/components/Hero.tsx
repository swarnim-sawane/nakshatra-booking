import { Clock3, Globe2, Video } from "lucide-react";
import BookingAction from "./BookingAction";
import TrustRow from "./TrustRow";

export default function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="container landing-hero__grid">
        <div className="landing-hero__intro">
          <p className="eyebrow">One-to-one astrology consultation</p>
          <h1 id="hero-title">A private space for clarity and direction</h1>
          <p className="landing-hero__lede">
            A focused 60-minute conversation shaped around the questions, patterns, or decisions you
            want to explore.
          </p>
          <TrustRow />
          <BookingAction label="Book your 60-minute session" />
        </div>

        <aside className="booking-preview" aria-label="Consultation booking preview">
          <img
            alt="Hands making notes beside a printed birth chart"
            className="booking-preview__image"
            height="992"
            src="/images/consultation-desk.webp"
            width="1586"
          />
          <div className="booking-preview__body">
            <div>
              <p className="eyebrow">Private consultation</p>
              <h2>Choose a time that works for you</h2>
            </div>
            <p className="booking-preview__status">Live availability on the booking page.</p>
            <ul className="booking-preview__facts" aria-label="Booking details">
              <li>
                <Clock3 aria-hidden="true" size={19} strokeWidth={1.7} />
                <span>60 minutes</span>
              </li>
              <li>
                <Globe2 aria-hidden="true" size={19} strokeWidth={1.7} />
                <span>Asia/Kolkata</span>
              </li>
              <li>
                <Video aria-hidden="true" size={19} strokeWidth={1.7} />
                <span>Google Meet</span>
              </li>
            </ul>
            <BookingAction class="booking-preview__action" label="View live availability" />
          </div>
        </aside>
      </div>
    </section>
  );
}
