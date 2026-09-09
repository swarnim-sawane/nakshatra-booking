import { consultationServices } from "../config/services";
import { motion } from "motion/react";

function formatPrice(priceInr: number) {
  return `₹${priceInr.toLocaleString("en-IN")}`;
}

export default function ServiceCards() {
  return (
    <section className="landing-section service-cards" id="consultation" aria-labelledby="services-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Consultations</p>
          <h2 id="services-title">Choose what you would like to understand</h2>
          <p>
            You do not need to know which chart or technique applies. Begin with the question that
            matters to you.
          </p>
        </div>

        <div className="service-cards__grid">
          {consultationServices.map((service, index) => (
            <motion.article
              aria-labelledby={`${service.slug}-title`}
              className="service-card"
              initial={{ opacity: 0, y: 16 }}
              key={service.slug}
              transition={{ delay: index * 0.07, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ amount: 0.18, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="service-card__visual" aria-hidden="true">
                <img alt="" loading="lazy" src={service.imageSrc} />
              </div>
              <div className="service-card__header">
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

              <a className="button button--primary service-card__action" href={`/book/${service.hash}`}>
                View available times
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
