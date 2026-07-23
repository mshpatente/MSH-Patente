import {
  argomenti
} from "../data/argomenti.js";

import {
  topics
} from "../data/topics.js";

import {
  archiveTheoryLesson,
  createTheoryLesson,
  getAdminTheoryLesson,
  loadAdminTheoryLessons,
  permanentlyDeleteTheoryLesson,
  removeTheoryImage,
  restoreTheoryLesson,
  updateTheoryLesson,
  uploadTheoryImage
} from "../services/adminTheoryService.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function getStatusLabel(status) {
  const labels = {
    draft: "Bozza",
    published: "Pubblicata",
    archived: "Archiviata"
  };

  return (
    labels[status] ||
    "Bozza"
  );
}

function getStatusClass(status) {
  const classes = {
    draft:
      "admin-status-draft",

    published:
      "admin-status-published",

    archived:
      "admin-status-archived"
  };

  return (
    classes[status] ||
    classes.draft
  );
}

function createEmptyLesson() {
  return {
    id: "",
    title: "",
    slug: "",
    argomentoId: "",
    topicId: "",
    order: 1,
    estimatedMinutes: 3,
    status: "draft",
    published: false,
    summary: "",
    theoryText: "",
    correctBehavior: "",
    remember: "",
    commonMistake: "",
    magicTrick: "",
    imageUrl: "",
    imageStoragePath: "",

    translations: {
      bn: {
        title: "",
        subtitle: "",
        summary: "",
        theoryText: "",
        correctBehavior: "",
        remember: "",
        commonMistake: "",
        magicTrick: "",
        imageAlt: ""
      },

      en: {
        title: "",
        subtitle: "",
        summary: "",
        theoryText: "",
        correctBehavior: "",
        remember: "",
        commonMistake: "",
        magicTrick: "",
        imageAlt: ""
      }
    }
  };
}

function createSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      "");
}

function createAdminLessonId() {
  const randomPart =
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `lesson-${randomPart}`;
}

function revokePendingImagePreview() {
  if (
    state.pendingImagePreviewUrl &&
    state.pendingImagePreviewUrl
      .startsWith("blob:")
  ) {
    URL.revokeObjectURL(
      state.pendingImagePreviewUrl
    );
  }

  state.pendingImagePreviewUrl = "";
}

export async function showAdminTheory({
  container,
  user,
  onBack
}) {
  const state = {
  lessons: [],

  selectedLesson:
    createEmptyLesson(),

  searchText: "",
  statusFilter: "all",
  argomentoFilter: "all",

  saving: false,
  uploading: false,
  loading: true,

  pendingImageFile: null,
  pendingImagePreviewUrl: "",
  imageStoragePathToDelete: ""
};

  function getSelectedArgomentoTopics() {
    if (
      !state.selectedLesson
        .argomentoId
    ) {
      return [];
    }

    return topics
      .filter(
        (topic) =>
          topic.argomentoId ===
          state.selectedLesson
            .argomentoId
      )
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
      );
  }

  function getFilteredLessons() {
    const searchText =
      normalizeSearchText(
        state.searchText
      );

    return state.lessons.filter(
      (lesson) => {
        const matchesStatus =
          state.statusFilter ===
            "all" ||
          lesson.status ===
            state.statusFilter;

        const matchesArgomento =
          state.argomentoFilter ===
            "all" ||
          lesson.argomentoId ===
            state.argomentoFilter;

        const searchableText =
          normalizeSearchText(
            [
              lesson.title,
              lesson.slug,
              lesson.summary,
              lesson.theoryText,
              lesson.argomentoId,
              lesson.topicId
            ].join(" ")
          );

        const matchesSearch =
          !searchText ||
          searchableText.includes(
            searchText
          );

        return (
          matchesStatus &&
          matchesArgomento &&
          matchesSearch
        );
      }
    );
  }

  function findArgomentoTitle(
    argomentoId
  ) {
    const argomento =
      argomenti.find(
        (item) =>
          item.id ===
          argomentoId
      );

    return (
      argomento?.title ||
      argomentoId ||
      "Argomento"
    );
  }

  function findTopicTitle(
    topicId
  ) {
    const topic =
      topics.find(
        (item) =>
          item.id === topicId
      );

    return (
      topic?.title ||
      topicId ||
      "Topic"
    );
  }

  function setMessage(
    message,
    type = "success"
  ) {
    const messageElement =
      document.querySelector(
        "#adminTheoryMessage"
      );

    if (!messageElement) {
      return;
    }

    messageElement.textContent =
      message;

    messageElement.className =
      `message ${type}`;
  }

  function clearMessage() {
    const messageElement =
      document.querySelector(
        "#adminTheoryMessage"
      );

    if (!messageElement) {
      return;
    }

    messageElement.textContent = "";
    messageElement.className =
      "message";
  }

