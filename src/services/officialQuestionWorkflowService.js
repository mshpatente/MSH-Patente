import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

import {
  processQuestionImport
} from "./questionIntegrityEngine.js";

const OFFICIAL_QUESTIONS_COLLECTION =
  "officialQuestions";

const REVIEW_QUEUE_COLLECTION =
  "questionReviewQueue";

const IMPORT_BATCHES_COLLECTION =
  "questionImportBatches";

const LIVE_QUESTIONS_COLLECTION =
  "questions";

function normalizeText(value) {
  return String(
    value ?? ""
  ).normalize("NFC").trim();
}

function normalizeBoolean(value) {
  if (
    value === true ||
    value === "true" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0
  ) {
    return false;
  }

  return null;
}

function createImportBatchId() {
  const randomPart =
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `question-import-${randomPart}`;
}

async function verifyAdmin(user) {
  if (!user?.uid) {
    throw new Error(
      "Utente non autenticato."
    );
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
    throw new Error(
      "Profilo utente non trovato."
    );
  }

  const userData =
    userSnapshot.data() || {};

  if (
    userData.role !== "admin"
  ) {
    throw new Error(
      "Questa operazione è riservata agli amministratori."
    );
  }

  return userData;
}

function sourceLinkKey(source = {}) {
  return [
    normalizeText(
      source.sourceType
    ),

    normalizeText(
      source.sourceName
    ),

    normalizeText(
      source.sourceVersion
    ),

    Number(
      source.sourcePage
    ) || "",

    normalizeText(
      source.officialBlockId
    ),

    normalizeText(
      source.officialGroup
    ),

    Number(
      source.officialOrder
    ) || "",

    normalizeText(
      source.argomentoId
    ),

    normalizeText(
      source.topicId
    ),

    normalizeText(
      source.subtopicId
    )
  ].join("|");
}

function mergeSourceLinks(
  currentSources = [],
  incomingSources = []
) {
  const sourceMap =
    new Map();

  [
    ...(
      Array.isArray(
        currentSources
      )
        ? currentSources
        : []
    ),

    ...(
      Array.isArray(
        incomingSources
      )
        ? incomingSources
        : []
    )
  ].forEach(
    (source) => {
      sourceMap.set(
        sourceLinkKey(
          source
        ),
        source
      );
    }
  );

  return Array.from(
    sourceMap.values()
  );
}

function mergeConceptIds(
  currentIds = [],
  incomingIds = []
) {
  return Array.from(
    new Set([
      ...(
        Array.isArray(
          currentIds
        )
          ? currentIds
          : []
      ),

      ...(
        Array.isArray(
          incomingIds
        )
          ? incomingIds
          : []
      )
    ]
      .map(normalizeText)
      .filter(Boolean))
  );
}

function buildReviewQueuePayload(
  question,
  batchId,
  adminUid
) {
  return {
    questionId:
      question.questionId,

    exactKey:
      question.exactKey,

    officialText:
      question.officialText,

    correctAnswer:
      question.correctAnswer,

    sourceLinks:
      question.sourceLinks,

    classification:
      question.classification,

    explanation:
      question.explanation,

    workflow:
      question.workflow,

    importBatchId:
      batchId,

    status:
      question.workflow?.status ===
        "blocked_conflict"
        ? "blocked_conflict"
        : "pending_review",

    createdBy:
      adminUid,

    createdAt:
      serverTimestamp(),

    updatedBy:
      adminUid,

    updatedAt:
      serverTimestamp()
  };
}

/*
 * Phase 2:
 * একটি raw import batch Integrity Engine দিয়ে process করে
 * Firestore-এর admin-only staging collections-এ সংরক্ষণ করে।
 *
 * কোনো প্রশ্ন student-facing "questions" collection-এ
 * এই function থেকে publish হয় না।
 */
