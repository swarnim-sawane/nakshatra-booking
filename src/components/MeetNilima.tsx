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
            <span className="meet-nilima__role">Kundli astrologer · Hindi and Marathi consultations</span>
          </motion.figcaption>
        </figure>
        <Reveal className="meet-nilima__story" delay={0.08}>
          <p className="eyebrow">About Nilima</p>
          <h2 id="meet-nilima-title">I study your Kundli before we speak.</h2>
          <dl className="meet-nilima__credentials" aria-label="Nilima's experience and languages">
            <div>
              <dt>Experience</dt>
              <dd>8+ years of Kundli reading</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>Hindi and Marathi</dd>
            </div>
          </dl>
          <p>
            I have been reading Kundlis for more than eight years. Before every consultation, I
            prepare the chart myself and study the question or situation you have shared, so our
            time is not spent starting from the beginning.
          </p>
          <p>
            During the call, I explain the patterns I see in clear language and leave room for you
            to question, reflect and go deeper. Where it is appropriate, I may also suggest
            practical steps or traditional nuskhe—always as guidance, never as a promise.
          </p>
          <p className="meet-nilima__language-note">
            You can speak with me in Hindi or Marathi—whichever feels most natural.
          </p>
          <a className="button button--secondary meet-nilima__link" href="#consultation">
            View consultations
          </a>
        </Reveal>
      </div>
    </section>
  );
}
