import { Clock3, Globe2, Video } from "lucide-react";
import TrustRow from "./TrustRow";

export default function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="container landing-hero__grid">
        <div className="landing-hero__intro">
          <p className="eyebrow">Astrology readings with Nilima Sawane</p>
          <h1 id="hero-title">Your birth chart, understood in the context of your life.</h1>
          <p className="landing-hero__lede">
            Nilima offers focused consultations that place the chart beside the questions,
            relationships, and timing you are navigating.
          </p>
          <TrustRow />
          <a className="button button--primary" href="#consultation">
            Explore the readings
          </a>
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
              <p className="eyebrow">Three focused readings</p>
              <h2>Choose the kind of guidance you need</h2>
            </div>
            <p className="booking-preview__status">Clear duration and pricing before you book.</p>
            <ul className="booking-preview__facts" aria-label="Booking details">
              <li>
                <Clock3 aria-hidden="true" size={19} strokeWidth={1.7} />
                <span>30 or 60 minutes</span>
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
            <a className="button button--primary booking-preview__action" href="#consultation">
              Compare the readings
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
