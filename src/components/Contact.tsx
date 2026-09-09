export default function Contact() {
  return (
    <section className="landing-section contact" id="contact" aria-labelledby="contact-title">
      <div className="container final-booking">
        <div>
          <p className="eyebrow">Private Consultations</p>
          <h2 id="contact-title">Choose the Reading That Fits Your Question</h2>
          <p>
            Review the consultation options, select a convenient time and share the details Nilima
            needs to prepare your Kundli.
          </p>
        </div>
        <div className="contact__actions">
          <a className="button button--primary" href="/book/">Book a Consultation</a>
        </div>
      </div>
    </section>
  );
}
