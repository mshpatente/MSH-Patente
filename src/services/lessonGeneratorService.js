import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

import {
  loadConceptQuestions,
  loadKnowledgeConcept,
  loadKnowledgeLessonDraft,
  verifyKnowledgeAdmin
} from "./knowledgeEngineService.js";

import {
  createTheoryLesson,
  getAdminTheoryLesson,
  updateTheoryLesson
} from "./adminTheoryService.js";

import {
  loadPublishedTheoryLessons
} from "./theoryLessonService.js";

const KNOWLEDGE_LESSON_DRAFTS_COLLECTION =
  "knowledgeLessonDrafts";

const KNOWLEDGE_LESSON_VERSIONS_COLLECTION =
  "knowledgeLessonVersions";

const KNOWLEDGE_CONCEPTS_COLLECTION =
  "knowledgeConcepts";

const THEORY_LESSONS_COLLECTION =
  "theoryLessons";

function normalizeText(value) {
  return String(
    value ?? ""
  ).normalize("NFC").trim();
}

function createVersionId(
  conceptId
) {
  const randomPart =
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `${conceptId}-${randomPart}`;
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

function buildItalianDraft({
  concept,
  questions
}) {
  const trueQuestions =
    questions.filter(
      (question) =>
        question.correctAnswer ===
        true
    );

  const falseQuestions =
    questions.filter(
      (question) =>
        question.correctAnswer ===
        false
    );

  const explanationLines =
    questions
      .map(
        (question) =>
          normalizeText(
            question.explanation
              ?.it
          )
      )
      .filter(Boolean);

  const mistakeLines =
    collectUnique([
      ...(
        concept.commonMistakes ||
        []
      ),

      ...questions.map(
        (question) =>
          question.explanation
            ?.misconception
      )
    ]);

  return [
    `# ${concept.title}`,
    "",
    "## Che cosa devi sapere",
    explanationLines.length > 0
      ? explanationLines
          .map(
            (line) =>
              `- ${line}`
          )
          .join("\n")
      : `Questo concetto è collegato a ${questions.length} domande ufficiali.`,
    "",
    "## Regole da ricordare",
    `- Domande vere collegate: ${trueQuestions.length}.`,
    `- Domande false collegate: ${falseQuestions.length}.`,
    "",
    "## Errori comuni",
    mistakeLines.length > 0
      ? mistakeLines
          .map(
            (line) =>
              `- ${line}`
          )
          .join("\n")
      : "- Nessun errore comune ancora registrato.",
    "",
    "## Domande ufficiali di riferimento",
    ...questions.map(
      (
        question,
        index
      ) =>
        `${index + 1}. ${normalizeText(
          question.officialText
        )} — ${
          question.correctAnswer ===
          true
            ? "VERO"
            : "FALSO"
        }`
    )
  ].join("\n");
}

function buildBanglaDraft({
  concept,
  questions
}) {
  const explanationLines =
    questions
      .map(
        (question) =>
          normalizeText(
            question.explanation
              ?.bn
          )
      )
      .filter(Boolean);

  return [
    `# ${concept.title}`,
    "",
    "## কী জানতে হবে",
    explanationLines.length > 0
      ? explanationLines
          .map(
            (line) =>
              `- ${line}`
          )
          .join("\n")
      : `এই ধারণার সঙ্গে ${questions.length}টি অফিসিয়াল প্রশ্ন যুক্ত আছে।`,
    "",
    "## মনে রাখার নিয়ম",
    `- অফিসিয়াল প্রশ্নের সংখ্যা: ${questions.length}`,
    "",
    "## পরীক্ষায় সতর্কতা",
    ...(
      Array.isArray(
        concept.commonMistakes
      ) &&
      concept.commonMistakes.length > 0
        ? concept.commonMistakes
            .map(
              (line) =>
                `- ${line}`
            )
        : [
            "- প্রশ্নের প্রতিটি শব্দ মনোযোগ দিয়ে পড়ুন।"
          ]
    )
  ].join("\n");
}

export async function generateLessonDraft({
  user,
  conceptId,
  regenerate = false
}) {
  await verifyKnowledgeAdmin(
    user
  );

  const concept =
    await loadKnowledgeConcept(
      user,
      conceptId
    );

  if (!concept) {
    throw new Error(
      "Concetto non trovato."
    );
  }

  const currentDraft =
    await loadKnowledgeLessonDraft(
      user,
      conceptId
    );

  if (
    currentDraft &&
    !regenerate &&
    (
      normalizeText(
        currentDraft.italianDraft
      ) ||
      normalizeText(
        currentDraft.banglaDraft
      )
    )
  ) {
    return currentDraft;
  }

  const questions =
    await loadConceptQuestions(
      user,
      concept
    );

  const summary =
    `${concept.title}: ${questions.length} domande ufficiali collegate.`;

  const italianDraft =
    buildItalianDraft({
      concept,
      questions
    });

  const banglaDraft =
    buildBanglaDraft({
      concept,
      questions
    });

  const payload = {
    draftId:
      concept.id,

    conceptId:
      concept.id,

    title:
      concept.title,

    argomentoId:
      concept.argomentoId || "",

    topicId:
      concept.topicId || "",

    subtopicId:
      concept.subtopicId || "",

    summary,

    italianDraft,

    banglaDraft,

    exampleQuestions:
      questions.map(
        (question) =>
          question.id
      ),

    decisiveWords:
      collectUnique([
        ...(
          concept.decisiveWords ||
          []
        ),

        ...questions.flatMap(
          (question) =>
            question.explanation
              ?.decisiveWords ||
            []
        )
      ]),

    commonMistakes:
      collectUnique([
        ...(
          concept.commonMistakes ||
          []
        ),

        ...questions.map(
          (question) =>
            question.explanation
              ?.misconception
        )
      ]),

    status:
      "draft",

    generatedBy:
      user.uid,

    generatedAt:
      serverTimestamp(),

    updatedBy:
      user.uid,

    updatedAt:
      serverTimestamp()
  };

  await setDoc(
    doc(
      db,
      KNOWLEDGE_LESSON_DRAFTS_COLLECTION,
      concept.id
    ),
    payload,
    {
      merge: true
    }
  );

  const conceptStatus =
    normalizeText(
      concept.lessonStatus
    ) ===
    "published"
      ? "updated"
      : "draft";

  await setDoc(
    doc(
      db,
      KNOWLEDGE_CONCEPTS_COLLECTION,
      concept.id
    ),
    {
      lessonStatus:
        conceptStatus,

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  return {
    ...payload,

    lessonStatus:
      conceptStatus
  };
}

export async function saveLessonVersion({
  user,
  conceptId,
  title,
  summary,
  italianDraft,
  banglaDraft
}) {
  await verifyKnowledgeAdmin(
    user
  );

  const safeConceptId =
    normalizeText(
      conceptId
    );

  if (!safeConceptId) {
    throw new Error(
      "Concept ID mancante."
    );
  }

  const safeItalianDraft =
    normalizeText(
      italianDraft
    );

  if (!safeItalianDraft) {
    throw new Error(
      "La bozza italiana è obbligatoria."
    );
  }

  const versionId =
    createVersionId(
      safeConceptId
    );

  const versionPayload = {
    versionId,

    conceptId:
      safeConceptId,

    title:
      normalizeText(
        title
      ),

    summary:
      normalizeText(
        summary
      ),

    italianDraft:
      safeItalianDraft,

    banglaDraft:
      normalizeText(
        banglaDraft
      ),

    status:
      "saved",

    createdBy:
      user.uid,

    createdAt:
      serverTimestamp()
  };

  await setDoc(
    doc(
      db,
      KNOWLEDGE_LESSON_VERSIONS_COLLECTION,
      versionId
    ),
    versionPayload
  );

  await setDoc(
    doc(
      db,
      KNOWLEDGE_LESSON_DRAFTS_COLLECTION,
      safeConceptId
    ),
    {
      ...versionPayload,

      draftId:
        safeConceptId,

      latestVersionId:
        versionId,

      status:
        "draft",

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  return {
    versionId
  };
}

export async function loadLessonVersions(
  user,
  conceptId
) {
  await verifyKnowledgeAdmin(
    user
  );

  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          KNOWLEDGE_LESSON_VERSIONS_COLLECTION
        ),
        where(
          "conceptId",
          "==",
          normalizeText(
            conceptId
          )
        )
      )
    );

  return snapshot.docs
    .map(
      (item) => ({
        id:
          item.id,

        ...(
          item.data() ||
          {}
        )
      })
    )
    .sort(
      (
        first,
        second
      ) =>
        (
          second.createdAt
            ?.toMillis?.() ||
          0
        ) -
        (
          first.createdAt
            ?.toMillis?.() ||
          0
        )
    );
}


function stripMarkdownHeading(value) {
  return normalizeText(
    value
  )
    .replace(
      /^#{1,6}\s+/gm,
      ""
    )
    .replace(
      /^\s*[-*]\s+/gm,
      "• "
    );
}

export function validateLessonForPublish({
  title,
  summary,
  italianDraft,
  banglaDraft,
  concept
}) {
  const errors = [];

  if (!normalizeText(title)) {
    errors.push(
      "Il titolo è obbligatorio."
    );
  }

  if (!normalizeText(summary)) {
    errors.push(
      "Il riassunto è obbligatorio."
    );
  }

  if (
    normalizeText(
      italianDraft
    ).length < 80
  ) {
    errors.push(
      "La bozza italiana deve contenere almeno 80 caratteri."
    );
  }

  if (
    !normalizeText(
      concept?.argomentoId
    )
  ) {
    errors.push(
      "Argomento mancante."
    );
  }

  if (
    !normalizeText(
      concept?.topicId
    )
  ) {
    errors.push(
      "Topic mancante."
    );
  }

  if (
    !normalizeText(
      concept?.subtopicId
    )
  ) {
    errors.push(
      "Subtopic mancante."
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,

    warnings:
      normalizeText(
        banglaDraft
      )
        ? []
        : [
            "La traduzione বাংলা è vuota."
          ]
  };
}

export async function publishLessonDraft({
  user,
  conceptId,
  title,
  summary,
  italianDraft,
  banglaDraft,
  versionId = ""
}) {
  await verifyKnowledgeAdmin(
    user
  );

  const concept =
    await loadKnowledgeConcept(
      user,
      conceptId
    );

  if (!concept) {
    throw new Error(
      "Concetto non trovato."
    );
  }

  const validation =
    validateLessonForPublish({
      title,
      summary,
      italianDraft,
      banglaDraft,
      concept
    });

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(" ")
    );
  }

  const questions =
    await loadConceptQuestions(
      user,
      concept
    );

  const lessonId =
    `knowledge-${normalizeText(
      concept.id ||
      concept.conceptId
    )}`;

  const lessonData = {
    id:
      lessonId,

    title:
      normalizeText(
        title
      ),

    slug:
      lessonId,

    argomentoId:
      normalizeText(
        concept.argomentoId
      ),

    topicId:
      normalizeText(
        concept.topicId
      ),

    subtopicId:
      normalizeText(
        concept.subtopicId
      ),

    order:
      1,

    estimatedMinutes:
      Math.max(
        3,
        Math.ceil(
          normalizeText(
            italianDraft
          ).length /
          900
        )
      ),

    status:
      "published",

    published:
      true,

    summary:
      normalizeText(
        summary
      ),

    theoryText:
      stripMarkdownHeading(
        italianDraft
      ),

    remember:
      (
        concept.decisiveWords ||
        []
      ).join(", "),

    commonMistake:
      (
        concept.commonMistakes ||
        []
      ).join(" "),

    sections: [
      {
        id:
          `${lessonId}-section-1`,

        order:
          1,

        title:
          normalizeText(
            title
          ),

        imageUrl:
          "",

        imageAlt:
          "",

        imageCaption:
          "",

        description:
          stripMarkdownHeading(
            italianDraft
          ),

        audioText:
          stripMarkdownHeading(
            italianDraft
          ),

        audioUrl:
          "",

        youtubeUrl:
          ""
      }
    ],

    lessonQuestions:
      questions.map(
        (
          question,
          index
        ) => ({
          id:
            question.id,

          question:
            normalizeText(
              question.officialText
            ),

          answer:
            question.correctAnswer ===
            true,

          explanation:
            normalizeText(
              question.explanation
                ?.it
            ),

          imageUrl:
            "",

          order:
            index + 1
        })
      ),

    translations: {
      bn: {
        title:
          normalizeText(
            title
          ),

        subtitle:
          normalizeText(
            summary
          ),

        summary:
          normalizeText(
            summary
          ),

        theoryText:
          stripMarkdownHeading(
            banglaDraft
          ),

        correctBehavior:
          "",

        remember:
          "",

        commonMistake:
          "",

        magicTrick:
          "",

        imageAlt:
          ""
      },

      en: {
        title:
          "",

        subtitle:
          "",

        summary:
          "",

        theoryText:
          "",

        correctBehavior:
          "",

        remember:
          "",

        commonMistake:
          "",

        magicTrick:
          "",

        imageAlt:
          ""
      }
    },

    knowledgeSource: {
      conceptId:
        normalizeText(
          concept.id ||
          concept.conceptId
        ),

      officialQuestionIds:
        questions.map(
          (question) =>
            question.id
        ),

      generatedFrom:
        "knowledge-engine",

      publishedBy:
        user.uid,

      publishedVersionId:
        normalizeText(
          versionId
        )
    }
  };

  const existingLesson =
    await getAdminTheoryLesson(
      user,
      lessonId
    );

  if (existingLesson) {
    await updateTheoryLesson(
      user,
      lessonId,
      lessonData
    );
  } else {
    await createTheoryLesson(
      user,
      lessonData
    );
  }

  const safeConceptId =
    normalizeText(
      concept.id ||
      concept.conceptId
    );

  await setDoc(
    doc(
      db,
      KNOWLEDGE_LESSON_DRAFTS_COLLECTION,
      safeConceptId
    ),
    {
      status:
        "published",

      publishedLessonId:
        lessonId,

      publishedVersionId:
        normalizeText(
          versionId
        ),

      publishedBy:
        user.uid,

      publishedAt:
        serverTimestamp(),

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  await setDoc(
    doc(
      db,
      KNOWLEDGE_CONCEPTS_COLLECTION,
      safeConceptId
    ),
    {
      lessonStatus:
        "published",

      publishedLessonId:
        lessonId,

      publishedVersionId:
        normalizeText(
          versionId
        ),

      publishedBy:
        user.uid,

      publishedAt:
        serverTimestamp(),

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  const versionsSnapshot =
    await getDocs(
      query(
        collection(
          db,
          KNOWLEDGE_LESSON_VERSIONS_COLLECTION
        ),
        where(
          "conceptId",
          "==",
          safeConceptId
        )
      )
    );

  const batch =
    writeBatch(
      db
    );

  versionsSnapshot.docs.forEach(
    (versionDocument) => {
      const isPublishedVersion =
        normalizeText(
          versionDocument.id
        ) ===
        normalizeText(
          versionId
        );

      batch.set(
        versionDocument.ref,
        {
          published:
            isPublishedVersion,

          status:
            isPublishedVersion
              ? "published"
              : (
                  versionDocument.data()
                    ?.status ===
                  "published"
                    ? "saved"
                    : (
                        versionDocument.data()
                          ?.status ||
                        "saved"
                      )
                ),

          publishedAt:
            isPublishedVersion
              ? serverTimestamp()
              : null,

          publishedBy:
            isPublishedVersion
              ? user.uid
              : ""
        },
        {
          merge: true
        }
      );
    }
  );

  await batch.commit();

  const studentLessons =
    await loadPublishedTheoryLessons(
      user
    );

  const verifiedLesson =
    studentLessons.find(
      (lesson) =>
        lesson.id ===
        lessonId &&
        lesson.published ===
        true
    );

  if (!verifiedLesson) {
    throw new Error(
      "La lezione è stata salvata, ma la verifica del lettore non è riuscita."
    );
  }

  return {
    lessonId,

    status:
      "published",

    questionCount:
      questions.length
  };
}


export async function publishLessonVersion({
  user,
  conceptId,
  versionId
}) {
  await verifyKnowledgeAdmin(
    user
  );

  const safeVersionId =
    normalizeText(
      versionId
    );

  if (!safeVersionId) {
    throw new Error(
      "Version ID mancante."
    );
  }

  const versionSnapshot =
    await getDoc(
      doc(
        db,
        KNOWLEDGE_LESSON_VERSIONS_COLLECTION,
        safeVersionId
      )
    );

  if (!versionSnapshot.exists()) {
    throw new Error(
      "Versione non trovata."
    );
  }

  const version =
    versionSnapshot.data() ||
    {};

  return publishLessonDraft({
    user,

    conceptId:
      normalizeText(
        conceptId ||
        version.conceptId
      ),

    title:
      version.title,

    summary:
      version.summary,

    italianDraft:
      version.italianDraft,

    banglaDraft:
      version.banglaDraft,

    versionId:
      safeVersionId
  });
}

export async function unpublishKnowledgeLesson({
  user,
  conceptId
}) {
  await verifyKnowledgeAdmin(
    user
  );

  const concept =
    await loadKnowledgeConcept(
      user,
      conceptId
    );

  if (!concept) {
    throw new Error(
      "Concetto non trovato."
    );
  }

  const safeConceptId =
    normalizeText(
      concept.id ||
      concept.conceptId
    );

  const lessonId =
    normalizeText(
      concept.publishedLessonId
    ) ||
    `knowledge-${safeConceptId}`;

  const existingLesson =
    await getAdminTheoryLesson(
      user,
      lessonId
    );

  if (existingLesson) {
    await updateTheoryLesson(
      user,
      lessonId,
      {
        ...existingLesson,

        status:
          "draft",

        published:
          false
      }
    );
  }

  await setDoc(
    doc(
      db,
      KNOWLEDGE_CONCEPTS_COLLECTION,
      safeConceptId
    ),
    {
      lessonStatus:
        "draft",

      publishedVersionId:
        "",

      unpublishedBy:
        user.uid,

      unpublishedAt:
        serverTimestamp(),

      updatedBy:
        user.uid,

      updatedAt:
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
      safeConceptId
    ),
    {
      status:
        "draft",

      publishedVersionId:
        "",

      unpublishedBy:
        user.uid,

      unpublishedAt:
        serverTimestamp(),

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );

  const versionsSnapshot =
    await getDocs(
      query(
        collection(
          db,
          KNOWLEDGE_LESSON_VERSIONS_COLLECTION
        ),
        where(
          "conceptId",
          "==",
          safeConceptId
        )
      )
    );

  const batch =
    writeBatch(
      db
    );

  versionsSnapshot.docs.forEach(
    (versionDocument) => {
      batch.set(
        versionDocument.ref,
        {
          published:
            false,

          status:
            versionDocument.data()
              ?.status ===
            "published"
              ? "saved"
              : (
                  versionDocument.data()
                    ?.status ||
                  "saved"
                )
        },
        {
          merge: true
        }
      );
    }
  );

  await batch.commit();

  return {
    lessonId,

    status:
      "draft"
  };
}
