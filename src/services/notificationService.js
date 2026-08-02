import {
  getToken,
  onMessage
} from "firebase/messaging";

import {
  getFirebaseMessaging,
  getFirebaseVapidKey
} from "../firebase.js";

const MESSAGING_SERVICE_WORKER_URL =
  "/firebase-messaging-sw.js";

const MESSAGING_SERVICE_WORKER_SCOPE =
  "/firebase-cloud-messaging-push-scope/";

let cachedServiceWorkerRegistration = null;
let serviceWorkerRegistrationPromise = null;

/**
 * Checks whether browser notifications and
 * Firebase Cloud Messaging can run in the browser.
 */
export function isNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    window.isSecureContext === true &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Returns the browser's current notification permission.
 */
export function getNotificationPermission() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  return Notification.permission;
}

/**
 * Waits until a service worker reaches its final state.
 */
function waitForServiceWorkerState(worker) {
  if (!worker) {
    return Promise.resolve();
  }

  if (
    worker.state === "activated" ||
    worker.state === "redundant"
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleStateChange = () => {
      if (
        worker.state === "activated" ||
        worker.state === "redundant"
      ) {
        worker.removeEventListener(
          "statechange",
          handleStateChange
        );

        resolve();
      }
    };

    worker.addEventListener(
      "statechange",
      handleStateChange
    );
  });
}

/**
 * Registers and returns the messaging service worker.
 *
 * The same registration is reused instead of registering
 * the service worker every time a token is requested.
 */
async function registerMessagingServiceWorker() {
  if (!isNotificationSupported()) {
    throw new Error(
      "Notifications are not supported in this browser."
    );
  }

  if (cachedServiceWorkerRegistration) {
    return cachedServiceWorkerRegistration;
  }

  if (serviceWorkerRegistrationPromise) {
    return serviceWorkerRegistrationPromise;
  }

  serviceWorkerRegistrationPromise =
    (async () => {
      const registration =
        await navigator.serviceWorker.register(
          MESSAGING_SERVICE_WORKER_URL,
          {
            scope:
              MESSAGING_SERVICE_WORKER_SCOPE
          }
        );

      const worker =
        registration.installing ||
        registration.waiting ||
        registration.active;

      await waitForServiceWorkerState(worker);

      const readyRegistration =
        await navigator.serviceWorker.ready;

      cachedServiceWorkerRegistration =
        readyRegistration;

      return readyRegistration;
    })();

  try {
    return await serviceWorkerRegistrationPromise;
  } catch (error) {
    serviceWorkerRegistrationPromise = null;

    throw error;
  }
}

/**
 * Requests notification permission only when necessary.
 */
async function requestBrowserPermission() {
  const currentPermission =
    getNotificationPermission();

  if (currentPermission === "unsupported") {
    return "unsupported";
  }

  if (currentPermission === "granted") {
    return "granted";
  }

  if (currentPermission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

/**
 * Requests an FCM notification token.
 *
 * Result format:
 * {
 *   success: boolean,
 *   reason: string | null,
 *   token: string | null,
 *   permission?: string,
 *   error?: unknown
 * }
 */
export async function requestNotificationToken() {
  if (!isNotificationSupported()) {
    return {
      success: false,
      reason: "unsupported",
      token: null,
      permission:
        getNotificationPermission()
    };
  }

  const vapidKey =
    getFirebaseVapidKey();

  if (!vapidKey) {
    return {
      success: false,
      reason: "missing-vapid-key",
      token: null,
      permission:
        getNotificationPermission()
    };
  }

  try {
    const permission =
      await requestBrowserPermission();

    if (permission !== "granted") {
      return {
        success: false,
        reason:
          permission === "denied"
            ? "permission-denied"
            : "permission-not-granted",
        token: null,
        permission
      };
    }

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      return {
        success: false,
        reason: "messaging-unavailable",
        token: null,
        permission
      };
    }

    const serviceWorkerRegistration =
      await registerMessagingServiceWorker();

    const token =
      await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration
      });

    if (
      typeof token !== "string" ||
      token.trim() === ""
    ) {
      return {
        success: false,
        reason: "token-unavailable",
        token: null,
        permission
      };
    }

    return {
      success: true,
      reason: null,
      token: token.trim(),
      permission
    };
  } catch (error) {
    console.error(
      "Failed to request Firebase notification token:",
      error
    );

    return {
      success: false,
      reason: "token-request-failed",
      token: null,
      permission:
        getNotificationPermission(),
      error
    };
  }
}

/**
 * Subscribes to Firebase messages received while
 * the application is open in the foreground.
 *
 * Returns an unsubscribe function.
 */
export async function listenForForegroundMessages(
  callback
) {
  if (typeof callback !== "function") {
    console.warn(
      "Foreground message listener requires a callback function."
    );

    return () => {};
  }

  if (!isNotificationSupported()) {
    return () => {};
  }

  try {
    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      return () => {};
    }

    const unsubscribe =
      onMessage(
        messaging,
        (payload) => {
          try {
            callback(payload);
          } catch (error) {
            console.error(
              "Foreground notification callback failed:",
              error
            );
          }
        }
      );

    return typeof unsubscribe === "function"
      ? unsubscribe
      : () => {};
  } catch (error) {
    console.error(
      "Failed to initialize foreground notification listener:",
      error
    );

    return () => {};
  }
}