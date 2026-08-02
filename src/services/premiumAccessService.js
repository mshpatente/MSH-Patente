import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

const USER_COLLECTION =
  "users";

const INSTALLATION_ID_KEY =
  "msh-premium-installation-id-v1";

function normalizeText(
  value
) {
  return String(
    value || ""
  ).trim();
}

function createRandomId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return globalThis.crypto
      .randomUUID();
  }

  return (
    `${Date.now()}-` +
    Math.random()
      .toString(16)
      .slice(2) +
    Math.random()
      .toString(16)
      .slice(2)
  );
}

/*
 * একই browser/PWA installation-এর
 * জন্য একটি স্থায়ী random ID।
 */
export function getInstallationId() {
  try {
    const existingId =
      localStorage.getItem(
        INSTALLATION_ID_KEY
      );

    if (existingId) {
      return existingId;
    }

    const installationId =
      createRandomId();

    localStorage.setItem(
      INSTALLATION_ID_KEY,
      installationId
    );

    return installationId;
  } catch {
    /*
     * localStorage unavailable হলে
     * temporary ID।
     */
    return createRandomId();
  }
}

async function sha256(
  value
) {
  const safeValue =
    normalizeText(value);

  if (
    !globalThis.crypto
      ?.subtle
  ) {
    /*
     * পুরোনো browser fallback।
     * Production security-এর জন্য
     * Cloud Function phase-এ
     * server verification যোগ হবে।
     */
    return safeValue;
  }

  const encodedValue =
    new TextEncoder()
      .encode(safeValue);

  const hashBuffer =
    await globalThis.crypto
      .subtle
      .digest(
        "SHA-256",
        encodedValue
      );

  return Array
    .from(
      new Uint8Array(
        hashBuffer
      )
    )
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}

export async function getCurrentDeviceHash() {
  const installationId =
    getInstallationId();

  return sha256(
    installationId
  );
}

function timestampToMilliseconds(
  value
) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  const parsed =
    new Date(value)
      .getTime();

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

/*
 * Premium profile-এর বর্তমান অবস্থা।
 */
export function evaluatePremiumAccess(
  userData = {}
) {
  if (
    userData.role === "admin"
  ) {
    return {
      allowed: true,
      reason: "admin",
      expiresAt: null
    };
  }

  const premiumAccess =
    userData.premiumAccess ||
    {};

  if (
    premiumAccess.enabled !==
    true
  ) {
    return {
      allowed: false,
      reason:
        "premium_not_enabled",
      expiresAt: null
    };
  }

  if (
    premiumAccess.unlimited ===
    true
  ) {
    return {
      allowed: true,
      reason:
        "premium_unlimited",
      expiresAt: null
    };
  }

  const expiresAtMilliseconds =
    timestampToMilliseconds(
      premiumAccess.expiresAt
    );

  if (
    !expiresAtMilliseconds
  ) {
    return {
      allowed: false,
      reason:
        "premium_expiry_missing",
      expiresAt: null
    };
  }

  if (
    expiresAtMilliseconds <=
    Date.now()
  ) {
    return {
      allowed: false,
      reason:
        "premium_expired",
      expiresAt:
        premiumAccess.expiresAt
    };
  }

  return {
    allowed: true,
    reason:
      "premium_active",
    expiresAt:
      premiumAccess.expiresAt
  };
}

export async function loadPremiumProfile(
  user
) {
  if (!user?.uid) {
    return {
      exists: false,
      userData: null,
      access: {
        allowed: false,
        reason:
          "authentication_required"
      }
    };
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        USER_COLLECTION,
        user.uid
      )
    );

  if (!snapshot.exists()) {
    return {
      exists: false,
      userData: null,
      access: {
        allowed: false,
        reason:
          "user_profile_missing"
      }
    };
  }

  const userData = {
    id: snapshot.id,
    ...snapshot.data()
  };

  return {
    exists: true,
    userData,
    access:
      evaluatePremiumAccess(
        userData
      )
  };
}

/*
 * Premium content খোলার আগে এটি call হবে।
 *
 * প্রথম অনুমোদিত device হলে bind করবে।
 * অন্য device হলে access বন্ধ করবে।
 */
