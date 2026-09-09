export default function Contact() {
  return (
    <section className="landing-section contact" id="contact" aria-labelledby="contact-title">
      <div className="container final-booking">
        <div>
          <p className="eyebrow">Get in Touch</p>
          <h2 id="contact-title">Which Reading Fits You?</h2>
          <p>
            Each consultation is built around a different question. Choose the one that's closest
            to yours — Nilima will guide the rest.
          </p>
        </div>
        <div className="contact__actions">
          <a className="button button--primary" href="/book/">Book a Consultation</a>
        </div>
      </div>
    </section>
  );
}
