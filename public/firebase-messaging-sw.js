importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB9BEqpcoHXTY-ZjInrA3fyhy1XljjTPF4",
  authDomain: "msh-patente.firebaseapp.com",
  projectId: "msh-patente",
  storageBucket: "msh-patente.firebasestorage.app",
  messagingSenderId: "1296263333563",
  appId: "1:1296263333563:web:5913f5a49b988eabe25dde"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "MSH Patente";

  const options = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "",

    icon:
      payload.notification?.icon ||
      "/pwa-192x192.png",

    badge:
      "/pwa-192x192.png",

    tag:
      payload.data?.tag ||
      "msh-patente-notification",

    data: {
      url:
        payload.data?.url ||
        "/"
    }
  };

  self.registration.showNotification(
    title,
    options
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification.data?.url ||
      "/";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((windowClients) => {
          const existingClient =
            windowClients.find(
              (client) =>
                client.url.startsWith(
                  self.location.origin
                )
            );

          if (existingClient) {
            return existingClient
              .navigate(targetUrl)
              .then(() =>
                existingClient.focus()
              );
          }

          return clients.openWindow(
            targetUrl
          );
        })
    );
  }
);