export async function verifyAndBindPremiumDevice(
  user
) {
  if (!user?.uid) {
    return {
      allowed: false,
      reason:
        "authentication_required"
    };
  }

  const deviceIdHash =
    await getCurrentDeviceHash();

  const userReference =
    doc(
      db,
      USER_COLLECTION,
      user.uid
    );

  return runTransaction(
    db,
    async (
      transaction
    ) => {
      const snapshot =
        await transaction.get(
          userReference
        );

      if (!snapshot.exists()) {
        return {
          allowed: false,
          reason:
            "user_profile_missing"
        };
      }

      const userData =
        snapshot.data();

      const premiumState =
        evaluatePremiumAccess(
          userData
        );

      if (
        premiumState.allowed !==
        true
      ) {
        return {
          allowed: false,
          reason:
            premiumState.reason,
          expiresAt:
            premiumState.expiresAt ||
            null
        };
      }

      /*
       * Admin account device lock-এর
       * বাইরে থাকবে।
       */
      if (
        userData.role === "admin"
      ) {
        return {
          allowed: true,
          reason: "admin",
          deviceBound: false
        };
      }

      const authorizedDevice =
        userData.authorizedDevice ||
        {};

      const savedDeviceHash =
        normalizeText(
          authorizedDevice
            .deviceIdHash
        );

      const deviceStatus =
        normalizeText(
          authorizedDevice.status
        );

      /*
       * Admin reset করার পর অথবা
       * আগে কোনো device bind না থাকলে
       * বর্তমান device bind হবে।
       */
      if (
        !savedDeviceHash ||
        deviceStatus ===
          "unbound" ||
        deviceStatus ===
          "reset"
      ) {
        transaction.update(
          userReference,
          {
            "authorizedDevice.deviceIdHash":
              deviceIdHash,

            "authorizedDevice.status":
              "active",

            "authorizedDevice.boundAt":
              serverTimestamp(),

            "authorizedDevice.lastSeenAt":
              serverTimestamp(),

            "authorizedDevice.resetAt":
              null,

            "authorizedDevice.resetBy":
              ""
          }
        );

        return {
          allowed: true,
          reason:
            "device_bound",
          deviceBound: true
        };
      }

      if (
        savedDeviceHash !==
        deviceIdHash
      ) {
        return {
          allowed: false,
          reason:
            "device_mismatch",
          deviceBound: false
        };
      }

      transaction.update(
        userReference,
        {
          "authorizedDevice.lastSeenAt":
            serverTimestamp(),

          "authorizedDevice.status":
            "active"
        }
      );

      return {
        allowed: true,
        reason:
          "device_verified",
        deviceBound: true
      };
    }
  );
}

/*
 * Admin: নির্দিষ্ট user-কে
 * Premium permission দেওয়া।
 */
export async function grantPremiumAccess({
  targetUserId,
  adminUid,
  durationDays = 30,
  unlimited = false
}) {
  const safeTargetUserId =
    normalizeText(
      targetUserId
    );

  const safeAdminUid =
    normalizeText(
      adminUid
    );

  if (
    !safeTargetUserId ||
    !safeAdminUid
  ) {
    throw new Error(
      "User ID e Admin ID sono obbligatori."
    );
  }

  const safeDurationDays =
    Math.max(
      1,
      Number(
        durationDays || 1
      )
    );

  const expiresAt =
    unlimited
      ? null
      : Timestamp.fromMillis(
          Date.now() +
          safeDurationDays *
            24 *
            60 *
            60 *
            1000
        );

  await updateDoc(
    doc(
      db,
      USER_COLLECTION,
      safeTargetUserId
    ),
    {
      "premiumAccess.enabled":
        true,

      "premiumAccess.unlimited":
        Boolean(unlimited),

      "premiumAccess.startsAt":
        serverTimestamp(),

      "premiumAccess.expiresAt":
        expiresAt,

      "premiumAccess.grantedAt":
        serverTimestamp(),

      "premiumAccess.grantedBy":
        safeAdminUid,

      "premiumAccess.revokedAt":
        null,

      "premiumAccess.revokedBy":
        ""
    }
  );
}

/*
 * Admin: Premium বাতিল।
 */
export async function revokePremiumAccess({
  targetUserId,
  adminUid
}) {
  const safeTargetUserId =
    normalizeText(
      targetUserId
    );

  const safeAdminUid =
    normalizeText(
      adminUid
    );

  if (
    !safeTargetUserId ||
    !safeAdminUid
  ) {
    throw new Error(
      "User ID e Admin ID sono obbligatori."
    );
  }

  await updateDoc(
    doc(
      db,
      USER_COLLECTION,
      safeTargetUserId
    ),
    {
      "premiumAccess.enabled":
        false,

      "premiumAccess.unlimited":
        false,

      "premiumAccess.expiresAt":
        null,

      "premiumAccess.revokedAt":
        serverTimestamp(),

      "premiumAccess.revokedBy":
        safeAdminUid
    }
  );
}

/*
 * Admin: পুরোনো mobile/device unlink।
 *
 * এরপর user নতুন mobile থেকে
 * Premium খুললে সেটি bind হবে।
 */
