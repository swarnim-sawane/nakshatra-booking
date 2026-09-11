import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  LogOut,
  RefreshCw,
  Video,
  WifiOff,
  X,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminErrorKind,
  loadConfiguredBookings,
  removeAdminBooking,
  signInAdmin,
  signOutAdmin,
} from "./api";
import {
  canRemoveBooking,
  filterBookings,
  findNextBooking,
  formatBookingDate,
  formatBookingTime,
  safeMeetingUrl,
  type AdminBooking,
  type BookingFilter,
} from "./bookings";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSubscription,
  registerAdminServiceWorker,
  refreshPushSubscription,
  revokeAllPushNotifications,
  sendTestNotification,
} from "./pwa";
import "./admin.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type AdminAppProps = {
  loadBookings?: () => Promise<AdminBooking[]>;
  signIn?: (username: string, password: string) => Promise<void>;
  signOut?: () => Promise<void>;
  removeBooking?: (bookingUid: string) => Promise<void>;
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
  paid: "Paid",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  completed: "Completed",
};

function timeUntil(startsAt: string, now: Date) {
  const minutes = Math.max(0, Math.round((new Date(startsAt).getTime() - now.getTime()) / 60_000));
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
  return <span className={`admin-status admin-status--${status}`}>{statusLabels[status]}</span>;
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
      Open video call
    </a>
  );
}

