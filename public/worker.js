// **************** TAKEN FORM SQUOOSH UTILS **************************

const nextMessageResolveMap = new Map();

/**
 * Wait on a message with a particular event.data value.
 *
 * @param dataVal The event.data value.
 */
function nextMessage(dataVal) {
  return new Promise(resolve => {
    if (!nextMessageResolveMap.has(dataVal)) {
      nextMessageResolveMap.set(dataVal, []);
    }
    nextMessageResolveMap.get(dataVal).push(resolve);
  });
}

self.addEventListener("message", event => {
  const resolvers = nextMessageResolveMap.get(event.data);
  if (!resolvers) return;
  nextMessageResolveMap.delete(event.data);
  for (const resolve of resolvers) resolve();
});

function serveShareTarget(event) {
  const dataPromise = event.request.formData();

  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect("/?share"));

  event.waitUntil(
    (async function() {
      // The page sends this message to tell the service worker it's ready to receive the file.
      await nextMessage("share-ready");
      const client = await self.clients.get(event.resultingClientId);
      const data = await dataPromise;
      const file = data.get("image");
      console.log(file);
      client.postMessage({ file, action: "load-file" });
    })()
  );
}

// **************** END TAKEN FORM SQUOOSH UTILS **************************

console.log("service worker loaded");
// NB: because the tags allow us to replace notifications we use them to indicate a friend request
// while at the same time we have a different one for each chat
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
          image: data.url,
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
    serveShareTarget(event);
  }
  if (isCachable(event.request)) {
    let requestToFind = event.request;
    if (isAppPage(url)) {
      // there is the odd chance we may have this url in the chance but not /home
      // that chance is very very low though
      requestToFind = "/home";
    }
    event.respondWith(
      caches.match(requestToFind).then(resp => {
        // try the cache first, if not go to the network update the cache and then give us
        return (
          resp ||
          fetch(event.request).then(response => {
            return caches.open("v2").then(async cache => {
              // TODO: do i need to await this?
              await cache.put(event.request, response.clone());
              return response;
            });
          })
        );
      })
    );
  }
});

function isCachable(request) {
  const url = new URL(request.url);
  return (
    url.hostname === self.location.hostname &&
    request.method !== "POST" &&
    !(
      url.pathname.startsWith("/io") ||
      url.pathname.startsWith("/sockjs-node") ||
      url.pathname.startsWith("/socket.io") ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/versionuid.json")
    )
  );
}

function isAppPage(url) {
  return (
    url.pathname.startsWith("/profile") ||
    url.pathname.startsWith("/home") ||
    url.pathname == "/"
  );
}
