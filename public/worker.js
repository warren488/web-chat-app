console.log("service worker loaded");
const REQUEST_TAG = "request";
self.addEventListener("push", async function(e) {
  console.log(e.data);
  const data = e.data.json();
  let tag, notifData;
  if (data.request === true) {
    tag = REQUEST_TAG;
    notifData = {
      count: 1
    };
  } else {
    tag = data.friendship_id;
    notifData = {
      count: 1,
      friendship_id: data.friendship_id
    };
  }

  let searchOptions = { tag };
  let newBody = data.text;
  // let dataCount = 1;
  const notifPromise = self.registration
    .getNotifications(searchOptions)
    .then(async function(notifications) {
      // in reality this apps use cases for tags should mean there will never
      // be more than one notification with the same tag.... for now
      notifications.forEach(notification => {
        notifData.count += notification.data.count;
        // notification.close();
      });
      const isInFocus = await self.clients
        .matchAll({ type: "window" })
        .then(clientsArr => {
          // If a Window tab is already in focus
          console.log(clientsArr);
          console.log(self.clients);
          return clientsArr.some(windowClient => {
            if (windowClient.focused) {
              return true;
            }
            return false;
          });
        });
      if (isInFocus) {
        return Promise.resolve();
      }
      return self.registration.showNotification(
        `${data.title}${notifData.count > 1 ? ` (${notifData.count})` : ""}`,
        {
          body: newBody,
          tag,
          badge: "/test-72x72.webp",
          icon: "/test-72x72.webp",
          /**
           * @fixme we need to find a way to clear this number when we clear
           * notifications on opening the app
           */
          data: notifData,
          vibrate: [400],
          timestamp: data.createdAt
        }
      );
    });
  e.waitUntil(notifPromise);
});

// Notification click event listener
self.addEventListener("notificationclick", e => {
  let chat, openUrl;
  if (e.notification.data.tag === REQUEST_TAG) {
    openUrl = `${self.location.hostname}`;
  } else {
    chat = e.notification.data.friendship_id;
    openUrl = `${self.location.hostname}?chat=${chat}`;
  }
  console.log(e.notification);
  console.log(self.clients);
  // Close the notification popout
  // e.notification.close();
  // Get all the Window clients
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(clientsArr => {
      // If a Window tab matching the targeted URL already exists, focus that;
      try {
        const hadWindowToFocus = clientsArr.some(async windowClient => {
          // if (windowClient.url.includes(`myapp-4f894.web.app`)) {
          const focusedClient = await windowClient.focus();
          /** so what we have down here isnt necessarily required in order to get to the page
           * cause we can simply the url to navigate to our chat however that usually creates
           * an entire page reload when we focus on the page and slows things down so instead
           * we tell the app itself to navigate to that page
           */
          if (chat) {
            focusedClient.postMessage({
              type: "openChat",
              chat
            });
          }
          return true;
          // }
          // return false;
        });
        // Otherwise, open a new tab to the applicable URL and focus it.
        if (!hadWindowToFocus)
          clients
            /** postMessage seems to be a little funny here when we try to use it immediately after
             * a window is created, maybe i just need to do a bit more diggin
             */
            /** @fixme subsequentl reloads will always open this chat */
            .openWindow(openUrl)
            .then(windowClient => (windowClient ? windowClient.focus() : null));
      } catch (error) {
        console.log(error);
      }
    })
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  // If this is an incoming POST request for the
  // registered "action" URL, respond to it.
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const image = formData.get("image") || "";
        console.log(image);
        return Response.redirect("/home", 303);
      })()
    );
  }
});
