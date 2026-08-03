import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

const OFFICIAL_QUESTIONS_COLLECTION =
  "officialQuestions";

const KNOWLEDGE_CONCEPTS_COLLECTION =
  "knowledgeConcepts";

const KNOWLEDGE_LESSON_DRAFTS_COLLECTION =
  "knowledgeLessonDrafts";

function normalizeText(value) {
  return String(
    value ?? ""
  ).normalize("NFC").trim();
}

function slugify(value) {
  return normalizeText(
    value
  )
    .toLocaleLowerCase(
      "it-IT"
    )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

export async function verifyKnowledgeAdmin(
  user
) {
  if (!user?.uid) {
    throw new Error(
      "Utente non autenticato."
    );
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        "users",
        user.uid
      )
    );

  if (
    !snapshot.exists() ||
    snapshot.data()?.role !==
      "admin"
  ) {
    throw new Error(
      "Questa operazione è riservata agli amministratori."
    );
  }
}

function collectUnique(values) {
  return Array.from(
    new Set(
      values
        .map(normalizeText)
        .filter(Boolean)
    )
  );
}

function getQuestionConceptIds(
  question
) {
  const explicitConceptIds =
    Array.isArray(
      question.classification
        ?.conceptIds
    )
      ? question.classification
          .conceptIds
          .map(normalizeText)
          .filter(Boolean)
      : [];

  if (
    explicitConceptIds.length > 0
  ) {
    return explicitConceptIds;
  }

  const subtopicId =
    normalizeText(
      question.classification
        ?.subtopicId
    );

  if (subtopicId) {
    return [subtopicId];
  }

  const topicId =
    normalizeText(
      question.classification
        ?.topicId
    );

  return topicId
    ? [topicId]
    : [];
}

function getConceptTitle(
  conceptId
) {
  return normalizeText(
    conceptId
  )
    .split("-")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function buildConceptGroups(
  questions
) {
  const conceptMap =
    new Map();

  questions.forEach(
    (question) => {
      getQuestionConceptIds(
        question
      ).forEach(
        (conceptId) => {
          const current =
            conceptMap.get(
              conceptId
            ) || {
              conceptId,
              title:
                getConceptTitle(
                  conceptId
                ),
              argomentoId:
                normalizeText(
                  question.classification
                    ?.argomentoId
                ),
              topicId:
                normalizeText(
                  question.classification
                    ?.topicId
                ),
              subtopicId:
                normalizeText(
                  question.classification
                    ?.subtopicId
                ),
              officialQuestionIds: [],
              keywords: [],
              decisiveWords: [],
              commonMistakes: [],
              questionCount: 0
            };

          current
            .officialQuestionIds
            .push(
              question.id ||
              question.questionId
            );

          current
            .keywords
            .push(
              ...normalizeText(
                question.officialText
              )
                .toLocaleLowerCase(
                  "it-IT"
                )
                .split(
                  /[^a-zà-öø-ÿ0-9]+/giu
                )
                .filter(
                  (word) =>
                    word.length >= 4
                )
            );

          current
            .decisiveWords
            .push(
              ...(
                Array.isArray(
                  question.explanation
                    ?.decisiveWords
                )
                  ? question.explanation
                      .decisiveWords
                  : []
              )
            );

          const misconception =
            normalizeText(
              question.explanation
                ?.misconception
            );

          if (misconception) {
            current
              .commonMistakes
              .push(
                misconception
              );
          }

          current.questionCount +=
            1;

          conceptMap.set(
            conceptId,
            current
          );
        }
      );
    }
  );

  return Array.from(
    conceptMap.values()
  ).map(
    (concept) => ({
      ...concept,

      officialQuestionIds:
        collectUnique(
          concept
            .officialQuestionIds
        ),

      keywords:
        collectUnique(
          concept.keywords
        ).slice(
          0,
          30
        ),

      decisiveWords:
        collectUnique(
          concept.decisiveWords
        ),

      commonMistakes:
        collectUnique(
          concept.commonMistakes
        )
    })
  );
}

export async function loadApprovedOfficialQuestions(
  user
) {
  await verifyKnowledgeAdmin(
    user
  );

  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          OFFICIAL_QUESTIONS_COLLECTION
        ),
        where(
          "workflow.status",
          "==",
          "approved"
        )
      )
    );

  return snapshot.docs.map(
    (item) => ({
      id:
        item.id,

      ...(
        item.data() ||
        {}
      )
    })
  );
}

