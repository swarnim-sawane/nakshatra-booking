import { motion } from "motion/react";

const readingAreas = [
  {
    description:
      "A compatibility reading that looks at where two charts align and where they may need attention.",
    imageSrc: "/images/relationship-consultation.webp",
    name: "Marriage & Compatibility (Kundli Milan)",
  },
  {
    description:
      "For decisions around a job change, business, higher study, or simply understanding your natural strengths and timing.",
    imageSrc: "/images/career-life-direction.png",
    name: "Career & Life Direction",
  },
  {
    description:
      "Chart-based insight into recurring health concerns and family dynamics, alongside practical guidance.",
    imageSrc: "/images/health-family-matters.png",
    name: "Health & Family Matters",
  },
  {
    description: "Timing for weddings, ceremonies, and other important dates.",
    imageSrc: "/images/best-date-analysis.webp",
    name: "Muhurat (Auspicious Timing)",
  },
  {
    description:
      "A full personal consultation for when you don't have one specific question — a detailed look at what your chart shows.",
    imageSrc: "/images/consultation-desk.webp",
    name: "General Readings",
  },
] as const;

export default function ServiceCards() {
  return (
    <section className="landing-section service-cards" id="consultation" aria-labelledby="services-title">
      <div className="container">
        <div className="section-heading">
          <h2 className="eyebrow" id="services-title">What She Reads</h2>
        </div>

        <div className="service-cards__grid">
          {readingAreas.map((reading, index) => (
            <motion.article
              aria-labelledby={`reading-area-${index}-title`}
              className="service-card"
              initial={{ opacity: 0, y: 16 }}
              key={reading.name}
              transition={{ delay: index * 0.07, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ amount: 0.18, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="service-card__visual" aria-hidden="true">
                <img alt="" loading="lazy" src={reading.imageSrc} />
              </div>
              <div className="service-card__header">
                <h3 id={`reading-area-${index}-title`}>{reading.name}</h3>
                <p>{reading.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
