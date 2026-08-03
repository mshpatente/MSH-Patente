import fs from "node:fs/promises";

import {
  createQuestionImportPreview
} from "../src/services/questionImportPreviewService.js";

const questions =
  JSON.parse(
    await fs.readFile(
      new URL(
        "../src/data/question-integrity/block-11012.parsed.json",
        import.meta.url
      ),
      "utf8"
    )
  );

const preview =
  createQuestionImportPreview(
    questions
  );

console.log(
  JSON.stringify(
    preview.summary,
    null,
    2
  )
);

if (
  preview.summary.total !== 10
) {
  throw new Error(
    "Expected 10 questions."
  );
}

if (
  preview.summary.trueQuestions !== 5
) {
  throw new Error(
    "Expected 5 true questions."
  );
}

if (
  preview.summary.falseQuestions !== 5
) {
  throw new Error(
    "Expected 5 false questions."
  );
}

if (
  preview.summary.readyForImport !==
  true
) {
  throw new Error(
    "Preview is not ready for import."
  );
}
