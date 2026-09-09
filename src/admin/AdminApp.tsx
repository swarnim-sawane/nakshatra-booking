import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  RefreshCw,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterBookings,
  findNextBooking,
  formatBookingDate,
  formatBookingTime,
  loadDemoBookings,
  safeMeetingUrl,
  type AdminBooking,
  type BookingFilter,
} from "./bookings";
import {
  registerAdminServiceWorker,
  requestNotificationPermission,
  sendTestNotification,
} from "./pwa";
import "./admin.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type AdminAppProps = {
  loadBookings?: () => Promise<AdminBooking[]>;
  now?: Date;
  serviceWorkerRegistration?: ServiceWorkerRegistration | null;
};

const filterLabels: Record<BookingFilter, string> = {
  upcoming: "Upcoming",
  today: "Today",
  all: "All",
};

const statusLabels: Record<AdminBooking["status"], string> = {
  confirmed: "Confirmed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  completed: "Completed",
};

function timeUntil(startsAt: string, now: Date) {
  const minutes = Math.max(
    0,
    Math.round((new Date(startsAt).getTime() - now.getTime()) / (60 * 1000)),
  );

  if (minutes < 60) return `Starts in ${minutes} min`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `Starts in ${hours} hr ${remainder} min` : `Starts in ${hours} hr`;
  }

  const days = Math.ceil(minutes / (24 * 60));
  return `Starts in ${days} ${days === 1 ? "day" : "days"}`;
}

function StatusPill({ status }: { status: AdminBooking["status"] }) {
  return (
    <span className={`admin-status admin-status--${status}`}>
      {statusLabels[status]}
    </span>
  );
}

function MeetingLink({ booking, compact = false }: { booking: AdminBooking; compact?: boolean }) {
  const meetingUrl = safeMeetingUrl(booking);
  if (!meetingUrl) return null;

  return (
    <a
      className={compact ? "admin-meeting-link admin-meeting-link--compact" : "admin-meeting-link"}
      href={meetingUrl.href}
      rel="noreferrer"
      target="_blank"
    >
      <Video aria-hidden="true" size={18} strokeWidth={1.8} />
      Join Google Meet
    </a>
  );
}

