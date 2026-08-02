import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

import {
  auth,
  db
} from "../firebase.js";

import {
  lessons
} from "../data/lessons.js";

import {
  getLessonSections
} from "../utils/lessonSections.js";

import {
  evaluatePremiumAccess,
  verifyAndBindPremiumDevice
} from "./premiumAccessService.js";

function normalizeAccessLevel(
  value
) {
  return value === "premium"
    ? "premium"
    : "free";
}

export function normalizeTheoryLesson(
  lessonData = {},
  documentId = ""
) {
  const storedContent =
    Array.isArray(
      lessonData.content
    )
      ? lessonData.content
      : [];

  const legacyContent = [];

  const theoryText =
    String(
      lessonData.theoryText ||
      ""
    ).trim();

  const correctBehavior =
    String(
      lessonData.correctBehavior ||
      ""
    ).trim();

  const remember =
    String(
      lessonData.remember ||
      ""
    ).trim();

  const commonMistake =
    String(
      lessonData.commonMistake ||
      ""
    ).trim();

  if (
    storedContent.length === 0 &&
    theoryText
  ) {
    legacyContent.push({
      type: "paragraph",
      text: theoryText
    });
  }

  if (
    storedContent.length === 0 &&
    remember
  ) {
    legacyContent.push({
      type: "important",
      title: "Da ricordare",
      text: remember
    });
  }

  if (
    storedContent.length === 0 &&
    correctBehavior
  ) {
    legacyContent.push({
      type: "important",
      title:
        "Comportamento corretto",
      text: correctBehavior
    });
  }

  if (
    storedContent.length === 0 &&
    commonMistake
  ) {
    legacyContent.push({
      type: "warning",
      title: "Errore comune",
      text: commonMistake
    });
  }

  const rawContent =
    storedContent.length > 0
      ? storedContent
      : legacyContent;

  const sections =
    getLessonSections(
      lessonData
    );

  const firstSection =
    sections[0] || null;

  return {
    id:
      String(
        lessonData.id ||
        documentId
      ).trim(),

    argomentoId:
      String(
        lessonData.argomentoId ||
        ""
      ).trim(),

    topicId:
      String(
        lessonData.topicId ||
        ""
      ).trim(),

    subtopicId:
      String(
        lessonData.subtopicId ||
        ""
      ).trim(),

    accessLevel:
      normalizeAccessLevel(
        lessonData.accessLevel
      ),

    title:
      String(
        lessonData.title ||
        ""
      ).trim(),

    subtitle:
      String(
        lessonData.subtitle ||
        lessonData.summary ||
        ""
      ).trim(),

    summary:
      String(
        lessonData.summary ||
        lessonData.subtitle ||
        ""
      ).trim(),

    sections,

    sectionCount:
      sections.length,

    imageUrl:
      String(
        lessonData.imageUrl ||
        firstSection?.imageUrl ||
        ""
      ).trim(),

    imageAlt:
      String(
        lessonData.imageAlt ||
        firstSection?.imageAlt ||
        ""
      ).trim(),

    imageCaption:
      String(
        lessonData.imageCaption ||
        firstSection
          ?.imageCaption ||
        ""
      ).trim(),

    audioUrl:
      String(
        lessonData.audioUrl ||
        ""
      ).trim(),

    youtubeUrl:
      String(
        lessonData.youtubeUrl ||
        ""
      ).trim(),

    content:
      rawContent.filter(
        (block) =>
          block &&
          typeof block ===
            "object"
      ),

    theoryText,

    correctBehavior,

    remember,

    commonMistake,

    magicTrick:
      String(
        lessonData.magicTrick ||
        ""
      ).trim(),

    order:
      Number(
        lessonData.order
      ) || 0,

    estimatedMinutes:
      Number(
        lessonData
          .estimatedMinutes
      ) || 0,

    status:
      String(
        lessonData.status ||
        ""
      ).trim(),

    published:
      lessonData.published ===
        true ||
      lessonData.status ===
        "published",

    schemaVersion:
      Number(
        lessonData.schemaVersion
      ) || 1
  };
}

