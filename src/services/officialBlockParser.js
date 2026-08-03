/*
 * Official Block Parser — Phase 3
 *
 * OCR/PDF থেকে পাওয়া plain text-কে structured
 * question candidates-এ রূপান্তর করে।
 */

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeLine(value) {
  return normalizeText(value)
    .replace(/^[•·\-–—]+\s*/u, "")
    .trim();
}

function normalizeHeading(value) {
  return normalizeText(value)
    .toLocaleUpperCase("it-IT");
}

function extractBlockId(lines) {
  for (const line of lines) {
    const match =
      line.match(
        /\b(?:blocco|block)\s*:?\s*(\d{3,})\b/iu
      );

    if (match) {
      return match[1];
    }
  }

  return "";
}

function findSectionIndex(
  lines,
  sectionName
) {
  const normalizedSection =
    normalizeHeading(sectionName);

  return lines.findIndex(
    (line) =>
      normalizeHeading(line)
        .includes(normalizedSection)
  );
}

function parseNumberedQuestions(
  lines,
  answer
) {
  const questions = [];

  let currentQuestion = null;

  for (const rawLine of lines) {
    const line =
      normalizeLine(rawLine);

    if (!line) {
      continue;
    }

    const numberedMatch =
      line.match(
        /^(\d+)\s*[.)\-:•·]\s*(.+)$/u
      );

    if (numberedMatch) {
      if (currentQuestion) {
        questions.push(
          currentQuestion
        );
      }

      currentQuestion = {
        officialOrder:
          Number(
            numberedMatch[1]
          ),

        officialText:
          normalizeText(
            numberedMatch[2]
          ),

        correctAnswer:
          answer
      };

      continue;
    }

    if (currentQuestion) {
      currentQuestion.officialText =
        normalizeText(
          `${currentQuestion.officialText} ${line}`
        );
    }
  }

  if (currentQuestion) {
    questions.push(
      currentQuestion
    );
  }

  return questions.filter(
    (question) =>
      question.officialText
  );
}

function detectTopMetadata(
  lines,
  trueSectionIndex
) {
  const metadataLines =
    lines
      .slice(
        0,
        trueSectionIndex >= 0
          ? trueSectionIndex
          : lines.length
      )
      .map(normalizeLine)
      .filter(Boolean)
      .filter(
        (line) =>
          !/\bblocco\s*:/iu.test(
            line
          )
      );

  return {
    argomentoTitle:
      metadataLines[0] || "",

    topicTitle:
      metadataLines[1] || "",

    subtopicTitle:
      metadataLines.at(-1) || ""
  };
}

export function parseOfficialBlockText({
  rawText,
  sourceName = "",
  sourceVersion = "",
  sourcePage = null,
  argomentoId = "",
  topicId = "",
  subtopicId = "",
  extractionConfidence = 1
}) {
  const normalizedRawText =
    normalizeText(rawText);

  if (!normalizedRawText) {
    throw new Error(
      "Testo del blocco mancante."
    );
  }

  const lines =
    normalizedRawText
      .split("\n")
      .map(normalizeLine)
      .filter(Boolean);

  const trueSectionIndex =
    findSectionIndex(
      lines,
      "DOMANDE VERE"
    );

  const falseSectionIndex =
    findSectionIndex(
      lines,
      "DOMANDE FALSE"
    );

  if (trueSectionIndex < 0) {
    throw new Error(
      "Sezione DOMANDE VERE non trovata."
    );
  }

  if (falseSectionIndex < 0) {
    throw new Error(
      "Sezione DOMANDE FALSE non trovata."
    );
  }

  if (
    falseSectionIndex <=
    trueSectionIndex
  ) {
    throw new Error(
      "Ordine delle sezioni VERO/FALSO non valido."
    );
  }

  const officialBlockId =
    extractBlockId(
      lines
    );

  if (!officialBlockId) {
    throw new Error(
      "Numero di blocco non trovato."
    );
  }

  const metadata =
    detectTopMetadata(
      lines,
      trueSectionIndex
    );

  const trueQuestions =
    parseNumberedQuestions(
      lines.slice(
        trueSectionIndex + 1,
        falseSectionIndex
      ),
      true
    );

  const falseQuestions =
    parseNumberedQuestions(
      lines.slice(
        falseSectionIndex + 1
      ),
      false
    );

  if (
    trueQuestions.length === 0
  ) {
    throw new Error(
      "Nessuna domanda VERA trovata."
    );
  }

  if (
    falseQuestions.length === 0
  ) {
    throw new Error(
      "Nessuna domanda FALSA trovata."
    );
  }

  const confidence =
    Math.max(
      0,
      Math.min(
        1,
        Number(
          extractionConfidence
        ) || 0
      )
    );

  const buildCandidate = (
    question,
    group
  ) => ({
    officialText:
      question.officialText,

    correctAnswer:
      group === "VERO",

    officialGroup:
      group,

    source: {
      sourceType:
        "PDF_SCREENSHOT",

      sourceName:
        normalizeText(
          sourceName
        ),

      sourceVersion:
        normalizeText(
          sourceVersion
        ),

      sourcePage:
        Number(
          sourcePage
        ) || null,

      officialChapter:
        metadata.argomentoTitle,

      officialTopic:
        metadata.topicTitle,

      officialBlockId,

      officialGroup:
        group,

      officialOrder:
        question.officialOrder,

      argomentoId:
        normalizeText(
          argomentoId
        ),

      topicId:
        normalizeText(
          topicId
        ),

      subtopicId:
        normalizeText(
          subtopicId
        )
    },

    classification: {
      argomentoId:
        normalizeText(
          argomentoId
        ),

      topicId:
        normalizeText(
          topicId
        ),

      subtopicId:
        normalizeText(
          subtopicId
        ),

      conceptIds: []
    },

    explanation: {
      it: "",
      bn: "",
      decisiveWords: [],
      misconception: ""
    },

    workflow: {
      status:
        "pending_review",

      confidence,

      needsAdminApproval:
        true
    }
  });

  const candidates = [
    ...trueQuestions.map(
      (question) =>
        buildCandidate(
          question,
          "VERO"
        )
    ),

    ...falseQuestions.map(
      (question) =>
        buildCandidate(
          question,
          "FALSO"
        )
    )
  ];

  return {
    metadata: {
      argomentoTitle:
        metadata.argomentoTitle,

      topicTitle:
        metadata.topicTitle,

      subtopicTitle:
        metadata.subtopicTitle,

      officialBlockId,

      sourceName:
        normalizeText(
          sourceName
        ),

      sourceVersion:
        normalizeText(
          sourceVersion
        ),

      sourcePage:
        Number(
          sourcePage
        ) || null
    },

    summary: {
      trueQuestions:
        trueQuestions.length,

      falseQuestions:
        falseQuestions.length,

      totalQuestions:
        candidates.length
    },

    candidates
  };
}
