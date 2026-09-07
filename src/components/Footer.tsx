import { brandName } from "../config/site";
import BookingAction from "./BookingAction";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <a className="brand" href="/">
            {brandName}
          </a>
          <p>Three focused readings with Nilima, with a clear path to booking online.</p>
        </div>
        <BookingAction class="site-footer__booking" />
      </div>
    </footer>
  );
}
