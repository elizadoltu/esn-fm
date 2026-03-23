/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title: string = data.title ?? "ESN FM";
  const body: string = data.body ?? "You have a new notification";
  const url: string = data.url ?? "/notifications";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url },
    })
  );
});

// ─── Notification click → open / focus the app ───────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => "focus" in c);
        if (existing) {
          existing.navigate(url);
          return existing.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