export async function rebuildKnowledgeConcepts(
  user
) {
  await verifyKnowledgeAdmin(
    user
  );

  const approvedQuestions =
    await loadApprovedOfficialQuestions(
      user
    );

  const concepts =
    buildConceptGroups(
      approvedQuestions
    );

  for (
    const concept
    of concepts
  ) {
    const conceptId =
      slugify(
        concept.conceptId
      );

    await setDoc(
      doc(
        db,
        KNOWLEDGE_CONCEPTS_COLLECTION,
        conceptId
      ),
      {
        ...concept,

        conceptId,

        lessonStatus:
          "draft",

        difficulty:
          Math.min(
            5,
            Math.max(
              1,
              Math.ceil(
                concept.questionCount /
                5
              )
            )
          ),

        updatedBy:
          user.uid,

        updatedAt:
          serverTimestamp(),

        createdBy:
          user.uid,

        createdAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    await setDoc(
      doc(
        db,
        KNOWLEDGE_LESSON_DRAFTS_COLLECTION,
        conceptId
      ),
      {
        draftId:
          conceptId,

        conceptId,

        title:
          concept.title,

        argomentoId:
          concept.argomentoId,

        topicId:
          concept.topicId,

        subtopicId:
          concept.subtopicId,

        summary:
          "",

        italianDraft:
          "",

        banglaDraft:
          "",

        exampleQuestions:
          concept.officialQuestionIds,

        decisiveWords:
          concept.decisiveWords,

        commonMistakes:
          concept.commonMistakes,

        status:
          "draft",

        updatedBy:
          user.uid,

        updatedAt:
          serverTimestamp(),

        createdBy:
          user.uid,

        createdAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );
  }

  return {
    approvedQuestions:
      approvedQuestions.length,

    conceptsCreated:
      concepts.length
  };
}

export async function loadKnowledgeConcepts(
  user
) {
  await verifyKnowledgeAdmin(
    user
  );

  const snapshot =
    await getDocs(
      collection(
        db,
        KNOWLEDGE_CONCEPTS_COLLECTION
      )
    );

  return snapshot.docs.map(
    (item) => ({
      id:
        item.id,

      ...(
        item.data() ||
        {}
      )
    })
  );
}

export async function loadKnowledgeConcept(
  user,
  conceptId
) {
  await verifyKnowledgeAdmin(
    user
  );

  const safeConceptId =
    slugify(
      conceptId
    );

  const snapshot =
    await getDoc(
      doc(
        db,
        KNOWLEDGE_CONCEPTS_COLLECTION,
        safeConceptId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id:
      snapshot.id,

    ...(
      snapshot.data() ||
      {}
    )
  };
}

export async function loadConceptQuestions(
  user,
  concept
) {
  await verifyKnowledgeAdmin(
    user
  );

  const ids =
    Array.isArray(
      concept?.officialQuestionIds
    )
      ? concept
          .officialQuestionIds
          .map(normalizeText)
          .filter(Boolean)
      : [];

  const questions = [];

  for (
    const questionId
    of ids
  ) {
    const snapshot =
      await getDoc(
        doc(
          db,
          OFFICIAL_QUESTIONS_COLLECTION,
          questionId
        )
      );

    if (snapshot.exists()) {
      questions.push({
        id:
          snapshot.id,

        ...(
          snapshot.data() ||
          {}
        )
      });
    }
  }

  return questions;
}

export async function loadKnowledgeLessonDraft(
  user,
  conceptId
) {
  await verifyKnowledgeAdmin(
    user
  );

  const safeConceptId =
    slugify(
      conceptId
    );

  const snapshot =
    await getDoc(
      doc(
        db,
        KNOWLEDGE_LESSON_DRAFTS_COLLECTION,
        safeConceptId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id:
      snapshot.id,

    ...(
      snapshot.data() ||
      {}
    )
  };
}
