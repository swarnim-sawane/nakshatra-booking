import { neon } from "@neondatabase/serverless";
import type {
  CalIdWebhookEvent,
  CalIdWebhookStore,
  CalIdWebhookStoreResult,
  CalIdWebhookTrigger,
} from "./calIdWebhook.js";

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

export type AdminLoginRateLimitResult = Readonly<{
  allowed: boolean;
  retryAfterSeconds: number;
}>;

export interface AdminDataStore extends CalIdWebhookStore {
  listBookings(): Promise<StoredAdminBooking[]>;
  deleteBooking(bookingUid: string): Promise<BookingRemovalResult>;
  savePushSubscription(subscription: StoredPushSubscription): Promise<void>;
  renewPushSubscription(subscription: StoredPushSubscription): Promise<boolean>;
  deletePushSubscription(endpoint: string): Promise<void>;
  deleteAllPushSubscriptions(): Promise<void>;
  getPushSubscription(endpoint: string): Promise<StoredPushSubscription | null>;
  listPushSubscriptions(): Promise<StoredPushSubscription[]>;
  claimPushDelivery(eventId: string): Promise<CalIdWebhookTrigger | null>;
  completePushDelivery(
    eventId: string,
    delivered: boolean,
    errorCode?: string,
  ): Promise<void>;
  consumeAdminLoginAttempt(sourceKey: string): Promise<AdminLoginRateLimitResult>;
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
        $9::timestamptz, $10::text
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
        event.rescheduledFromUid ?? null,
      ],
    );
    return singleResult(rows, ["applied", "duplicate", "suppressed"]) as CalIdWebhookStoreResult;
  }

  async listBookings(): Promise<StoredAdminBooking[]> {
    const rows = await this.query("select * from nakshatra_admin.list_admin_bookings()");

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

  async deleteBooking(bookingUid: string): Promise<BookingRemovalResult> {
    const rows = await this.query(
      "select nakshatra_admin.remove_admin_booking($1::text) as result",
      [bookingUid],
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

  async renewPushSubscription(subscription: StoredPushSubscription) {
    const rows = await this.query(
      `select nakshatra_admin.renew_admin_push_subscription(
        $1::text, $2::timestamptz, $3::text, $4::text
      ) as renewed`,
      [
        subscription.endpoint,
        subscription.expirationTime
          ? new Date(subscription.expirationTime).toISOString()
          : null,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ],
    );
    const renewed = rows[0]?.renewed;
    if (typeof renewed !== "boolean") {
      throw new Error("Neon returned an invalid push-renewal result");
    }
    return renewed;
  }

  async deletePushSubscription(endpoint: string) {
    await this.query("select nakshatra_admin.delete_admin_push_subscription($1::text)", [endpoint]);
  }

  async deleteAllPushSubscriptions() {
    await this.query("select nakshatra_admin.delete_all_admin_push_subscriptions()");
  }

  async getPushSubscription(endpoint: string) {
    const rows = await this.query(
      "select * from nakshatra_admin.get_admin_push_subscription($1::text)",
      [endpoint],
    );
    return rows[0] ? this.mapPushSubscription(rows[0]) : null;
  }

  async listPushSubscriptions() {
    const rows = await this.query("select * from nakshatra_admin.list_admin_push_subscriptions()");
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

  async claimPushDelivery(eventId: string): Promise<CalIdWebhookTrigger | null> {
    const rows = await this.query(
      "select * from nakshatra_admin.claim_admin_push_delivery($1::text)",
      [eventId],
    );
    const trigger = rows[0]?.trigger;
    return typeof trigger === "string" ? (trigger as CalIdWebhookTrigger) : null;
  }

  async completePushDelivery(
    eventId: string,
    delivered: boolean,
    errorCode?: string,
  ) {
    await this.query(
      `select nakshatra_admin.complete_admin_push_delivery(
        $1::text, $2::boolean, $3::text
      )`,
      [eventId, delivered, errorCode?.slice(0, 80) ?? null],
    );
  }

  async consumeAdminLoginAttempt(sourceKey: string): Promise<AdminLoginRateLimitResult> {
    const rows = await this.query(
      "select * from nakshatra_admin.consume_admin_login_attempt($1::text)",
      [sourceKey],
    );
    const allowed = rows[0]?.allowed;
    const retryAfter = rows[0]?.retry_after_seconds;
    const retryAfterSeconds = typeof retryAfter === "number"
      ? retryAfter
      : typeof retryAfter === "string"
        ? Number(retryAfter)
        : Number.NaN;
    if (typeof allowed !== "boolean" || !Number.isInteger(retryAfterSeconds)) {
      throw new Error("Neon returned an invalid login rate-limit result");
    }
    return { allowed, retryAfterSeconds };
  }
}
