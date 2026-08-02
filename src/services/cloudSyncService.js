import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import { db } from "../firebase.js";

const DRAFT_COLLECTION =
  "quizDrafts";

const LOCAL_PENDING_PREFIX =
  "msh-cloud-pending-";

function getUserId(userOrUid) {
  if (
    typeof userOrUid === "string"
  ) {
    return userOrUid.trim();
  }

  return String(
    userOrUid?.uid || ""
  ).trim();
}

export function createCloudDraftId(
  storageKey
) {
  const normalizedKey =
    String(storageKey || "")
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return (
    normalizedKey ||
    "default-quiz"
  ).slice(0, 140);
}

function getDraftReference(
  userOrUid,
  draftId
) {
  const uid =
    getUserId(userOrUid);

  const safeDraftId =
    createCloudDraftId(draftId);

  if (!uid) {
    throw new Error(
      "Cloud draft user UID missing."
    );
  }

  return doc(
    db,
    "users",
    uid,
    DRAFT_COLLECTION,
    safeDraftId
  );
}

function getPendingStorageKey(
  userOrUid,
  draftId
) {
  const uid =
    getUserId(userOrUid);

  return (
    LOCAL_PENDING_PREFIX +
    uid +
    "-" +
    createCloudDraftId(draftId)
  );
}

function normalizeTimestamp(value) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Date.parse(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  if (
    value &&
    typeof value.toMillis ===
      "function"
  ) {
    return value.toMillis();
  }

  if (
    value &&
    typeof value.seconds ===
      "number"
  ) {
    return (
      value.seconds * 1000
    );
  }

  return 0;
}

function isValidDraft(draft) {
  return Boolean(
    draft &&
    typeof draft === "object" &&
    !Array.isArray(draft)
  );
}

function cloneDraft(draft) {
  try {
    return JSON.parse(
      JSON.stringify(draft)
    );
  } catch {
    return null;
  }
}

function savePendingDraft(
  userOrUid,
  draftId,
  draft
) {
  try {
    localStorage.setItem(
      getPendingStorageKey(
        userOrUid,
        draftId
      ),
      JSON.stringify(draft)
    );
  } catch (error) {
    console.warn(
      "Pending cloud draft save error:",
      error
    );
  }
}

function loadPendingDraft(
  userOrUid,
  draftId
) {
  try {
    const rawDraft =
      localStorage.getItem(
        getPendingStorageKey(
          userOrUid,
          draftId
        )
      );

    if (!rawDraft) {
      return null;
    }

    const draft =
      JSON.parse(rawDraft);

    return isValidDraft(draft)
      ? draft
      : null;
  } catch (error) {
    console.warn(
      "Pending cloud draft load error:",
      error
    );

    return null;
  }
}

function clearPendingDraft(
  userOrUid,
  draftId
) {
  try {
    localStorage.removeItem(
      getPendingStorageKey(
        userOrUid,
        draftId
      )
    );
  } catch (error) {
    console.warn(
      "Pending cloud draft clear error:",
      error
    );
  }
}

export async function saveCloudDraft({
  user,
  draftId,
  draft
}) {
  if (!isValidDraft(draft)) {
    throw new Error(
      "Invalid cloud draft."
    );
  }

  const updatedAtMs =
    Date.now();

  const safeDraft =
    cloneDraft({
      ...draft,
      updatedAtMs
    });

  if (!safeDraft) {
    throw new Error(
      "Cloud draft cannot be serialized."
    );
  }

  /*
   * Firestore save fail করলে এই copy
   * local pending queue-তে থাকবে।
   */
  savePendingDraft(
    user,
    draftId,
    safeDraft
  );

  try {
    await setDoc(
      getDraftReference(
        user,
        draftId
      ),
      {
        draftId:
          createCloudDraftId(
            draftId
          ),

        data:
          safeDraft,

        updatedAtMs,

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    clearPendingDraft(
      user,
      draftId
    );

    return safeDraft;
  } catch (error) {
    console.warn(
      "Cloud draft save deferred:",
      error
    );

    /*
     * Local quiz save বন্ধ হবে না।
     * Internet ফিরে এলে syncPendingCloudDraft()
     * দিয়ে আবার পাঠানো যাবে।
     */
    return safeDraft;
  }
}

export async function loadCloudDraft({
  user,
  draftId
}) {
  try {
    const snapshot =
      await getDoc(
        getDraftReference(
          user,
          draftId
        )
      );

    if (!snapshot.exists()) {
      return loadPendingDraft(
        user,
        draftId
      );
    }

    const storedData =
      snapshot.data();

    const cloudDraft =
      storedData?.data;

    if (
      !isValidDraft(cloudDraft)
    ) {
      return loadPendingDraft(
        user,
        draftId
      );
    }

    return {
      ...cloudDraft,

      updatedAtMs:
        normalizeTimestamp(
          cloudDraft.updatedAtMs ||
          storedData.updatedAtMs ||
          storedData.updatedAt
        )
    };
  } catch (error) {
    console.warn(
      "Cloud draft load error:",
      error
    );

    return loadPendingDraft(
      user,
      draftId
    );
  }
}

export async function deleteCloudDraft({
  user,
  draftId
}) {
  clearPendingDraft(
    user,
    draftId
  );

  try {
    await deleteDoc(
      getDraftReference(
        user,
        draftId
      )
    );

    return true;
  } catch (error) {
    console.warn(
      "Cloud draft delete error:",
      error
    );

    return false;
  }
}

export function resolveLatestDraft(
  localDraft,
  cloudDraft
) {
  const validLocal =
    isValidDraft(localDraft)
      ? localDraft
      : null;

  const validCloud =
    isValidDraft(cloudDraft)
      ? cloudDraft
      : null;

  if (
    !validLocal &&
    !validCloud
  ) {
    return null;
  }

  if (!validLocal) {
    return validCloud;
  }

  if (!validCloud) {
    return validLocal;
  }

  const localUpdatedAt =
    normalizeTimestamp(
      validLocal.updatedAtMs ||
      validLocal.updatedAt ||
      validLocal.savedAt
    );

  const cloudUpdatedAt =
    normalizeTimestamp(
      validCloud.updatedAtMs ||
      validCloud.updatedAt ||
      validCloud.savedAt
    );

  /*
   * সর্বশেষ save হওয়া draft-টি জিতবে।
   * পুরোনো local draft নতুন cloud draft-কে
   * overwrite করবে না।
   */
  return cloudUpdatedAt >
    localUpdatedAt
    ? validCloud
    : validLocal;
}

export async function syncPendingCloudDraft({
  user,
  draftId
}) {
  const pendingDraft =
    loadPendingDraft(
      user,
      draftId
    );

  if (!pendingDraft) {
    return null;
  }

  try {
    await setDoc(
      getDraftReference(
        user,
        draftId
      ),
      {
        draftId:
          createCloudDraftId(
            draftId
          ),

        data:
          pendingDraft,

        updatedAtMs:
          normalizeTimestamp(
            pendingDraft.updatedAtMs
          ) || Date.now(),

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    clearPendingDraft(
      user,
      draftId
    );

    return pendingDraft;
  } catch (error) {
    console.warn(
      "Pending cloud draft sync error:",
      error
    );

    return null;
  }
}