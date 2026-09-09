import { BookOpenText, MessagesSquare, NotebookPen, PhoneCall } from "lucide-react";

export default function Preparation() {
  return (
    <section className="landing-section preparation" id="experience" aria-labelledby="experience-title">
      <div className="container preparation__panel">
        <div className="section-heading">
          <h2 className="eyebrow" id="experience-title">How a Consultation Works</h2>
        </div>
        <div className="preparation__items">
          <article>
            <NotebookPen aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>Share your birth details</h3>
              <p>Date, time, and place of birth, along with a short note on what you'd like the session to cover.</p>
            </div>
          </article>
          <article>
            <BookOpenText aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>Nilima prepares your chart</h3>
              <p>Ahead of the session, so the time you spend together goes toward your questions.</p>
            </div>
          </article>
          <article>
            <MessagesSquare aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>You talk it through together</h3>
              <p>By phone, video call, or WhatsApp, whichever is easiest for you.</p>
            </div>
          </article>
          <article>
            <PhoneCall aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>You leave with a clear sense of what your chart shows and why it matters</h3>
              <p>For your situation.</p>
            </div>
          </article>
        </div>
        <div className="preparation__assurance" id="approach">
          <strong>Approach</strong>
          <p>Every reading is specific to your chart and your question. Sessions are unhurried and private, conducted in Hindi or Marathi — whichever language you're most comfortable in.</p>
        </div>
      </div>
    </section>
  );
}