export default function AdminApp({
  loadBookings = loadDemoBookings,
  now,
  serviceWorkerRegistration,
}: AdminAppProps) {
  const [referenceNow] = useState(() => now ?? new Date());
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [filter, setFilter] = useState<BookingFilter>("upcoming");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(
    serviceWorkerRegistration ?? null,
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => (typeof Notification === "undefined" ? "unsupported" : Notification.permission));
  const [notificationMessage, setNotificationMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    let active = true;
    setLoadError(false);

    loadBookings()
      .then((records) => {
        if (active) setBookings(records);
      })
      .catch(() => {
        if (active) {
          setBookings(null);
          setLoadError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [loadBookings, reloadCount]);

  useEffect(() => {
    if (serviceWorkerRegistration !== undefined) {
      setRegistration(serviceWorkerRegistration);
      return;
    }

    void registerAdminServiceWorker().then(setRegistration);
  }, [serviceWorkerRegistration]);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  useEffect(() => {
    if (!selectedBooking) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedBooking(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedBooking]);

  const retry = useCallback(() => {
    setBookings(null);
    setReloadCount((count) => count + 1);
  }, []);

  const visibleBookings = useMemo(
    () => (bookings ? filterBookings(bookings, filter, referenceNow) : []),
    [bookings, filter, referenceNow],
  );
  const nextBooking = useMemo(
    () => (bookings ? findNextBooking(bookings, referenceNow) : undefined),
    [bookings, referenceNow],
  );
  const todayCount = bookings
    ? filterBookings(bookings, "today", referenceNow).length
    : 0;
  const upcomingCount = bookings
    ? filterBookings(bookings, "upcoming", referenceNow).filter(
        ({ status }) => status === "confirmed" || status === "rescheduled",
      ).length
    : 0;

  const handleNotification = async () => {
    setNotificationMessage("");
    let permission = notificationPermission;

    if (permission !== "granted") {
      permission = await requestNotificationPermission();
      setNotificationPermission(permission);
    }

    if (permission === "unsupported") {
      setNotificationMessage("Notifications are not supported in this browser.");
      return;
    }
    if (permission !== "granted") {
      setNotificationMessage(
        "Notifications are blocked. Allow them from your browser's site settings.",
      );
      return;
    }

    const result = await sendTestNotification(registration);
    if (result === "sent") {
      setNotificationMessage("Test notification sent to this device.");
    } else if (result === "unavailable") {
      setNotificationMessage("The notification service is unavailable on this device.");
    } else {
      setNotificationMessage("Notifications are unavailable in this browser.");
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header__brand">
          <img alt="" height="42" src="/brand/kundli-mark-master.png" width="42" />
          <div>
            <p className="admin-eyebrow">Nakshatra</p>
            <h1>Admin</h1>
          </div>
        </div>
        <span className="admin-demo-badge">Prototype — sample bookings</span>
      </header>

      <main className="admin-main">
        {loadError ? (
          <section className="admin-state-card" aria-live="polite">
            <RefreshCw aria-hidden="true" size={28} strokeWidth={1.6} />
            <h2>Appointments are unavailable right now.</h2>
            <p>The sample list could not be loaded. Nothing has been changed.</p>
            <button className="admin-button admin-button--secondary" onClick={retry} type="button">
              Try again
            </button>
          </section>
        ) : bookings === null ? (
          <section className="admin-state-card" aria-live="polite">
            <span className="admin-loading-dot" />
            <h2>Loading appointments</h2>
            <p>Preparing the sample schedule.</p>
          </section>
        ) : (
          <>
            {nextBooking ? (
              <section className="admin-next" aria-labelledby="next-consultation-title">
                <div className="admin-section-heading admin-section-heading--light">
                  <div>
                    <p className="admin-eyebrow">Your day at a glance</p>
                    <h2 id="next-consultation-title">Next consultation</h2>
                  </div>
                  <StatusPill status={nextBooking.status} />
                </div>
                <div className="admin-next__person">
                  <p>{nextBooking.serviceName}</p>
                  <h3>{nextBooking.customerFirstName}</h3>
                </div>
                <div className="admin-next__time">
                  <span>
                    <CalendarDays aria-hidden="true" size={18} />
                    {formatBookingDate(nextBooking.startsAt)}
                  </span>
                  <span>
                    <Clock3 aria-hidden="true" size={18} />
                    {formatBookingTime(nextBooking.startsAt)}
                  </span>
                </div>
                <p className="admin-next__countdown">
                  {timeUntil(nextBooking.startsAt, referenceNow)}
                </p>
                <MeetingLink booking={nextBooking} />
              </section>
            ) : (
              <section className="admin-state-card">
                <CheckCircle2 aria-hidden="true" size={30} strokeWidth={1.6} />
                <h2>No upcoming consultations</h2>
                <p>Your current sample schedule is clear.</p>
              </section>
            )}

            <section className="admin-summary" aria-label="Appointment summary">
              <div>
                <span>{todayCount}</span>
                <p>today</p>
              </div>
              <div>
                <span>{upcomingCount}</span>
                <p>upcoming</p>
              </div>
            </section>

            <section className="admin-appointments" aria-labelledby="appointments-title">
              <div className="admin-section-heading">
                <div>
                  <p className="admin-eyebrow">Schedule</p>
                  <h2 id="appointments-title">Appointments</h2>
                </div>
                <span>{visibleBookings.length} shown</span>
              </div>

              <div className="admin-filters" aria-label="Filter appointments">
                {(Object.keys(filterLabels) as BookingFilter[]).map((filterName) => (
                  <button
                    aria-pressed={filter === filterName}
                    className={filter === filterName ? "is-active" : ""}
                    key={filterName}
                    onClick={() => setFilter(filterName)}
                    type="button"
                  >
                    {filterLabels[filterName]}
                  </button>
                ))}
              </div>

              {visibleBookings.length ? (
                <div className="admin-booking-list">
                  {visibleBookings.map((booking) => (
                    <button
                      aria-label={`View ${booking.customerFirstName} details`}
                      className={`admin-booking-row admin-booking-row--${booking.status}`}
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      type="button"
                    >
                      <span className="admin-booking-row__date">
                        <strong>{formatBookingTime(booking.startsAt)}</strong>
                        <small>{formatBookingDate(booking.startsAt)}</small>
                      </span>
                      <span className="admin-booking-row__main">
                        <strong>{`${booking.customerFirstName} — ${booking.serviceName}`}</strong>
                        <StatusPill status={booking.status} />
                      </span>
                      <ChevronRight aria-hidden="true" size={20} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-list">
                  <CalendarDays aria-hidden="true" size={25} strokeWidth={1.6} />
                  <p>No sample appointments in this view.</p>
                </div>
              )}
            </section>
          </>
        )}

        <section className="admin-device" aria-labelledby="device-title">
          <div className="admin-section-heading">
            <div>
              <p className="admin-eyebrow">This Android phone</p>
              <h2 id="device-title">App & notifications</h2>
            </div>
            <Bell aria-hidden="true" size={24} strokeWidth={1.6} />
          </div>
          <p>Device-only test. Live booking alerts are not connected yet.</p>
          <div className="admin-device__actions">
            <button className="admin-button admin-button--primary" onClick={handleNotification} type="button">
              <Bell aria-hidden="true" size={18} />
              {notificationPermission === "granted"
                ? "Send test notification"
                : "Enable notifications"}
            </button>
            {installPrompt ? (
              <button className="admin-button admin-button--secondary" onClick={handleInstall} type="button">
                <Download aria-hidden="true" size={18} />
                Install app
              </button>
            ) : null}
          </div>
          {notificationMessage ? (
            <p className="admin-device__message" role="status">
              {notificationMessage}
            </p>
          ) : null}
          {!installPrompt ? (
            <p className="admin-device__hint">
              On Android Chrome, open the menu and choose <strong>Add to Home screen</strong>.
            </p>
          ) : null}
        </section>
      </main>

      <footer className="admin-footer">
        <span className="admin-footer__dot" />
        Demo mode · Not connected to Cal ID
      </footer>

      {selectedBooking ? (
        <div className="admin-dialog-backdrop" onMouseDown={() => setSelectedBooking(null)}>
          <section
            aria-labelledby="appointment-dialog-title"
            aria-modal="true"
            className="admin-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close appointment details"
              className="admin-dialog__close"
              onClick={() => setSelectedBooking(null)}
              type="button"
            >
              <X aria-hidden="true" size={22} />
            </button>
            <p className="admin-eyebrow">Appointment details</p>
            <h2 id="appointment-dialog-title">Appointment details</h2>
            <div className="admin-dialog__person">
              <h3>{selectedBooking.customerFirstName}</h3>
              <p>{selectedBooking.serviceName}</p>
            </div>
            <dl className="admin-dialog__facts">
              <div>
                <dt>Date</dt>
                <dd>{formatBookingDate(selectedBooking.startsAt)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{formatBookingTime(selectedBooking.startsAt)} · India time</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><StatusPill status={selectedBooking.status} /></dd>
              </div>
              <div>
                <dt>Sample reference</dt>
                <dd>{selectedBooking.id.toUpperCase()}</dd>
              </div>
            </dl>
            <MeetingLink booking={selectedBooking} compact />
            <p className="admin-dialog__privacy">
              This prototype intentionally contains no birth details, questions, email address or phone number.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
