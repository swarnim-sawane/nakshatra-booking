import { brandName, navigation } from "../config/site";
import BookingAction from "./BookingAction";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="brand" href="/" aria-label={brandName}>
          <img aria-hidden="true" className="brand__mark" src="/brand/icon-192.png" width="32" height="32" />
          <span>{brandName}</span>
        </a>
        <nav className="primary-navigation" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <details className="mobile-navigation">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              {navigation.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
          <BookingAction class="header-booking-action header-booking-action--desktop" />
          <BookingAction class="header-booking-action header-booking-action--mobile" label="Book" />
        </div>
      </div>
    </header>
  );
}
