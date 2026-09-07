import { CalendarDays, NotebookPen } from "lucide-react";

export default function Preparation() {
  return (
    <section className="landing-section preparation" id="prepare" aria-labelledby="prepare-title">
      <div className="container preparation__panel">
        <div className="section-heading">
          <p className="eyebrow">Prepare for your session</p>
          <h2 id="prepare-title">A little context is all you need</h2>
          <p>
            Keep your question simple and note any background that will help frame the conversation.
          </p>
        </div>
        <div className="preparation__items">
          <article>
            <NotebookPen aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>Bring what feels relevant</h3>
              <p>Write down the themes, changes, or decisions you would most like to explore.</p>
            </div>
          </article>
          <article>
            <CalendarDays aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>Share birth details during booking</h3>
              <p>
                Cal ID may request your date, time, and place of birth so Nilima has the context for
                your reading. This landing page does not collect those details.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
