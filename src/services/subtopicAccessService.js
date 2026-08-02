import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

import {
  getPremiumAccessMessage,
  verifyAndBindPremiumDevice
} from "./premiumAccessService.js";

const ACCESS_COLLECTION =
  "subtopicAccess";

const THEORY_COLLECTION =
  "theoryLessons";

const BATCH_LIMIT = 450;

function normalizeText(
  value
) {
  return String(
    value || ""
  ).trim();
}

export function normalizeAccessLevel(
  value
) {
  return value === "premium"
    ? "premium"
    : "free";
}

async function commitLessonAccessUpdates(
  lessonDocuments,
  accessLevel,
  adminUid
) {
  const normalizedLevel =
    normalizeAccessLevel(
      accessLevel
    );

  let updated = 0;

  for (
    let startIndex = 0;
    startIndex <
      lessonDocuments.length;
    startIndex += BATCH_LIMIT
  ) {
    const chunk =
      lessonDocuments.slice(
        startIndex,
        startIndex +
          BATCH_LIMIT
      );

    const batch =
      writeBatch(db);

    chunk.forEach(
      (lessonDocument) => {
        batch.update(
          lessonDocument.ref,
          {
            accessLevel:
              normalizedLevel,

            accessUpdatedAt:
              serverTimestamp(),

            accessUpdatedBy:
              adminUid
          }
        );
      }
    );

    await batch.commit();

    updated += chunk.length;
  }

  return updated;
}

export async function synchronizeSubtopicLessonsAccess({
  subtopicId,
  accessLevel,
  adminUid
}) {
  const safeSubtopicId =
    normalizeText(
      subtopicId
    );

  const safeAdminUid =
    normalizeText(
      adminUid
    );

  if (
    !safeSubtopicId ||
    !safeAdminUid
  ) {
    throw new Error(
      "Subtopic ID e Admin ID sono obbligatori."
    );
  }

  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          THEORY_COLLECTION
        ),
        where(
          "subtopicId",
          "==",
          safeSubtopicId
        )
      )
    );

  return commitLessonAccessUpdates(
    snapshot.docs,
    accessLevel,
    safeAdminUid
  );
}

export async function loadSubtopicAccess(
  subtopicId
) {
  const safeSubtopicId =
    normalizeText(
      subtopicId
    );

  if (!safeSubtopicId) {
    return {
      subtopicId: "",
      accessLevel: "free",
      exists: false
    };
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        ACCESS_COLLECTION,
        safeSubtopicId
      )
    );

  if (!snapshot.exists()) {
    return {
      subtopicId:
        safeSubtopicId,

      accessLevel:
        "free",

      exists: false
    };
  }

  const data =
    snapshot.data() || {};

  return {
    subtopicId:
      safeSubtopicId,

    accessLevel:
      normalizeAccessLevel(
        data.accessLevel
      ),

    updatedAt:
      data.updatedAt ||
      null,

    updatedBy:
      normalizeText(
        data.updatedBy
      ),

    exists: true
  };
}

export async function loadAllSubtopicAccess() {
  const snapshot =
    await getDocs(
      collection(
        db,
        ACCESS_COLLECTION
      )
    );

  const accessMap =
    new Map();

  snapshot.docs.forEach(
    (documentSnapshot) => {
      const data =
        documentSnapshot.data() ||
        {};

      accessMap.set(
        documentSnapshot.id,

        normalizeAccessLevel(
          data.accessLevel
        )
      );
    }
  );

  return accessMap;
}