function LoginView({
  expired,
  onSubmit,
}: {
  expired: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(expired ? "Your session expired. Please sign in again." : "");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await onSubmit(username, password);
    } catch (error) {
      const kind = adminErrorKind(error);
      setMessage(
        kind === "offline"
          ? "You appear to be offline. Reconnect and try again."
          : kind === "unauthorized"
            ? "That username or password did not match."
            : "Sign-in is temporarily unavailable. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-main">
      <section className="admin-login" aria-labelledby="admin-login-title">
        <p className="admin-eyebrow">Private schedule</p>
        <h2 id="admin-login-title">Sign in to Nakshatra Admin</h2>
        <p>Appointments and joining links are visible only after sign-in.</p>
        <form onSubmit={submit}>
          <label>
            Username
            <input autoComplete="username" onChange={(event) => setUsername(event.target.value)} required value={username} />
          </label>
          <label>
            Password
            <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <button className="admin-button admin-button--primary" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {message ? <p className="admin-login__message" role="alert">{message}</p> : null}
      </section>
    </main>
  );
}

export default function AdminApp({
  loadBookings = loadConfiguredBookings,
  signIn = signInAdmin,
  signOut = signOutAdmin,
  removeBooking = removeAdminBooking,
  now,
  serviceWorkerRegistration,
}: AdminAppProps) {
  const [referenceNow] = useState(() => now ?? new Date());
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [screen, setScreen] = useState<"loading" | "schedule" | "login" | "error">("loading");
  const [errorKind, setErrorKind] = useState<"offline" | "unavailable">("unavailable");
  const [sessionExpired, setSessionExpired] = useState(false);
  const wasAuthenticated = useRef(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [filter, setFilter] = useState<BookingFilter>("upcoming");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [removalBusy, setRemovalBusy] = useState(false);
  const [removalMessage, setRemovalMessage] = useState("");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(serviceWorkerRegistration ?? null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    let active = true;
    setScreen("loading");
    loadBookings()
      .then((records) => {
        if (!active) return;
        setBookings(records);
        setScreen("schedule");
        wasAuthenticated.current = true;
      })
      .catch((error) => {
        if (!active) return;
        const kind = adminErrorKind(error);
        setBookings(null);
        if (kind === "unauthorized") {
          setSessionExpired(wasAuthenticated.current);
          setScreen("login");
        } else {
          setErrorKind(kind === "offline" ? "offline" : "unavailable");
          setScreen("error");
        }
      });
    return () => { active = false; };
  }, [loadBookings, reloadCount]);

  useEffect(() => {
    if (serviceWorkerRegistration !== undefined) {
      setRegistration(serviceWorkerRegistration);
      return;
    }
    void registerAdminServiceWorker().then(setRegistration);
  }, [serviceWorkerRegistration]);

  useEffect(() => {
    if (screen !== "schedule") return;
    let active = true;
    void getPushSubscription(registration).then(async (subscription) => {
      if (!active) return;
      if (!subscription) {
        setNotificationsEnabled(false);
        return;
      }
      try {
        const result = await refreshPushSubscription(registration);
        if (active) setNotificationsEnabled(result === "enabled");
      } catch (error) {
        if (!active) return;
        const kind = adminErrorKind(error);
        if (kind === "unauthorized") {
          setBookings(null);
          setSessionExpired(true);
          setScreen("login");
        } else {
          setNotificationsEnabled(false);
          setNotificationMessage(
            kind === "offline"
              ? "You are offline. Reconnect to renew notification access."
              : "Notification access could not be renewed on this device.",
          );
        }
      }
    });
    return () => { active = false; };
  }, [registration, screen]);

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
    setConfirmingRemoval(false);
    setRemovalMessage("");
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

  const handleSignIn = async (username: string, password: string) => {
    await signIn(username, password);
    setSessionExpired(false);
    wasAuthenticated.current = true;
    retry();
  };

  const handleSignOut = async () => {
    try { await signOut(); } finally {
      setBookings(null);
      wasAuthenticated.current = false;
      setSessionExpired(false);
      setScreen("login");
    }
  };

  const handleNotificationError = (error: unknown) => {
    const kind = adminErrorKind(error);
    if (kind === "unauthorized") {
      setBookings(null);
      setSelectedBooking(null);
      setSessionExpired(true);
      setScreen("login");
    } else {
      setNotificationMessage(kind === "offline" ? "You are offline. Reconnect before changing notification settings." : "Notifications are temporarily unavailable.");
    }
  };

  const handleNotificationToggle = async () => {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      const result = notificationsEnabled
        ? await disablePushNotifications(registration)
        : await enablePushNotifications(registration);
      if (result === "enabled") {
        setNotificationsEnabled(true);
        setNotificationMessage("Booking alerts are enabled on this device.");
      } else if (result === "disabled") {
        setNotificationsEnabled(false);
        setNotificationMessage("Booking alerts are disabled on this device.");
      } else if (result === "denied") {
        setNotificationMessage("Notifications are blocked in this browser's site settings.");
      } else {
        setNotificationMessage("Notifications are not supported on this device.");
      }
    } catch (error) {
      handleNotificationError(error);
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleTestNotification = async () => {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      await sendTestNotification(registration);
      setNotificationMessage("A private test alert was sent to this device.");
    } catch (error) {
      handleNotificationError(error);
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleRevokeAllNotifications = async () => {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      await revokeAllPushNotifications(registration);
      setNotificationsEnabled(false);
      setNotificationMessage("Booking alerts are disabled on every registered device.");
    } catch (error) {
      handleNotificationError(error);
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleRemoveBooking = async () => {
    if (!selectedBooking) return;
    setRemovalBusy(true);
    setRemovalMessage("");
    try {
      await removeBooking(selectedBooking.id);
      setBookings((records) => records?.filter(({ id }) => id !== selectedBooking.id) ?? null);
      setSelectedBooking(null);
      setConfirmingRemoval(false);
    } catch (error) {
      const kind = adminErrorKind(error);
      if (kind === "unauthorized") {
        setBookings(null);
        setSelectedBooking(null);
        setSessionExpired(true);
        setScreen("login");
      } else if (kind === "conflict") {
        setRemovalMessage("This appointment is still active and cannot be removed.");
      } else if (kind === "offline") {
        setRemovalMessage("You are offline. Reconnect before removing this appointment.");
      } else {
        setRemovalMessage("The appointment could not be removed. Please try again.");
      }
    } finally {
      setRemovalBusy(false);
    }
  };

  const visibleBookings = useMemo(() => bookings ? filterBookings(bookings, filter, referenceNow) : [], [bookings, filter, referenceNow]);
  const nextBooking = useMemo(() => bookings ? findNextBooking(bookings, referenceNow) : undefined, [bookings, referenceNow]);
  const todayCount = bookings ? filterBookings(bookings, "today", referenceNow).length : 0;
  const upcomingCount = bookings
    ? filterBookings(bookings, "upcoming", referenceNow).filter(({ status }) => status === "confirmed" || status === "paid" || status === "rescheduled").length
    : 0;
  const demoMode = Boolean(bookings?.some((booking) => booking.isSample));
  const selectedBookingCanBeRemoved = Boolean(
    selectedBooking && canRemoveBooking(selectedBooking, referenceNow),
  );

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header__brand">
          <img alt="" height="42" src="/brand/kundli-mark-master.png" width="42" />
          <div><p className="admin-eyebrow">Nakshatra</p><h1>Admin</h1></div>
        </div>
        {screen === "schedule" ? (
          demoMode ? <span className="admin-demo-badge">Development demo</span> : (
            <button className="admin-signout" onClick={() => void handleSignOut()} type="button"><LogOut aria-hidden="true" size={17} /> Sign out</button>
          )
        ) : null}
      </header>

      {screen === "login" ? <LoginView expired={sessionExpired} onSubmit={handleSignIn} /> : (
        <main className="admin-main">
          {screen === "error" ? (
            <section className="admin-state-card" aria-live="polite">
              {errorKind === "offline" ? <WifiOff aria-hidden="true" size={30} strokeWidth={1.6} /> : <RefreshCw aria-hidden="true" size={28} strokeWidth={1.6} />}
              <h2>{errorKind === "offline" ? "You are offline" : "Appointments are unavailable right now"}</h2>
              <p>{errorKind === "offline" ? "Reconnect to view the private schedule." : "No sample data has been substituted. Please try again."}</p>
              <button className="admin-button admin-button--secondary" onClick={retry} type="button">Try again</button>
            </section>
          ) : screen === "loading" || bookings === null ? (
            <section className="admin-state-card" aria-live="polite"><span className="admin-loading-dot" /><h2>Loading appointments</h2><p>Checking the protected Nakshatra schedule.</p></section>
          ) : (
            <>
              {nextBooking ? (
                <section className="admin-next" aria-labelledby="next-consultation-title">
                  <div className="admin-section-heading admin-section-heading--light"><div><p className="admin-eyebrow">Your day at a glance</p><h2 id="next-consultation-title">Next consultation</h2></div><StatusPill status={nextBooking.status} /></div>
                  <div className="admin-next__person"><p>{nextBooking.serviceName}</p><h3>{nextBooking.customerFirstName}</h3></div>
                  <div className="admin-next__time"><span><CalendarDays aria-hidden="true" size={18} />{formatBookingDate(nextBooking.startsAt)}</span><span><Clock3 aria-hidden="true" size={18} />{formatBookingTime(nextBooking.startsAt)}</span></div>
                  <p className="admin-next__countdown">{timeUntil(nextBooking.startsAt, referenceNow)}</p>
                  <MeetingLink booking={nextBooking} />
                </section>
              ) : (
                <section className="admin-state-card"><CheckCircle2 aria-hidden="true" size={30} strokeWidth={1.6} /><h2>No upcoming consultations</h2><p>Your current schedule is clear.</p></section>
              )}
              <section className="admin-summary" aria-label="Appointment summary"><div><span>{todayCount}</span><p>today</p></div><div><span>{upcomingCount}</span><p>upcoming</p></div></section>
              <section className="admin-appointments" aria-labelledby="appointments-title">
                <div className="admin-section-heading"><div><p className="admin-eyebrow">Schedule</p><h2 id="appointments-title">Appointments</h2></div><span>{visibleBookings.length} shown</span></div>
                <div className="admin-filters" aria-label="Filter appointments">
                  {(Object.keys(filterLabels) as BookingFilter[]).map((filterName) => (
                    <button aria-pressed={filter === filterName} className={filter === filterName ? "is-active" : ""} key={filterName} onClick={() => setFilter(filterName)} type="button">{filterLabels[filterName]}</button>
                  ))}
                </div>
                {visibleBookings.length ? (
                  <div className="admin-booking-list">
                    {visibleBookings.map((booking) => (
                      <button aria-label={`View ${booking.customerFirstName} details`} className={`admin-booking-row admin-booking-row--${booking.status}`} key={booking.id} onClick={() => setSelectedBooking(booking)} type="button">
                        <span className="admin-booking-row__date"><strong>{formatBookingTime(booking.startsAt)}</strong><small>{formatBookingDate(booking.startsAt)}</small></span>
                        <span className="admin-booking-row__main"><strong>{`${booking.customerFirstName} — ${booking.serviceName}`}</strong><StatusPill status={booking.status} /></span><ChevronRight aria-hidden="true" size={20} />
                      </button>
                    ))}
                  </div>
                ) : <div className="admin-empty-list"><CalendarDays aria-hidden="true" size={25} strokeWidth={1.6} /><p>No appointments in this view.</p></div>}
              </section>
              {!demoMode ? (
                <section className="admin-device" aria-labelledby="device-title">
                  <div className="admin-section-heading"><div><p className="admin-eyebrow">This device</p><h2 id="device-title">App & notifications</h2></div><Bell aria-hidden="true" size={24} strokeWidth={1.6} /></div>
                  <p>Receive private booking, reschedule and cancellation alerts. Customer details stay inside the signed-in app.</p>
                  <div className="admin-device__actions">
                    <button className="admin-button admin-button--primary" disabled={notificationBusy || notificationsEnabled === null} onClick={() => void handleNotificationToggle()} type="button"><Bell aria-hidden="true" size={18} />{notificationsEnabled ? "Disable alerts" : "Enable alerts"}</button>
                    {notificationsEnabled ? <button className="admin-button admin-button--secondary" disabled={notificationBusy} onClick={() => void handleTestNotification()} type="button">Send private test</button> : null}
                    <button className="admin-button admin-button--secondary" disabled={notificationBusy || notificationsEnabled === null} onClick={() => void handleRevokeAllNotifications()} type="button">Disable alerts on every device</button>
                    {installPrompt ? <button className="admin-button admin-button--secondary" onClick={() => void handleInstall()} type="button"><Download aria-hidden="true" size={18} />Install app</button> : null}
                  </div>
                  {notificationMessage ? <p className="admin-device__message" role="status">{notificationMessage}</p> : null}
                  {!installPrompt ? <p className="admin-device__hint">On Android Chrome, open the menu and choose <strong>Add to Home screen</strong>.</p> : null}
                </section>
              ) : null}
            </>
          )}
        </main>
      )}

      <footer className="admin-footer"><span className="admin-footer__dot" />{demoMode ? "Development demo data" : "Protected Nakshatra admin"}</footer>

      {selectedBooking ? (
        <div className="admin-dialog-backdrop" onMouseDown={() => setSelectedBooking(null)}>
          <section aria-labelledby="appointment-dialog-title" aria-modal="true" className="admin-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Close appointment details" className="admin-dialog__close" onClick={() => setSelectedBooking(null)} type="button"><X aria-hidden="true" size={22} /></button>
            <p className="admin-eyebrow">Appointment details</p><h2 id="appointment-dialog-title">Appointment details</h2>
            <div className="admin-dialog__person"><h3>{selectedBooking.customerFirstName}</h3><p>{selectedBooking.serviceName}</p></div>
            <dl className="admin-dialog__facts">
              <div><dt>Date</dt><dd>{formatBookingDate(selectedBooking.startsAt)}</dd></div><div><dt>Time</dt><dd>{formatBookingTime(selectedBooking.startsAt)} · India time</dd></div>
              <div><dt>Status</dt><dd><StatusPill status={selectedBooking.status} /></dd></div><div><dt>Booking reference</dt><dd>{selectedBooking.id.toUpperCase()}</dd></div>
            </dl>
            <MeetingLink booking={selectedBooking} compact />
            <p className="admin-dialog__privacy">Only the operational details needed for the appointment are shown here. Birth details and private questions are not stored by this website. Appointment records are removed automatically after the short retention period.</p>
            {selectedBookingCanBeRemoved && !demoMode ? (
              confirmingRemoval ? (
                <div className="admin-removal-confirmation" role="alert">
                  <p>Remove this appointment from Nakshatra Admin now? This cannot be undone.</p>
                  <div>
                    <button className="admin-button admin-button--secondary" disabled={removalBusy} onClick={() => setConfirmingRemoval(false)} type="button">Keep appointment</button>
                    <button className="admin-button admin-button--danger" disabled={removalBusy} onClick={() => void handleRemoveBooking()} type="button">{removalBusy ? "Removing…" : "Remove permanently"}</button>
                  </div>
                </div>
              ) : (
                <button className="admin-remove-link" onClick={() => setConfirmingRemoval(true)} type="button">Remove from admin</button>
              )
            ) : null}
            {removalMessage ? <p className="admin-removal-message" role="alert">{removalMessage}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
