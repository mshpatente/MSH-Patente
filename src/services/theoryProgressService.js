import {
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

const THEORY_COMPLETION_XP = 10;

function getValidUserId(user) {
  return String(
    user?.uid || ""
  ).trim();
}

function getTheoryProgressKey(userId) {
  return `msh-theory-progress-${userId}`;
}

function normalizeLessonId(value) {
  return String(value || "").trim();
}

function loadLegacyTheoryProgress(userId) {
  try {
    const storedValue =
      localStorage.getItem(
        getTheoryProgressKey(userId)
      );

    if (!storedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(storedValue);

    if (
      !Array.isArray(
        parsedValue?.completedLessonIds
      )
    ) {
      return [];
    }

    return [
      ...new Set(
        parsedValue.completedLessonIds
          .map(normalizeLessonId)
          .filter(Boolean)
      )
    ];
  } catch (error) {
    console.error(
      "Legacy theory progress reading error:",
      error
    );

    return [];
  }
}

function removeLegacyTheoryProgress(userId) {
  try {
    localStorage.removeItem(
      getTheoryProgressKey(userId)
    );
  } catch (error) {
    console.warn(
      "Legacy theory progress cleanup error:",
      error
    );
  }
}

async function migrateLegacyTheoryProgress(
  userId
) {
  const legacyLessonIds =
    loadLegacyTheoryProgress(userId);

  if (legacyLessonIds.length === 0) {
    return;
  }

  const progressCollection =
    collection(
      db,
      "users",
      userId,
      "theoryProgress"
    );

  const currentSnapshot =
    await getDocs(progressCollection);

  const existingLessonIds =
    new Set(
      currentSnapshot.docs.map(
        (progressDocument) =>
          normalizeLessonId(
            progressDocument.data()
              ?.lessonId ||
            progressDocument.id
          )
      )
    );

  const lessonIdsToMigrate =
    legacyLessonIds.filter(
      (lessonId) =>
        !existingLessonIds.has(lessonId)
    );

  if (lessonIdsToMigrate.length > 0) {
    const batch = writeBatch(db);

    lessonIdsToMigrate.forEach(
      (lessonId) => {
        batch.set(
          doc(
            progressCollection,
            lessonId
          ),
          {
            lessonId,
            completed: true,
            migratedFromLocalStorage: true,
            completedAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp()
          },
          {
            merge: true
          }
        );
      }
    );

    await batch.commit();
  }

  removeLegacyTheoryProgress(userId);
}

export async function loadTheoryProgress(
  user
) {
  const userId =
    getValidUserId(user);

  if (!userId) {
    return {
      completedLessonIds: []
    };
  }

  const legacyLessonIds =
    loadLegacyTheoryProgress(userId);

  try {
    await migrateLegacyTheoryProgress(
      userId
    );

    const progressSnapshot =
      await getDocs(
        collection(
          db,
          "users",
          userId,
          "theoryProgress"
        )
      );

    const completedLessonIds =
      progressSnapshot.docs
        .filter(
          (progressDocument) =>
            progressDocument.data()
              ?.completed === true
        )
        .map(
          (progressDocument) =>
            normalizeLessonId(
              progressDocument.data()
                ?.lessonId ||
              progressDocument.id
            )
        )
        .filter(Boolean);

    return {
      completedLessonIds: [
        ...new Set(completedLessonIds)
      ]
    };
  } catch (error) {
    console.error(
      "Theory progress loading error:",
      error
    );

    return {
      completedLessonIds:
        legacyLessonIds
    };
  }
}

export async function markTheoryLessonCompleted({
  user,
  lesson
}) {
  const userId =
    getValidUserId(user);

  const lessonId =
    normalizeLessonId(lesson?.id);

  if (!userId) {
    throw new Error(
      "Utente non autenticato."
    );
  }

  if (!lessonId) {
    throw new Error(
      "Lezione non valida."
    );
  }

  const progressReference =
    doc(
      db,
      "users",
      userId,
      "theoryProgress",
      lessonId
    );

  const userReference =
    doc(
      db,
      "users",
      userId
    );

  return runTransaction(
    db,
    async (transaction) => {
      const progressSnapshot =
        await transaction.get(
          progressReference
        );

      const alreadyCompleted =
        progressSnapshot.exists() &&
        progressSnapshot.data()
          ?.completed === true;

      transaction.set(
        progressReference,
        {
          lessonId,

          lessonTitle:
            String(
              lesson?.title || ""
            ).trim(),

          topicId:
            String(
              lesson?.topicId || ""
            ).trim(),

          argomentoId:
            String(
              lesson?.argomentoId || ""
            ).trim(),

          completed: true,

          completedAt:
            alreadyCompleted
              ? (
                  progressSnapshot.data()
                    ?.completedAt ||
                  serverTimestamp()
                )
              : serverTimestamp(),

          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

      const userUpdate = {
        lastTheoryLessonId:
          lessonId,

        lastTheoryTopicId:
          String(
            lesson?.topicId || ""
          ).trim(),

        lastTheoryArgomentoId:
          String(
            lesson?.argomentoId || ""
          ).trim(),

        lastTheoryActivityAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      };

      if (!alreadyCompleted) {
        userUpdate.xp =
          increment(
            THEORY_COMPLETION_XP
          );
      }

      transaction.set(
        userReference,
        userUpdate,
        {
          merge: true
        }
      );

      return {
        lessonId,
        completed: true,
        alreadyCompleted,
        xpAwarded:
          !alreadyCompleted
      };
    }
  );
}

export async function saveLastOpenedTheoryLesson(
  user,
  lesson
) {
  const userId =
    getValidUserId(user);

  const lessonId =
    normalizeLessonId(lesson?.id);

  if (!userId || !lessonId) {
    return;
  }

  await setDoc(
    doc(
      db,
      "users",
      userId
    ),
    {
      lastTheoryLessonId:
        lessonId,

      lastTheoryTopicId:
        String(
          lesson?.topicId || ""
        ).trim(),

      lastTheoryArgomentoId:
        String(
          lesson?.argomentoId || ""
        ).trim(),

      lastTheoryActivityAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );
}