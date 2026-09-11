import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import {
  getCalIdEventPath,
  parseCalIdBookingUrl,
} from "../config/scheduling";
import {
  createBookingConfirmation,
  type BookingConfirmation,
} from "../pages/BookingConfirmationPage";
import "../styles/booking-modal.css";

type CalCommand = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns: Record<string, CalCommand>;
  q: IArguments[];
};

declare global {
  interface Window {
    Cal?: CalCommand;
  }
}

type BookingModalProps = {
  bookingUrl: URL;
  onClose: () => void;
  onBookingComplete: (confirmation: BookingConfirmation) => void;
  serviceName: string;
};

let embedInstance = 0;

function getCalApi() {
  if (window.Cal) return window.Cal;

  const queue = (command: CalCommand, args: IArguments) => command.q.push(args);
  const cal = function (this: unknown) {
    const args = arguments;

    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const script = document.createElement("script");
      script.src = "https://cal.id/embed-link/embed.js";
      script.async = true;
      document.head.appendChild(script);
      cal.loaded = true;
    }

    if (args[0] === "init") {
      const namespace = args[1];
      const namespacedCommand = function (this: unknown) {
        queue(namespacedCommand, arguments);
      } as CalCommand;
      namespacedCommand.q = namespacedCommand.q || [];
      namespacedCommand.ns = namespacedCommand.ns || {};

      if (typeof namespace === "string") {
        cal.ns[namespace] = cal.ns[namespace] || namespacedCommand;
        queue(cal.ns[namespace], args);
        queue(cal, ["initNamespace", namespace] as unknown as IArguments);
      } else {
        queue(cal, args);
      }
      return;
    }

    queue(cal, args);
  } as CalCommand;

  cal.ns = {};
  cal.q = [];
  window.Cal = cal;
  return cal;
}

function isCompactViewport() {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 700px)").matches
    : window.innerWidth <= 700;
}

function bookingLinkForEmbed(bookingUrl: URL, eventPath: string) {
  const params = new URLSearchParams(bookingUrl.search);
  params.delete("layout");
  const query = params.toString();
  return query ? `${eventPath}?${query}` : eventPath;
}

export function shouldOpenBookingModal(
  event: ReactMouseEvent<HTMLAnchorElement>,
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function BookingModal({
  bookingUrl,
  onClose,
  onBookingComplete,
  serviceName,
}: BookingModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const completionHandledRef = useRef(false);
  const containerIdRef = useRef(`nakshatra-cal-id-${++embedInstance}`);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "slow">(
    "loading",
  );
  const safeBookingUrl = parseCalIdBookingUrl(bookingUrl.href);
  const eventPath = safeBookingUrl
    ? getCalIdEventPath(safeBookingUrl)
    : null;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!safeBookingUrl || !eventPath) return;

    const container = document.getElementById(containerIdRef.current);
    if (!container) return;

    let iframe: HTMLIFrameElement | null = null;
    let frameReadyTimer = 0;
    const markReady = () => setLoadState("ready");
    const observer = new MutationObserver(() => {
      const embeddedFrame = container.querySelector("iframe");
      if (!embeddedFrame || embeddedFrame === iframe) return;
      iframe = embeddedFrame;
      iframe.title = `${serviceName} booking form`;
      iframe.addEventListener("load", markReady, { once: true });
      frameReadyTimer = window.setTimeout(markReady, 2_500);
    });
    observer.observe(container, { childList: true, subtree: true });

    const compact = isCompactViewport();
    const layout = compact ? "column_view" : "month_view";
    const calLink = bookingLinkForEmbed(safeBookingUrl, eventPath);
    const cal = getCalApi();
    const namespace = containerIdRef.current;
    cal("init", namespace, { origin: "https://cal.id" });
    cal.ns[namespace]("on", {
      action: "iframeReady",
      callback: markReady,
    });
    cal.ns[namespace]("on", {
      action: "bookingSuccessfulV2",
      callback: (event: unknown) => {
        if (completionHandledRef.current) return;
        const confirmation = createBookingConfirmation(event, serviceName);
        if (!confirmation) return;
        completionHandledRef.current = true;
        onBookingComplete(confirmation);
      },
    });
    cal.ns[namespace]("ui", {
      cssVarsPerTheme: {
        dark: { "cal-brand": "#91611f" },
        light: { "cal-brand": "#91611f" },
      },
      hideEventTypeDetails: false,
      layout,
    });
    cal.ns[namespace]("inline", {
      calLink,
      config: { layout },
      elementOrSelector: `#${containerIdRef.current}`,
    });

    const slowTimer = window.setTimeout(() => {
      setLoadState((current) => (current === "loading" ? "slow" : current));
    }, 10_000);

    return () => {
      observer.disconnect();
      iframe?.removeEventListener("load", markReady);
      window.clearTimeout(frameReadyTimer);
      window.clearTimeout(slowTimer);
    };
  }, [eventPath, onBookingComplete, safeBookingUrl?.href, serviceName]);

  if (!safeBookingUrl || !eventPath || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="booking-modal__backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        aria-labelledby="booking-modal-title"
        aria-modal="true"
        className="booking-modal__panel"
        role="dialog"
      >
        <header className="booking-modal__header">
          <div className="booking-modal__title-group">
            <img alt="" aria-hidden="true" src="/brand/icon-192.png" />
            <div>
              <p>{serviceName}</p>
              <h2 id="booking-modal-title">Complete your booking</h2>
            </div>
          </div>
          <div className="booking-modal__controls">
            <a
              aria-label="Open booking in a separate tab"
              className="booking-modal__external"
              href={safeBookingUrl.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>Open separately</span>
              <ExternalLink aria-hidden="true" size={17} strokeWidth={1.7} />
            </a>
            <button
              aria-label="Close booking"
              className="booking-modal__close"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" size={22} strokeWidth={1.6} />
            </button>
          </div>
        </header>

        <div className="booking-modal__body">
          <div className="booking-modal__embed" id={containerIdRef.current} />
          {loadState !== "ready" ? (
            <div className="booking-modal__loader" role="status">
              <img alt="" aria-hidden="true" src="/brand/icon-192.png" />
              <strong>
                {loadState === "slow"
                  ? "The booking page is taking longer than usual"
                  : "Preparing your booking"}
              </strong>
              <p>
                {loadState === "slow"
                  ? "You can wait here or open the booking page separately."
                  : "Your selected consultation and time are being kept."}
              </p>
              {loadState === "slow" ? (
                <a
                  className="button button--secondary"
                  href={safeBookingUrl.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open booking page
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}
