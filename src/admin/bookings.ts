export const ADMIN_TIME_ZONE = "Asia/Kolkata" as const;

export type BookingStatus =
  | "confirmed"
  | "paid"
  | "rescheduled"
  | "cancelled"
  | "completed";

export type BookingFilter = "upcoming" | "today" | "all";

export type AdminBooking = {
  id: string;
  customerFirstName: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  timezone: typeof ADMIN_TIME_ZONE;
  status: BookingStatus;
  meetingUrl?: string;
  isSample?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  timeZone: ADMIN_TIME_ZONE,
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: ADMIN_TIME_ZONE,
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: ADMIN_TIME_ZONE,
  year: "numeric",
});

function kolkataDayStart(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: ADMIN_TIME_ZONE,
      year: "numeric",
    })
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+05:30`);
}

function atKolkataTime(dayStart: Date, dayOffset: number, hour: number, minute = 0) {
  const milliseconds =
    dayStart.getTime() +
    dayOffset * 24 * 60 * 60 * 1000 +
    hour * 60 * 60 * 1000 +
    minute * 60 * 1000;

  return new Date(milliseconds);
}

function sampleBooking(
  dayStart: Date,
  details: {
    id: string;
    customerFirstName: string;
    serviceName: string;
    dayOffset: number;
    hour: number;
    minute?: number;
    durationMinutes: number;
    status: BookingStatus;
    meetingUrl?: string;
  },
): AdminBooking {
  const startsAt = atKolkataTime(
    dayStart,
    details.dayOffset,
    details.hour,
    details.minute,
  );
  const endsAt = new Date(startsAt.getTime() + details.durationMinutes * 60 * 1000);

  return {
    id: details.id,
    customerFirstName: details.customerFirstName,
    serviceName: details.serviceName,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    timezone: ADMIN_TIME_ZONE,
    status: details.status,
    meetingUrl: details.meetingUrl,
    isSample: true,
  };
}

export async function loadDemoBookings(now = new Date()): Promise<AdminBooking[]> {
  const dayStart = kolkataDayStart(now);
  const bookings = [
    sampleBooking(dayStart, {
      id: "sample-nak-101",
      customerFirstName: "Meera",
      serviceName: "Muhurat",
      dayOffset: -1,
      hour: 16,
      durationMinutes: 10,
      status: "completed",
    }),
    sampleBooking(dayStart, {
      id: "sample-nak-102",
      customerFirstName: "Kavya",
      serviceName: "Relationship Consultation",
      dayOffset: 0,
      hour: 9,
      durationMinutes: 20,
      status: "completed",
    }),
    sampleBooking(dayStart, {
      id: "sample-nak-103",
      customerFirstName: "Ananya",
      serviceName: "Personal Consultation",
      dayOffset: 0,
      hour: 13,
      minute: 30,
      durationMinutes: 30,
      status: "confirmed",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    }),
    sampleBooking(dayStart, {
      id: "sample-nak-104",
      customerFirstName: "Rohan",
      serviceName: "Personal Consultation",
      dayOffset: 1,
      hour: 16,
      durationMinutes: 30,
      status: "rescheduled",
      meetingUrl: "https://meet.google.com/klm-nopq-rst",
    }),
    sampleBooking(dayStart, {
      id: "sample-nak-105",
      customerFirstName: "Sanya",
      serviceName: "Muhurat",
      dayOffset: 3,
      hour: 11,
      durationMinutes: 10,
      status: "cancelled",
      meetingUrl: "https://meet.google.com/uvw-xyza-bcd",
    }),
    sampleBooking(dayStart, {
      id: "sample-nak-106",
      customerFirstName: "Ishita",
      serviceName: "Relationship Consultation",
      dayOffset: 5,
      hour: 18,
      durationMinutes: 20,
      status: "confirmed",
      meetingUrl: "https://meet.google.com/efg-hijk-lmn",
    }),
  ];

  return bookings.sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

function dayKey(value: Date | string) {
  return dayKeyFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function filterBookings(
  bookings: AdminBooking[],
  filter: BookingFilter,
  now = new Date(),
) {
  if (filter === "all") return bookings;
  if (filter === "today") {
    const today = dayKey(now);
    return bookings.filter((booking) => dayKey(booking.startsAt) === today);
  }

  return bookings.filter((booking) => new Date(booking.startsAt).getTime() >= now.getTime());
}

export function findNextBooking(bookings: AdminBooking[], now = new Date()) {
  return bookings.find(
    (booking) =>
      new Date(booking.startsAt).getTime() >= now.getTime() &&
      (booking.status === "confirmed" ||
        booking.status === "paid" ||
        booking.status === "rescheduled"),
  );
}

export function formatBookingDate(startsAt: string) {
  return dateFormatter.format(new Date(startsAt));
}

export function formatBookingTime(startsAt: string) {
  return timeFormatter.format(new Date(startsAt));
}

export function safeMeetingUrl(booking: AdminBooking) {
  if (
    !booking.meetingUrl ||
    booking.status === "cancelled" ||
    booking.status === "completed"
  ) {
    return null;
  }

  try {
    const url = new URL(booking.meetingUrl);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
