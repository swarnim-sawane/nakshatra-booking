import Reveal from "../components/Reveal";

export default function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <Reveal className="not-found__panel">
        <img alt="" aria-hidden="true" height="64" src="/brand/icon-192.png" width="64" />
        <p className="eyebrow">Nakshatra</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>The page you were looking for is not here. You can return home or choose a consultation.</p>
        <div className="not-found__actions">
          <a className="button button--primary" href="/">Return home</a>
          <a className="button button--secondary" href="/#consultation">View consultations</a>
        </div>
      </Reveal>
    </section>
  );
}