function clearPendingImage() {
  if (
    state.pendingImagePreviewUrl &&
    state.pendingImagePreviewUrl
      .startsWith("blob:")
  ) {
    URL.revokeObjectURL(
      state.pendingImagePreviewUrl
    );
  }

  state.pendingImageFile = null;
  state.pendingImagePreviewUrl = "";
}

  function renderTopicOptions() {
    const topicSelect =
      document.querySelector(
        "#adminLessonTopic"
      );

    if (!topicSelect) {
      return;
    }

    const availableTopics =
      getSelectedArgomentoTopics();

    topicSelect.innerHTML = `
      <option value="">
        Seleziona topic
      </option>

      ${availableTopics
        .map(
          (topic) => `
            <option
              value="${escapeHtml(
                topic.id
              )}"
              ${
                topic.id ===
                state.selectedLesson
                  .topicId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                topic.title
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function renderEditor() {
    const editorContainer =
      document.querySelector(
        "#adminTheoryEditor"
      );

    if (!editorContainer) {
      return;
    }

    const lesson =
      state.selectedLesson;

   const editing =
  Boolean(lesson.id);

const imagePreviewUrl =
  state.pendingImagePreviewUrl ||
  lesson.imageUrl ||
  "";

editorContainer.innerHTML = `
      <div class="admin-editor-header">
        <div>
          <p class="eyebrow">
            ${
              editing
                ? "MODIFICA CONTENUTO"
                : "NUOVO CONTENUTO"
            }
          </p>

          <h2>
            ${
              editing
                ? escapeHtml(
                    lesson.title ||
                    "Lezione"
                  )
                : "Crea una nuova lezione"
            }
          </h2>

          ${
            editing
              ? `
                <p class="admin-document-id">
                  ID:
                  ${escapeHtml(
                    lesson.id
                  )}
                </p>
              `
              : `
                <p class="admin-editor-subtitle">
                  Compila i campi e salva
                  come bozza o pubblica.
                </p>
              `
          }
        </div>

        ${
          editing
            ? `
              <button
                id="adminNewLessonButton"
                class="btn btn-secondary"
                type="button"
              >
                + Nuova lezione
              </button>
            `
            : ""
        }
      </div>

      <form
        id="adminTheoryForm"
        class="admin-theory-form"
      >
        <section class="admin-form-section">
          <div class="admin-form-section-title">
            <span>1</span>

            <div>
              <h3>
                Informazioni principali
              </h3>

              <p>
                Titolo, categoria, topic
                e ordine della lezione.
              </p>
            </div>
          </div>

          <div class="admin-form-grid">
            <label
              class="
                admin-form-field
                admin-form-field-full
              "
            >
              <span>
                Titolo della lezione *
              </span>

              <input
                id="adminLessonTitle"
                type="text"
                value="${escapeHtml(
                  lesson.title
                )}"
                placeholder="
                  Es. Segnale di strada
                  deformata
                "
                required
              />
            </label>

            <label class="admin-form-field">
              <span>
                Slug
              </span>

              <input
                id="adminLessonSlug"
                type="text"
                value="${escapeHtml(
                  lesson.slug
                )}"
                placeholder="
                  segnale-strada-deformata
                "
              />
            </label>

            <label class="admin-form-field">
  <span>
    Ordine *
  </span>

  <input
    id="adminLessonOrder"
    type="number"
    min="1"
    step="1"
    value="${Number(
      lesson.order || 1
    )}"
    required
  />
</label>

<label class="admin-form-field">
  <span>
    Durata stimata *
  </span>

  <input
    id="adminLessonEstimatedMinutes"
    type="number"
    min="1"
    max="60"
    step="1"
    value="${Number(
      lesson.estimatedMinutes || 3
    )}"
    required
  />

  <small>
    Tempo medio di lettura in minuti.
  </small>
</label>

<label class="admin-form-field">
  <span>
    Argomento *
  </span>

              <select
                id="adminLessonArgomento"
                required
              >
                <option value="">
                  Seleziona argomento
                </option>

                ${[...argomenti]
                  .sort(
                    (
                      first,
                      second
                    ) =>
                      Number(
                        first.order ||
                        0
                      ) -
                      Number(
                        second.order ||
                        0
                      )
                  )
                  .map(
                    (argomento) => `
                      <option
                        value="${escapeHtml(
                          argomento.id
                        )}"
                        ${
                          argomento.id ===
                          lesson.argomentoId
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          argomento.icon ||
                          ""
                        )}
                        ${escapeHtml(
                          argomento.title
                        )}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </label>

            <label class="admin-form-field">
              <span>
                Topic *
              </span>

              <select
                id="adminLessonTopic"
                required
              ></select>
            </label>

            <label class="admin-form-field">
              <span>
                Stato
              </span>

              <select
                id="adminLessonStatus"
              >
                <option
                  value="draft"
                  ${
                    lesson.status ===
                    "draft"
                      ? "selected"
                      : ""
                  }
                >
                  Bozza
                </option>

                <option
                  value="published"
                  ${
                    lesson.status ===
                    "published"
                      ? "selected"
                      : ""
                  }
                >
                  Pubblicata
                </option>

                <option
                  value="archived"
                  ${
                    lesson.status ===
                    "archived"
                      ? "selected"
                      : ""
                  }
                >
                  Archiviata
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="admin-form-section">
  <div class="admin-form-section-title">
    <span>2</span>

    <div>
      <h3>
        Immagine
      </h3>

      <p>
        Carica un'immagine JPG, PNG
        o WEBP. Massimo 5 MB.
      </p>
    </div>
  </div>

  <div class="admin-url-image-manager">
    <div
      id="adminImagePreview"
      class="admin-image-preview"
    >
      ${
        imagePreviewUrl
          ? `
              <img
                src="${escapeHtml(
                  imagePreviewUrl
                )}"
                alt="${escapeHtml(
                  lesson.title ||
                  "Immagine lezione"
                )}"
                onerror="
                  this.style.display='none';
                  this.nextElementSibling.style.display='flex';
                "
              />

              <div
                class="admin-invalid-image"
                style="display: none;"
              >
                <span>⚠️</span>

                <strong>
                  Immagine non disponibile
                </strong>
              </div>
            `
          : `
              <div class="admin-empty-image">
                <span>🖼️</span>

                <strong>
                  Nessuna immagine
                </strong>

                <small>
                  Seleziona un'immagine
                  dal dispositivo.
                </small>
              </div>
            `
      }
    </div>

    <div class="admin-image-url-controls">
      <label
        class="
          admin-form-field
          admin-form-field-full
        "
      >
        <span>
          File immagine
        </span>

        <input
          id="adminLessonImageFile"
          type="file"
          accept="
            image/jpeg,
            image/png,
            image/webp
          "
        />

        <small>
          Formati consentiti:
          JPG, PNG e WEBP.
          Dimensione massima: 5 MB.
        </small>
      </label>

      <div class="admin-image-url-actions">
        ${
          imagePreviewUrl
            ? `
                <button
                  id="adminRemoveImageButton"
                  class="btn btn-danger"
                  type="button"
                >
                  Rimuovi immagine
                </button>
              `
            : ""
        }
      </div>

      ${
        state.pendingImageFile
          ? `
              <div class="admin-image-url-help">
                <strong>
                  Nuova immagine selezionata
                </strong>

                <p>
                  ${escapeHtml(
                    state.pendingImageFile.name
                  )}
                </p>

                <small>
                  L'immagine sarà caricata
                  quando salvi la lezione.
                </small>
              </div>
            `
          : ""
      }
    </div>
  </div>
