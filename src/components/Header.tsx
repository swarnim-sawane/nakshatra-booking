import { brandName, navigation } from "../config/site";
import BookingAction from "./BookingAction";
import SocialLinks from "./SocialLinks";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
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
        <nav className="primary-navigation" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <SocialLinks className="header-socials header-socials--desktop" label="Social profiles" />
          <BookingAction class="header-booking-action header-booking-action--desktop" />
          <BookingAction
            label="Book consultation"
            class="header-booking-action header-booking-action--mobile"
          />
          <details className="mobile-navigation">
            <summary aria-label="Open navigation menu">
              <span className="mobile-navigation__icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </summary>
            <nav aria-label="Mobile navigation">
              {navigation.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
              <SocialLinks
                as="div"
                className="header-socials header-socials--mobile"
                label="Social profiles"
              />
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
