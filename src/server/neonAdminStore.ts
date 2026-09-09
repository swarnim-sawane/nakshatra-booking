import { neon } from "@neondatabase/serverless";
import type {
  CalIdWebhookEvent,
  CalIdWebhookStore,
  CalIdWebhookStoreResult,
  CalIdWebhookTrigger,
} from "./calIdWebhook";

export type NeonEnvironment = Readonly<{
  DATABASE_URL?: string;
}>;

export type StoredAdminBooking = Readonly<{
  id: string;
  customerFirstName: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  timezone: "Asia/Kolkata";
  status: "confirmed" | "paid" | "rescheduled" | "cancelled" | "completed";
  meetingUrl?: string;
}>;

export type StoredPushSubscription = Readonly<{
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}>;

export type BookingRemovalResult = "deleted" | "active" | "not_found";

export interface AdminDataStore extends CalIdWebhookStore {
  listBookings(now?: Date): Promise<StoredAdminBooking[]>;
  deleteBooking(bookingUid: string, now?: Date): Promise<BookingRemovalResult>;
  savePushSubscription(subscription: StoredPushSubscription): Promise<void>;
  deletePushSubscription(endpoint: string): Promise<void>;
  getPushSubscription(endpoint: string): Promise<StoredPushSubscription | null>;
  listPushSubscriptions(now?: Date): Promise<StoredPushSubscription[]>;
  claimPushDelivery(eventId: string, now?: Date): Promise<CalIdWebhookTrigger | null>;
  completePushDelivery(
    eventId: string,
    delivered: boolean,
    errorCode?: string,
    now?: Date,
  ): Promise<void>;
}

type QueryRow = Record<string, unknown>;
export type NeonQuery = (
  statement: string,
  parameters?: readonly unknown[],
) => Promise<readonly QueryRow[]>;

type NeonAdminStoreOptions = {
  databaseUrl: string;
  createQuery?: (databaseUrl: string) => NeonQuery;
};

const serviceNames = {
  "personal-consultation": "Personal Consultation",
  "relationship-consultation": "Relationship Consultation (Kundli Milan)",
  "best-date-analysis": "Muhurat",
} as const;

const bookingStatuses = new Set([
  "confirmed",
  "paid",
  "rescheduled",
  "cancelled",
  "completed",
]);

function validateDatabaseUrl(value: string) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
    throw new Error("DATABASE_URL must be a Postgres connection string");
  }
  return value;
}

function defaultCreateQuery(databaseUrl: string): NeonQuery {
  const sql = neon(databaseUrl);
  return async (statement, parameters = []) => {
    const rows = await sql.query(statement, [...parameters]);
    return rows as QueryRow[];
  };
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value) {
    throw new Error(`Neon returned an invalid ${field}`);
  }
  return value;
}

function timestamp(value: unknown, field: string) {
  const raw = value instanceof Date ? value.toISOString() : requireString(value, field);
  const milliseconds = new Date(raw).getTime();
  if (!Number.isFinite(milliseconds)) throw new Error(`Neon returned an invalid ${field}`);
  return new Date(milliseconds).toISOString();
}

function singleResult(
  rows: readonly QueryRow[],
  allowed: readonly string[],
  field = "result",
) {
  const result = rows[0]?.[field];
  if (typeof result !== "string" || !allowed.includes(result)) {
    throw new Error("Neon returned an invalid function result");
  }
  return result;
}

function isStoredSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const keys = item.keys;
  return (
    typeof item.endpoint === "string" &&
    (item.expirationTime === null ||
      (typeof item.expirationTime === "number" && Number.isFinite(item.expirationTime))) &&
    Boolean(keys) &&
    typeof keys === "object" &&
    typeof (keys as Record<string, unknown>).p256dh === "string" &&
    typeof (keys as Record<string, unknown>).auth === "string"
  );
}

export function createNeonAdminStore(
  environment: NeonEnvironment,
  createQuery: (databaseUrl: string) => NeonQuery = defaultCreateQuery,
) {
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  try {
    return new NeonAdminStore({ databaseUrl, createQuery });
  } catch {
    return null;
  }
}

export class NeonAdminStore implements AdminDataStore {
  private readonly query: NeonQuery;

  constructor({ databaseUrl, createQuery = defaultCreateQuery }: NeonAdminStoreOptions) {
    this.query = createQuery(validateDatabaseUrl(databaseUrl));
  }

