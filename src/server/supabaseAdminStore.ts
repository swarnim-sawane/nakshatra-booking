import type {
  CalIdWebhookEvent,
  CalIdWebhookStore,
  CalIdWebhookStoreResult,
  CalIdWebhookTrigger,
} from "./calIdWebhook";

export type SupabaseEnvironment = Readonly<{
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}>;

export type StoredAdminBooking = Readonly<{
  id: string;
  customerFirstName: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  timezone: "Asia/Kolkata";
  status: "confirmed" | "paid" | "rescheduled" | "cancelled";
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

type SupabaseAdminStoreOptions = {
  url: string;
  serviceRoleKey: string;
  fetchImpl?: typeof fetch;
};

const serviceNames = {
  "personal-consultation": "Personal Consultation",
  "relationship-consultation": "Relationship Consultation (Kundli Milan)",
  "best-date-analysis": "Muhurat",
} as const;

function normalizeSupabaseUrl(value: string) {
  const url = new URL(value);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if ((!local && url.protocol !== "https:") || (local && !["http:", "https:"].includes(url.protocol))) {
    throw new Error("SUPABASE_URL must use HTTPS");
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.href.replace(/\/$/, "");
}

function endpointHash(endpoint: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint)).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""),
  );
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

export function createSupabaseAdminStore(
  environment: SupabaseEnvironment,
  fetchImpl: typeof fetch = fetch,
) {
  const rawUrl = environment.SUPABASE_URL?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceRoleKey) return null;

  try {
    return new SupabaseAdminStore({ url: rawUrl, serviceRoleKey, fetchImpl });
  } catch {
    return null;
  }
}

export class SupabaseAdminStore implements CalIdWebhookStore {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor({ url, serviceRoleKey, fetchImpl = fetch }: SupabaseAdminStoreOptions) {
    if (!serviceRoleKey.trim()) throw new Error("Supabase service role key is required");
    this.baseUrl = normalizeSupabaseUrl(url);
    this.serviceRoleKey = serviceRoleKey;
    this.fetchImpl = fetchImpl;
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetchImpl(`${this.baseUrl}/rest/v1${path}`, {
      ...init,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`Supabase request failed with ${response.status}`);
    return response;
  }

  async applyEvent(event: CalIdWebhookEvent): Promise<CalIdWebhookStoreResult> {
    const response = await this.request("/rpc/apply_calid_webhook_event", {
      method: "POST",
      body: JSON.stringify({
        p_event_id: event.eventId,
        p_trigger: event.trigger,
        p_booking_uid: event.bookingUid,
        p_event_type_slug: event.eventTypeSlug,
        p_customer_first_name: event.customerFirstName,
        p_starts_at: event.startsAt,
        p_ends_at: event.endsAt,
        p_meeting_url: event.meetingUrl ?? null,
        p_occurred_at: event.occurredAt,
        p_received_at: event.receivedAt,
        p_rescheduled_from_uid: event.rescheduledFromUid ?? null,
      }),
    });
    const result = (await response.json()) as unknown;
    if (result !== "applied" && result !== "duplicate") {
      throw new Error("Supabase returned an invalid webhook result");
    }
    return result;
  }

  async listBookings(): Promise<StoredAdminBooking[]> {
    const query = new URLSearchParams({
      select: "booking_uid,event_type_slug,customer_first_name,starts_at,ends_at,lifecycle_status,meeting_url",
      replaced_by_uid: "is.null",
      order: "starts_at.asc",
    });
    const response = await this.request(`/calid_booking_state?${query.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const rows = (await response.json()) as Array<Record<string, unknown>>;

    return rows.map((row) => {
      const slug = row.event_type_slug as keyof typeof serviceNames;
      const status = row.lifecycle_status as StoredAdminBooking["status"];
      if (!serviceNames[slug] || !["confirmed", "paid", "rescheduled", "cancelled"].includes(status)) {
        throw new Error("Supabase returned an invalid booking record");
      }
      return {
        id: String(row.booking_uid),
        customerFirstName: String(row.customer_first_name),
        serviceName: serviceNames[slug],
        startsAt: String(row.starts_at),
        endsAt: String(row.ends_at),
        timezone: "Asia/Kolkata" as const,
        status,
        ...(typeof row.meeting_url === "string" && row.meeting_url
          ? { meetingUrl: row.meeting_url }
          : {}),
      };
    });
  }

  async savePushSubscription(subscription: StoredPushSubscription) {
    const hash = await endpointHash(subscription.endpoint);
    await this.request("/admin_push_subscriptions?on_conflict=endpoint_hash", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        endpoint_hash: hash,
        endpoint: subscription.endpoint,
        expiration_time: subscription.expirationTime
          ? new Date(subscription.expirationTime).toISOString()
          : null,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enabled: true,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  async deletePushSubscription(endpoint: string) {
    const hash = await endpointHash(endpoint);
    await this.request(`/admin_push_subscriptions?endpoint_hash=eq.${encodeURIComponent(hash)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  }

  async getPushSubscription(endpoint: string) {
    const hash = await endpointHash(endpoint);
    const query = new URLSearchParams({
      select: "endpoint,expiration_time,p256dh,auth",
      endpoint_hash: `eq.${hash}`,
      enabled: "eq.true",
      limit: "1",
    });
    const response = await this.request(`/admin_push_subscriptions?${query.toString()}`, {
      method: "GET",
    });
    const [row] = (await response.json()) as Array<Record<string, unknown>>;
    return row ? this.mapPushSubscription(row) : null;
  }

  async listPushSubscriptions() {
    const query = new URLSearchParams({
      select: "endpoint,expiration_time,p256dh,auth",
      enabled: "eq.true",
    });
    const response = await this.request(`/admin_push_subscriptions?${query.toString()}`, {
      method: "GET",
    });
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    return rows.map((row) => this.mapPushSubscription(row));
  }

  private mapPushSubscription(row: Record<string, unknown>): StoredPushSubscription {
    const subscription = {
      endpoint: row.endpoint,
      expirationTime:
        typeof row.expiration_time === "string"
          ? new Date(row.expiration_time).getTime()
          : null,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    if (!isStoredSubscription(subscription)) {
      throw new Error("Supabase returned an invalid push subscription");
    }
    return subscription;
  }

  async claimPushDelivery(eventId: string): Promise<CalIdWebhookTrigger | null> {
    const response = await this.request("/rpc/claim_admin_push_delivery", {
      method: "POST",
      body: JSON.stringify({ p_event_id: eventId }),
    });
    const rows = (await response.json()) as Array<{ trigger?: unknown }>;
    const trigger = rows[0]?.trigger;
    return typeof trigger === "string" ? (trigger as CalIdWebhookTrigger) : null;
  }

  async completePushDelivery(eventId: string, delivered: boolean, errorCode?: string) {
    await this.request("/rpc/complete_admin_push_delivery", {
      method: "POST",
      body: JSON.stringify({
        p_event_id: eventId,
        p_delivered: delivered,
        p_error_code: errorCode?.slice(0, 80) ?? null,
      }),
    });
  }
}
