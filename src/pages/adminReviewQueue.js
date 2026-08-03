import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

import {
  officialSubtopics
} from "../data/officialSubtopics.js";

import {
  approveOfficialQuestion,
  getOfficialQuestion,
  loadQuestionReviewQueue,
  rejectOfficialQuestion,
  resolveOfficialQuestionConflict
} from "../services/officialQuestionWorkflowService.js";

function normalizeText(value) {
  return String(
    value ?? ""
  ).normalize("NFC").trim();
}

function normalizeSearch(value) {
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
    );
}

function escapeHtml(value) {
  return normalizeText(
    value
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function findTitle(
  list,
  id,
  fallback
) {
  const safeId =
    normalizeText(
      id
    );

  if (!safeId) {
    return fallback;
  }

  const item =
    list.find(
      (entry) =>
        entry.id ===
        safeId
    );

  return (
    item?.title ||
    item?.name ||
    safeId
  );
}

function getStatusLabel(
  status
) {
  const labels = {
    pending_review:
      "Da revisionare",

    blocked_conflict:
      "Conflitto bloccato",

    approved:
      "Approvata",

    rejected:
      "Rifiutata"
  };

  return (
    labels[status] ||
    status ||
    "Sconosciuto"
  );
}

function getStatusClass(
  status
) {
  const classes = {
    pending_review:
      "is-pending",

    blocked_conflict:
      "is-conflict",

    approved:
      "is-approved",

    rejected:
      "is-rejected"
  };

  return (
    classes[status] ||
    "is-pending"
  );
}

function getSource(question) {
  const sources =
    Array.isArray(
      question?.sourceLinks
    )
      ? question.sourceLinks
      : [];

  return (
    sources[0] ||
    {}
  );
}

function getConfidence(
  question
) {
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
    return null;
  }

  return Math.round(
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    ) * 100
  );
}

function calculateStatistics(
  questions
) {
  const statuses = {
    pending_review: 0,
    blocked_conflict: 0,
    approved: 0,
    rejected: 0
  };

  questions.forEach(
    (question) => {
      const status =
        normalizeText(
          question.status
        );

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            statuses,
            status
          )
      ) {
        statuses[status] +=
          1;
      }
    }
  );

  return {
    total:
      questions.length,

    ...statuses
  };
}


function createWordDiff(leftText, rightText) {
  const leftWords = normalizeText(leftText).split(/\s+/u).filter(Boolean);
  const rightWords = normalizeText(rightText).split(/\s+/u).filter(Boolean);
  const leftNormalized = leftWords.map((word) => word.toLocaleLowerCase("it-IT"));
  const rightNormalized = rightWords.map((word) => word.toLocaleLowerCase("it-IT"));
  const matrix = Array.from({ length: leftWords.length + 1 }, () =>
    Array(rightWords.length + 1).fill(0)
  );
  for (let i = 1; i <= leftWords.length; i += 1) {
    for (let j = 1; j <= rightWords.length; j += 1) {
      matrix[i][j] = leftNormalized[i - 1] === rightNormalized[j - 1]
        ? matrix[i - 1][j - 1] + 1
        : Math.max(matrix[i - 1][j], matrix[i][j - 1]);
    }
  }
  const leftParts = [];
  const rightParts = [];
  let i = leftWords.length;
  let j = rightWords.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftNormalized[i - 1] === rightNormalized[j - 1]) {
      leftParts.unshift({ changed: false, value: leftWords[i - 1] });
      rightParts.unshift({ changed: false, value: rightWords[j - 1] });
      i -= 1; j -= 1; continue;
    }
    if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      rightParts.unshift({ changed: true, value: rightWords[j - 1] });
      j -= 1; continue;
    }
    if (i > 0) {
      leftParts.unshift({ changed: true, value: leftWords[i - 1] });
      i -= 1;
    }
  }
  const render = (parts) => parts.map((part) =>
    part.changed ? `<mark>${escapeHtml(part.value)}</mark>` : escapeHtml(part.value)
  ).join(" ");
  return { leftHtml: render(leftParts), rightHtml: render(rightParts) };
}

function formatAnswer(value) {
  return value === true ? "VERO" : "FALSO";
}

