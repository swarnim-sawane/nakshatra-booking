import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  buildCalIdCheckoutUrl,
  parseCalIdBookingUrl,
} from "../config/scheduling";
import type { ConsultationService, ServiceSlug } from "../config/services";
import "../styles/availability-calendar.css";

export type AvailabilityPayload = {
  service: ServiceSlug;
  timeZone: string;
  slots: string[];
};

type LoadAvailability = (request: {
  service: ServiceSlug;
  start: string;
  end: string;
  timeZone: string;
}) => Promise<AvailabilityPayload>;

type AvailabilityCalendarProps = {
  bookingUrl: URL | null;
  service: ConsultationService;
  initialMonth?: Date;
  loadAvailability?: LoadAvailability;
  timeZone?: string;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function zonedDateTimeParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    month: Number(byType.month),
    second: Number(byType.second),
    year: Number(byType.year),
  };
}

function zonedMidnight(year: number, month: number, timeZone: string) {
  const intendedUtc = Date.UTC(year, month, 1);
  const guess = new Date(intendedUtc);
  const guessedParts = zonedDateTimeParts(guess, timeZone);
  const guessedAsUtc = Date.UTC(
    guessedParts.year,
    guessedParts.month - 1,
    guessedParts.day,
    guessedParts.hour,
    guessedParts.minute,
    guessedParts.second,
  );
  const firstCandidate = new Date(intendedUtc - (guessedAsUtc - intendedUtc));
  const candidateParts = zonedDateTimeParts(firstCandidate, timeZone);
  const candidateAsUtc = Date.UTC(
    candidateParts.year,
    candidateParts.month - 1,
    candidateParts.day,
    candidateParts.hour,
    candidateParts.minute,
    candidateParts.second,
  );
  return new Date(firstCandidate.getTime() - (candidateAsUtc - intendedUtc));
}

function monthWindow(year: number, month: number, timeZone: string) {
  return {
    start: zonedMidnight(year, month, timeZone).toISOString(),
    end: zonedMidnight(year, month + 1, timeZone).toISOString(),
  };
}

function dateKey(value: string | Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function dayAriaLabel(year: number, month: number, day: number, count: number) {
  const date = new Date(Date.UTC(year, month, day, 12));
  const label = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `${label}, ${count} ${count === 1 ? "time" : "times"} available`;
}

function formatTime(slot: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(slot));
}