export async function resetPremiumDevice({
  targetUserId,
  adminUid
}) {
  const safeTargetUserId =
    normalizeText(
      targetUserId
    );

  const safeAdminUid =
    normalizeText(
      adminUid
    );

  if (
    !safeTargetUserId ||
    !safeAdminUid
  ) {
    throw new Error(
      "User ID e Admin ID sono obbligatori."
    );
  }

  await updateDoc(
    doc(
      db,
      USER_COLLECTION,
      safeTargetUserId
    ),
    {
      "authorizedDevice.deviceIdHash":
        "",

      "authorizedDevice.status":
        "reset",

      "authorizedDevice.boundAt":
        null,

      "authorizedDevice.lastSeenAt":
        null,

      "authorizedDevice.resetAt":
        serverTimestamp(),

      "authorizedDevice.resetBy":
        safeAdminUid
    }
  );
}

export function getPremiumAccessMessage(
  reason
) {
  const messages = {
    authentication_required:
      "Accedi per utilizzare i contenuti Premium.",

    user_profile_missing:
      "Profilo utente non trovato.",

    premium_not_enabled:
      "Il tuo profilo non dispone dell'accesso Premium.",

    premium_expiry_missing:
      "La scadenza Premium non è configurata.",

    premium_expired:
      "Il tuo accesso Premium è scaduto.",

    device_mismatch:
      "Questo account Premium è già associato a un altro dispositivo. Contatta l'amministratore per cambiare dispositivo."
  };

  return (
    messages[reason] ||
    "Accesso Premium non disponibile."
  );
}function getTimestampMilliseconds(
  value
) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  const parsedDate =
    new Date(value).getTime();

  return Number.isFinite(
    parsedDate
  )
    ? parsedDate
    : 0;
}

export function normalizePremiumUser(
  userData = {},
  documentId = ""
) {
  const premiumAccess =
    userData.premiumAccess ||
    {};

  const authorizedDevice =
    userData.authorizedDevice ||
    {};

  const premiumState =
    evaluatePremiumAccess(
      userData
    );

  return {
    id:
      normalizeText(
        userData.uid ||
        documentId
      ),

    uid:
      normalizeText(
        userData.uid ||
        documentId
      ),

    name:
      normalizeText(
        userData.name
      ) ||
      "Utente senza nome",

    email:
      normalizeText(
        userData.email
      ),

    role:
      normalizeText(
        userData.role
      ) ||
      "student",

    premiumAccess: {
      enabled:
        premiumAccess.enabled ===
        true,

      unlimited:
        premiumAccess.unlimited ===
        true,

      startsAt:
        premiumAccess.startsAt ||
        null,

      expiresAt:
        premiumAccess.expiresAt ||
        null,

      grantedAt:
        premiumAccess.grantedAt ||
        null,

      grantedBy:
        normalizeText(
          premiumAccess.grantedBy
        ),

      revokedAt:
        premiumAccess.revokedAt ||
        null,

      revokedBy:
        normalizeText(
          premiumAccess.revokedBy
        )
    },

    authorizedDevice: {
      deviceIdHash:
        normalizeText(
          authorizedDevice
            .deviceIdHash
        ),

      status:
        normalizeText(
          authorizedDevice.status
        ) ||
        "unbound",

      boundAt:
        authorizedDevice.boundAt ||
        null,

      lastSeenAt:
        authorizedDevice.lastSeenAt ||
        null,

      resetAt:
        authorizedDevice.resetAt ||
        null,

      resetBy:
        normalizeText(
          authorizedDevice.resetBy
        )
    },

    premiumAllowed:
      premiumState.allowed ===
      true,

    premiumReason:
      premiumState.reason,

    createdAt:
      userData.createdAt ||
      null,

    updatedAt:
      userData.updatedAt ||
      null,

    createdAtMilliseconds:
      getTimestampMilliseconds(
        userData.createdAt
      ),

    expiresAtMilliseconds:
      getTimestampMilliseconds(
        premiumAccess.expiresAt
      )
  };
}

export async function loadPremiumUsers(
  adminUser
) {
  if (!adminUser?.uid) {
    throw new Error(
      "Accesso amministratore richiesto."
    );
  }

  const adminSnapshot =
    await getDoc(
      doc(
        db,
        USER_COLLECTION,
        adminUser.uid
      )
    );

  if (
    !adminSnapshot.exists() ||
    adminSnapshot.data()
      ?.role !== "admin"
  ) {
    throw new Error(
      "Questa area è riservata agli amministratori."
    );
  }

  const usersSnapshot =
    await getDocs(
      collection(
        db,
        USER_COLLECTION
      )
    );

  return usersSnapshot.docs
    .map(
      (userDocument) =>
        normalizePremiumUser(
          userDocument.data(),
          userDocument.id
        )
    )
    .sort(
      (first, second) => {
        if (
          first.role === "admin" &&
          second.role !== "admin"
        ) {
          return -1;
        }

        if (
          first.role !== "admin" &&
          second.role === "admin"
        ) {
          return 1;
        }

        return String(
          first.name || first.email
        ).localeCompare(
          String(
            second.name ||
            second.email
          ),
          "it",
          {
            sensitivity: "base"
          }
        );
      }
    );
}