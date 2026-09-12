import { ChevronDown } from "lucide-react";
import { bookingFaqItems, consultationFaqItems } from "../config/site";
import Reveal from "./Reveal";

export default function FAQ() {
  return (
    <section className="landing-section faq" id="faqs" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <Reveal className="section-heading faq__intro">
          <p className="eyebrow">Frequently asked questions</p>
          <h2 id="faq-title">Details worth knowing before you pay</h2>
          <p>Birth time, privacy, predictions, remedies, payment and changing an appointment.</p>
        </Reveal>
        <Reveal className="faq__groups" delay={0.08}>
          <section aria-labelledby="consultation-questions-title">
            <h3 id="consultation-questions-title">About your reading</h3>
            <div className="faq__list">
              {consultationFaqItems.map((item) => (
                <details
                  id={item.question === "How are my birth details and personal questions kept private?" ? "privacy" : undefined}
                  key={item.question}
                >
                  <summary><span>{item.question}</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.75} /></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
          <section aria-labelledby="booking-policies-title" id="booking-policies">
            <h3 id="booking-policies-title">Booking and policies</h3>
            <div className="faq__list">
              {bookingFaqItems.map((item) => (
                <details key={item.question}>
                  <summary><span>{item.question}</span><ChevronDown aria-hidden="true" size={20} strokeWidth={1.75} /></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </section>
  );
}
