import { motion } from "motion/react";
import Reveal from "./Reveal";

export default function MeetNilima() {
  return (
    <section className="landing-section meet-nilima" id="about" aria-labelledby="meet-nilima-title">
      <div className="container meet-nilima__grid">
        <figure className="meet-nilima__portrait">
          <motion.img
            alt="Nilima Sawane"
            height="3214"
            initial={{ opacity: 0, scale: 1.025, y: 16 }}
            loading="lazy"
            src="/images/nilima-sawane.jpg"
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            width="2382"
          />
          <motion.figcaption
            initial={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="meet-nilima__name">Nilima Sawane</span>
            <span className="meet-nilima__role">Personal Kundli consultations in Hindi and Marathi</span>
          </motion.figcaption>
        </figure>
        <Reveal className="meet-nilima__story" delay={0.08}>
          <p className="eyebrow">About</p>
          <h2 id="meet-nilima-title">Nilima Sawane</h2>
          <p>
            Nilima Sawane has been reading birth charts for over five years, working directly with
            individuals and families on the questions that matter most to them. Each consultation
            is built around your specific kundli, and she takes the time to explain what she sees
            in plain, clear language.
          </p>
          <a className="button button--secondary meet-nilima__link" href="#consultation">
            What she reads
          </a>
        </Reveal>
      </div>
    </section>
  );
}
