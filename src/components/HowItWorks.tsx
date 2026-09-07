import { howItWorks } from "../config/site";

export default function HowItWorks() {
  return (
    <section className="landing-section process" id="process" aria-labelledby="process-title">
      <div className="container">
        <div className="section-heading section-heading--centered">
          <p className="eyebrow">How it works</p>
          <h2 id="process-title">Three simple steps</h2>
        </div>
        <ol className="process__steps">
          {howItWorks.map((step, index) => (
            <li key={step.title}>
              <span className="process__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