function formatSelectedDate(key: string, timeZone: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

async function fetchAvailability({
  service,
  start,
  end,
  timeZone,
}: Parameters<LoadAvailability>[0]): Promise<AvailabilityPayload> {
  const params = new URLSearchParams({ service, start, end, timeZone });
  const response = await fetch(`/api/cal-id-slots?${params.toString()}`);

  if (!response.ok) throw new Error("Availability request failed");
  return response.json() as Promise<AvailabilityPayload>;
}

function CalendarSkeleton() {
  return (
    <div className="availability-calendar__skeleton" aria-label="Loading available times">
      <span />
      <span />
      <span />
    </div>
  );
}

type CalendarAlternateStateProps = {
  bookingUrl: URL | null;
  kind: "error" | "unavailable";
  onRetry?: () => void;
  service: ConsultationService;
};

function CalendarAlternateState({
  bookingUrl,
  kind,
  onRetry,
  service,
}: CalendarAlternateStateProps) {
  const isError = kind === "error";

  return (
    <section className="availability-calendar availability-calendar--alternate">
      <header className="availability-calendar__header">
        <div>
          <p className="eyebrow">{service.name}</p>
          <h2>{isError ? "Choose your time" : "Booking availability"}</h2>
        </div>
        <div className="availability-calendar__service-meta">
          <strong>{service.durationMinutes} min</strong>
          <span>₹{service.priceInr.toLocaleString("en-IN")}</span>
        </div>
      </header>
      <div className="availability-calendar__alternate-body">
        <img alt="" aria-hidden="true" height="48" src="/brand/icon-192.png" width="48" />
        <p className="eyebrow">Your consultation journey</p>
        <h3>
          {isError
            ? "You can still book your consultation."
            : "Prepare for your consultation."}
        </h3>
        <p>
          {isError
            ? "Continue to Nilima's secure booking page to choose a suitable time. The remaining steps are simple:"
            : "Keep your birth date, exact birth time—if known—birth place and main questions ready."}
        </p>
        {isError ? (
          <ol className="availability-calendar__booking-steps">
            <li>Choose an available time</li>
            <li>Share your birth details and questions</li>
            <li>Pay securely and receive your confirmation</li>
          </ol>
        ) : null}
        <div className="availability-calendar__alternate-actions">
          {bookingUrl ? (
            <a className="button button--primary" href={bookingUrl.href}>
              Choose a time securely
            </a>
          ) : (
            <a className="button button--primary" href="/#consultation">
              Return to consultations
            </a>
          )}
          {onRetry ? (
            <button className="button button--secondary" onClick={onRetry} type="button">
              Refresh calendar
            </button>
          ) : null}
        </div>
        {isError ? (
          <p className="availability-calendar__alternate-note">
            Payment is completed through Razorpay. Your booking confirmation includes the online meeting details.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function AvailabilityCalendar({
  bookingUrl,
  service,
  initialMonth = new Date(),
  loadAvailability = fetchAvailability,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
}: AvailabilityCalendarProps) {
  const safeBookingUrl = useMemo(
    () => (bookingUrl ? parseCalIdBookingUrl(bookingUrl.href) : null),
    [bookingUrl],
  );
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialParts = zonedDateTimeParts(initialMonth, timeZone);
    return { month: initialParts.month - 1, year: initialParts.year };
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [requestState, setRequestState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!safeBookingUrl) return;

    setRequestState("loading");
    const range = monthWindow(visibleMonth.year, visibleMonth.month, timeZone);
    loadAvailability({
      end: range.end,
      service: service.slug,
      start: range.start,
      timeZone,
    })
      .then((payload) => {
        if (!active) return;
        setSlots(payload.slots);
        setRequestState("ready");
      })
      .catch(() => {
        if (!active) return;
        setSlots([]);
        setRequestState("error");
      });

    return () => {
      active = false;
    };
  }, [loadAvailability, retryCount, safeBookingUrl, service.slug, timeZone, visibleMonth]);

  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, string[]>();
    slots.forEach((slot) => {
      const key = dateKey(slot, timeZone);
      grouped.set(key, [...(grouped.get(key) ?? []), slot]);
    });
    return grouped;
  }, [slots, timeZone]);

  useEffect(() => {
    const firstAvailableDay = [...slotsByDay.keys()].sort()[0] ?? "";
    setSelectedDay((current) =>
      current && slotsByDay.has(current) ? current : firstAvailableDay,
    );
  }, [slotsByDay]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)));
  const daysInMonth = new Date(
    Date.UTC(visibleMonth.year, visibleMonth.month + 1, 0),
  ).getUTCDate();
  const firstWeekday =
    (new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)).getUTCDay() + 6) % 7;
  const calendarDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );
  const selectedSlots = selectedDay ? slotsByDay.get(selectedDay) ?? [] : [];

  if (!safeBookingUrl) {
    return <CalendarAlternateState bookingUrl={null} kind="unavailable" service={service} />;
  }

  if (requestState === "error") {
    return (
      <CalendarAlternateState
        bookingUrl={safeBookingUrl}
        kind="error"
        onRetry={() => setRetryCount((value) => value + 1)}
        service={service}
      />
    );
  }

  function moveMonth(offset: number) {
    const next = new Date(Date.UTC(visibleMonth.year, visibleMonth.month + offset, 1));
    setSelectedDay("");
    setVisibleMonth({ month: next.getUTCMonth(), year: next.getUTCFullYear() });
  }

  return (
    <section className="availability-calendar" aria-label={`${service.name} availability`}>
      <header className="availability-calendar__header">
        <div>
          <p className="eyebrow">{service.name}</p>
          <h2>Choose your time</h2>
        </div>
        <div className="availability-calendar__service-meta">
          <strong>{service.durationMinutes} min</strong>
          <span>₹{service.priceInr.toLocaleString("en-IN")}</span>
        </div>
      </header>

      <div className="availability-calendar__body">
        <div className="availability-calendar__month">
          <div className="availability-calendar__month-header">
            <h3>{monthLabel}</h3>
            <div className="availability-calendar__month-actions">
              <button aria-label="Previous month" onClick={() => moveMonth(-1)} type="button">
                <ChevronLeft aria-hidden="true" size={19} strokeWidth={1.6} />
              </button>
              <button aria-label="Next month" onClick={() => moveMonth(1)} type="button">
                <ChevronRight aria-hidden="true" size={19} strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <div className="availability-calendar__weekdays" aria-hidden="true">
            {weekdayLabels.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="availability-calendar__days">
            {calendarDays.map((day, index) => {
              if (!day) return <span aria-hidden="true" key={`blank-${index}`} />;
              const key = `${visibleMonth.year}-${String(visibleMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const count = slotsByDay.get(key)?.length ?? 0;
              const available = count > 0;

              return (
                <button
                  aria-label={available ? dayAriaLabel(visibleMonth.year, visibleMonth.month, day, count) : undefined}
                  aria-pressed={available ? selectedDay === key : undefined}
                  className={selectedDay === key ? "is-selected" : undefined}
                  disabled={!available}
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  type="button"
                >
                  {day}
                  {available && <span aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          {requestState === "loading" && <CalendarSkeleton />}
        </div>

        <div className="availability-calendar__times" aria-live="polite">
          {requestState === "ready" && selectedDay ? (
            <>
              <div className="availability-calendar__times-heading">
                <p>{formatSelectedDate(selectedDay, timeZone)}</p>
                <span>{timeZone.replaceAll("_", " ")}</span>
              </div>
              <div className="availability-calendar__time-list">
                {selectedSlots.map((slot) => {
                  const checkoutUrl = buildCalIdCheckoutUrl(safeBookingUrl, slot);
                  return checkoutUrl ? (
                    <a href={checkoutUrl.href} key={slot}>{formatTime(slot, timeZone)}</a>
                  ) : null;
                })}
              </div>
              <p className="availability-calendar__handoff-note">
                After choosing a time, you’ll share your birth details and complete the booking.
              </p>
            </>
          ) : requestState === "ready" ? (
            <div className="availability-calendar__message">
              <h3>No appointments are available this month.</h3>
              <p>Please check the next month for a suitable time.</p>
              <div className="availability-calendar__message-actions">
                <button className="button button--secondary" onClick={() => moveMonth(1)} type="button">
                  Check next month
                </button>
                <a className="button button--primary" href={safeBookingUrl.href}>
                  View all available times
                </a>
              </div>
            </div>
          ) : (
            <div className="availability-calendar__message availability-calendar__message--loading">
              <p>Checking Nilima’s available times…</p>
            </div>
          )}
        </div>
      </div>

      <footer className="availability-calendar__footer">
        <span className="availability-calendar__privacy">Secure online booking</span>
        <a className="availability-calendar__fallback" href={safeBookingUrl.href}>
          View all available times
        </a>
      </footer>
    </section>
  );
}
