import {
  loadKnowledgeConcepts,
  rebuildKnowledgeConcepts
} from "../services/knowledgeEngineService.js";

import {
  generateLessonDraft,
  loadLessonVersions,
  publishLessonDraft,
  publishLessonVersion,
  saveLessonVersion,
  unpublishKnowledgeLesson,
  validateLessonForPublish
} from "../services/lessonGeneratorService.js";

function normalizeText(value) {
  return String(
    value ?? ""
  ).normalize("NFC").trim();
}

function escapeHtml(value) {
  return normalizeText(
    value
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date =
    typeof value?.toDate ===
    "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : null;

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

export async function showAdminKnowledgeEngine({
  container,
  user,
  onBack,
  onOpenReviewQueue
}) {
  const state = {
    concepts: [],
    searchText: "",
    rebuilding: false,
    selectedConcept: null,
    draft: null,
    versions: [],
    saving: false,
    generating: false,
    publishing: false,
    unpublishing: false
  };

  function getFilteredConcepts() {
    const search =
      state.searchText
        .trim()
        .toLocaleLowerCase(
          "it-IT"
        );

    if (!search) {
      return state.concepts;
    }

    return state.concepts.filter(
      (concept) =>
        [
          concept.title,
          concept.conceptId,
          concept.argomentoId,
          concept.topicId,
          concept.subtopicId,
          ...(concept.keywords || [])
        ]
          .join(" ")
          .toLocaleLowerCase(
            "it-IT"
          )
          .includes(
            search
          )
    );
  }

  function renderConcepts() {
    const list =
      document.querySelector(
        "#knowledgeConceptList"
      );

    const count =
      document.querySelector(
        "#knowledgeVisibleCount"
      );

    if (!list) {
      return;
    }

    const concepts =
      getFilteredConcepts();

    if (count) {
      count.textContent =
        `${concepts.length} concetti`;
    }

    if (
      concepts.length === 0
    ) {
      list.innerHTML = `
        <section class="knowledge-empty">
          <span>🧠</span>

          <h3>
            Nessun concetto disponibile
          </h3>

          <p>
            Premi “Ricostruisci concetti”
            dopo aver approvato le domande.
          </p>
        </section>
      `;

      return;
    }

    list.innerHTML =
      concepts
        .map(
          (concept) => `
            <article class="knowledge-concept-card">
              <header>
                <div>
                  <p class="eyebrow">
                    ${escapeHtml(
                      concept.conceptId
                    )}
                  </p>

                  <h3>
                    ${escapeHtml(
                      concept.title
                    )}
                  </h3>
                </div>

                <span
                  class="knowledge-status"
                  data-status="${escapeHtml(
                    concept.lessonStatus ||
                    "draft"
                  )}"
                >
                  ${escapeHtml(
                    concept.lessonStatus ||
                    "draft"
                  )}
                </span>
              </header>

              <dl class="knowledge-meta">
                <div>
                  <dt>Domande</dt>
                  <dd>
                    ${Number(
                      concept.questionCount ||
                      concept.officialQuestionIds
                        ?.length ||
                      0
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Difficoltà</dt>
                  <dd>
                    ${Number(
                      concept.difficulty ||
                      1
                    )}/5
                  </dd>
                </div>

                <div>
                  <dt>Topic</dt>
                  <dd>
                    ${escapeHtml(
                      concept.topicId ||
                      "—"
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Subtopic</dt>
                  <dd>
                    ${escapeHtml(
                      concept.subtopicId ||
                      "—"
                    )}
                  </dd>
                </div>
              </dl>

              <div class="knowledge-keywords">
                ${(concept.keywords || [])
                  .slice(0, 8)
                  .map(
                    (keyword) => `
                      <span>
                        ${escapeHtml(
                          keyword
                        )}
                      </span>
                    `
                  )
                  .join("")}
              </div>

              <footer>
                <button
                  class="btn btn-secondary"
                  type="button"
                  data-open-concept="${escapeHtml(
                    concept.id ||
                    concept.conceptId
                  )}"
                >
                  Apri concetto
                </button>

                <button
                  class="btn btn-primary"
                  type="button"
                  data-generate-lesson="${escapeHtml(
                    concept.id ||
                    concept.conceptId
                  )}"
                >
                  Genera lezione
                </button>
              </footer>
            </article>
          `
        )
        .join("");

    list
      .querySelectorAll(
        "[data-open-concept]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              const concept =
                state.concepts.find(
                  (item) =>
                    (
                      item.id ||
                      item.conceptId
                    ) ===
                    button.dataset
                      .openConcept
                );

              if (concept) {
                openConceptDetails(
                  concept,
                  false
                );
              }
            }
          );
        }
      );

    list
      .querySelectorAll(
        "[data-generate-lesson]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              const concept =
                state.concepts.find(
                  (item) =>
                    (
                      item.id ||
                      item.conceptId
                    ) ===
                    button.dataset
                      .generateLesson
                );

              if (concept) {
                openConceptDetails(
                  concept,
                  true
                );
              }
            }
          );
        }
      );
  }

  function closeConceptModal() {
    document
      .querySelector(
        "#knowledgeConceptModal"
      )
      ?.remove();

    state.selectedConcept =
      null;

    state.draft =
      null;

    state.versions =
      [];
  }

  function renderVersionHistory() {
    const list =
      document.querySelector(
        "#knowledgeVersionList"
      );

    if (!list) {
      return;
    }

    if (
      state.versions.length ===
      0
    ) {
      list.innerHTML = `
        <p class="knowledge-version-empty">
          Nessuna versione salvata.
        </p>
      `;

      return;
    }

    list.innerHTML =
      state.versions
        .map(
          (
            version,
            index
          ) => `
            <article class="knowledge-version-item">
              <div>
                <strong>
                  Versione ${
                    state.versions.length -
                    index
                  }
                </strong>

                <small>
                  ${escapeHtml(
                    formatDate(
                      version.createdAt
                    )
                  )}
                </small>
              </div>

              <div class="knowledge-version-actions">
                ${
                  version.published ===
                  true
                    ? `
                      <span class="knowledge-version-published">
                        Published ✅
                      </span>
                    `
                    : `
                      <button
                        class="btn btn-secondary"
                        type="button"
                        data-preview-version="${escapeHtml(
                          version.id
                        )}"
                      >
                        Preview
                      </button>

                      <button
                        class="btn btn-primary"
                        type="button"
                        data-publish-version="${escapeHtml(
                          version.id
                        )}"
                      >
                        Publish
                      </button>
                    `
                }
              </div>
            </article>
          `
        )
        .join("");

    list
      .querySelectorAll(
        "[data-preview-version]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              const version =
                state.versions.find(
                  (item) =>
                    item.id ===
                    button.dataset
                      .previewVersion
                );

              if (version) {
                openLessonPreview(
                  version
                );
              }
            }
          );
        }
      );

    list
      .querySelectorAll(
        "[data-publish-version]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            async () => {
              const versionId =
                button.dataset
                  .publishVersion;

              const confirmed =
                window.confirm(
                  "Pubblicare questa versione?"
                );

              if (!confirmed) {
                return;
              }

              button.disabled =
                true;

              try {
                await publishLessonVersion({
                  user,

                  conceptId:
                    state.selectedConcept.id ||
                    state.selectedConcept
                      .conceptId,

                  versionId
                });

                state.versions =
                  await loadLessonVersions(
                    user,
                    state.selectedConcept.id ||
                    state.selectedConcept
                      .conceptId
                  );

                renderVersionHistory();

                const message =
                  document.querySelector(
                    "#knowledgeConceptMessage"
                  );

                if (message) {
                  message.textContent =
                    "Versione pubblicata correttamente.";

                  message.className =
                    "message success";
                }
              } catch (error) {
                console.error(
                  "Version publication error:",
                  error
                );

                window.alert(
                  error.message ||
                  "Pubblicazione non riuscita."
                );
              } finally {
                button.disabled =
                  false;
              }
            }
          );
        }
      );
  }

  function fillDraftForm() {
    const draft =
      state.draft || {};

    const titleInput =
      document.querySelector(
        "#knowledgeDraftTitle"
      );

    const summaryInput =
      document.querySelector(
        "#knowledgeDraftSummary"
      );

    const italianInput =
      document.querySelector(
        "#knowledgeItalianDraft"
      );

    const banglaInput =
      document.querySelector(
        "#knowledgeBanglaDraft"
      );

    if (titleInput) {
      titleInput.value =
        normalizeText(
          draft.title ||
          state.selectedConcept
            ?.title
        );
    }

    if (summaryInput) {
      summaryInput.value =
        normalizeText(
          draft.summary
        );
    }

    if (italianInput) {
      italianInput.value =
        normalizeText(
          draft.italianDraft
        );
    }

    if (banglaInput) {
      banglaInput.value =
        normalizeText(
          draft.banglaDraft
        );
    }
  }

  async function generateCurrentDraft({
    regenerate
  }) {
    if (
      !state.selectedConcept ||
      state.generating
    ) {
      return;
    }

    const button =
      document.querySelector(
        "#knowledgeGenerateDraftButton"
      );

    const message =
      document.querySelector(
        "#knowledgeConceptMessage"
      );

    state.generating =
      true;

    if (button) {
      button.disabled =
        true;

      button.textContent =
        "Generazione...";
    }

    try {
      state.draft =
        await generateLessonDraft({
          user,

          conceptId:
            state.selectedConcept.id ||
            state.selectedConcept
              .conceptId,

          regenerate
        });

      fillDraftForm();

      if (message) {
        message.textContent =
          "Bozza generata correttamente.";

        message.className =
          "message success";
      }
    } catch (error) {
      console.error(
        "Lesson draft generation error:",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Generazione non riuscita.";

        message.className =
          "message error";
      }
    } finally {
      state.generating =
        false;

      if (button) {
        button.disabled =
          false;

        button.textContent =
          "✨ Genera / Rigenera";
      }
    }
  }

  function getCurrentDraftFormData() {
    return {
      title:
        document
          .querySelector(
            "#knowledgeDraftTitle"
          )
          ?.value || "",

      summary:
        document
          .querySelector(
            "#knowledgeDraftSummary"
          )
          ?.value || "",

      italianDraft:
        document
          .querySelector(
            "#knowledgeItalianDraft"
          )
          ?.value || "",

      banglaDraft:
        document
          .querySelector(
            "#knowledgeBanglaDraft"
          )
          ?.value || ""
    };
  }

  function openLessonPreview(
    versionData = null
  ) {
    const data =
      versionData ||
      getCurrentDraftFormData();

    const validation =
      validateLessonForPublish({
        ...data,

        concept:
          state.selectedConcept
      });

    document
      .querySelector(
        "#knowledgeLessonPreview"
      )
      ?.remove();

    const preview =
      document.createElement(
        "div"
      );

    preview.id =
      "knowledgeLessonPreview";

    preview.className =
      "knowledge-preview-modal";

    preview.innerHTML = `
      <div
        class="knowledge-concept-backdrop"
        data-preview-close
      ></div>

      <section class="knowledge-preview-dialog">
        <header>
          <div>
            <p class="eyebrow">
              ANTEPRIMA LEZIONE
            </p>

            <h2>
              ${escapeHtml(
                data.title ||
                "Senza titolo"
              )}
            </h2>
          </div>

          <button
            class="knowledge-concept-close"
            type="button"
            data-preview-close
          >
            ×
          </button>
        </header>

        <div class="knowledge-preview-body">
          ${
            validation.valid
              ? `
                <p class="message success">
                  La lezione è pronta per la pubblicazione.
                </p>
              `
              : `
                <div class="message error">
                  ${validation.errors
                    .map(
                      (error) =>
                        `<div>${escapeHtml(
                          error
                        )}</div>`
                    )
                    .join("")}
                </div>
              `
          }

          ${
            validation.warnings.length > 0
              ? `
                <div class="knowledge-preview-warning">
                  ${validation.warnings
                    .map(
                      (warning) =>
                        `<div>${escapeHtml(
                          warning
                        )}</div>`
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          <article class="knowledge-preview-lesson">
            <p class="knowledge-preview-summary">
              ${escapeHtml(
                data.summary
              )}
            </p>

            <h3>Italiano</h3>

            <pre>${escapeHtml(
              data.italianDraft
            )}</pre>

            <h3>বাংলা</h3>

            <pre>${escapeHtml(
              data.banglaDraft
            )}</pre>
          </article>
        </div>
      </section>
    `;

    document.body.appendChild(
      preview
    );

    preview
      .querySelectorAll(
        "[data-preview-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            () =>
              preview.remove()
          );
        }
      );
  }

  async function publishCurrentLesson() {
    if (
      !state.selectedConcept ||
      state.publishing
    ) {
      return;
    }

    const data =
      getCurrentDraftFormData();

    const validation =
      validateLessonForPublish({
        ...data,

        concept:
          state.selectedConcept
      });

    const message =
      document.querySelector(
        "#knowledgeConceptMessage"
      );

    if (!validation.valid) {
      if (message) {
        message.textContent =
          validation.errors.join(
            " "
          );

        message.className =
          "message error";
      }

      return;
    }

    const confirmed =
      window.confirm(
        "Pubblicare questa lezione in theoryLessons?"
      );

    if (!confirmed) {
      return;
    }

    const button =
      document.querySelector(
        "#knowledgePublishLessonButton"
      );

    state.publishing =
      true;

    if (button) {
      button.disabled =
        true;

      button.textContent =
        "Pubblicazione...";
    }

    try {
      const result =
        await publishLessonDraft({
          user,

          conceptId:
            state.selectedConcept.id ||
            state.selectedConcept
              .conceptId,

          ...data,

          versionId:
            state.versions.find(
              (version) =>
                version.published ===
                true
            )?.id ||
            state.versions[0]?.id ||
            ""
        });

      if (message) {
        message.textContent =
          `Lezione pubblicata: ${result.lessonId}`;

        message.className =
          "message success";
      }
    } catch (error) {
      console.error(
        "Lesson publication error:",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Pubblicazione non riuscita.";

        message.className =
          "message error";
      }
    } finally {
      state.publishing =
        false;

      if (button) {
        button.disabled =
          false;

        button.textContent =
          "Pubblica lezione";
      }
    }
  }

  async function unpublishCurrentLesson() {
    if (
      !state.selectedConcept ||
      state.unpublishing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Rimuovere questa lezione dagli studenti?"
      );

    if (!confirmed) {
      return;
    }

    const button =
      document.querySelector(
        "#knowledgeUnpublishLessonButton"
      );

    const message =
      document.querySelector(
        "#knowledgeConceptMessage"
      );

    state.unpublishing =
      true;

    if (button) {
      button.disabled =
        true;

      button.textContent =
        "Rimozione...";
    }

    try {
      await unpublishKnowledgeLesson({
        user,

        conceptId:
          state.selectedConcept.id ||
          state.selectedConcept
            .conceptId
      });

      state.versions =
        await loadLessonVersions(
          user,
          state.selectedConcept.id ||
          state.selectedConcept
            .conceptId
        );

      renderVersionHistory();

      if (message) {
        message.textContent =
          "Lezione rimossa dalla pubblicazione.";

        message.className =
          "message success";
      }
    } catch (error) {
      console.error(
        "Lesson unpublish error:",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Operazione non riuscita.";

        message.className =
          "message error";
      }
    } finally {
      state.unpublishing =
        false;

      if (button) {
        button.disabled =
          false;

        button.textContent =
          "Unpublish";
      }
    }
  }

  async function saveCurrentVersion(
    event
  ) {
    event.preventDefault();

    if (
      !state.selectedConcept ||
      state.saving
    ) {
      return;
    }

    const button =
      document.querySelector(
        "#knowledgeSaveVersionButton"
      );

    const message =
      document.querySelector(
        "#knowledgeConceptMessage"
      );

    state.saving =
      true;

    if (button) {
      button.disabled =
        true;

      button.textContent =
        "Salvataggio...";
    }

    try {
      const result =
        await saveLessonVersion({
          user,

          conceptId:
            state.selectedConcept.id ||
            state.selectedConcept
              .conceptId,

          title:
            document
              .querySelector(
                "#knowledgeDraftTitle"
              )
              ?.value || "",

          summary:
            document
              .querySelector(
                "#knowledgeDraftSummary"
              )
              ?.value || "",

          italianDraft:
            document
              .querySelector(
                "#knowledgeItalianDraft"
              )
              ?.value || "",

          banglaDraft:
            document
              .querySelector(
                "#knowledgeBanglaDraft"
              )
              ?.value || ""
        });

      state.versions =
        await loadLessonVersions(
          user,
          state.selectedConcept.id ||
          state.selectedConcept
            .conceptId
        );

      renderVersionHistory();

      if (message) {
        message.textContent =
          `Versione salvata: ${result.versionId}`;

        message.className =
          "message success";
      }
    } catch (error) {
      console.error(
        "Lesson version save error:",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Salvataggio non riuscito.";

        message.className =
          "message error";
      }
    } finally {
      state.saving =
        false;

      if (button) {
        button.disabled =
          false;

        button.textContent =
          "Salva nuova versione";
      }
    }
  }

  async function openConceptDetails(
    concept,
    generateImmediately
  ) {
    closeConceptModal();

    state.selectedConcept =
      concept;

    const modal =
      document.createElement(
        "div"
      );

    modal.id =
      "knowledgeConceptModal";

    modal.className =
      "knowledge-concept-modal";

    modal.innerHTML = `
      <div
        class="knowledge-concept-backdrop"
        data-knowledge-close
      ></div>

      <section
        class="knowledge-concept-dialog"
        role="dialog"
        aria-modal="true"
      >
        <header class="knowledge-concept-dialog-header">
          <div>
            <p class="eyebrow">
              CONCEPT DETAILS
            </p>

            <h2>
              ${escapeHtml(
                concept.title
              )}
            </h2>

            <p>
              ${escapeHtml(
                concept.conceptId
              )}
            </p>
          </div>

          <button
            class="knowledge-concept-close"
            type="button"
            data-knowledge-close
          >
            ×
          </button>
        </header>

        <div class="knowledge-concept-dialog-body">
          <p
            id="knowledgeConceptMessage"
            class="message"
          ></p>

          <section class="knowledge-concept-overview">
            <article>
              <strong>
                ${Number(
                  concept.questionCount ||
                  concept.officialQuestionIds
                    ?.length ||
                  0
                )}
              </strong>

              <span>
                Domande ufficiali
              </span>
            </article>

            <article>
              <strong>
                ${Number(
                  concept.difficulty ||
                  1
                )}/5
              </strong>

              <span>
                Difficoltà
              </span>
            </article>

            <article>
              <strong>
                ${Number(
                  concept.decisiveWords
                    ?.length ||
                  0
                )}
              </strong>

              <span>
                Parole decisive
              </span>
            </article>

            <article>
              <strong>
                ${Number(
                  concept.commonMistakes
                    ?.length ||
                  0
                )}
              </strong>

              <span>
                Errori comuni
              </span>
            </article>
          </section>

          <section class="knowledge-concept-tags">
            ${(concept.decisiveWords || [])
              .map(
                (word) => `
                  <span>
                    ${escapeHtml(
                      word
                    )}
                  </span>
                `
              )
              .join("")}
          </section>

          <form
            id="knowledgeLessonDraftForm"
            class="knowledge-draft-form"
          >
            <label class="admin-form-field">
              <span>Titolo</span>

              <input
                id="knowledgeDraftTitle"
                type="text"
              />
            </label>

            <label class="admin-form-field">
              <span>Riassunto</span>

              <textarea
                id="knowledgeDraftSummary"
                rows="3"
              ></textarea>
            </label>

            <div class="knowledge-draft-grid">
              <label class="admin-form-field">
                <span>
                  Bozza italiana *
                </span>

                <textarea
                  id="knowledgeItalianDraft"
                  rows="20"
                  required
                ></textarea>
              </label>

              <label class="admin-form-field">
                <span>
                  বাংলা খসড়া
                </span>

                <textarea
                  id="knowledgeBanglaDraft"
                  rows="20"
                ></textarea>
              </label>
            </div>

            <footer class="knowledge-draft-actions">
              <button
                id="knowledgeGenerateDraftButton"
                class="btn btn-secondary"
                type="button"
              >
                ✨ Genera / Rigenera
              </button>

              <button
                id="knowledgePreviewLessonButton"
                class="btn btn-secondary"
                type="button"
              >
                Anteprima
              </button>

              <button
                id="knowledgeSaveVersionButton"
                class="btn btn-primary"
                type="submit"
              >
                Salva nuova versione
              </button>

              <button
                id="knowledgePublishLessonButton"
                class="
                  btn
                  btn-primary
                  knowledge-publish-button
                "
                type="button"
              >
                Pubblica lezione
              </button>

              <button
                id="knowledgeUnpublishLessonButton"
                class="
                  btn
                  btn-secondary
                  knowledge-unpublish-button
                "
                type="button"
              >
                Unpublish
              </button>
            </footer>
          </form>

          <section class="knowledge-version-panel">
            <h3>
              Cronologia versioni
            </h3>

            <div
              id="knowledgeVersionList"
              class="knowledge-version-list"
            >
              <p>
                Caricamento...
              </p>
            </div>
          </section>
        </div>
      </section>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelectorAll(
        "[data-knowledge-close]"
      )
      .forEach(
        (element) => {
          element.addEventListener(
            "click",
            closeConceptModal
          );
        }
      );

    modal
      .querySelector(
        "#knowledgeGenerateDraftButton"
      )
      ?.addEventListener(
        "click",
        () => {
          generateCurrentDraft({
            regenerate:
              true
          });
        }
      );

    modal
      .querySelector(
        "#knowledgePreviewLessonButton"
      )
      ?.addEventListener(
        "click",
        openLessonPreview
      );

    modal
      .querySelector(
        "#knowledgePublishLessonButton"
      )
      ?.addEventListener(
        "click",
        publishCurrentLesson
      );

    modal
      .querySelector(
        "#knowledgeUnpublishLessonButton"
      )
      ?.addEventListener(
        "click",
        unpublishCurrentLesson
      );

    modal
      .querySelector(
        "#knowledgeLessonDraftForm"
      )
      ?.addEventListener(
        "submit",
        saveCurrentVersion
      );

    try {
      state.versions =
        await loadLessonVersions(
          user,
          concept.id ||
          concept.conceptId
        );

      renderVersionHistory();

      state.draft =
        await generateLessonDraft({
          user,

          conceptId:
            concept.id ||
            concept.conceptId,

          regenerate:
            generateImmediately
        });

      fillDraftForm();
    } catch (error) {
      console.error(
        "Concept details loading error:",
        error
      );

      const message =
        document.querySelector(
          "#knowledgeConceptMessage"
        );

      if (message) {
        message.textContent =
          error.message ||
          "Caricamento non riuscito.";

        message.className =
          "message error";
      }
    }
  }

  async function loadConcepts() {
    state.concepts =
      await loadKnowledgeConcepts(
        user
      );

    state.concepts.sort(
      (first, second) =>
        String(
          first.title || ""
        ).localeCompare(
          String(
            second.title || ""
          ),
          "it-IT"
        )
    );

    renderConcepts();
  }

  container.innerHTML = `
    <main class="page admin-knowledge-page">
      <section
        class="
          card
          wide-card
          admin-knowledge-shell
        "
      >
        <header class="admin-knowledge-header">
          <div>
            <button
              id="knowledgeBackButton"
              class="back-button"
              type="button"
            >
              ← Dashboard
            </button>

            <p class="eyebrow">
              MSH KNOWLEDGE ENGINE
            </p>

            <h1>
              Knowledge Engine
            </h1>

            <p class="subtitle">
              Trasforma le domande approvate
              in concetti e bozze di lezione.
            </p>
          </div>

          <div class="admin-knowledge-actions">
            <button
              id="knowledgeReviewQueueButton"
              class="btn btn-secondary"
              type="button"
            >
              🛡️ Coda revisione
            </button>

            <button
              id="knowledgeRebuildButton"
              class="btn btn-primary"
              type="button"
            >
              ↻ Ricostruisci concetti
            </button>
          </div>
        </header>

        <p
          id="knowledgeMessage"
          class="message"
        ></p>

        <section class="knowledge-toolbar">
          <input
            id="knowledgeSearch"
            type="search"
            placeholder="Cerca concetto, topic, keyword..."
          />

          <span id="knowledgeVisibleCount">
            0 concetti
          </span>
        </section>

        <section
          id="knowledgeConceptList"
          class="knowledge-concept-list"
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
      "#knowledgeBackButton"
    )
    ?.addEventListener(
      "click",
      onBack
    );

  document
    .querySelector(
      "#knowledgeReviewQueueButton"
    )
    ?.addEventListener(
      "click",
      onOpenReviewQueue
    );

  document
    .querySelector(
      "#knowledgeSearch"
    )
    ?.addEventListener(
      "input",
      (event) => {
        state.searchText =
          event.target.value;

        renderConcepts();
      }
    );

  document
    .querySelector(
      "#knowledgeRebuildButton"
    )
    ?.addEventListener(
      "click",
      async () => {
        if (
          state.rebuilding
        ) {
          return;
        }

        const button =
          document.querySelector(
            "#knowledgeRebuildButton"
          );

        const message =
          document.querySelector(
            "#knowledgeMessage"
          );

        state.rebuilding =
          true;

        if (button) {
          button.disabled =
            true;

          button.textContent =
            "Ricostruzione...";
        }

        try {
          const result =
            await rebuildKnowledgeConcepts(
              user
            );

          if (message) {
            message.textContent =
              `${result.approvedQuestions} domande approvate, ${result.conceptsCreated} concetti creati.`;

            message.className =
              "message success";
          }

          await loadConcepts();
        } catch (error) {
          console.error(
            "Knowledge rebuild error:",
            error
          );

          if (message) {
            message.textContent =
              error.message ||
              "Ricostruzione non riuscita.";

            message.className =
              "message error";
          }
        } finally {
          state.rebuilding =
            false;

          if (button) {
            button.disabled =
              false;

            button.textContent =
              "↻ Ricostruisci concetti";
          }
        }
      }
    );

  try {
    await loadConcepts();
  } catch (error) {
    console.error(
      "Knowledge concepts loading error:",
      error
    );

    const message =
      document.querySelector(
        "#knowledgeMessage"
      );

    if (message) {
      message.textContent =
        error.message ||
        "Caricamento non riuscito.";

      message.className =
        "message error";
    }
  }
}
