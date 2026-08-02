import {
  requestNotificationToken,
  listenForForegroundMessages
} from "./notificationService.js";

import {
  saveNotificationToken
} from "./notificationTokenService.js";

let notificationUserId = null;
let stopForegroundNotifications = null;

function showForegroundNotification(
  payload
) {
  const title =
    payload.notification?.title ??
    payload.data?.title ??
    "MSH Patente";

  const body =
    payload.notification?.body ??
    payload.data?.body ??
    "";

  if (
    typeof Notification ===
      "undefined" ||
    Notification.permission !==
      "granted"
  ) {
    return;
  }

  new Notification(title, {
    body,
    icon:
      "/pwa-192x192.png",
    badge:
      "/pwa-192x192.png",

    tag:
      payload.messageId ||
      "msh-patente-notification"
  });
}

export async function initializeNotifications(
  user
) {
  if (!user?.uid) {
    return;
  }

  if (
    notificationUserId ===
    user.uid
  ) {
    return;
  }

  const result =
    await requestNotificationToken();

  if (!result.success) {
    console.info(
      "Notifications not enabled:",
      result.reason
    );

    return;
  }

  const saveResult =
    await saveNotificationToken(
      user,
      result.token
    );

  if (!saveResult.success) {
    console.warn(
      "FCM token was not saved:",
      saveResult.reason
    );
  }

  if (
    typeof stopForegroundNotifications ===
    "function"
  ) {
    stopForegroundNotifications();
  }

  stopForegroundNotifications =
    await listenForForegroundMessages(
      showForegroundNotification
    );

  notificationUserId =
    user.uid;
}

export function resetNotifications() {
  notificationUserId = null;

  if (
    typeof stopForegroundNotifications ===
    "function"
  ) {
    stopForegroundNotifications();
  }

  stopForegroundNotifications =
    null;
}