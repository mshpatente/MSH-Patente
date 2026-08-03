import fs from "node:fs/promises";

import {
  parseOfficialBlockText
} from "../src/services/officialBlockParser.js";

import {
  processQuestionImport
} from "../src/services/questionIntegrityEngine.js";

const rawText =
  await fs.readFile(
    new URL(
      "../src/data/question-integrity/block-11012.raw.txt",
      import.meta.url
    ),
    "utf8"
  );

const parsed =
  parseOfficialBlockText({
    rawText,

    sourceName:
      "Listato A e B",

    sourceVersion:
      "2025-02-27",

    sourcePage:
      10,

    argomentoId:
      "la-strada",

    topicId:
      "definizioni-stradali",

    subtopicId:
      "strada",

    extractionConfidence:
      1
  });

const integrityResult =
  processQuestionImport(
    parsed.candidates
  );

console.log(
  JSON.stringify(
    {
      metadata:
        parsed.metadata,

      parserSummary:
        parsed.summary,

      integritySummary:
        integrityResult.summary
    },
    null,
    2
  )
);

await fs.writeFile(
  new URL(
    "../src/data/question-integrity/block-11012.parsed.json",
    import.meta.url
  ),

  JSON.stringify(
    integrityResult.records,
    null,
    2
  ),

  "utf8"
);
