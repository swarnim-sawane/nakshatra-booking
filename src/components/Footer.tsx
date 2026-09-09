import { brandName } from "../config/site";
import SocialLinks from "./SocialLinks";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <a className="brand" href="/" aria-label={brandName}>
            <img
              alt=""
              aria-hidden="true"
              className="brand__mark"
              height="32"
              src="/brand/icon-192.png"
              width="32"
            />
            <span className="brand__wordmark">{brandName}</span>
          </a>
          <p>Personal Kundli consultations with Nilima Sawane · Hindi and Marathi · Online</p>
          <SocialLinks className="site-footer__socials" label="Follow Nakshatra" />
        </div>
        <nav className="site-footer__links" aria-label="Practice information">
          <a href="/#about">About Nilima</a>
          <a href="/#consultation">What she reads</a>
          <a href="/#experience">How it works</a>
          <a href="/#approach">Approach</a>
          <a href="/#faqs">FAQs</a>
          <a href="/#contact">Get in touch</a>
        </nav>
      </div>
    </footer>
  );
}
