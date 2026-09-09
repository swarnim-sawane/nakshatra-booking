const CACHE_NAME = "nakshatra-admin-v2";
const ADMIN_ASSETS = [
  "/admin/",
  "/admin/manifest.webmanifest",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ADMIN_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("nakshatra-admin-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/admin/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached ?? caches.match("/admin/");
      }),
  );
});

self.addEventListener("push", (event) => {
  const allowedTitles = new Set([
    "New consultation booked",
    "Consultation payment confirmed",
    "Consultation rescheduled",
    "Consultation cancelled",
    "Nakshatra notifications are ready",
  ]);
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = allowedTitles.has(data.title) ? data.title : "Consultation update";
  const tag = typeof data.tag === "string" ? data.tag.slice(0, 80) : "nakshatra-booking-update";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: "Open Nakshatra Admin for details.",
      data: { url: "/admin/" },
      icon: "/brand/icon-192.png",
      badge: "/brand/favicon-32.png",
      tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const existing = clients.find((client) => {
          const url = new URL(client.url);
          return url.origin === self.location.origin && url.pathname.startsWith("/admin/");
        });

        if (existing) return existing.focus();
        return self.clients.openWindow("/admin/");
      }),
  );
});