  async applyEvent(event: CalIdWebhookEvent): Promise<CalIdWebhookStoreResult> {
    const rows = await this.query(
      `select nakshatra_admin.apply_calid_webhook_event(
        $1::text, $2::text, $3::text, $4::text, $5::text,
        $6::timestamptz, $7::timestamptz, $8::text,
        $9::timestamptz, $10::timestamptz, $11::text
      ) as result`,
      [
        event.eventId,
        event.trigger,
        event.bookingUid,
        event.eventTypeSlug,
        event.customerFirstName,
        event.startsAt,
        event.endsAt,
        event.meetingUrl ?? null,
        event.occurredAt,
        event.receivedAt,
        event.rescheduledFromUid ?? null,
      ],
    );
    return singleResult(rows, ["applied", "duplicate", "suppressed"]) as CalIdWebhookStoreResult;
  }

  async listBookings(now = new Date()): Promise<StoredAdminBooking[]> {
    const rows = await this.query(
      "select * from nakshatra_admin.list_admin_bookings($1::timestamptz)",
      [now.toISOString()],
    );

    return rows.map((row) => {
      const slug = row.event_type_slug as keyof typeof serviceNames;
      const status = requireString(row.lifecycle_status, "booking status") as StoredAdminBooking["status"];
      if (!serviceNames[slug] || !bookingStatuses.has(status)) {
        throw new Error("Neon returned an invalid booking record");
      }
      const meetingUrl = typeof row.meeting_url === "string" && row.meeting_url
        ? row.meeting_url
        : undefined;
      return {
        id: requireString(row.booking_uid, "booking UID"),
        customerFirstName: requireString(row.customer_first_name, "customer name"),
        serviceName: serviceNames[slug],
        startsAt: timestamp(row.starts_at, "start time"),
        endsAt: timestamp(row.ends_at, "end time"),
        timezone: "Asia/Kolkata" as const,
        status,
        ...(meetingUrl ? { meetingUrl } : {}),
      };
    });
  }

  async deleteBooking(bookingUid: string, now = new Date()): Promise<BookingRemovalResult> {
    const rows = await this.query(
      "select nakshatra_admin.remove_admin_booking($1::text, $2::timestamptz) as result",
      [bookingUid, now.toISOString()],
    );
    return singleResult(rows, ["deleted", "active", "not_found"]) as BookingRemovalResult;
  }

  async savePushSubscription(subscription: StoredPushSubscription) {
    await this.query(
      `select nakshatra_admin.upsert_admin_push_subscription(
        $1::text, $2::timestamptz, $3::text, $4::text
      )`,
      [
        subscription.endpoint,
        subscription.expirationTime
          ? new Date(subscription.expirationTime).toISOString()
          : null,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ],
    );
  }

  async deletePushSubscription(endpoint: string) {
    await this.query("select nakshatra_admin.delete_admin_push_subscription($1::text)", [endpoint]);
  }

  async getPushSubscription(endpoint: string) {
    const rows = await this.query(
      "select * from nakshatra_admin.get_admin_push_subscription($1::text, $2::timestamptz)",
      [endpoint, new Date().toISOString()],
    );
    return rows[0] ? this.mapPushSubscription(rows[0]) : null;
  }

  async listPushSubscriptions(now = new Date()) {
    const rows = await this.query(
      "select * from nakshatra_admin.list_admin_push_subscriptions($1::timestamptz)",
      [now.toISOString()],
    );
    return rows.map((row) => this.mapPushSubscription(row));
  }

  private mapPushSubscription(row: QueryRow): StoredPushSubscription {
    const rawExpiration = row.expiration_time;
    const expirationTime = rawExpiration instanceof Date
      ? rawExpiration.getTime()
      : typeof rawExpiration === "string"
        ? new Date(rawExpiration).getTime()
        : null;
    const subscription = {
      endpoint: row.endpoint,
      expirationTime,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    if (!isStoredSubscription(subscription)) {
      throw new Error("Neon returned an invalid push subscription");
    }
    return subscription;
  }

  async claimPushDelivery(eventId: string, now = new Date()): Promise<CalIdWebhookTrigger | null> {
    const rows = await this.query(
      "select * from nakshatra_admin.claim_admin_push_delivery($1::text, $2::timestamptz)",
      [eventId, now.toISOString()],
    );
    const trigger = rows[0]?.trigger;
    return typeof trigger === "string" ? (trigger as CalIdWebhookTrigger) : null;
  }

  async completePushDelivery(
    eventId: string,
    delivered: boolean,
    errorCode?: string,
    now = new Date(),
  ) {
    await this.query(
      `select nakshatra_admin.complete_admin_push_delivery(
        $1::text, $2::boolean, $3::text, $4::timestamptz
      )`,
      [eventId, delivered, errorCode?.slice(0, 80) ?? null, now.toISOString()],
    );
  }
}
