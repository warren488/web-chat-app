console.log("service worker loaded");

self.addEventListener("push", async function(e) {
  const data = e.data.json();

  let searchOptions = { tag: data.fromId };
  let newBody = data.text;
  let dataCount = 1;
  const notifPromise = self.registration
    .getNotifications(searchOptions)
    .then(function(notifications) {
      // in reality this apps use cases for tags should mean there will never
      // be more than one notification with the same tag.... for now
      notifications.forEach(notification => {
        dataCount += notification.data;
        // notification.close();
      });
      return self.registration.showNotification(
        `${data.title}${dataCount > 1 ? ` (${dataCount})` : ""}`,
        {
          body: newBody,
          tag: data.fromId,
          badge: "/test-72x72.png",
          icon: "/test-72x72.png",
          /**
           * @fixme we need to find a way to clear this number when we clear
           * notifications on opening the app
           */
          data: dataCount,
          vibrate: [400],
          timestamp: data.createdAt
        }
      );
    });
  e.waitUntil(notifPromise);
});

// Notification click event listener
self.addEventListener("notificationclick", e => {
  // Close the notification popout
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(clientsArr => {
      // If a Window tab matching the targeted URL already exists, focus that;
      console.log(self.clients);
      const hadWindowToFocus = clientsArr.some(windowClient => {
        if (windowClient.url.startsWith(`https://myapp-4f894.web.app/`)) {
          windowClient.focus();
          return true;
        }
        return false;
      });
      // Otherwise, open a new tab to the applicable URL and focus it.
      if (!hadWindowToFocus)
        clients
          .openWindow(`https://myapp-4f894.web.app/`)
          .then(windowClient => (windowClient ? windowClient.focus() : null));
    })
  );
});
