import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getMessaging,
  isSupported
} from "firebase/messaging";

const requiredEnvironmentVariables = {
  VITE_FIREBASE_API_KEY:
    import.meta.env.VITE_FIREBASE_API_KEY,

  VITE_FIREBASE_AUTH_DOMAIN:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  VITE_FIREBASE_PROJECT_ID:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  VITE_FIREBASE_STORAGE_BUCKET:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  VITE_FIREBASE_MESSAGING_SENDER_ID:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

  VITE_FIREBASE_APP_ID:
    import.meta.env.VITE_FIREBASE_APP_ID
};

const missingEnvironmentVariables =
  Object.entries(requiredEnvironmentVariables)
    .filter(([, value]) => {
      return (
        typeof value !== "string" ||
        value.trim() === ""
      );
    })
    .map(([key]) => key);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    [
      "Firebase configuration is incomplete.",
      "Missing environment variables:",
      ...missingEnvironmentVariables.map(
        (key) => `- ${key}`
      )
    ].join("\n")
  );
}

const firebaseConfig = {
  apiKey:
    requiredEnvironmentVariables
      .VITE_FIREBASE_API_KEY,

  authDomain:
    requiredEnvironmentVariables
      .VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    requiredEnvironmentVariables
      .VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    requiredEnvironmentVariables
      .VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    requiredEnvironmentVariables
      .VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    requiredEnvironmentVariables
      .VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

let messagingInstance = null;

export async function getFirebaseMessaging() {
  if (messagingInstance) {
    return messagingInstance;
  }

  try {
    const messagingSupported =
      await isSupported();

    if (!messagingSupported) {
      console.warn(
        "Firebase Messaging is not supported in this browser."
      );

      return null;
    }

    messagingInstance =
      getMessaging(app);

    return messagingInstance;
  } catch (error) {
    console.error(
      "Firebase Messaging initialization failed:",
      error
    );

    return null;
  }
}

export function getFirebaseVapidKey() {
  const vapidKey =
    import.meta.env.VITE_FIREBASE_VAPID_KEY;

  if (
    typeof vapidKey !== "string" ||
    vapidKey.trim() === ""
  ) {
    console.warn(
      "VITE_FIREBASE_VAPID_KEY is missing."
    );

    return null;
  }

  return vapidKey.trim();
}

export default app;