/*
 * Question Integrity Engine - Phase 1
 *
 * নীতি:
 * - শুধু exact normalized text duplicate হিসেবে ধরা হবে।
 * - similarity কখনো delete করবে না।
 * - একই exact text একাধিক official block-এ থাকলে
 *   source association merge হবে।
 * - answer conflict হলে record block হবে।
 */

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\s*\n\s*/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeIdentifier(value) {
  return String(value ?? "")
    .normalize("NFC")
    .trim();
}

/*
 * Deliberately conservative:
 * punctuation, accents, case, apostrophes,
 * word order এবং negation অপরিবর্তিত থাকে।
 */
export function buildExactQuestionKey(text) {
  return normalizeText(text);
}

/*
 * Browser/Node উভয় জায়গায় dependency ছাড়া
 * deterministic key তৈরি করে।
 * এটি cryptographic security নয়;
 * Firestore document ID stability-এর জন্য।
 */
export function createStableQuestionId(text) {
  const value = buildExactQuestionKey(text);

  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `official-${(hash >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

export function normalizeOfficialSource(source = {}) {
  return {
    sourceType:
      normalizeIdentifier(source.sourceType) || "PDF",

    sourceName:
      normalizeIdentifier(source.sourceName),

    sourceVersion:
      normalizeIdentifier(source.sourceVersion),

    sourcePage:
      Number(source.sourcePage) || null,

    argomentoId:
      normalizeIdentifier(source.argomentoId),

    topicId:
      normalizeIdentifier(source.topicId),

    subtopicId:
      normalizeIdentifier(source.subtopicId),

    officialChapter:
      normalizeIdentifier(source.officialChapter),

    officialTopic:
      normalizeIdentifier(source.officialTopic),

    officialBlockId:
      normalizeIdentifier(source.officialBlockId),

    officialGroup:
      source.officialGroup === "FALSO"
        ? "FALSO"
        : "VERO",

    officialOrder:
      Math.max(1, Number(source.officialOrder) || 1)
  };
}

export function createQuestionCandidate(input = {}) {
  const officialText =
    buildExactQuestionKey(input.officialText);

  if (!officialText) {
    throw new Error("Official question text mancante.");
  }

  const correctAnswer =
    input.correctAnswer === false ||
    input.officialGroup === "FALSO"
      ? false
      : true;

  const source =
    normalizeOfficialSource({
      ...input.source,
      officialGroup:
        correctAnswer ? "VERO" : "FALSO"
    });

  return {
    questionId:
      createStableQuestionId(officialText),

    exactKey:
      officialText,

    officialText,

    correctAnswer,

    sourceLinks: [source],

    classification: {
      argomentoId:
        normalizeIdentifier(
          input.classification?.argomentoId ||
          source.argomentoId
        ),

      topicId:
        normalizeIdentifier(
          input.classification?.topicId ||
          source.topicId
        ),

      subtopicId:
        normalizeIdentifier(
          input.classification?.subtopicId ||
          source.subtopicId
        ),

      conceptIds:
        Array.from(
          new Set(
            (
              Array.isArray(
                input.classification?.conceptIds
              )
                ? input.classification.conceptIds
                : []
            )
              .map(normalizeIdentifier)
              .filter(Boolean)
          )
        )
    },

    explanation: {
      it:
        normalizeText(
          input.explanation?.it
        ),

      bn:
        normalizeText(
          input.explanation?.bn
        ),

      decisiveWords:
        Array.from(
          new Set(
            (
              Array.isArray(
                input.explanation?.decisiveWords
              )
                ? input.explanation.decisiveWords
                : []
            )
              .map(normalizeIdentifier)
              .filter(Boolean)
          )
        ),

      misconception:
        normalizeText(
          input.explanation?.misconception
        )
    },

    workflow: {
      status:
        input.workflow?.status ||
        "pending_review",

      confidence:
        Math.max(
          0,
          Math.min(
            1,
            Number(
              input.workflow?.confidence
            ) || 0
          )
        ),

      needsAdminApproval: true,

      conflictReasons: []
    }
  };
}

function sourceLinkKey(source) {
  return [
    source.sourceType,
    source.sourceName,
    source.sourceVersion,
    source.sourcePage,
    source.officialBlockId,
    source.officialGroup,
    source.officialOrder,
    source.argomentoId,
    source.topicId,
    source.subtopicId
  ].join("|");
}

function mergeUniqueSources(first = [], second = []) {
  const sourceMap = new Map();

  [...first, ...second].forEach((source) => {
    const normalized =
      normalizeOfficialSource(source);

    sourceMap.set(
      sourceLinkKey(normalized),
      normalized
    );
  });

  return Array.from(sourceMap.values());
}

/*
 * Exact duplicate merge:
 * exactKey একই এবং answer একই হলে merge।
 * answer ভিন্ন হলে delete/merge নয় - conflict।
 */
export function compareQuestionCandidates(
  existing,
  incoming
) {
  if (
    existing.exactKey !==
    incoming.exactKey
  ) {
    return {
      relation: "different",
      action: "keep_both"
    };
  }

  if (
    existing.correctAnswer !==
    incoming.correctAnswer
  ) {
    return {
      relation: "exact_text_answer_conflict",
      action: "block_for_admin_review"
    };
  }

  return {
    relation: "exact_duplicate",
    action: "merge_source_associations"
  };
}

export function mergeExactDuplicate(
  existing,
  incoming
) {
  const comparison =
    compareQuestionCandidates(
      existing,
      incoming
    );

  if (
    comparison.action ===
    "block_for_admin_review"
  ) {
    return {
      ...existing,

      workflow: {
        ...existing.workflow,

        status:
          "blocked_conflict",

        needsAdminApproval:
          true,

        conflictReasons:
          Array.from(
            new Set([
              ...(
                existing.workflow
                  ?.conflictReasons || []
              ),

              "EXACT_TEXT_WITH_DIFFERENT_ANSWER"
            ])
          )
      },

      conflictingCandidate:
        incoming
    };
  }

  if (
    comparison.action !==
    "merge_source_associations"
  ) {
    throw new Error(
      "Le domande non sono duplicati esatti."
    );
  }

  return {
    ...existing,

    sourceLinks:
      mergeUniqueSources(
        existing.sourceLinks,
        incoming.sourceLinks
      ),

    classification: {
      ...existing.classification,

      conceptIds:
        Array.from(
          new Set([
            ...(
              existing.classification
                ?.conceptIds || []
            ),

            ...(
              incoming.classification
                ?.conceptIds || []
            )
          ])
        )
    }
  };
}

/*
 * একটি import batch process করে।
 *
 * Return:
 * - records: unique exact questions
 * - exactDuplicatesMerged
 * - conflicts
 *
 * Similarity এখানে ব্যবহার করা হয় না।
 */
export function processQuestionImport(
  rawCandidates = []
) {
  const recordMap = new Map();
  const conflicts = [];

  let exactDuplicatesMerged = 0;

  rawCandidates.forEach(
    (rawCandidate) => {
      const candidate =
        createQuestionCandidate(
          rawCandidate
        );

      const existing =
        recordMap.get(
          candidate.exactKey
        );

      if (!existing) {
        recordMap.set(
          candidate.exactKey,
          candidate
        );

        return;
      }

      const comparison =
        compareQuestionCandidates(
          existing,
          candidate
        );

      if (
        comparison.action ===
        "merge_source_associations"
      ) {
        recordMap.set(
          candidate.exactKey,

          mergeExactDuplicate(
            existing,
            candidate
          )
        );

        exactDuplicatesMerged += 1;

        return;
      }

      if (
        comparison.action ===
        "block_for_admin_review"
      ) {
        conflicts.push({
          existing,
          incoming: candidate,
          reason:
            "EXACT_TEXT_WITH_DIFFERENT_ANSWER"
        });

        recordMap.set(
          candidate.exactKey,

          mergeExactDuplicate(
            existing,
            candidate
          )
        );
      }
    }
  );

  return {
    records:
      Array.from(
        recordMap.values()
      ),

    exactDuplicatesMerged,

    conflicts,

    summary: {
      importedCandidates:
        rawCandidates.length,

      uniqueExactQuestions:
        recordMap.size,

      exactDuplicatesMerged,

      conflicts:
        conflicts.length
    }
  };
}

/*
 * Similar question শুধু cluster/tag করবে।
 * এটি delete অথবা merge করার অনুমতি দেয় না।
 */
export function attachRelatedQuestions(
  question,
  relatedQuestionIds = []
) {
  return {
    ...question,

    relatedQuestionIds:
      Array.from(
        new Set(
          relatedQuestionIds
            .map(normalizeIdentifier)
            .filter(Boolean)
        )
      ),

    integrityPolicy: {
      similarityAction:
        "KEEP_BOTH",

      autoDeleteAllowed:
        false
    }
  };
}
