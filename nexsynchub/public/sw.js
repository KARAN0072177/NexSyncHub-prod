// NexSyncHub Service Worker for Web Push & Desktop Notifications

self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications (when received via push event)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "NexSyncHub Notification";
    const options = {
      body: data.content || data.body || "You have a new update",
      icon: "/logo-icon.png",
      badge: "/favicon.ico",
      tag: data.tag || (data._id ? `mention-${data._id}` : "nexsync-mention"),
      data: {
        url: data.link || data.url || "/dashboard",
      },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Service worker push notification error:", err);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // 1. Check if there's already an open tab on this domain
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // 2. If no client window is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
