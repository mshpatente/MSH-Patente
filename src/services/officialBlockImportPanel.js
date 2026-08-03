import {
  parseOfficialBlockText
} from "./officialBlockParser.js";

import {
  processQuestionImport
} from "./questionIntegrityEngine.js";

import {
  createQuestionImportPreview,
  renderQuestionImportPreview
} from "./questionImportPreviewService.js";

import {
  importOfficialQuestionBatch
} from "./officialQuestionWorkflowService.js";

function normalizeText(value) {
  return String(
    value ?? ""
  ).normalize("NFC").trim();
}

function escapeHtml(value) {
  return normalizeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortByOrder(items = []) {
  return items
    .slice()
    .sort(
      (first, second) =>
        Number(first.order || 0) -
        Number(second.order || 0)
    );
}

export function openOfficialBlockImportPanel({
  user,
  argomenti = [],
  topics = [],
  subtopics = []
}) {
  const state = {
    step: "input",
    sourceName: "Listato A e B",
    sourceVersion: "2025-02-27",
    sourcePage: "",
    argomentoId: "",
    topicId: "",
    subtopicId: "",
    rawText: "",
    metadata: null,
    rawCandidates: [],
    previewQuestions: [],
    preview: null,
    submitting: false,
    result: null
  };

  function close() {
    document
      .querySelector(
        "#officialBlockImportModal"
      )
      ?.remove();
  }

  function showMessage(
    message,
    type = "error"
  ) {
    const element =
      document.querySelector(
        "#officialBlockImportMessage"
      );

    if (!element) {
      return;
    }

    element.textContent =
      message || "";

    element.className =
      `message ${type}`;
  }

  function availableTopics() {
    return sortByOrder(
      topics.filter(
        (topic) =>
          topic.argomentoId ===
          state.argomentoId
      )
    );
  }

  function availableSubtopics() {
    return sortByOrder(
      subtopics.filter(
        (subtopic) =>
          subtopic.topicId ===
          state.topicId
      )
    );
  }

  function renderTopicOptions() {
    const select =
      document.querySelector(
        "#officialImportTopic"
      );

    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">
        Seleziona topic
      </option>

      ${availableTopics()
        .map(
          (topic) => `
            <option
              value="${escapeHtml(
                topic.id
              )}"
              ${
                state.topicId ===
                topic.id
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                topic.title ||
                topic.name ||
                topic.id
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function renderSubtopicOptions() {
    const select =
      document.querySelector(
        "#officialImportSubtopic"
      );

    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">
        Seleziona subtopic
      </option>

      ${availableSubtopics()
        .map(
          (subtopic) => `
            <option
              value="${escapeHtml(
                subtopic.id
              )}"
              ${
                state.subtopicId ===
                subtopic.id
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                subtopic.title ||
                subtopic.name ||
                subtopic.id
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function renderShell() {
    document
      .querySelector(
        "#officialBlockImportModal"
      )
      ?.remove();

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "officialBlockImportModal";

    modal.className =
      "official-import-modal";

    modal.innerHTML = `
      <div
        class="official-import-backdrop"
        data-official-import-close
      ></div>

      <section
        class="official-import-dialog"
        role="dialog"
        aria-modal="true"
      >
        <header class="official-import-header">
          <div>
            <p class="eyebrow">
              QUESTION INTEGRITY ENGINE
            </p>

            <h2>
              Importa blocco ufficiale
            </h2>

            <p>
              ${
                state.step === "input"
                  ? "Incolla il testo e seleziona la classificazione."
                  : state.step === "preview"
                    ? "Controlla prima di inviare alla revisione."
                    : "Il blocco è stato elaborato."
              }
            </p>
          </div>

          <button
            id="officialImportClose"
            class="official-import-close"
            type="button"
            aria-label="Chiudi"
          >
            ×
          </button>
        </header>

        <p
          id="officialBlockImportMessage"
          class="message"
        ></p>

        <div
          id="officialImportBody"
          class="official-import-body"
        ></div>
      </section>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelector(
        "#officialImportClose"
      )
      ?.addEventListener(
        "click",
        close
      );

    modal
      .querySelector(
        "[data-official-import-close]"
      )
      ?.addEventListener(
        "click",
        close
      );

    if (
      state.step === "preview"
    ) {
      renderPreview();
    } else if (
      state.step === "success"
    ) {
      renderSuccess();
    } else {
      renderInput();
    }
  }

  function renderInput() {
    const body =
      document.querySelector(
        "#officialImportBody"
      );

    if (!body) {
      return;
    }

    const argomentoOptions =
      sortByOrder(argomenti)
        .map(
          (argomento) => `
            <option
              value="${escapeHtml(
                argomento.id
              )}"
              ${
                state.argomentoId ===
                argomento.id
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                argomento.title ||
                argomento.name ||
                argomento.id
              )}
            </option>
          `
        )
        .join("");

    body.innerHTML = `
      <form
        id="officialBlockImportForm"
        class="official-import-form"
      >
        <div class="official-import-grid">
          <label class="admin-form-field">
            <span>Fonte *</span>

            <input
              id="officialImportSourceName"
              value="${escapeHtml(
                state.sourceName
              )}"
              required
            />
          </label>

          <label class="admin-form-field">
            <span>Versione *</span>

            <input
              id="officialImportSourceVersion"
              value="${escapeHtml(
                state.sourceVersion
              )}"
              required
            />
          </label>

          <label class="admin-form-field">
            <span>Pagina PDF</span>

            <input
              id="officialImportSourcePage"
              type="number"
              min="1"
              value="${escapeHtml(
                state.sourcePage
              )}"
              placeholder="Es. 10"
            />
          </label>
        </div>

        <div class="official-import-grid">
          <label class="admin-form-field">
            <span>Argomento *</span>

            <select
              id="officialImportArgomento"
              required
            >
              <option value="">
                Seleziona argomento
              </option>

              ${argomentoOptions}
            </select>
          </label>

          <label class="admin-form-field">
            <span>Topic *</span>

            <select
              id="officialImportTopic"
              required
            ></select>
          </label>

          <label class="admin-form-field">
            <span>Subtopic *</span>

            <select
              id="officialImportSubtopic"
              required
            ></select>
          </label>
        </div>

        <label class="admin-form-field">
          <span>
            Testo ufficiale del blocco *
          </span>

          <textarea
            id="officialImportRawText"
            class="official-import-textarea"
            rows="18"
            required
            placeholder="LA STRADA&#10;DEFINIZIONI STRADALI E DI TRAFFICO&#10;Strada&#10;Blocco: 11012&#10;&#10;DOMANDE VERE&#10;1 · ...&#10;&#10;DOMANDE FALSE&#10;1 · ..."
          >${escapeHtml(
            state.rawText
          )}</textarea>

          <small>
            Includi intestazioni, Blocco,
            DOMANDE VERE e DOMANDE FALSE.
          </small>
        </label>

        <footer class="official-import-actions">
          <button
            id="officialImportCancel"
            class="btn btn-secondary"
            type="button"
          >
            Annulla
          </button>

          <button
            class="btn btn-primary"
            type="submit"
          >
            Analizza blocco
          </button>
        </footer>
      </form>
    `;

    renderTopicOptions();
    renderSubtopicOptions();

    document
      .querySelector(
        "#officialImportArgomento"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.argomentoId =
            event.target.value;

          state.topicId = "";
          state.subtopicId = "";

          renderTopicOptions();
          renderSubtopicOptions();
        }
      );

    document
      .querySelector(
        "#officialImportTopic"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.topicId =
            event.target.value;

          state.subtopicId = "";

          renderSubtopicOptions();
        }
      );

    document
      .querySelector(
        "#officialImportSubtopic"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.subtopicId =
            event.target.value;
        }
      );

    document
      .querySelector(
        "#officialImportCancel"
      )
      ?.addEventListener(
        "click",
        close
      );

    document
      .querySelector(
        "#officialBlockImportForm"
      )
      ?.addEventListener(
        "submit",
        analyze
      );
  }

  function analyze(event) {
    event.preventDefault();

    state.sourceName =
      document
        .querySelector(
          "#officialImportSourceName"
        )
        ?.value
        .trim() || "";

    state.sourceVersion =
      document
        .querySelector(
          "#officialImportSourceVersion"
        )
        ?.value
        .trim() || "";

    state.sourcePage =
      document
        .querySelector(
          "#officialImportSourcePage"
        )
        ?.value
        .trim() || "";

    state.argomentoId =
      document
        .querySelector(
          "#officialImportArgomento"
        )
        ?.value || "";

    state.topicId =
      document
        .querySelector(
          "#officialImportTopic"
        )
        ?.value || "";

    state.subtopicId =
      document
        .querySelector(
          "#officialImportSubtopic"
        )
        ?.value || "";

    state.rawText =
      document
        .querySelector(
          "#officialImportRawText"
        )
        ?.value || "";

    if (
      !state.argomentoId ||
      !state.topicId ||
      !state.subtopicId
    ) {
      showMessage(
        "Seleziona argomento, topic e subtopic."
      );

      return;
    }

    try {
      const parsed =
        parseOfficialBlockText({
          rawText:
            state.rawText,

          sourceName:
            state.sourceName,

          sourceVersion:
            state.sourceVersion,

          sourcePage:
            state.sourcePage,

          argomentoId:
            state.argomentoId,

          topicId:
            state.topicId,

          subtopicId:
            state.subtopicId,

          extractionConfidence:
            1
        });

      const integrity =
        processQuestionImport(
          parsed.candidates
        );

      state.metadata =
        parsed.metadata;

      state.rawCandidates =
        parsed.candidates;

      state.previewQuestions =
        integrity.records;

      state.preview =
        createQuestionImportPreview(
          integrity.records
        );

      state.step =
        "preview";

      renderShell();
    } catch (error) {
      console.error(
        "Official block parsing error:",
        error
      );

      showMessage(
        error.message ||
        "Analisi del blocco non riuscita."
      );
    }
  }

  function renderPreview() {
    const body =
      document.querySelector(
        "#officialImportBody"
      );

    if (!body) {
      return;
    }

    body.innerHTML = `
      <div id="officialImportPreview"></div>
    `;

    state.preview =
      renderQuestionImportPreview({
        container:
          document.querySelector(
            "#officialImportPreview"
          ),

        questions:
          state.previewQuestions,

        onReject: () => {
          state.step = "input";
          renderShell();
        },

        onApprove: submit
      });

    const button =
      document.querySelector(
        "#questionImportApproveButton"
      );

    if (button) {
      button.textContent =
        state.submitting
          ? "Importazione..."
          : "Invia alla revisione";

      button.disabled =
        state.submitting ||
        !state.preview
          ?.summary
          ?.readyForImport;
    }
  }

  async function submit() {
    if (
      state.submitting ||
      !state.preview
        ?.summary
        ?.readyForImport
    ) {
      return;
    }

    state.submitting = true;
    renderPreview();

    try {
      state.result =
        await importOfficialQuestionBatch({
          user,

          candidates:
            state.rawCandidates,

          sourceName:
            state.sourceName,

          sourceVersion:
            state.sourceVersion,

          officialBlockId:
            state.metadata
              ?.officialBlockId || "",

          notes:
            "Importazione da Admin Phase 4B"
        });

      state.submitting = false;
      state.step = "success";

      renderShell();
    } catch (error) {
      console.error(
        "Official block import error:",
        error
      );

      state.submitting = false;
      renderPreview();

      showMessage(
        error.message ||
        "Importazione non riuscita."
      );
    }
  }

  function renderSuccess() {
    const body =
      document.querySelector(
        "#officialImportBody"
      );

    if (!body) {
      return;
    }

    const summary =
      state.result
        ?.firestoreSummary || {};

    body.innerHTML = `
      <section class="official-import-success">
        <div class="official-import-success-icon">
          ✓
        </div>

        <p class="eyebrow">
          IMPORTAZIONE COMPLETATA
        </p>

        <h3>
          Blocco inviato alla revisione
        </h3>

        <div class="official-import-success-grid">
          <article>
            <strong>
              ${Number(
                summary.created || 0
              )}
            </strong>

            <span>Nuove</span>
          </article>

          <article>
            <strong>
              ${Number(
                summary
                  .exactDuplicatesMerged ||
                0
              )}
            </strong>

            <span>Duplicate unite</span>
          </article>

          <article>
            <strong>
              ${Number(
                summary
                  .conflictsBlocked ||
                0
              )}
            </strong>

            <span>Conflitti</span>
          </article>

          <article>
            <strong>
              ${Number(
                summary.totalProcessed ||
                0
              )}
            </strong>

            <span>Totale</span>
          </article>
        </div>

        <p>
          Batch:
          <strong>
            ${escapeHtml(
              state.result?.batchId
            )}
          </strong>
        </p>

        <button
          id="officialImportDone"
          class="btn btn-primary"
          type="button"
        >
          Chiudi
        </button>
      </section>
    `;

    document
      .querySelector(
        "#officialImportDone"
      )
      ?.addEventListener(
        "click",
        close
      );
  }

  renderShell();
}