export async function saveSubtopicAccess({
  subtopicId,
  accessLevel,
  adminUid
}) {
  const safeSubtopicId =
    normalizeText(
      subtopicId
    );

  const safeAdminUid =
    normalizeText(
      adminUid
    );

  if (!safeSubtopicId) {
    throw new Error(
      "Subtopic ID mancante."
    );
  }

  if (!safeAdminUid) {
    throw new Error(
      "Admin ID mancante."
    );
  }

  const normalizedLevel =
    normalizeAccessLevel(
      accessLevel
    );

  await setDoc(
    doc(
      db,
      ACCESS_COLLECTION,
      safeSubtopicId
    ),
    {
      subtopicId:
        safeSubtopicId,

      accessLevel:
        normalizedLevel,

      updatedBy:
        safeAdminUid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  const synchronizedLessons =
    await synchronizeSubtopicLessonsAccess({
      subtopicId:
        safeSubtopicId,

      accessLevel:
        normalizedLevel,

      adminUid:
        safeAdminUid
    });

  return {
    subtopicId:
      safeSubtopicId,

    accessLevel:
      normalizedLevel,

    synchronizedLessons
  };
}

export async function saveMultipleSubtopicAccess({
  subtopicIds,
  accessLevel,
  adminUid
}) {
  const safeAdminUid =
    normalizeText(
      adminUid
    );

  const normalizedIds =
    Array.from(
      new Set(
        (
          Array.isArray(
            subtopicIds
          )
            ? subtopicIds
            : []
        )
          .map(normalizeText)
          .filter(Boolean)
      )
    );

  if (!safeAdminUid) {
    throw new Error(
      "Admin ID mancante."
    );
  }

  if (
    normalizedIds.length === 0
  ) {
    throw new Error(
      "Seleziona almeno un subtopic."
    );
  }

  const normalizedLevel =
    normalizeAccessLevel(
      accessLevel
    );

  const accessBatch =
    writeBatch(db);

  normalizedIds.forEach(
    (subtopicId) => {
      accessBatch.set(
        doc(
          db,
          ACCESS_COLLECTION,
          subtopicId
        ),
        {
          subtopicId,

          accessLevel:
            normalizedLevel,

          updatedBy:
            safeAdminUid,

          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );
    }
  );

  await accessBatch.commit();

  let synchronizedLessons = 0;

  for (
    const subtopicId of
    normalizedIds
  ) {
    synchronizedLessons +=
      await synchronizeSubtopicLessonsAccess({
        subtopicId,
        accessLevel:
          normalizedLevel,
        adminUid:
          safeAdminUid
      });
  }

  return {
    updated:
      normalizedIds.length,

    accessLevel:
      normalizedLevel,

    synchronizedLessons
  };
}

/*
 * একবারের migration:
 * সব existing theory lesson-এ accessLevel বসায়।
 *
 * Subtopic document না থাকলে Free।
 */
export async function synchronizeAllTheoryLessonAccess({
  adminUid
}) {
  const safeAdminUid =
    normalizeText(
      adminUid
    );

  if (!safeAdminUid) {
    throw new Error(
      "Admin ID mancante."
    );
  }

  const [
    accessMap,
    lessonSnapshot
  ] = await Promise.all([
    loadAllSubtopicAccess(),

    getDocs(
      collection(
        db,
        THEORY_COLLECTION
      )
    )
  ]);

  let updated = 0;

  for (
    let startIndex = 0;
    startIndex <
      lessonSnapshot.docs.length;
    startIndex += BATCH_LIMIT
  ) {
    const chunk =
      lessonSnapshot.docs.slice(
        startIndex,
        startIndex +
          BATCH_LIMIT
      );

    const batch =
      writeBatch(db);

    chunk.forEach(
      (lessonDocument) => {
        const lessonData =
          lessonDocument.data() ||
          {};

        const subtopicId =
          normalizeText(
            lessonData.subtopicId
          );

        const accessLevel =
          normalizeAccessLevel(
            accessMap.get(
              subtopicId
            )
          );

        batch.update(
          lessonDocument.ref,
          {
            accessLevel,

            accessUpdatedAt:
              serverTimestamp(),

            accessUpdatedBy:
              safeAdminUid
          }
        );
      }
    );

    await batch.commit();

    updated += chunk.length;
  }

  return {
    updated
  };
}

export function getSubtopicAccessLevel(
  accessMap,
  subtopicId
) {
  const safeSubtopicId =
    normalizeText(
      subtopicId
    );

  if (
    accessMap instanceof Map
  ) {
    return normalizeAccessLevel(
      accessMap.get(
        safeSubtopicId
      )
    );
  }

  return "free";
}

export function isPremiumSubtopic(
  accessMap,
  subtopicId
) {
  return (
    getSubtopicAccessLevel(
      accessMap,
      subtopicId
    ) === "premium"
  );
}

export async function verifySubtopicAccessForUser(
  user,
  subtopicId
) {
  const access =
    await loadSubtopicAccess(
      subtopicId
    );

  if (
    access.accessLevel !==
    "premium"
  ) {
    return {
      allowed: true,
      reason: "free",
      accessLevel: "free",
      subtopicId:
        access.subtopicId
    };
  }

  const premiumResult =
    await verifyAndBindPremiumDevice(
      user
    );

  return {
    ...premiumResult,
    accessLevel: "premium",
    subtopicId:
      access.subtopicId,

    message:
      premiumResult.allowed
        ? ""
        : getPremiumAccessMessage(
            premiumResult.reason
          )
  };
}