export function getFallbackTheoryLessons() {
  return lessons
    .map((lesson) =>
      normalizeTheoryLesson(
        lesson,
        lesson.id
      )
    )
    .filter(
      (lesson) =>
        lesson.id &&
        lesson.argomentoId &&
        lesson.topicId &&
        lesson.subtopicId &&
        lesson.published === true
    )
    .sort(
      (first, second) =>
        first.order - second.order
    );
}

async function getReaderAccessState(
  user
) {
  if (!user?.uid) {
    return {
      role: "guest",
      premiumAllowed: false
    };
  }

  const userSnapshot =
    await getDoc(
      doc(
        db,
        "users",
        user.uid
      )
    );

  if (!userSnapshot.exists()) {
    return {
      role: "student",
      premiumAllowed: false
    };
  }

  const userData =
    userSnapshot.data() || {};

  if (
    userData.role === "admin"
  ) {
    return {
      role: "admin",
      premiumAllowed: true
    };
  }

  const premiumState =
    evaluatePremiumAccess(
      userData
    );

  if (
    premiumState.allowed !== true
  ) {
    return {
      role: "student",
      premiumAllowed: false
    };
  }

  /*
   * App-level single-device protection:
   * অন্য device হলে Premium documents
   * query করা হবে না।
   */
  const deviceResult =
    await verifyAndBindPremiumDevice(
      user
    );

  return {
    role: "student",
    premiumAllowed:
      deviceResult.allowed === true
  };
}

async function loadPublishedLessonsByAccess(
  accessLevel
) {
  const lessonsQuery =
    query(
      collection(
        db,
        "theoryLessons"
      ),
      where(
        "status",
        "==",
        "published"
      ),
      where(
        "accessLevel",
        "==",
        normalizeAccessLevel(
          accessLevel
        )
      )
    );

  const snapshot =
    await getDocs(
      lessonsQuery
    );

  return snapshot.docs.map(
    (lessonDocument) =>
      normalizeTheoryLesson(
        lessonDocument.data(),
        lessonDocument.id
      )
  );
}

export async function loadPublishedTheoryLessons(
  user = auth.currentUser
) {
  try {
    const accessState =
      await getReaderAccessState(
        user
      );

    let firestoreLessons = [];

    if (
      accessState.role === "admin"
    ) {
      const adminQuery =
        query(
          collection(
            db,
            "theoryLessons"
          ),
          where(
            "status",
            "==",
            "published"
          )
        );

      const adminSnapshot =
        await getDocs(
          adminQuery
        );

      firestoreLessons =
        adminSnapshot.docs.map(
          (lessonDocument) => ({
            documentId:
              lessonDocument.id,

            raw:
              lessonDocument.data(),

            normalized:
              normalizeTheoryLesson(
                lessonDocument.data(),
                lessonDocument.id
              )
          })
        );
    } else {
      const freeLessons =
        await loadPublishedLessonsByAccess(
          "free"
        );

      const premiumLessons =
        accessState.premiumAllowed
          ? await loadPublishedLessonsByAccess(
              "premium"
            )
          : [];

      firestoreLessons = [
        ...freeLessons,
        ...premiumLessons
      ].map(
        (lesson) => ({
          documentId:
            lesson.id,

          raw: lesson,

          normalized:
            lesson
        })
      );
    }

    const normalizedLessons =
      firestoreLessons
        .map(
          (item) =>
            item.normalized
        )
        .filter(
          (lesson) => {
            const valid =
              Boolean(
                lesson.id &&
                lesson.argomentoId &&
                lesson.topicId &&
                lesson.subtopicId &&
                lesson.title &&
                lesson.published ===
                  true
              );

            if (!valid) {
              console.warn(
                "Lesson excluded:",
                lesson
              );
            }

            return valid;
          }
        )
        .sort(
          (first, second) =>
            first.order -
            second.order
        );

    if (
      normalizedLessons.length > 0
    ) {
      return normalizedLessons;
    }

    console.warn(
      "Nessuna lezione pubblicata accessibile in Firestore. Uso il fallback locale."
    );

    return getFallbackTheoryLessons()
      .filter(
        (lesson) =>
          lesson.accessLevel ===
          "free"
      );
  } catch (error) {
    console.error(
      "Firestore theory lessons loading error:",
      error
    );

    return getFallbackTheoryLessons()
      .filter(
        (lesson) =>
          lesson.accessLevel ===
          "free"
      );
  }
}
