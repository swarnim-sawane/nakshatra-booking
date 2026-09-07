import { explorationTopics } from "../config/site";
import BookingAction from "./BookingAction";

export default function ConsultationOverview() {
  return (
    <section className="landing-section consultation-overview" id="consultation" aria-labelledby="consultation-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">The consultation</p>
          <h2 id="consultation-title">One focused, 60-minute session</h2>
          <p>
            Bring one question or a small set of connected themes. The session offers time to notice
            patterns, consider context, and leave with a clearer view of what you want to do next.
          </p>
        </div>

        <div className="consultation-overview__grid">
          <div>
            <h3>You might explore</h3>
            <ul className="lined-list">
              {explorationTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>What is included</h3>
            <ul className="lined-list">
              <li>A private, one-to-one conversation</li>
              <li>A 60-minute Google Meet session</li>
              <li>A meeting invitation after booking</li>
            </ul>
          </div>
          <div className="consultation-overview__scope">
            <p className="eyebrow">A considered boundary</p>
            <h3>Guidance, not a substitute for professional advice</h3>
            <p>
              Astrology can offer a reflective perspective. It does not replace medical, legal,
              financial, or mental-health advice.
            </p>
            <BookingAction label="Book the consultation" />
          </div>
        </div>
      </div>
    </section>
  );
}
