import { consultationServices } from "../config/services";

function formatPrice(priceInr: number) {
  return `₹${priceInr.toLocaleString("en-IN")}`;
}

export default function ServiceCards() {
  return (
    <section className="landing-section service-cards" id="consultation" aria-labelledby="services-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Choose your reading</p>
          <h2 id="services-title">Three readings, each with a clear focus</h2>
          <p>
            Compare what each consultation is designed to explore, what to prepare, and the full
            price before continuing to the calendar.
          </p>
        </div>

        <div className="service-cards__grid">
          {consultationServices.map((service) => (
            <article className="service-card" key={service.slug} aria-labelledby={`${service.slug}-title`}>
              <div className="service-card__header">
                <p className="service-card__duration">{service.durationMinutes} minutes</p>
                <h3 id={`${service.slug}-title`}>{service.name}</h3>
                <p>{service.purpose}</p>
              </div>

              <dl className="service-card__facts">
                <div>
                  <dt>Duration</dt>
                  <dd>{service.durationMinutes} minutes</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatPrice(service.priceInr)}</dd>
                </div>
              </dl>

              <div className="service-card__detail">
                <h4>What we can consider</h4>
                <p>{service.scope}</p>
              </div>
              <div className="service-card__detail">
                <h4>Please prepare</h4>
                <p>{service.preparation}</p>
              </div>

              <a className="button button--primary service-card__action" href={`/book/${service.hash}`}>
                Choose {service.name}
              </a>
            </article>
          ))}
        </div>

        <p className="service-cards__payment">Secure online payment through Razorpay.</p>
      </div>
    </section>
  );
}