export async function showAdminReviewQueue({
  container,
  user,
  onBack,
  onOpenQuestionManager
}) {
  if (!container) {
    throw new Error(
      "Container della coda di revisione mancante."
    );
  }

  const state = {
    questions: [],
    filteredQuestions: [],
    loading: true,
    searchText: "",
    statusFilter: "all",
    answerFilter: "all",
    blockFilter: "all",
    selectedQuestionId: "",
    submittingQuestionId: ""
  };

  function applyFilters() {
    const safeSearch =
      normalizeSearch(
        state.searchText
      );

    state.filteredQuestions =
      state.questions.filter(
        (question) => {
          const source =
            getSource(
              question
            );

          const searchHaystack =
            normalizeSearch([
              question.officialText,
              question.questionId,
              question.importBatchId,
              question.classification
                ?.argomentoId,
              question.classification
                ?.topicId,
              question.classification
                ?.subtopicId,
              source.officialBlockId,
              source.sourceName
            ].join(" "));

          const matchesSearch =
            !safeSearch ||
            searchHaystack
              .includes(
                safeSearch
              );

          const matchesStatus =
            state.statusFilter ===
              "all" ||
            question.status ===
              state.statusFilter;

          const matchesAnswer =
            state.answerFilter ===
              "all" ||
            String(
              question.correctAnswer
            ) ===
              state.answerFilter;

          const matchesBlock =
            state.blockFilter ===
              "all" ||
            normalizeText(
              source.officialBlockId
            ) ===
              state.blockFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesAnswer &&
            matchesBlock
          );
        }
      );

    renderList();
  }

  function getBlockOptions() {
    return Array.from(
      new Set(
        state.questions
          .map(
            (question) =>
              normalizeText(
                getSource(
                  question
                ).officialBlockId
              )
          )
          .filter(
            Boolean
          )
      )
    ).sort(
      (
        first,
        second
      ) =>
        first.localeCompare(
          second,
          "it-IT",
          {
            numeric: true
          }
        )
    );
  }

  function renderStatistics() {
    const element =
      document.querySelector(
        "#adminReviewStatistics"
      );

    if (!element) {
      return;
    }

    const statistics =
      calculateStatistics(
        state.questions
      );

    element.innerHTML = `
      <article>
        <strong>
          ${statistics.total}
        </strong>

        <span>Totale</span>
      </article>

      <article>
        <strong>
          ${statistics.pending_review}
        </strong>

        <span>Da revisionare</span>
      </article>

      <article>
        <strong>
          ${statistics.blocked_conflict}
        </strong>

        <span>Conflitti</span>
      </article>

      <article>
        <strong>
          ${statistics.approved}
        </strong>

        <span>Approvate</span>
      </article>

      <article>
        <strong>
          ${statistics.rejected}
        </strong>

        <span>Rifiutate</span>
      </article>
    `;
  }

  function renderBlockFilter() {
    const select =
      document.querySelector(
        "#adminReviewBlockFilter"
      );

    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="all">
        Tutti i blocchi
      </option>

      ${getBlockOptions()
        .map(
          (blockId) => `
            <option
              value="${escapeHtml(
                blockId
              )}"
              ${
                state.blockFilter ===
                blockId
                  ? "selected"
                  : ""
              }
            >
              Blocco
              ${escapeHtml(
                blockId
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function renderList() {
    const list =
      document.querySelector(
        "#adminReviewQuestionList"
      );

    const counter =
      document.querySelector(
        "#adminReviewVisibleCount"
      );

    if (!list) {
      return;
    }

    if (counter) {
      counter.textContent =
        `${state.filteredQuestions.length} risultati`;
    }

    if (
      state.filteredQuestions
        .length === 0
    ) {
      list.innerHTML = `
        <section class="admin-review-empty">
          <span>🔍</span>

          <h3>
            Nessuna domanda trovata
          </h3>

          <p>
            Modifica i filtri oppure
            importa un nuovo blocco.
          </p>
        </section>
      `;

      return;
    }

    list.innerHTML =
      state.filteredQuestions
        .map(
          (question) => {
            const source =
              getSource(
                question
              );

            const classification =
              question.classification ||
              {};

            const confidence =
              getConfidence(
                question
              );

            const conflicts =
              question.workflow
                ?.conflictReasons ||
              [];

            return `
              <article class="admin-review-card">
                <header class="admin-review-card-header">
                  <div class="admin-review-answer-group">
                    <span
                      class="
                        admin-review-answer
                        ${
                          question.correctAnswer ===
                          true
                            ? "is-true"
                            : "is-false"
                        }
                      "
                    >
                      ${
                        question.correctAnswer ===
                        true
                          ? "VERO"
                          : "FALSO"
                      }
                    </span>

                    <span
                      class="
                        admin-review-status
                        ${getStatusClass(
                          question.status
                        )}
                      "
                    >
                      ${escapeHtml(
                        getStatusLabel(
                          question.status
                        )
                      )}
                    </span>
                  </div>

                  <span class="admin-review-block">
                    Blocco
                    ${escapeHtml(
                      source.officialBlockId ||
                      "—"
                    )}
                  </span>
                </header>

                <h3 class="admin-review-question-text">
                  ${escapeHtml(
                    question.officialText
                  )}
                </h3>

                <dl class="admin-review-metadata">
                  <div>
                    <dt>Argomento</dt>
                    <dd>
                      ${escapeHtml(
                        findTitle(
                          argomenti,
                          classification
                            .argomentoId,
                          "—"
                        )
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Topic</dt>
                    <dd>
                      ${escapeHtml(
                        findTitle(
                          topics,
                          classification
                            .topicId,
                          "—"
                        )
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Subtopic</dt>
                    <dd>
                      ${escapeHtml(
                        findTitle(
                          officialSubtopics,
                          classification
                            .subtopicId,
                          "—"
                        )
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Confidence</dt>
                    <dd>
                      ${
                        confidence ===
                        null
                          ? "—"
                          : `${confidence}%`
                      }
                    </dd>
                  </div>
                </dl>

                ${
                  conflicts.length > 0
                    ? `
                      <div class="admin-review-conflict">
                        <strong>
                          Conflitto rilevato
                        </strong>

                        <span>
                          ${escapeHtml(
                            conflicts.join(
                              ", "
                            )
                          )}
                        </span>
                      </div>
                    `
                    : ""
                }

                <footer class="admin-review-card-footer">
                  <div>
                    <small>
                      Ordine:
                      ${Number(
                        source.officialOrder ||
                        0
                      ) || "—"}
                    </small>

                    <small>
                      Pagina:
                      ${Number(
                        source.sourcePage ||
                        0
                      ) || "—"}
                    </small>
                  </div>

                  <div class="admin-review-card-actions">
                    <button
                      class="btn btn-secondary"
                      type="button"
                      data-review-details="${escapeHtml(
                        question.id
                      )}"
                    >
                      Dettagli
                    </button>

                    <button
                      class="btn btn-secondary"
                      type="button"
                      data-review-reject="${escapeHtml(
                        question.id
                      )}"
                      ${
                        question.status ===
                        "approved"
                          ? "disabled"
                          : ""
                      }
                    >
                      Rifiuta
                    </button>

                    <button
                      class="btn btn-primary"
                      type="button"
                      data-review-approve="${escapeHtml(
                        question.id
                      )}"
                      ${
                        question.status ===
                          "blocked_conflict" ||
                        question.status ===
                          "approved"
                          ? "disabled"
                          : ""
                      }
                      title="${
                        question.status ===
                        "blocked_conflict"
                          ? "Risolvi prima il conflitto"
                          : ""
                      }"
                    >
                      Approva
                    </button>

                    ${
                      question.status ===
                      "blocked_conflict"
                        ? `
                          <button
                            class="btn btn-primary admin-review-resolve-button"
                            type="button"
                            data-review-resolve="${escapeHtml(question.id)}"
                          >
                            Risolvi conflitto
                          </button>
                        `
                        : ""
                    }
                  </div>
                </footer>
              </article>
            `;
          }
        )
        .join("");

    list
      .querySelectorAll(
        "[data-review-details]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              openDetails(
                button.dataset
                  .reviewDetails
              );
            }
          );
        }
      );

    list
      .querySelectorAll(
        "[data-review-approve]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              openApprovalEditor(
                button.dataset
                  .reviewApprove
              );
            }
          );
        }
      );

    list
      .querySelectorAll(
        "[data-review-reject]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              openRejectEditor(
                button.dataset
                  .reviewReject
              );
            }
          );
        }
      );


    list
      .querySelectorAll(
        "[data-review-resolve]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              openConflictResolver(
                button.dataset.reviewResolve
              );
            }
          );
        }
      );
  }

  function openDetails(
    questionId
  ) {
    const question =
      state.questions.find(
        (item) =>
          item.id ===
          questionId
      );

    if (!question) {
      return;
    }

    const source =
      getSource(
        question
      );

    const classification =
      question.classification ||
      {};

    const modal =
      document.createElement(
        "div"
      );

    modal.className =
      "admin-review-modal";

    modal.innerHTML = `
      <div
        class="admin-review-modal-backdrop"
        data-review-modal-close
      ></div>

      <section
        class="admin-review-modal-dialog"
        role="dialog"
        aria-modal="true"
      >
        <header>
          <div>
            <p class="eyebrow">
              DETTAGLI DOMANDA
            </p>

            <h2>
              Blocco
              ${escapeHtml(
                source.officialBlockId ||
                "—"
              )}
            </h2>
          </div>

          <button
            class="admin-review-modal-close"
            type="button"
            data-review-modal-close
          >
            ×
          </button>
        </header>

        <div class="admin-review-modal-body">
          <span
            class="
              admin-review-answer
              ${
                question.correctAnswer ===
                true
                  ? "is-true"
                  : "is-false"
              }
            "
          >
            ${
              question.correctAnswer ===
              true
                ? "VERO"
                : "FALSO"
            }
          </span>

          <h3>
            ${escapeHtml(
              question.officialText
            )}
          </h3>

          <dl class="admin-review-details-grid">
            <div>
              <dt>Question ID</dt>
              <dd>
                ${escapeHtml(
                  question.questionId ||
                  question.id
                )}
              </dd>
            </div>

            <div>
              <dt>Stato</dt>
              <dd>
                ${escapeHtml(
                  getStatusLabel(
                    question.status
                  )
                )}
              </dd>
            </div>

            <div>
              <dt>Argomento ID</dt>
              <dd>
                ${escapeHtml(
                  classification
                    .argomentoId ||
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt>Topic ID</dt>
              <dd>
                ${escapeHtml(
                  classification
                    .topicId ||
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt>Subtopic ID</dt>
              <dd>
                ${escapeHtml(
                  classification
                    .subtopicId ||
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt>Batch</dt>
              <dd>
                ${escapeHtml(
                  question.importBatchId ||
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt>Fonte</dt>
              <dd>
                ${escapeHtml(
                  source.sourceName ||
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt>Versione</dt>
              <dd>
                ${escapeHtml(
                  source.sourceVersion ||
                  "—"
                )}
              </dd>
            </div>
          </dl>

          <section class="admin-review-explanation-preview">
            <h4>
              Spiegazione
            </h4>

            <p>
              ${escapeHtml(
                question.explanation
                  ?.it ||
                "Non ancora disponibile."
              )}
            </p>
          </section>
        </div>
      </section>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelectorAll(
        "[data-review-modal-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            () => {
              modal.remove();
            }
          );
        }
      );
  }


  async function openConflictResolver(questionId) {
    const queueQuestion = state.questions.find((item) => item.id === questionId);
    if (!queueQuestion || queueQuestion.status !== "blocked_conflict") return;
    try {
      const officialQuestion = await getOfficialQuestion(user, questionId);
      const candidate = officialQuestion?.conflictingCandidate;
      if (!officialQuestion || !candidate) {
        throw new Error("Candidato in conflitto non disponibile.");
      }
      const officialSource = getSource(officialQuestion);
      const importedSource = getSource(candidate);
      const officialClassification = officialQuestion.classification || {};
      const importedClassification = candidate.classification || {};
      const diff = createWordDiff(officialQuestion.officialText, candidate.officialText);
      const modal = buildActionModal({
        eyebrow: "RISOLUZIONE CONFLITTO",
        title: "Confronto tra versioni",
        subtitle: "Scegli quale versione deve diventare quella ufficiale.",
        bodyHtml: `
          <form id="adminReviewConflictForm" class="admin-review-conflict-form">
            <section class="admin-review-conflict-comparison">
              <article class="admin-review-conflict-version">
                <header><span>VERSIONE UFFICIALE ATTUALE</span>
                  <strong class="admin-review-answer ${officialQuestion.correctAnswer ? "is-true" : "is-false"}">${formatAnswer(officialQuestion.correctAnswer)}</strong>
                </header>
                <p class="admin-review-conflict-text">${diff.leftHtml}</p>
                <dl class="admin-review-conflict-meta">
                  <div><dt>Argomento</dt><dd>${escapeHtml(officialClassification.argomentoId || "—")}</dd></div>
                  <div><dt>Topic</dt><dd>${escapeHtml(officialClassification.topicId || "—")}</dd></div>
                  <div><dt>Subtopic</dt><dd>${escapeHtml(officialClassification.subtopicId || "—")}</dd></div>
                  <div><dt>Blocco</dt><dd>${escapeHtml(officialSource.officialBlockId || "—")}</dd></div>
                  <div><dt>Pagina</dt><dd>${Number(officialSource.sourcePage || 0) || "—"}</dd></div>
                </dl>
              </article>
              <article class="admin-review-conflict-version is-imported">
                <header><span>VERSIONE IMPORTATA</span>
                  <strong class="admin-review-answer ${candidate.correctAnswer ? "is-true" : "is-false"}">${formatAnswer(candidate.correctAnswer)}</strong>
                </header>
                <p class="admin-review-conflict-text">${diff.rightHtml}</p>
                <dl class="admin-review-conflict-meta">
                  <div><dt>Argomento</dt><dd>${escapeHtml(importedClassification.argomentoId || "—")}</dd></div>
                  <div><dt>Topic</dt><dd>${escapeHtml(importedClassification.topicId || "—")}</dd></div>
                  <div><dt>Subtopic</dt><dd>${escapeHtml(importedClassification.subtopicId || "—")}</dd></div>
                  <div><dt>Blocco</dt><dd>${escapeHtml(importedSource.officialBlockId || "—")}</dd></div>
                  <div><dt>Pagina</dt><dd>${Number(importedSource.sourcePage || 0) || "—"}</dd></div>
                </dl>
              </article>
            </section>
            <section class="admin-review-conflict-options">
              <label><input name="adminReviewConflictResolution" type="radio" value="keep_official" checked><span><strong>Mantieni versione ufficiale</strong><small>Conserva testo, risposta e classificazione attuali.</small></span></label>
              <label><input name="adminReviewConflictResolution" type="radio" value="use_imported"><span><strong>Usa versione importata</strong><small>Accetta la risposta e i metadati importati.</small></span></label>
              <label><input name="adminReviewConflictResolution" type="radio" value="merge_information"><span><strong>Unisci informazioni</strong><small>Mantiene la risposta ufficiale e unisce fonti e concetti.</small></span></label>
            </section>
            <label class="admin-form-field"><span>Nota di risoluzione *</span><textarea id="adminReviewConflictNote" rows="5" required placeholder="Spiega come hai verificato la risposta corretta."></textarea></label>
            <footer class="admin-review-action-footer">
              <button class="btn btn-secondary" type="button" data-review-action-close>Annulla</button>
              <button id="adminReviewConflictSubmit" class="btn btn-primary" type="submit">Risolvi conflitto</button>
            </footer>
          </form>`
      });
      modal.querySelectorAll("[data-review-action-close]").forEach((element) => element.addEventListener("click", closeActionModal));
      modal.querySelector("#adminReviewConflictForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (state.submittingQuestionId) return;
        const resolutionType = modal.querySelector('input[name="adminReviewConflictResolution"]:checked')?.value || "keep_official";
        const note = modal.querySelector("#adminReviewConflictNote")?.value.trim() || "";
        if (!note) { setActionMessage("Inserisci una nota di risoluzione."); return; }
        const submitButton = modal.querySelector("#adminReviewConflictSubmit");
        state.submittingQuestionId = questionId;
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Salvataggio..."; }
        try {
          await resolveOfficialQuestionConflict({ user, questionId, resolutionType, note });
          closeActionModal();
          await loadQueue();
        } catch (error) {
          console.error("Conflict resolution error:", error);
          setActionMessage(error.message || "Risoluzione non riuscita.");
        } finally {
          state.submittingQuestionId = "";
          if (submitButton && document.body.contains(submitButton)) { submitButton.disabled = false; submitButton.textContent = "Risolvi conflitto"; }
        }
      });
    } catch (error) {
      console.error("Conflict loading error:", error);
      window.alert(error.message || "Non è stato possibile caricare il conflitto.");
    }
  }

  function closeActionModal() {
    document
      .querySelector(
        "#adminReviewActionModal"
      )
      ?.remove();
  }

  function setActionMessage(
    message,
    type = "error"
  ) {
    const element =
      document.querySelector(
        "#adminReviewActionMessage"
      );

    if (!element) {
      return;
    }

    element.textContent =
      message || "";

    element.className =
      `message ${type}`;
  }

  function buildActionModal({
    eyebrow,
    title,
    subtitle,
    bodyHtml
  }) {
    closeActionModal();

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "adminReviewActionModal";

    modal.className =
      "admin-review-modal";

    modal.innerHTML = `
      <div
        class="admin-review-modal-backdrop"
        data-review-action-close
      ></div>

      <section
        class="
          admin-review-modal-dialog
          admin-review-action-dialog
        "
        role="dialog"
        aria-modal="true"
      >
        <header>
          <div>
            <p class="eyebrow">
              ${escapeHtml(
                eyebrow
              )}
            </p>

            <h2>
              ${escapeHtml(
                title
              )}
            </h2>

            <p>
              ${escapeHtml(
                subtitle
              )}
            </p>
          </div>

          <button
            class="admin-review-modal-close"
            type="button"
            data-review-action-close
          >
            ×
          </button>
        </header>

        <div class="admin-review-modal-body">
          <p
            id="adminReviewActionMessage"
            class="message"
          ></p>

          ${bodyHtml}
        </div>
      </section>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelectorAll(
        "[data-review-action-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            closeActionModal
          );
        }
      );

    return modal;
  }

  function openApprovalEditor(
    questionId
  ) {
    const question =
      state.questions.find(
        (item) =>
          item.id ===
          questionId
      );

    if (!question) {
      return;
    }

    if (
      question.status ===
      "blocked_conflict"
    ) {
      window.alert(
        "Questa domanda ha un conflitto. Risolvi prima il conflitto."
      );

      return;
    }

    const explanation =
      question.explanation || {};

    const decisiveWords =
      Array.isArray(
        explanation.decisiveWords
      )
        ? explanation
            .decisiveWords
            .join(", ")
        : "";

    const modal =
      buildActionModal({
        eyebrow:
          "APPROVAZIONE DOMANDA",

        title:
          question.correctAnswer ===
          true
            ? "Risposta corretta: VERO"
            : "Risposta corretta: FALSO",

        subtitle:
          question.officialText,

        bodyHtml: `
          <form
            id="adminReviewApprovalForm"
            class="admin-review-action-form"
          >
            <label class="admin-form-field">
              <span>
                Spiegazione italiana *
              </span>

              <textarea
                id="adminReviewExplanationIt"
                rows="5"
                required
                placeholder="Spiega perché la risposta è vera o falsa."
              >${escapeHtml(
                explanation.it || ""
              )}</textarea>
            </label>

            <label class="admin-form-field">
              <span>
                Spiegazione বাংলা
              </span>

              <textarea
                id="adminReviewExplanationBn"
                rows="5"
                placeholder="বাংলায় সহজ ব্যাখ্যা লিখুন।"
              >${escapeHtml(
                explanation.bn || ""
              )}</textarea>
            </label>

            <div class="admin-review-action-grid">
              <label class="admin-form-field">
                <span>
                  Parole decisive
                </span>

                <input
                  id="adminReviewDecisiveWords"
                  type="text"
                  value="${escapeHtml(
                    decisiveWords
                  )}"
                  placeholder="es. qualsiasi, non, solo"
                />

                <small>
                  Separa le parole con una virgola.
                </small>
              </label>

              <label class="admin-form-field">
                <span>
                  Errore comune
                </span>

                <textarea
                  id="adminReviewMisconception"
                  rows="3"
                  placeholder="Quale errore può fare lo studente?"
                >${escapeHtml(
                  explanation.misconception ||
                  ""
                )}</textarea>
              </label>
            </div>

            <section class="admin-review-publish-choice">
              <label>
                <input
                  name="adminReviewPublishMode"
                  type="radio"
                  value="draft"
                  checked
                />

                <span>
                  <strong>
                    Approva come bozza
                  </strong>

                  <small>
                    Sarà salvata in questions,
                    ma non visibile agli studenti.
                  </small>
                </span>
              </label>

              <label>
                <input
                  name="adminReviewPublishMode"
                  type="radio"
                  value="published"
                />

                <span>
                  <strong>
                    Approva e pubblica
                  </strong>

                  <small>
                    Sarà immediatamente disponibile
                    nei quiz degli studenti.
                  </small>
                </span>
              </label>
            </section>

            <footer class="admin-review-action-footer">
              <button
                class="btn btn-secondary"
                type="button"
                data-review-action-close
              >
                Annulla
              </button>

              <button
                id="adminReviewApprovalSubmit"
                class="btn btn-primary"
                type="submit"
              >
                Conferma approvazione
              </button>
            </footer>
          </form>
        `
      });

    modal
      .querySelectorAll(
        "[data-review-action-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            closeActionModal
          );
        }
      );

    modal
      .querySelector(
        "#adminReviewApprovalForm"
      )
      ?.addEventListener(
        "submit",
        async (
          event
        ) => {
          event.preventDefault();

          if (
            state.submittingQuestionId
          ) {
            return;
          }

          const explanationIt =
            modal
              .querySelector(
                "#adminReviewExplanationIt"
              )
              ?.value
              .trim() || "";

          const explanationBn =
            modal
              .querySelector(
                "#adminReviewExplanationBn"
              )
              ?.value
              .trim() || "";

          const decisiveWordsValue =
            modal
              .querySelector(
                "#adminReviewDecisiveWords"
              )
              ?.value || "";

          const misconception =
            modal
              .querySelector(
                "#adminReviewMisconception"
              )
              ?.value
              .trim() || "";

          const publishMode =
            modal
              .querySelector(
                'input[name="adminReviewPublishMode"]:checked'
              )
              ?.value || "draft";

          if (!explanationIt) {
            setActionMessage(
              "La spiegazione italiana è obbligatoria."
            );

            return;
          }

          const submitButton =
            modal.querySelector(
              "#adminReviewApprovalSubmit"
            );

          state.submittingQuestionId =
            questionId;

          if (submitButton) {
            submitButton.disabled =
              true;

            submitButton.textContent =
              "Salvataggio...";
          }

          try {
            await approveOfficialQuestion({
              user,
              questionId,
              explanationIt,
              explanationBn,

              decisiveWords:
                decisiveWordsValue
                  .split(",")
                  .map(
                    (word) =>
                      word.trim()
                  )
                  .filter(Boolean),

              misconception,

              publish:
                publishMode ===
                "published"
            });

            closeActionModal();

            await loadQueue();
          } catch (error) {
            console.error(
              "Question approval error:",
              error
            );

            setActionMessage(
              error.message ||
              "Approvazione non riuscita."
            );
          } finally {
            state.submittingQuestionId =
              "";

            if (
              submitButton &&
              document.body
                .contains(
                  submitButton
                )
            ) {
              submitButton.disabled =
                false;

              submitButton.textContent =
                "Conferma approvazione";
            }
          }
        }
      );
  }

  function openRejectEditor(
    questionId
  ) {
    const question =
      state.questions.find(
        (item) =>
          item.id ===
          questionId
      );

    if (!question) {
      return;
    }

    const modal =
      buildActionModal({
        eyebrow:
          "RIFIUTO DOMANDA",

        title:
          "Indica il motivo del rifiuto",

        subtitle:
          question.officialText,

        bodyHtml: `
          <form
            id="adminReviewRejectForm"
            class="admin-review-action-form"
          >
            <label class="admin-form-field">
              <span>
                Motivo del rifiuto *
              </span>

              <textarea
                id="adminReviewRejectReason"
                rows="6"
                required
                placeholder="Es. testo OCR errato, classificazione sbagliata, fonte non verificata..."
              ></textarea>
            </label>

            <div class="admin-review-reject-warning">
              La domanda non sarà eliminata.
              Rimarrà tracciata con stato
              <strong>Rifiutata</strong>.
            </div>

            <footer class="admin-review-action-footer">
              <button
                class="btn btn-secondary"
                type="button"
                data-review-action-close
              >
                Annulla
              </button>

              <button
                id="adminReviewRejectSubmit"
                class="
                  btn
                  btn-primary
                  admin-review-danger-button
                "
                type="submit"
              >
                Conferma rifiuto
              </button>
            </footer>
          </form>
        `
      });

    modal
      .querySelectorAll(
        "[data-review-action-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            closeActionModal
          );
        }
      );

    modal
      .querySelector(
        "#adminReviewRejectForm"
      )
      ?.addEventListener(
        "submit",
        async (
          event
        ) => {
          event.preventDefault();

          if (
            state.submittingQuestionId
          ) {
            return;
          }

          const reason =
            modal
              .querySelector(
                "#adminReviewRejectReason"
              )
              ?.value
              .trim() || "";

          if (!reason) {
            setActionMessage(
              "Inserisci il motivo del rifiuto."
            );

            return;
          }

          const submitButton =
            modal.querySelector(
              "#adminReviewRejectSubmit"
            );

          state.submittingQuestionId =
            questionId;

          if (submitButton) {
            submitButton.disabled =
              true;

            submitButton.textContent =
              "Salvataggio...";
          }

          try {
            await rejectOfficialQuestion({
              user,
              questionId,
              reason
            });

            closeActionModal();

            await loadQueue();
          } catch (error) {
            console.error(
              "Question rejection error:",
              error
            );

            setActionMessage(
              error.message ||
              "Rifiuto non riuscito."
            );
          } finally {
            state.submittingQuestionId =
              "";

            if (
              submitButton &&
              document.body
                .contains(
                  submitButton
                )
            ) {
              submitButton.disabled =
                false;

              submitButton.textContent =
                "Conferma rifiuto";
            }
          }
        }
      );
  }

  function bindFilters() {
    document
      .querySelector(
        "#adminReviewSearch"
      )
      ?.addEventListener(
        "input",
        (event) => {
          state.searchText =
            event.target.value;

          applyFilters();
        }
      );

    document
      .querySelector(
        "#adminReviewStatusFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.statusFilter =
            event.target.value;

          applyFilters();
        }
      );

    document
      .querySelector(
        "#adminReviewAnswerFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.answerFilter =
            event.target.value;

          applyFilters();
        }
      );

    document
      .querySelector(
        "#adminReviewBlockFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.blockFilter =
            event.target.value;

          applyFilters();
        }
      );
  }

  async function loadQueue() {
    const message =
      document.querySelector(
        "#adminReviewMessage"
      );

    try {
      state.loading = true;

      state.questions =
        await loadQuestionReviewQueue(
          user
        );

      state.questions.sort(
        (
          first,
          second
        ) => {
          const firstUpdated =
            first.updatedAt
              ?.toMillis?.() ||
            0;

          const secondUpdated =
            second.updatedAt
              ?.toMillis?.() ||
            0;

          return (
            secondUpdated -
            firstUpdated
          );
        }
      );

      renderStatistics();
      renderBlockFilter();
      applyFilters();

      if (message) {
        message.textContent = "";
        message.className =
          "message";
      }
    } catch (error) {
      console.error(
        "Review queue loading error:",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Caricamento non riuscito.";

        message.className =
          "message error";
      }
    } finally {
      state.loading = false;
    }
  }

  container.innerHTML = `
    <main class="page admin-review-page">
      <section
        class="
          card
          wide-card
          admin-review-shell
        "
      >
        <header class="admin-review-page-header">
          <div>
            <button
              id="adminReviewBackButton"
              class="back-button"
              type="button"
            >
              ← Dashboard
            </button>

            <p class="eyebrow">
              QUESTION INTEGRITY ENGINE
            </p>

            <h1>
              Coda di revisione
            </h1>

            <p class="subtitle">
              Controlla le domande ufficiali
              prima della pubblicazione.
            </p>
          </div>

          <div class="admin-review-header-actions">
            <button
              id="adminReviewQuestionManagerButton"
              class="btn btn-secondary"
              type="button"
            >
              ❓ Gestione domande
            </button>

            <button
              id="adminReviewRefreshButton"
              class="btn btn-primary"
              type="button"
            >
              ↻ Aggiorna
            </button>
          </div>
        </header>

        <p
          id="adminReviewMessage"
          class="message"
        ></p>

        <section
          id="adminReviewStatistics"
          class="admin-review-statistics"
        ></section>

        <section class="admin-review-toolbar">
          <label class="admin-review-search">
            <span>🔎</span>

            <input
              id="adminReviewSearch"
              type="search"
              placeholder="Cerca testo, ID, blocco..."
            />
          </label>

          <select
            id="adminReviewStatusFilter"
            aria-label="Filtra per stato"
          >
            <option value="all">
              Tutti gli stati
            </option>

            <option value="pending_review">
              Da revisionare
            </option>

            <option value="blocked_conflict">
              Conflitti bloccati
            </option>

            <option value="approved">
              Approvate
            </option>

            <option value="rejected">
              Rifiutate
            </option>
          </select>

          <select
            id="adminReviewAnswerFilter"
            aria-label="Filtra per risposta"
          >
            <option value="all">
              Vero e Falso
            </option>

            <option value="true">
              Solo Vero
            </option>

            <option value="false">
              Solo Falso
            </option>
          </select>

          <select
            id="adminReviewBlockFilter"
            aria-label="Filtra per blocco"
          >
            <option value="all">
              Tutti i blocchi
            </option>
          </select>
        </section>

        <div class="admin-review-result-header">
          <strong>
            Domande importate
          </strong>

          <span id="adminReviewVisibleCount">
            0 risultati
          </span>
        </div>

        <section
          id="adminReviewQuestionList"
          class="admin-review-list"
        >
          <div class="admin-review-loading">
            <div class="loading-spinner"></div>
            <p>Caricamento...</p>
          </div>
        </section>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#adminReviewBackButton"
    )
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof onBack ===
          "function"
        ) {
          onBack();
        }
      }
    );

  document
    .querySelector(
      "#adminReviewQuestionManagerButton"
    )
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof onOpenQuestionManager ===
          "function"
        ) {
          onOpenQuestionManager();
        }
      }
    );

  document
    .querySelector(
      "#adminReviewRefreshButton"
    )
    ?.addEventListener(
      "click",
      loadQueue
    );

  bindFilters();

  await loadQueue();
}