</section>

<section class="admin-form-section">
  <div class="admin-form-section-title">
    <span>3</span>

            <div>
              <h3>
                Contenuto della lezione
              </h3>

              <p>
                Scrivi la spiegazione
                completa per lo studente.
              </p>
            </div>
          </div>

          <div class="admin-form-grid">
            <label
              class="
                admin-form-field
                admin-form-field-full
              "
            >
              <span>
                Riassunto breve
              </span>

              <textarea
                id="adminLessonSummary"
                rows="3"
                placeholder="
                  Una breve introduzione
                  alla lezione...
                "
              >${escapeHtml(
                lesson.summary
              )}</textarea>
            </label>

            <label
              class="
                admin-form-field
                admin-form-field-full
              "
            >
              <span>
                Spiegazione teorica *
              </span>

              <textarea
                id="adminLessonTheoryText"
                rows="10"
                placeholder="
                  Scrivi qui tutta
                  la spiegazione...
                "
                required
              >${escapeHtml(
                lesson.theoryText
              )}</textarea>
            </label>

            <label
              class="
                admin-form-field
                admin-form-field-full
              "
            >
              <span>
                Comportamento corretto
              </span>

              <textarea
                id="adminLessonCorrectBehavior"
                rows="5"
                placeholder="
                  Cosa deve fare
                  il conducente?
                "
              >${escapeHtml(
                lesson.correctBehavior
              )}</textarea>
            </label>
          </div>
        </section>

        <section class="admin-form-section">
          <div class="admin-form-section-title">
            <span>4</span>

            <div>
              <h3>
                Blocchi di memorizzazione
              </h3>

              <p>
                Aggiungi suggerimenti,
                errori e trucchi.
              </p>
            </div>
          </div>

          <div class="admin-form-grid">
            <label class="admin-form-field">
              <span>
                Da ricordare
              </span>

              <textarea
                id="adminLessonRemember"
                rows="6"
                placeholder="
                  Il punto più importante
                  da ricordare...
                "
              >${escapeHtml(
                lesson.remember
              )}</textarea>
            </label>

            <label class="admin-form-field">
              <span>
                Errore comune
              </span>

              <textarea
                id="adminLessonCommonMistake"
                rows="6"
                placeholder="
                  L'errore che gli
                  studenti fanno spesso...
                "
              >${escapeHtml(
                lesson.commonMistake
              )}</textarea>
            </label>

            <label
              class="
                admin-form-field
                admin-form-field-full
              "
            >
              <span>
                Trucco magico
              </span>

              <textarea
                id="adminLessonMagicTrick"
                rows="4"
                placeholder="
                  Una frase semplice
                  per memorizzare...
                "
              >${escapeHtml(
                lesson.magicTrick
              )}</textarea>
            </label>
          </div>
        </section>

        <section class="admin-save-panel">
          <div>
            <strong>
              ${
                lesson.status ===
                "published"
                  ? "Lezione pubblicata"
                  : lesson.status ===
                      "archived"
                    ? "Lezione archiviata"
                    : "Bozza non pubblicata"
              }
            </strong>

            <p>
              Controlla i dati prima
              di salvare.
            </p>
          </div>

          <div class="admin-save-actions">
            <button
              id="adminSaveDraftButton"
              class="btn btn-secondary"
              type="button"
            >
              Salva come bozza
            </button>

            <button
              id="adminPublishButton"
              class="btn btn-primary"
              type="button"
            >
              Salva e pubblica
            </button>
          </div>
        </section>
      </form>
    `;

    renderTopicOptions();
    bindEditorEvents();
  }

  function renderLessonList() {
    const listContainer =
      document.querySelector(
        "#adminTheoryLessonList"
      );

    const resultCount =
      document.querySelector(
        "#adminTheoryResultCount"
      );

    if (
      !listContainer ||
      !resultCount
    ) {
      return;
    }

    const filteredLessons =
      getFilteredLessons();

    resultCount.textContent =
      `${filteredLessons.length} ${
        filteredLessons.length === 1
          ? "lezione"
          : "lezioni"
      }`;

    if (
      filteredLessons.length === 0
    ) {
      listContainer.innerHTML = `
        <div class="admin-empty-list">
          <span>📚</span>

          <h3>
            Nessuna lezione trovata
          </h3>

          <p>
            Crea una nuova lezione
            oppure modifica i filtri.
          </p>

          <button
            id="adminEmptyNewLessonButton"
            class="btn btn-primary"
            type="button"
          >
            + Nuova lezione
          </button>
        </div>
      `;

      document
        .querySelector(
          "#adminEmptyNewLessonButton"
        )
        .addEventListener(
          "click",
          openNewLesson
        );

      return;
    }

    listContainer.innerHTML =
      filteredLessons
        .map(
          (lesson) => `
            <article
              class="
                admin-lesson-list-item
                ${
                  state.selectedLesson
                    .id === lesson.id
                    ? "admin-lesson-selected"
                    : ""
                }
              "
            >
              <button
                class="
                  admin-lesson-main-button
                "
                data-action="edit"
                data-lesson-id="${escapeHtml(
                  lesson.id
                )}"
                type="button"
              >
                <div
                  class="
                    admin-lesson-thumbnail
                  "
                >
                  ${
                    lesson.imageUrl
                      ? `
                        <img
                          src="${escapeHtml(
                            lesson.imageUrl
                          )}"
                          alt=""
                        />
                      `
                      : `
                        <span>📖</span>
                      `
                  }
                </div>

                <div
                  class="
                    admin-lesson-list-content
                  "
                >
                  <div
                    class="
                      admin-lesson-list-top
                    "
                  >
                    <strong>
                      ${escapeHtml(
                        lesson.title ||
                        "Senza titolo"
                      )}
                    </strong>

                    <span
                      class="
                        admin-status-badge
                        ${getStatusClass(
                          lesson.status
                        )}
                      "
                    >
                      ${getStatusLabel(
                        lesson.status
                      )}
                    </span>
                  </div>

                  <p>
                    ${escapeHtml(
                      findArgomentoTitle(
                        lesson.argomentoId
                      )
                    )}
                  </p>

                  <small>
                    ${escapeHtml(
                      findTopicTitle(
                        lesson.topicId
                      )
                    )}
                    · Ordine
                    ${Number(
                      lesson.order || 0
                    )}
                  </small>
                </div>
              </button>

              <div
                class="
                  admin-lesson-item-actions
                "
              >
                ${
                  lesson.status ===
                    "archived"
                    ? `
                      <button
                        class="
                          admin-icon-action
                        "
                        data-action="restore"
                        data-lesson-id="${escapeHtml(
                          lesson.id
                        )}"
                        type="button"
                        title="
                          Ripristina bozza
                        "
                      >
                        ↩️
                      </button>
                    `
                    : `
                      <button
                        class="
                          admin-icon-action
                        "
                        data-action="archive"
                        data-lesson-id="${escapeHtml(
                          lesson.id
                        )}"
                        type="button"
                        title="Archivia"
                      >
                        📦
                      </button>
                    `
                }

                <button
                  class="
                    admin-icon-action
                    admin-delete-action
                  "
                  data-action="delete"
                  data-lesson-id="${escapeHtml(
                    lesson.id
                  )}"
                  type="button"
                  title="
                    Elimina definitivamente
                  "
                >
                  🗑️
                </button>
              </div>
            </article>
          `
        )
        .join("");

    listContainer
      .querySelectorAll(
        "[data-action]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          async (event) => {
            event.stopPropagation();

            const lessonId =
              button.dataset
                .lessonId;

            const action =
              button.dataset.action;

            if (
              !lessonId ||
              !action
            ) {
              return;
            }

            if (action === "edit") {
              await openExistingLesson(
                lessonId
              );

              return;
            }

            if (action === "archive") {
              await handleArchiveLesson(
                lessonId
              );

              return;
            }

            if (action === "restore") {
              await handleRestoreLesson(
                lessonId
              );

              return;
            }

            if (action === "delete") {
              await handleDeleteLesson(
                lessonId
              );
            }
          }
        );
      });
  }

  function renderPage() {
    container.innerHTML = `
      <main
        class="
          page
          admin-theory-page
        "
      >
        <section
          class="
            card
            wide-card
            admin-theory-shell
          "
        >
          <header class="admin-theory-header">
            <div>
              <button
                id="backFromAdminTheoryButton"
                class="back-button"
                type="button"
              >
                ← Dashboard
              </button>

              <p class="eyebrow">
                AMMINISTRAZIONE
              </p>

              <h1>
                Gestione contenuti teoria
              </h1>

              <p class="subtitle">
                Crea, modifica, pubblica
                e organizza le lezioni
                della piattaforma.
              </p>
            </div>

            <div class="admin-header-actions">
              <button
                id="adminRefreshButton"
                class="btn btn-secondary"
                type="button"
              >
                ↻ Aggiorna
              </button>

              <button
                id="adminHeaderNewButton"
                class="btn btn-primary"
                type="button"
              >
                + Nuova lezione
              </button>
            </div>
          </header>

          <p
            id="adminTheoryMessage"
            class="message"
          ></p>

          <section class="admin-summary-grid">
            <article>
              <span>
                Tutte
              </span>

              <strong>
                ${state.lessons.length}
              </strong>
            </article>

            <article>
              <span>
                Pubblicate
              </span>

              <strong>
                ${
                  state.lessons.filter(
                    (lesson) =>
                      lesson.status ===
                      "published"
                  ).length
                }
              </strong>
            </article>

            <article>
              <span>
                Bozze
              </span>

              <strong>
                ${
                  state.lessons.filter(
                    (lesson) =>
                      lesson.status ===
                      "draft"
                  ).length
                }
              </strong>
            </article>

            <article>
              <span>
                Archiviate
              </span>

              <strong>
                ${
                  state.lessons.filter(
                    (lesson) =>
                      lesson.status ===
                      "archived"
                  ).length
                }
              </strong>
            </article>
          </section>

          <section class="admin-theory-layout">
            <aside class="admin-theory-sidebar">
              <div class="admin-sidebar-toolbar">
                <label class="admin-search-field">
                  <span>🔍</span>

                  <input
                    id="adminTheorySearch"
                    type="search"
                    placeholder="
                      Cerca una lezione...
                    "
                    value="${escapeHtml(
                      state.searchText
                    )}"
                  />
                </label>

                <div class="admin-sidebar-filters">
                  <select
                    id="adminTheoryStatusFilter"
                  >
                    <option value="all">
                      Tutti gli stati
                    </option>

                    <option
                      value="published"
                      ${
                        state.statusFilter ===
                        "published"
                          ? "selected"
                          : ""
                      }
                    >
                      Pubblicate
                    </option>

                    <option
                      value="draft"
                      ${
                        state.statusFilter ===
                        "draft"
                          ? "selected"
                          : ""
                      }
                    >
                      Bozze
                    </option>

                    <option
                      value="archived"
                      ${
                        state.statusFilter ===
                        "archived"
                          ? "selected"
                          : ""
                      }
                    >
                      Archiviate
                    </option>
                  </select>

                  <select
  id="adminTheoryArgomentoFilter"