export async function importOfficialQuestionBatch({
  user,
  candidates,
  sourceName = "",
  sourceVersion = "",
  officialBlockId = "",
  notes = ""
}) {
  await verifyAdmin(user);

  const safeCandidates =
    Array.isArray(candidates)
      ? candidates
      : [];

  if (
    safeCandidates.length === 0
  ) {
    throw new Error(
      "Nessuna domanda da importare."
    );
  }

  const integrityResult =
    processQuestionImport(
      safeCandidates
    );

  const batchId =
    createImportBatchId();

  const batchReference =
    doc(
      db,
      IMPORT_BATCHES_COLLECTION,
      batchId
    );

  await setDoc(
    batchReference,
    {
      batchId,

      sourceName:
        normalizeText(
          sourceName
        ),

      sourceVersion:
        normalizeText(
          sourceVersion
        ),

      officialBlockId:
        normalizeText(
          officialBlockId
        ),

      notes:
        normalizeText(
          notes
        ),

      status:
        "processing",

      summary:
        integrityResult.summary,

      createdBy:
        user.uid,

      createdAt:
        serverTimestamp(),

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );

  const importResults = [];

  for (
    const incomingQuestion
    of integrityResult.records
  ) {
    const officialReference =
      doc(
        db,
        OFFICIAL_QUESTIONS_COLLECTION,
        incomingQuestion.questionId
      );

    const reviewReference =
      doc(
        db,
        REVIEW_QUEUE_COLLECTION,
        incomingQuestion.questionId
      );

    const transactionResult =
      await runTransaction(
        db,
        async (
          transaction
        ) => {
          const existingSnapshot =
            await transaction.get(
              officialReference
            );

          let finalQuestion =
            incomingQuestion;

          let resultStatus =
            "created";

          if (
            existingSnapshot.exists()
          ) {
            const existing =
              existingSnapshot.data() ||
              {};

            if (
              normalizeText(
                existing.exactKey
              ) !==
              normalizeText(
                incomingQuestion.exactKey
              )
            ) {
              throw new Error(
                `Question ID collision: ${incomingQuestion.questionId}`
              );
            }

            if (
              normalizeBoolean(
                existing.correctAnswer
              ) !==
              normalizeBoolean(
                incomingQuestion.correctAnswer
              )
            ) {
              finalQuestion = {
                ...existing,

                sourceLinks:
                  mergeSourceLinks(
                    existing.sourceLinks,
                    incomingQuestion.sourceLinks
                  ),

                workflow: {
                  ...(
                    existing.workflow ||
                    {}
                  ),

                  status:
                    "blocked_conflict",

                  needsAdminApproval:
                    true,

                  conflictReasons:
                    Array.from(
                      new Set([
                        ...(
                          existing.workflow
                            ?.conflictReasons ||
                          []
                        ),

                        "EXACT_TEXT_WITH_DIFFERENT_ANSWER"
                      ])
                    )
                },

                conflictingCandidate:
                  incomingQuestion
              };

              resultStatus =
                "blocked_conflict";
            } else {
              finalQuestion = {
                ...existing,

                sourceLinks:
                  mergeSourceLinks(
                    existing.sourceLinks,
                    incomingQuestion.sourceLinks
                  ),

                classification: {
                  ...(
                    existing.classification ||
                    {}
                  ),

                  conceptIds:
                    mergeConceptIds(
                      existing.classification
                        ?.conceptIds,

                      incomingQuestion
                        .classification
                        ?.conceptIds
                    )
                },

                workflow: {
                  ...(
                    existing.workflow ||
                    incomingQuestion.workflow
                  ),

                  needsAdminApproval:
                    existing.workflow
                      ?.status !== "approved"
                }
              };

              resultStatus =
                "exact_duplicate_merged";
            }
          }

          transaction.set(
            officialReference,
            {
              ...finalQuestion,

              lastImportBatchId:
                batchId,

              updatedBy:
                user.uid,

              updatedAt:
                serverTimestamp(),

              ...(
                existingSnapshot.exists()
                  ? {}
                  : {
                      createdBy:
                        user.uid,

                      createdAt:
                        serverTimestamp()
                    }
              )
            },
            {
              merge: true
            }
          );

          if (
            finalQuestion.workflow
              ?.status !== "approved"
          ) {
            transaction.set(
              reviewReference,

              buildReviewQueuePayload(
                finalQuestion,
                batchId,
                user.uid
              ),

              {
                merge: true
              }
            );
          }

          return {
            questionId:
              incomingQuestion.questionId,

            status:
              resultStatus
          };
        }
      );

    importResults.push(
      transactionResult
    );
  }

  const created =
    importResults.filter(
      (item) =>
        item.status === "created"
    ).length;

  const merged =
    importResults.filter(
      (item) =>
        item.status ===
        "exact_duplicate_merged"
    ).length;

  const blocked =
    importResults.filter(
      (item) =>
        item.status ===
        "blocked_conflict"
    ).length;

  await updateDoc(
    batchReference,
    {
      status:
        blocked > 0
          ? "completed_with_conflicts"
          : "completed",

      firestoreSummary: {
        created,
        exactDuplicatesMerged:
          merged,

        conflictsBlocked:
          blocked,

        totalProcessed:
          importResults.length
      },

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );

  return {
    batchId,

    integritySummary:
      integrityResult.summary,

    firestoreSummary: {
      created,

      exactDuplicatesMerged:
        merged,

      conflictsBlocked:
        blocked,

      totalProcessed:
        importResults.length
    },

    results:
      importResults
  };
}

export async function loadQuestionReviewQueue(
  user,
  status = ""
) {
  await verifyAdmin(user);

  const safeStatus =
    normalizeText(
      status
    );

  const queueQuery =
    safeStatus
      ? query(
          collection(
            db,
            REVIEW_QUEUE_COLLECTION
          ),
          where(
            "status",
            "==",
            safeStatus
          )
        )
      : query(
          collection(
            db,
            REVIEW_QUEUE_COLLECTION
          )
        );

  const snapshot =
    await getDocs(
      queueQuery
    );

  return snapshot.docs.map(
    (
      documentSnapshot
    ) => ({
      id:
        documentSnapshot.id,

      ...(
        documentSnapshot.data() ||
        {}
      )
    })
  );
}

export async function getOfficialQuestion(
  user,
  questionId
) {
  await verifyAdmin(user);

  const safeQuestionId =
    normalizeText(
      questionId
    );

  if (!safeQuestionId) {
    throw new Error(
      "Question ID mancante."
    );
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        OFFICIAL_QUESTIONS_COLLECTION,
        safeQuestionId
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

/*
 * Admin approval:
 * - canonical officialQuestions record approved হয়
 * - existing student-facing questions collection-এ
 *   draft অথবা published record তৈরি হয়
 * - review queue approved হয়
 */
export async function approveOfficialQuestion({
  user,
  questionId,
  explanationIt = "",
  explanationBn = "",
  decisiveWords = [],
  misconception = "",
  publish = false
}) {
  await verifyAdmin(user);

  const safeQuestionId =
    normalizeText(
      questionId
    );

  if (!safeQuestionId) {
    throw new Error(
      "Question ID mancante."
    );
  }

  const officialReference =
    doc(
      db,
      OFFICIAL_QUESTIONS_COLLECTION,
      safeQuestionId
    );

  const reviewReference =
    doc(
      db,
      REVIEW_QUEUE_COLLECTION,
      safeQuestionId
    );

  const liveQuestionReference =
    doc(
      db,
      LIVE_QUESTIONS_COLLECTION,
      safeQuestionId
    );

  await runTransaction(
    db,
    async (
      transaction
    ) => {
      const officialSnapshot =
        await transaction.get(
          officialReference
        );

      if (
        !officialSnapshot.exists()
      ) {
        throw new Error(
          "Domanda ufficiale non trovata."
        );
      }

      const officialQuestion =
        officialSnapshot.data() ||
        {};

      if (
        officialQuestion.workflow
          ?.status ===
        "blocked_conflict"
      ) {
        throw new Error(
          "Risolvi il conflitto prima dell'approvazione."
        );
      }

      const classification =
        officialQuestion.classification ||
        {};

      if (
        !normalizeText(
          classification.argomentoId
        ) ||
        !normalizeText(
          classification.topicId
        ) ||
        !normalizeText(
          classification.subtopicId
        )
      ) {
        throw new Error(
          "Classificazione incompleta: argomento, topic e subtopic sono obbligatori."
        );
      }

      const approvedExplanation = {
        it:
          normalizeText(
            explanationIt ||
            officialQuestion
              .explanation?.it
          ),

        bn:
          normalizeText(
            explanationBn ||
            officialQuestion
              .explanation?.bn
          ),

        decisiveWords:
          Array.from(
            new Set(
              (
                Array.isArray(
                  decisiveWords
                )
                  ? decisiveWords
                  : officialQuestion
                      .explanation
                      ?.decisiveWords ||
                    []
              )
                .map(normalizeText)
                .filter(Boolean)
            )
          ),

        misconception:
          normalizeText(
            misconception ||
            officialQuestion
              .explanation
              ?.misconception
          )
      };

      transaction.set(
        officialReference,
        {
          explanation:
            approvedExplanation,

          workflow: {
            ...(
              officialQuestion.workflow ||
              {}
            ),

            status:
              "approved",

            needsAdminApproval:
              false,

            approvedBy:
              user.uid,

            approvedAt:
              serverTimestamp()
          },

          updatedBy:
            user.uid,

          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

      transaction.set(
        liveQuestionReference,
        {
          officialQuestionId:
            safeQuestionId,

          officialText:
            normalizeText(
              officialQuestion
                .officialText
            ),

          question:
            normalizeText(
              officialQuestion
                .officialText
            ),

          answer:
            normalizeBoolean(
              officialQuestion
                .correctAnswer
            ),

          explanation:
            approvedExplanation.it,

          explanationBn:
            approvedExplanation.bn,

          decisiveWords:
            approvedExplanation
              .decisiveWords,

          misconception:
            approvedExplanation
              .misconception,

          argomentoId:
            normalizeText(
              classification.argomentoId
            ),

          topicId:
            normalizeText(
              classification.topicId
            ),

          subtopicId:
            normalizeText(
              classification.subtopicId
            ),

          lessonId:
            normalizeText(
              classification.lessonId
            ),

          sourceLinks:
            officialQuestion.sourceLinks ||
            [],

          status:
            publish
              ? "published"
              : "draft",

          published:
            publish === true,

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

      transaction.set(
        reviewReference,
        {
          status:
            "approved",

          approvedBy:
            user.uid,

          approvedAt:
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
    }
  );

  return {
    questionId:
      safeQuestionId,

    status:
      publish
        ? "published"
        : "draft"
  };
}

export async function rejectOfficialQuestion({
  user,
  questionId,
  reason
}) {
  await verifyAdmin(user);

  const safeQuestionId =
    normalizeText(
      questionId
    );

  const safeReason =
    normalizeText(
      reason
    );

  if (!safeQuestionId) {
    throw new Error(
      "Question ID mancante."
    );
  }

  if (!safeReason) {
    throw new Error(
      "Inserisci il motivo del rifiuto."
    );
  }

  await updateDoc(
    doc(
      db,
      REVIEW_QUEUE_COLLECTION,
      safeQuestionId
    ),
    {
      status:
        "rejected",

      rejectionReason:
        safeReason,

      rejectedBy:
        user.uid,

      rejectedAt:
        serverTimestamp(),

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );

  await updateDoc(
    doc(
      db,
      OFFICIAL_QUESTIONS_COLLECTION,
      safeQuestionId
    ),
    {
      workflow: {
        status:
          "rejected",

        needsAdminApproval:
          true,

        rejectionReason:
          safeReason,

        rejectedBy:
          user.uid,

        rejectedAt:
          serverTimestamp()
      },

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );
}
