import { ChevronDown } from "lucide-react";
import { faqItems } from "../config/site";
import BookingAction from "./BookingAction";

export default function FAQ() {
  return (
    <section className="landing-section faq" id="faqs" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <div className="section-heading faq__intro">
          <p className="eyebrow">Frequently asked questions</p>
          <h2 id="faq-title">Before you book</h2>
          <p>Open any question for a concise answer about the booking and consultation.</p>
        </div>
        <div className="faq__list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>
                <span>{item.question}</span>
                <ChevronDown aria-hidden="true" size={20} strokeWidth={1.75} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="container final-booking">
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Choose your consultation time</h2>
          <p>See current availability, then confirm your booking securely online.</p>
        </div>
        <BookingAction label="Continue to booking" />
      </div>
    </section>
  );
}
