import { explorationTopics } from "../config/site";

export default function ConsultationOverview() {
  return (
    <section className="landing-section consultation-overview" aria-labelledby="guidance-scope-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Who the readings may help</p>
          <h2 id="guidance-scope-title">Bring the part of life that needs a closer look</h2>
          <p>
            A reading begins with the question or situation that matters now, then considers the
            relevant chart patterns and timing in that context.
          </p>
        </div>

        <div className="consultation-overview__grid consultation-overview__grid--scope">
          <div>
            <h3>You may want to explore</h3>
            <ul className="lined-list">
              {explorationTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
          <div className="consultation-overview__scope">
            <p className="eyebrow">A considered boundary</p>
            <h3>Guidance, not a substitute for professional advice</h3>
            <p>
              Astrology can offer a reflective perspective. It does not replace medical, legal,
              financial, or mental-health advice.
            </p>
            <a className="button button--primary" href="#consultation">
              Compare the readings
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
