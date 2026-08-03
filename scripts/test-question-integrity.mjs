import fs from "node:fs/promises";

import {
  processQuestionImport
} from "../src/services/questionIntegrityEngine.js";

const sourceUrl =
  new URL(
    "../src/data/question-integrity/block-11012.sample.json",
    import.meta.url
  );

const rawData =
  JSON.parse(
    await fs.readFile(
      sourceUrl,
      "utf8"
    )
  );

/*
 * Exact duplicate test:
 * same text + same answer + different source page.
 */
rawData.push({
  ...rawData[0],

  source: {
    ...rawData[0].source,
    sourcePage: 999
  }
});

/*
 * Similar কিন্তু exact নয়:
 * এটি কখনো merge/delete হবে না।
 */
rawData.push({
  ...rawData[0],

  officialText:
    "La carreggiata è una parte della strada",

  source: {
    ...rawData[0].source,
    officialOrder: 99
  }
});

const result =
  processQuestionImport(
    rawData
  );

console.log(
  JSON.stringify(
    result.summary,
    null,
    2
  )
);

await fs.writeFile(
  new URL(
    "../src/data/question-integrity/block-11012.processed.json",
    import.meta.url
  ),

  JSON.stringify(
    result.records,
    null,
    2
  ),

  "utf8"
);
