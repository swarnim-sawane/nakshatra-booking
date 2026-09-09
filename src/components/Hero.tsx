import { ArrowDownRight, ArrowRight } from "lucide-react";
import { DEFAULT_CAL_ID_EVENT_URLS } from "../config/scheduling";
import { consultationServices } from "../config/services";
import AvailabilityCalendar from "./AvailabilityCalendar";

export default function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="container landing-hero__grid">
        <div className="landing-hero__intro">
          <p className="eyebrow">Personal Kundli consultations with Nilima Sawane</p>
          <h1 id="hero-title">Your Kundli, studied before we meet.</h1>
          <p className="landing-hero__lede">
            Nilima prepares your Janam Kundli before the call, so your time together can focus on
            the questions that matter to you.
          </p>
          <div className="landing-hero__actions">
            <a className="button button--primary" href="#book-personal">
              Book a consultation
              <ArrowDownRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
            <a className="button button--secondary landing-hero__secondary-action" href="#consultation">
              Explore consultations
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
            </a>
          </div>
        </div>

        <aside className="landing-hero__booking" id="book-personal">
          <AvailabilityCalendar
            bookingUrl={new URL(DEFAULT_CAL_ID_EVENT_URLS["personal-consultation"])}
            service={consultationServices[0]}
          />
        </aside>

        <div className="landing-hero__supporting">
          <ul className="landing-hero__facts" aria-label="Consultation facts">
            <li><span>Experience</span><strong>8+ years of practice</strong></li>
            <li><span>Languages</span><strong>Hindi &amp; Marathi</strong></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
