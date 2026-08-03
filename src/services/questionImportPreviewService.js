/*
 * Question Import Preview Service — Phase 4A
 *
 * Parser output Firestore-এ পাঠানোর আগে
 * validation + human-readable preview তৈরি করে।
 *
 * এই service কোনো database write করে না।
 */

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .trim();
}

function escapeHtml(value) {
  return normalizeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getPrimarySource(question = {}) {
  return (
    Array.isArray(
      question.sourceLinks
    )
      ? question.sourceLinks[0]
      : null
  ) || {};
}

function validateQuestion(
  question,
  index
) {
  const errors = [];
  const warnings = [];

  const officialText =
    normalizeText(
      question?.officialText
    );

  const answer =
    question?.correctAnswer;

  const source =
    getPrimarySource(
      question
    );

  const classification =
    question?.classification || {};

  if (!officialText) {
    errors.push(
      "Testo ufficiale mancante."
    );
  }

  if (
    answer !== true &&
    answer !== false
  ) {
    errors.push(
      "Risposta Vero/Falso non valida."
    );
  }

  if (
    !normalizeText(
      source.officialBlockId
    )
  ) {
    errors.push(
      "Blocco ufficiale mancante."
    );
  }

  if (
    !Number.isInteger(
      Number(
        source.officialOrder
      )
    ) ||
    Number(
      source.officialOrder
    ) < 1
  ) {
    errors.push(
      "Ordine ufficiale non valido."
    );
  }

  if (
    !normalizeText(
      classification.argomentoId
    )
  ) {
    warnings.push(
      "Argomento ID mancante."
    );
  }

  if (
    !normalizeText(
      classification.topicId
    )
  ) {
    warnings.push(
      "Topic ID mancante."
    );
  }

  if (
    !normalizeText(
      classification.subtopicId
    )
  ) {
    warnings.push(
      "Subtopic ID mancante."
    );
  }

  const confidence =
    Number(
      question?.workflow
        ?.confidence
    );

  if (
    !Number.isFinite(
      confidence
    )
  ) {
    warnings.push(
      "Confidence non disponibile."
    );
  } else if (
    confidence < 0.98
  ) {
    warnings.push(
      `Confidence bassa: ${Math.round(
        confidence * 100
      )}%`
    );
  }

  return {
    index,
    question,
    errors,
    warnings,
    valid:
      errors.length === 0
  };
}

export function createQuestionImportPreview(
  questions = []
) {
  const safeQuestions =
    Array.isArray(
      questions
    )
      ? questions
      : [];

  const items =
    safeQuestions.map(
      (
        question,
        index
      ) =>
        validateQuestion(
          question,
          index
        )
    );

  const validItems =
    items.filter(
      (item) =>
        item.valid
    );

  const invalidItems =
    items.filter(
      (item) =>
        !item.valid
    );

  const warningItems =
    items.filter(
      (item) =>
        item.warnings.length > 0
    );

  const trueQuestions =
    items.filter(
      (item) =>
        item.question
          ?.correctAnswer === true
    ).length;

  const falseQuestions =
    items.filter(
      (item) =>
        item.question
          ?.correctAnswer === false
    ).length;

  const blockIds =
    Array.from(
      new Set(
        items
          .map(
            (item) =>
              normalizeText(
                getPrimarySource(
                  item.question
                ).officialBlockId
              )
          )
          .filter(Boolean)
      )
    );

  const exactKeys =
    new Map();

  const duplicateIndexes = [];

  items.forEach(
    (
      item,
      index
    ) => {
      const exactKey =
        normalizeText(
          item.question
            ?.exactKey ||
          item.question
            ?.officialText
        );

      if (!exactKey) {
        return;
      }

      if (
        exactKeys.has(
          exactKey
        )
      ) {
        duplicateIndexes.push({
          firstIndex:
            exactKeys.get(
              exactKey
            ),

          duplicateIndex:
            index,

          exactKey
        });
      } else {
        exactKeys.set(
          exactKey,
          index
        );
      }
    }
  );

  return {
    items,

    summary: {
      total:
        items.length,

      valid:
        validItems.length,

      invalid:
        invalidItems.length,

      warnings:
        warningItems.length,

      trueQuestions,

      falseQuestions,

      blockIds,

      exactDuplicatesInsidePreview:
        duplicateIndexes.length,

      readyForImport:
        items.length > 0 &&
        invalidItems.length === 0 &&
        duplicateIndexes.length === 0
    },

    duplicateIndexes
  };
}

function renderMessageList(
  messages,
  className
) {
  if (
    !Array.isArray(
      messages
    ) ||
    messages.length === 0
  ) {
    return "";
  }

  return `
    <ul class="${className}">
      ${messages
        .map(
          (message) => `
            <li>
              ${escapeHtml(
                message
              )}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

export function renderQuestionImportPreview({
  container,
  questions,
  onApprove,
  onReject
}) {
  if (!container) {
    throw new Error(
      "Preview container mancante."
    );
  }

  const preview =
    createQuestionImportPreview(
      questions
    );

  const {
    summary
  } = preview;

  container.innerHTML = `
    <section class="question-import-preview">
      <header class="question-import-preview-header">
        <div>
          <p class="eyebrow">
            QUESTION INTEGRITY ENGINE
          </p>

          <h2>
            Anteprima importazione
          </h2>

          <p>
            Controlla tutte le domande prima
            di inviarle alla coda di revisione.
          </p>
        </div>

        <span
          class="
            question-import-ready-badge
            ${
              summary.readyForImport
                ? "is-ready"
                : "is-blocked"
            }
          "
        >
          ${
            summary.readyForImport
              ? "Pronto"
              : "Bloccato"
          }
        </span>
      </header>

      <section class="question-import-summary">
        <article>
          <strong>
            ${summary.total}
          </strong>
          <span>Totale</span>
        </article>

        <article>
          <strong>
            ${summary.trueQuestions}
          </strong>
          <span>Vero</span>
        </article>

        <article>
          <strong>
            ${summary.falseQuestions}
          </strong>
          <span>Falso</span>
        </article>

        <article>
          <strong>
            ${summary.invalid}
          </strong>
          <span>Errori</span>
        </article>

        <article>
          <strong>
            ${summary.warnings}
          </strong>
          <span>Avvisi</span>
        </article>
      </section>

      <div class="question-import-block-info">
        <strong>Blocchi:</strong>
        ${escapeHtml(
          summary.blockIds.join(", ") ||
          "Non disponibile"
        )}
      </div>

      <section class="question-import-list">
        ${preview.items
          .map(
            (
              item,
              index
            ) => {
              const question =
                item.question || {};

              const source =
                getPrimarySource(
                  question
                );

              const classification =
                question.classification ||
                {};

              return `
                <article
                  class="
                    question-import-item
                    ${
                      item.valid
                        ? ""
                        : "has-error"
                    }
                  "
                >
                  <header>
                    <span class="question-import-number">
                      ${
                        Number(
                          source.officialOrder
                        ) ||
                        index + 1
                      }
                    </span>

                    <div>
                      <strong>
                        ${
                          question.correctAnswer ===
                          true
                            ? "VERO"
                            : "FALSO"
                        }
                      </strong>

                      <small>
                        Blocco
                        ${escapeHtml(
                          source.officialBlockId
                        )}
                      </small>
                    </div>
                  </header>

                  <p class="question-import-text">
                    ${escapeHtml(
                      question.officialText
                    )}
                  </p>

                  <dl class="question-import-classification">
                    <div>
                      <dt>Argomento</dt>
                      <dd>
                        ${escapeHtml(
                          classification
                            .argomentoId ||
                          "—"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Topic</dt>
                      <dd>
                        ${escapeHtml(
                          classification
                            .topicId ||
                          "—"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Subtopic</dt>
                      <dd>
                        ${escapeHtml(
                          classification
                            .subtopicId ||
                          "—"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Confidence</dt>
                      <dd>
                        ${
                          Number.isFinite(
                            Number(
                              question.workflow
                                ?.confidence
                            )
                          )
                            ? `${Math.round(
                                Number(
                                  question.workflow
                                    ?.confidence
                                ) * 100
                              )}%`
                            : "—"
                        }
                      </dd>
                    </div>
                  </dl>

                  ${renderMessageList(
                    item.errors,
                    "question-import-errors"
                  )}

                  ${renderMessageList(
                    item.warnings,
                    "question-import-warnings"
                  )}
                </article>
              `;
            }
          )
          .join("")}
      </section>

      <footer class="question-import-actions">
        <button
          id="questionImportRejectButton"
          class="btn btn-secondary"
          type="button"
        >
          Annulla
        </button>

        <button
          id="questionImportApproveButton"
          class="btn btn-primary"
          type="button"
          ${
            summary.readyForImport
              ? ""
              : "disabled"
          }
        >
          Approva blocco
        </button>
      </footer>
    </section>
  `;

  container
    .querySelector(
      "#questionImportRejectButton"
    )
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof onReject ===
          "function"
        ) {
          onReject(
            preview
          );
        }
      }
    );

  container
    .querySelector(
      "#questionImportApproveButton"
    )
    ?.addEventListener(
      "click",
      () => {
        if (
          !summary.readyForImport
        ) {
          return;
        }

        if (
          typeof onApprove ===
          "function"
        ) {
          onApprove(
            preview
          );
        }
      }
    );

  return preview;
}
