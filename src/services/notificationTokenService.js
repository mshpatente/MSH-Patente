import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

async function createTokenHash(token) {
  const encodedToken =
    new TextEncoder().encode(token);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      encodedToken
    );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

function detectDeviceType() {
  const userAgent =
    navigator.userAgent.toLowerCase();

  if (
    /android|iphone|ipad|ipod/.test(
      userAgent
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

export async function saveNotificationToken(
  user,
  token
) {
  if (!user?.uid || !token) {
    return {
      success: false,
      reason: "missing-user-or-token"
    };
  }

  try {
    const tokenHash =
      await createTokenHash(token);

    const tokenReference =
      doc(
        db,
        "users",
        user.uid,
        "notificationTokens",
        tokenHash
      );

    const tokenSnapshot =
      await getDoc(tokenReference);

    const tokenData = {
      token,
      tokenHash,

      userId:
        user.uid,

      enabled:
        true,

      deviceType:
        detectDeviceType(),

      platform:
        navigator.platform || "unknown",

      language:
        navigator.language || "unknown",

      userAgent:
        navigator.userAgent,

      lastSeenAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()
    };

    if (!tokenSnapshot.exists()) {
      tokenData.createdAt =
        serverTimestamp();
    }

    await setDoc(
      tokenReference,
      tokenData,
      {
        merge: true
      }
    );

    return {
      success: true,
      tokenHash
    };
  } catch (error) {
    console.error(
      "Notification token saving error:",
      error
    );

    return {
      success: false,
      reason: "firestore-error",
      error
    };
  }
}