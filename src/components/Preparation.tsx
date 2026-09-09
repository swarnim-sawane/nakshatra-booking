import { BookOpenText, MessagesSquare, NotebookPen } from "lucide-react";

export default function Preparation() {
  return (
    <section className="landing-section preparation" id="experience" aria-labelledby="experience-title">
      <div className="container preparation__panel">
        <div className="section-heading">
          <p className="eyebrow">What to expect</p>
          <h2 id="experience-title">Prepared before you meet. Explained with care.</h2>
          <p>
            Your consultation is shaped around your Kundli, your questions and the time you have together.
          </p>
        </div>
        <div className="preparation__items">
          <article>
            <NotebookPen aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>Before you meet</h3>
              <p>Share your date, exact time—if known—and place of birth, along with what you would like to understand.</p>
            </div>
          </article>
          <article>
            <BookOpenText aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>Nilima prepares</h3>
              <p>Nilima prepares and studies your Janam Kundli before the call. For a relationship reading, she studies both charts.</p>
            </div>
          </article>
          <article>
            <MessagesSquare aria-hidden="true" size={24} strokeWidth={1.6} />
            <div>
              <h3>During the conversation</h3>
              <p>Nilima explains the relevant patterns in clear language, listens to your questions and discusses practical guidance or traditional nuskhe where appropriate.</p>
            </div>
          </article>
        </div>
        <div className="preparation__assurance" id="consultation-terms">
          <strong>Guidance without fear</strong>
          <p>Nilima does not use frightening predictions or present the future as fixed. Astrology is offered as reflective guidance and does not replace medical, legal, financial or mental-health advice.</p>
        </div>
      </div>
    </section>
  );
}