>
                    <option value="all">
                      Tutti gli argomenti
                    </option>

                    ${argomenti
                      .map(
                        (argomento) => `
                          <option
                            value="${escapeHtml(
                              argomento.id
                            )}"
                            ${
                              state.argomentoFilter ===
                              argomento.id
                                ? "selected"
                                : ""
                            }
                          >
                            ${escapeHtml(
                              argomento.title
                            )}
                          </option>
                        `
                      )
                      .join("")}
                  </select>
                </div>

                <div
                  class="
                    admin-sidebar-result-row
                  "
                >
                  <strong
                    id="adminTheoryResultCount"
                  >
                    0 lezioni
                  </strong>
                </div>
              </div>

              <div
                id="adminTheoryLessonList"
                class="
                  admin-theory-lesson-list
                "
              ></div>
            </aside>

            <section
              id="adminTheoryEditor"
              class="admin-theory-editor"
            ></section>
          </section>
        </section>
      </main>
    `;

    bindPageEvents();
    renderLessonList();
    renderEditor();
  }

  function bindPageEvents() {
    document
      .querySelector(
        "#backFromAdminTheoryButton"
      )
      .addEventListener(
        "click",
        onBack
      );

    document
      .querySelector(
        "#adminHeaderNewButton"
      )
      .addEventListener(
        "click",
        openNewLesson
      );

    document
      .querySelector(
        "#adminRefreshButton"
      )
      .addEventListener(
        "click",
        refreshLessons
      );

    document
      .querySelector(
        "#adminTheorySearch"
      )
      .addEventListener(
        "input",
        (event) => {
          state.searchText =
            event.target.value;

          renderLessonList();
        }
      );

    document
      .querySelector(
        "#adminTheoryStatusFilter"
      )
      .addEventListener(
        "change",
        (event) => {
          state.statusFilter =
            event.target.value;

          renderLessonList();
        }
      );

    document
      .querySelector(
        "#adminTheoryArgomentoFilter"
      )
      .addEventListener(
        "change",
        (event) => {
          state.argomentoFilter =
            event.target.value;

          renderLessonList();
        }
      );
  }

  function bindEditorEvents() {
  const titleInput =
    document.querySelector(
      "#adminLessonTitle"
    );

  const slugInput =
    document.querySelector(
      "#adminLessonSlug"
    );

  const argomentoSelect =
    document.querySelector(
      "#adminLessonArgomento"
    );

  const topicSelect =
    document.querySelector(
      "#adminLessonTopic"
    );

  const imageFileInput =
  document.querySelector(
    "#adminLessonImageFile"
  );

const removeImageButton =
  document.querySelector(
    "#adminRemoveImageButton"
  );

  const saveDraftButton =
    document.querySelector(
      "#adminSaveDraftButton"
    );

  const publishButton =
    document.querySelector(
      "#adminPublishButton"
    );

  const newLessonButton =
    document.querySelector(
      "#adminNewLessonButton"
    );

  if (
    titleInput &&
    slugInput
  ) {
    titleInput.addEventListener(
      "input",
      () => {
        if (
          !slugInput.dataset
            .manuallyEdited
        ) {
          slugInput.value =
            createSlug(
              titleInput.value
            );
        }
      }
    );

    slugInput.addEventListener(
      "input",
      () => {
        slugInput.dataset
          .manuallyEdited =
          slugInput.value
            ? "true"
            : "";
      }
    );
  }

  if (argomentoSelect) {
    argomentoSelect.addEventListener(
      "change",
      () => {
        state.selectedLesson
          .argomentoId =
          argomentoSelect.value;

        state.selectedLesson
          .topicId = "";

        renderTopicOptions();
      }
    );
  }

  if (topicSelect) {
    topicSelect.addEventListener(
      "change",
      () => {
        state.selectedLesson
          .topicId =
          topicSelect.value;
      }
    );
  }

  if (imageFileInput) {
  imageFileInput.addEventListener(
    "change",
    () => {
      const file =
        imageFileInput.files?.[0];

      if (!file) {
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        imageFileInput.value = "";

        setMessage(
          "Formato non valido. Usa JPG, PNG o WEBP.",
          "error"
        );

        return;
      }

      const maximumSize =
        5 * 1024 * 1024;

      if (file.size > maximumSize) {
        imageFileInput.value = "";

        setMessage(
          "L'immagine non può superare 5 MB.",
          "error"
        );

        return;
      }

      if (
        state.selectedLesson
          .imageStoragePath
      ) {
        state.imageStoragePathToDelete =
          state.selectedLesson
            .imageStoragePath;
      }

      clearPendingImage();

      state.pendingImageFile = file;

      state.pendingImagePreviewUrl =
        URL.createObjectURL(file);

      renderEditor();

      setMessage(
        "Immagine selezionata. Salva la lezione per caricarla.",
        "success"
      );
    }
  );
}

if (removeImageButton) {
  removeImageButton.addEventListener(
    "click",
    () => {
      const confirmed =
        window.confirm(
          "Vuoi rimuovere l'immagine dalla lezione?"
        );

      if (!confirmed) {
        return;
      }

      if (
        state.selectedLesson
          .imageStoragePath
      ) {
        state.imageStoragePathToDelete =
          state.selectedLesson
            .imageStoragePath;
      }

      clearPendingImage();

      state.selectedLesson.imageUrl = "";

      state.selectedLesson
        .imageStoragePath = "";

      renderEditor();

      setMessage(
        "Immagine rimossa. Salva la lezione per confermare.",
        "success"
      );
    }
  );
}

  if (saveDraftButton) {
    saveDraftButton.addEventListener(
      "click",
      () => {
        saveLesson("draft");
      }
    );
  }

  if (publishButton) {
    publishButton.addEventListener(
      "click",
      () => {
        saveLesson("published");
      }
    );
  }

  if (newLessonButton) {
    newLessonButton.addEventListener(
      "click",
      openNewLesson
    );
  }
}

  function collectFormData(
    forcedStatus
  ) {
    return {
      id:
        state.selectedLesson.id,

      title:
        document
          .querySelector(
            "#adminLessonTitle"
          )
          .value
          .trim(),

      slug:
        document
          .querySelector(
            "#adminLessonSlug"
          )
          .value
          .trim(),

      order:
  Number(
    document
      .querySelector(
        "#adminLessonOrder"
      )
      .value
  ),

estimatedMinutes:
  Number(
    document
      .querySelector(
        "#adminLessonEstimatedMinutes"
      )
      .value
  ),

argomentoId:
        document
          .querySelector(
            "#adminLessonArgomento"
          )
          .value,

      topicId:
        document
          .querySelector(
            "#adminLessonTopic"
          )
          .value,

      status:
        forcedStatus ||
        document
          .querySelector(
            "#adminLessonStatus"
          )
          .value,

      summary:
        document
          .querySelector(
            "#adminLessonSummary"
          )
          .value
          .trim(),

      theoryText:
        document
          .querySelector(
            "#adminLessonTheoryText"
          )
          .value
          .trim(),

      correctBehavior:
        document
          .querySelector(
            "#adminLessonCorrectBehavior"
          )
          .value
          .trim(),

      remember:
        document
          .querySelector(
            "#adminLessonRemember"
          )
          .value
          .trim(),

      commonMistake:
        document
          .querySelector(
            "#adminLessonCommonMistake"
          )
          .value
          .trim(),

      magicTrick:
        document
          .querySelector(
            "#adminLessonMagicTrick"
          )
          .value
          .trim(),

      imageUrl:
  state.selectedLesson.imageUrl ||
  "",

imageStoragePath:
  state.selectedLesson
    .imageStoragePath ||
  ""
    };
  }

  async function saveLesson(
    forcedStatus
  ) {
    if (state.saving) {
      return;
    }

    clearMessage();

    const form =
      document.querySelector(
        "#adminTheoryForm"
      );

    if (!form.reportValidity()) {
      return;
    }

    const formData =
      collectFormData(
        forcedStatus
      );

    if (!formData.theoryText) {
  setMessage(
    "Scrivi la spiegazione teorica.",
    "error"
  );

  return;
}

if (
  !Number.isFinite(
    formData.estimatedMinutes
  ) ||
  formData.estimatedMinutes < 1
) {
  setMessage(
    "Inserisci una durata valida di almeno 1 minuto.",
    "error"
  );

  return;
}

state.saving = true;

    const saveButtons =
      document.querySelectorAll(
        "#adminSaveDraftButton, #adminPublishButton"
      );

    saveButtons.forEach(
      (button) => {
        button.disabled = true;
      }
    );

   let uploadedImage = null;
let lessonSaved = false;

try {
  const editingLessonId =
    state.selectedLesson.id;

  const lessonId =
    editingLessonId ||
    createAdminLessonId();

  formData.id = lessonId;

  if (state.pendingImageFile) {
    state.uploading = true;

    setMessage(
      "Caricamento immagine...",
      "success"
    );

    uploadedImage =
      await uploadTheoryImage(
        user,
        state.pendingImageFile,
        lessonId
      );

    formData.imageUrl =
      uploadedImage.imageUrl;

    formData.imageStoragePath =
      uploadedImage
        .imageStoragePath;
  }

  if (editingLessonId) {
    await updateTheoryLesson(
      user,
      lessonId,
      formData
    );
  } else {
    await createTheoryLesson(
      user,
      formData
    );
  }

  lessonSaved = true;

  const oldImagePath =
    state.imageStoragePathToDelete;

  if (
    oldImagePath &&
    oldImagePath !==
      formData.imageStoragePath
  ) {
    try {
      await removeTheoryImage(
        user,
        oldImagePath
      );
    } catch (imageDeleteError) {
      console.warn(
        "Old image cleanup error:",
        imageDeleteError
      );
    }
  }

  clearPendingImage();

  state.imageStoragePathToDelete =
    "";

  await refreshLessons(
    false
  );

  await openExistingLesson(
    lessonId,
    false
  );

      setMessage(
        forcedStatus ===
          "published"
          ? "Lezione salvata e pubblicata."
          : "Lezione salvata come bozza.",
        "success"
      );
    } catch (error) {
  console.error(
    "Admin theory saving error:",
    error
  );

  if (
    uploadedImage
      ?.imageStoragePath &&
    !lessonSaved
  ) {
    try {
      await removeTheoryImage(
        user,
        uploadedImage
          .imageStoragePath
      );
    } catch (cleanupError) {
      console.warn(
        "Uploaded image cleanup error:",
        cleanupError
      );
    }
  }

  setMessage(
    error.message ||
    "Non è stato possibile salvare la lezione.",
    "error"
  );
    } finally {
      state.saving = false;
      state.uploading = false;

      document
        .querySelectorAll(
          "#adminSaveDraftButton, #adminPublishButton"
        )
        .forEach(
          (button) => {
            button.disabled = false;
          }
        );
    }
  }

  async function openExistingLesson(
    lessonId,
    showLoading = true
  ) {
   clearMessage();
clearPendingImage();

state.imageStoragePathToDelete =
  "";

if (showLoading) {
      setMessage(
        "Caricamento lezione...",
        "success"
      );
    }

    try {
      const lesson =
        await getAdminTheoryLesson(
          user,
          lessonId
        );

      if (!lesson) {
        throw new Error(
          "Lezione non trovata."
        );
      }

      state.selectedLesson = {
        ...createEmptyLesson(),
        ...lesson
      };

      renderLessonList();
      renderEditor();
      clearMessage();

      document
        .querySelector(
          "#adminTheoryEditor"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    } catch (error) {
      console.error(
        "Admin lesson loading error:",
        error
      );

      setMessage(
        error.message ||
        "Errore durante il caricamento.",
        "error"
      );
    }
  }

  function openNewLesson() {
  clearMessage();
  clearPendingImage();

  state.imageStoragePathToDelete =
    "";

  const nextOrder =
      state.lessons.length > 0
        ? Math.max(
            ...state.lessons.map(
              (lesson) =>
                Number(
                  lesson.order || 0
                )
            )
          ) + 1
        : 1;

    state.selectedLesson = {
      ...createEmptyLesson(),
      order: nextOrder
    };

    renderLessonList();
    renderEditor();

    document
      .querySelector(
        "#adminTheoryEditor"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  async function handleArchiveLesson(
    lessonId
  ) {
    const confirmed =
      window.confirm(
        "Vuoi archiviare questa lezione? Non sarà più pubblicata."
      );

    if (!confirmed) {
      return;
    }

    try {
      await archiveTheoryLesson(
        user,
        lessonId
      );

      if (
        state.selectedLesson.id ===
        lessonId
      ) {
        state.selectedLesson =
          createEmptyLesson();
      }

      await refreshLessons();

      setMessage(
        "Lezione archiviata.",
        "success"
      );
    } catch (error) {
      console.error(
        "Admin archive error:",
        error
      );

      setMessage(
        error.message ||
        "Non è stato possibile archiviare la lezione.",
        "error"
      );
    }
  }

  async function handleRestoreLesson(
    lessonId
  ) {
    try {
      await restoreTheoryLesson(
        user,
        lessonId
      );

      await refreshLessons();

      setMessage(
        "Lezione ripristinata come bozza.",
        "success"
      );
    } catch (error) {
      console.error(
        "Admin restore error:",
        error
      );

      setMessage(
        error.message ||
        "Non è stato possibile ripristinare la lezione.",
        "error"
      );
    }
  }

  async function handleDeleteLesson(
    lessonId
  ) {
    const firstConfirmation =
      window.confirm(
        "ATTENZIONE: vuoi eliminare definitivamente questa lezione?"
      );

    if (!firstConfirmation) {
      return;
    }

    const secondConfirmation =
      window.confirm(
        "L'eliminazione è permanente e rimuoverà anche l'immagine. Continuare?"
      );

    if (!secondConfirmation) {
      return;
    }

    try {
      await permanentlyDeleteTheoryLesson(
        user,
        lessonId
      );

      if (
        state.selectedLesson.id ===
        lessonId
      ) {
        state.selectedLesson =
          createEmptyLesson();
      }

      await refreshLessons();

      setMessage(
        "Lezione eliminata definitivamente.",
        "success"
      );
    } catch (error) {
      console.error(
        "Admin delete error:",
        error
      );

      setMessage(
        error.message ||
        "Non è stato possibile eliminare la lezione.",
        "error"
      );
    }
  }

  async function refreshLessons(
    rerenderPage = true
  ) {
    try {
      state.lessons =
        await loadAdminTheoryLessons(
          user
        );

      if (rerenderPage) {
        renderPage();
      } else {
        renderLessonList();
      }
    } catch (error) {
      console.error(
        "Admin theory refresh error:",
        error
      );

      throw error;
    }
  }

  container.innerHTML = `
    <main class="page">
      <section class="card loading-card">
        <div class="loading-spinner"></div>

        <p>
          Caricamento pannello amministratore...
        </p>
      </section>
    </main>
  `;

  try {
    state.lessons =
      await loadAdminTheoryLessons(
        user
      );

    state.loading = false;

    renderPage();
  } catch (error) {
    console.error(
      "Admin theory page error:",
      error
    );

    container.innerHTML = `
      <main class="page">
        <section class="card admin-access-error">
          <div class="admin-access-error-icon">
            🔒
          </div>

          <p class="eyebrow">
            ACCESSO NEGATO
          </p>

          <h1>
            Area riservata agli amministratori
          </h1>

          <p class="subtitle">
            ${
              escapeHtml(
                error.message ||
                "Non hai i permessi necessari."
              )
            }
          </p>

          <button
            id="adminAccessBackButton"
            class="btn btn-primary"
            type="button"
          >
            Torna alla dashboard
          </button>
        </section>
      </main>
    `;

    document
      .querySelector(
        "#adminAccessBackButton"
      )
      .addEventListener(
        "click",
        onBack
      );
  }
}