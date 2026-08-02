import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

import {officialSubtopics} from "../data/officialSubtopics.js";


import {
  archiveTheoryLesson,
  createTheoryLesson,
  getAdminTheoryLesson,
  loadAdminTheoryLessons,
  permanentlyDeleteTheoryLesson,
  restoreTheoryLesson,
  updateTheoryLesson,
} from "../services/adminTheoryService.js";

import {
  createEmptyLessonSection,
  getLessonSections,
  moveLessonSection,
  normalizeLessonSections,
  removeLessonSection
} from "../utils/lessonSections.js";

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
subtopicId: "",
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

sections: [
  createEmptyLessonSection(1)
],

lessonQuestions: [],

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
  onBack,
  onOpenAdminQuestions,
  onOpenAdminVideos
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

  function renderSubtopicOptions() {
  const subtopicSelect = document.querySelector(
    "#adminLessonSubtopic"
  );

  if (!subtopicSelect) {
    return;
  }

  const availableSubtopics = officialSubtopics
    .filter(
      (subtopic) =>
        subtopic.topicId ===
        state.selectedLesson.topicId
    )
    .sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

  subtopicSelect.innerHTML = `
    <option value="">
      Seleziona subtopic
    </option>

    ${availableSubtopics
      .map(
        (subtopic) => `
          <option
            value="${escapeHtml(subtopic.id)}"
            ${
              subtopic.id ===
              state.selectedLesson.subtopicId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(subtopic.title)}
          </option>
        `
      )
      .join("")}
  `;
}

function createEmptyLessonQuestion(
  order = 1
) {
  const randomPart =
    globalThis.crypto
      ?.randomUUID
      ? globalThis.crypto
          .randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return {
    id:
      `question-${randomPart}`,

    question: "",

    answer: true,

    explanation: "",

    imageUrl: "",

    order:
      Math.max(
        1,
        Number(order || 1)
      ),

    status: "draft",

    published: false,

    isNew: true
  };
}

function normalizeLessonQuestion(
  questionData = {},
  fallbackOrder = 1
) {
  const rawAnswer =
    questionData.answer;

  return {
    id:
      String(
        questionData.id || ""
      ).trim() ||
      createEmptyLessonQuestion(
        fallbackOrder
      ).id,

    question:
      String(
        questionData.question ||
        questionData.questionText ||
        ""
      ).trim(),

    answer:
      rawAnswer === false ||
      rawAnswer === "false" ||
      rawAnswer === 0
        ? false
        : true,

    explanation:
      String(
        questionData.explanation ||
        ""
      ).trim(),

    imageUrl:
      String(
        questionData.imageUrl ||
        questionData.image ||
        ""
      ).trim(),

    order:
      Math.max(
        1,
        Number(
          questionData.order ||
          fallbackOrder
        )
      ),

    status:
      [
        "draft",
        "published",
        "archived"
      ].includes(
        questionData.status
      )
        ? questionData.status
        : "draft",

    published:
      questionData.published ===
        true ||
      questionData.status ===
        "published",

    isNew:
      questionData.isNew === true
  };
}

function normalizeLessonQuestions(
  questions = []
) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map(
      (question, index) =>
        normalizeLessonQuestion(
          question,
          index + 1
        )
    )
    .sort(
      (first, second) =>
        Number(first.order || 0) -
        Number(second.order || 0)
    )
    .map(
      (question, index) => ({
        ...question,
        order: index + 1
      })
    );
}

function ensureLessonEditorCollections() {
  const currentSections =
    Array.isArray(
      state.selectedLesson.sections
    )
      ? state.selectedLesson.sections
      : [];

  /*
   * Editor-এর মধ্যে খালি নতুন Section
   * রাখা জরুরি। তাই এখানে
   * normalizeLessonSections() ব্যবহার
   * করা হচ্ছে না—ওটি খালি Section
   * মুছে দেয়।
   */
  state.selectedLesson.sections =
    currentSections.length > 0
      ? currentSections.map(
          (section, index) => {
            const emptySection =
              createEmptyLessonSection(
                index + 1
              );

            return {
              ...emptySection,
              ...section,

              id:
                String(
                  section?.id ||
                  emptySection.id
                ).trim(),

              order: index + 1,

              title:
                String(
                  section?.title || ""
                ),

              imageUrl:
                String(
                  section?.imageUrl || ""
                ),

              imageAlt:
                String(
                  section?.imageAlt || ""
                ),

              imageCaption:
                String(
                  section?.imageCaption ||
                  ""
                ),

              description:
                String(
                  section?.description ||
                  ""
                ),

              audioText:
                String(
                  section?.audioText || ""
                ),

              audioUrl:
                String(
                  section?.audioUrl || ""
                ),

              youtubeUrl:
                String(
                  section?.youtubeUrl ||
                  ""
                )
            };
          }
        )
      : [
          createEmptyLessonSection(1)
        ];

  state.selectedLesson
    .lessonQuestions =
    normalizeLessonQuestions(
      state.selectedLesson
        .lessonQuestions
    );
}

function renderSectionImagePreview(
  section
) {
  if (!section.imageUrl) {
    return `
      <div
        class="
          admin-section-image-empty
        "
      >
        <span>🖼️</span>

        <strong>
          Nessuna immagine
        </strong>

        <small>
          Inserisci un URL immagine.
        </small>
      </div>
    `;
  }

  return `
    <img
      src="${escapeHtml(
        section.imageUrl
      )}"
      alt="${escapeHtml(
        section.imageAlt ||
        section.title ||
        "Immagine sezione"
      )}"
      loading="lazy"
      onerror="
        this.style.display='none';
        this.nextElementSibling.style.display='flex';
      "
    />

    <div
      class="
        admin-invalid-image
      "
      style="display: none;"
    >
      <span>⚠️</span>

      <strong>
        Immagine non disponibile
      </strong>
    </div>
  `;
}

function renderLessonSectionCard(
  section,
  index,
  totalSections
) {
  const sectionNumber =
    index + 1;

  return `
    <article
      class="
        admin-lesson-section-editor
      "
      data-section-id="${escapeHtml(
        section.id
      )}"
    >
      <header
        class="
          admin-lesson-section-header
        "
      >
        <div
          class="
            admin-lesson-section-heading
          "
        >
          <span
            class="
              admin-lesson-section-number
            "
          >
            ${sectionNumber}
          </span>

          <div>
            <h4>
              ${
                section.title
                  ? escapeHtml(
                      section.title
                    )
                  : `Sezione ${sectionNumber}`
              }
            </h4>

            <p>
              Immagine, spiegazione,
              audio e video di questa
              sezione.
            </p>
          </div>
        </div>

        <div
          class="
            admin-section-order-actions
          "
        >
          <button
            class="
              btn
              btn-secondary
              admin-section-move-button
            "
            data-section-action="move-up"
            data-section-id="${escapeHtml(
              section.id
            )}"
            type="button"
            title="Sposta in alto"
            ${
              index === 0
                ? "disabled"
                : ""
            }
          >
            ↑
          </button>

          <button
            class="
              btn
              btn-secondary
              admin-section-move-button
            "
            data-section-action="move-down"
            data-section-id="${escapeHtml(
              section.id
            )}"
            type="button"
            title="Sposta in basso"
            ${
              index ===
              totalSections - 1
                ? "disabled"
                : ""
            }
          >
            ↓
          </button>

          <button
            class="
              btn
              btn-danger
              admin-section-delete-button
            "
            data-section-action="delete"
            data-section-id="${escapeHtml(
              section.id
            )}"
            type="button"
            title="Elimina sezione"
            ${
              totalSections === 1
                ? "disabled"
                : ""
            }
          >
            🗑️
          </button>
        </div>
      </header>

      <div
        class="
          admin-form-grid
          admin-section-fields-grid
        "
      >
        <label
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            Titolo della sezione *
          </span>

          <input
            class="
              admin-section-input
            "
            data-section-field="title"
            data-section-id="${escapeHtml(
              section.id
            )}"
            type="text"
            value="${escapeHtml(
              section.title
            )}"
            placeholder="
              Es. Che cos'è una strada
            "
            required
          />
        </label>

        <div
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            Immagine della sezione
          </span>

          <div
            class="
              admin-section-image-layout
            "
          >
            <div
              class="
                admin-section-image-preview
              "
            >
              ${renderSectionImagePreview(
                section
              )}
            </div>

            <div
              class="
                admin-section-image-fields
              "
            >
              <label
                class="
                  admin-form-field
                  admin-form-field-full
                "
              >
                <span>
                  URL immagine
                </span>

                <input
                  class="
                    admin-section-input
                  "
                  data-section-field="imageUrl"
                  data-section-id="${escapeHtml(
                    section.id
                  )}"
                  type="text"
                  value="${escapeHtml(
                    section.imageUrl
                  )}"
                  placeholder="
                    /images/lessons/nome-immagine.jpg
                  "
                />

                <small>
                  Usa un URL pubblico oppure
                  un percorso in
                  /images/lessons/.
                </small>
              </label>

              <label
                class="
                  admin-form-field
                  admin-form-field-full
                "
              >
                <span>
                  Testo alternativo
                </span>

                <input
                  class="
                    admin-section-input
                  "
                  data-section-field="imageAlt"
                  data-section-id="${escapeHtml(
                    section.id
                  )}"
                  type="text"
                  value="${escapeHtml(
                    section.imageAlt
                  )}"
                  placeholder="
                    Descrizione breve dell'immagine
                  "
                />
              </label>

              <label
                class="
                  admin-form-field
                  admin-form-field-full
                "
              >
                <span>
                  Didascalia immagine
                </span>

                <input
                  class="
                    admin-section-input
                  "
                  data-section-field="imageCaption"
                  data-section-id="${escapeHtml(
                    section.id
                  )}"
                  type="text"
                  value="${escapeHtml(
                    section.imageCaption
                  )}"
                  placeholder="
                    Testo mostrato sotto l'immagine
                  "
                />
              </label>
            </div>
          </div>
        </div>

        <label
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            Spiegazione della sezione *
          </span>

          <textarea
            class="
              admin-section-input
            "
            data-section-field="description"
            data-section-id="${escapeHtml(
              section.id
            )}"
            rows="8"
            placeholder="
              Scrivi la spiegazione relativa
              a questa immagine...
            "
            required
          >${escapeHtml(
            section.description
          )}</textarea>
        </label>

        <label
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            Testo da leggere con l'audio
          </span>

          <textarea
            class="
              admin-section-input
            "
            data-section-field="audioText"
            data-section-id="${escapeHtml(
              section.id
            )}"
            rows="5"
            placeholder="
              Lascia vuoto per usare
              automaticamente la spiegazione.
            "
          >${escapeHtml(
            section.audioText
          )}</textarea>

          <small>
            Il pulsante audio leggerà soltanto
            questa sezione.
          </small>
        </label>

        <label
          class="admin-form-field"
        >
          <span>
            URL audio professionale
          </span>

          <input
            class="
              admin-section-input
            "
            data-section-field="audioUrl"
            data-section-id="${escapeHtml(
              section.id
            )}"
            type="text"
            value="${escapeHtml(
              section.audioUrl
            )}"
            placeholder="
              https://.../audio.mp3
            "
          />

          <small>
            Opzionale. Se presente,
            avrà priorità sulla voce
            automatica.
          </small>
        </label>

        <label
          class="admin-form-field"
        >
          <span>
            URL video YouTube
          </span>

          <input
            class="
              admin-section-input
            "
            data-section-field="youtubeUrl"
            data-section-id="${escapeHtml(
              section.id
            )}"
            type="text"
            value="${escapeHtml(
              section.youtubeUrl
            )}"
            placeholder="
              https://www.youtube.com/watch?v=...
            "
          />

          <small>
            Video specifico per questa
            sezione.
          </small>
        </label>
      </div>
    </article>
  `;
}

function renderLessonQuestionCard(
  question,
  index,
  totalQuestions
) {
  const questionNumber =
    index + 1;

  return `
    <article
      class="
        admin-lesson-question-editor
      "
      data-question-id="${escapeHtml(
        question.id
      )}"
    >
      <header
        class="
          admin-lesson-question-header
        "
      >
        <div
          class="
            admin-lesson-question-heading
          "
        >
          <span
            class="
              admin-lesson-question-number
            "
          >
            ${questionNumber}
          </span>

          <div>
            <h4>
              Domanda ${questionNumber}
            </h4>

            <p>
              Questa domanda sarà utilizzata
              nei quiz della piattaforma.
            </p>
          </div>
        </div>

        <div
          class="
            admin-question-order-actions
          "
        >
          <button
            class="
              btn
              btn-secondary
              admin-question-action-button
            "
            data-question-action="move-up"
            data-question-id="${escapeHtml(
              question.id
            )}"
            type="button"
            ${
              index === 0
                ? "disabled"
                : ""
            }
          >
            ↑
          </button>

          <button
            class="
              btn
              btn-secondary
              admin-question-action-button
            "
            data-question-action="move-down"
            data-question-id="${escapeHtml(
              question.id
            )}"
            type="button"
            ${
              index ===
              totalQuestions - 1
                ? "disabled"
                : ""
            }
          >
            ↓
          </button>

          <button
            class="
              btn
              btn-danger
              admin-question-action-button
            "
            data-question-action="delete"
            data-question-id="${escapeHtml(
              question.id
            )}"
            type="button"
          >
            🗑️
          </button>
        </div>
      </header>

      <div class="admin-form-grid">
        <label
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            Testo della domanda *
          </span>

          <textarea
            class="
              admin-question-input
            "
            data-question-field="question"
            data-question-id="${escapeHtml(
              question.id
            )}"
            rows="4"
            placeholder="
              Scrivi la domanda vero o falso...
            "
            required
          >${escapeHtml(
            question.question
          )}</textarea>
        </label>

        <fieldset
          class="
            admin-question-answer-fieldset
            admin-form-field-full
          "
        >
          <legend>
            Risposta corretta *
          </legend>

          <label>
            <input
              class="
                admin-question-answer-input
              "
              data-question-id="${escapeHtml(
                question.id
              )}"
              type="radio"
              name="question-answer-${escapeHtml(
                question.id
              )}"
              value="true"
              ${
                question.answer === true
                  ? "checked"
                  : ""
              }
            />

            <span>
              ✅ Vero
            </span>
          </label>

          <label>
            <input
              class="
                admin-question-answer-input
              "
              data-question-id="${escapeHtml(
                question.id
              )}"
              type="radio"
              name="question-answer-${escapeHtml(
                question.id
              )}"
              value="false"
              ${
                question.answer === false
                  ? "checked"
                  : ""
              }
            />

            <span>
              ❌ Falso
            </span>
          </label>
        </fieldset>

        <label
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            Spiegazione della risposta *
          </span>

          <textarea
            class="
              admin-question-input
            "
            data-question-field="explanation"
            data-question-id="${escapeHtml(
              question.id
            )}"
            rows="5"
            placeholder="
              Spiega perché la frase
              è vera oppure falsa...
            "
            required
          >${escapeHtml(
            question.explanation
          )}</textarea>
        </label>

        <label
          class="
            admin-form-field
            admin-form-field-full
          "
        >
          <span>
            URL immagine domanda
          </span>

          <input
            class="
              admin-question-input
            "
            data-question-field="imageUrl"
            data-question-id="${escapeHtml(
              question.id
            )}"
            type="text"
            value="${escapeHtml(
              question.imageUrl
            )}"
            placeholder="
              /images/questions/nome-immagine.jpg
            "
          />
        </label>
      </div>
    </article>
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

  ensureLessonEditorCollections();

  const lesson =
    state.selectedLesson;

  const editing =
    Boolean(lesson.id);

  const sections =
    lesson.sections;

  const lessonQuestions =
    lesson.lessonQuestions;

  /*
   * পুরোনো field-এর value রাখা হচ্ছে,
   * যাতে migration চলাকালে পুরোনো
   * lesson compatibility নষ্ট না হয়।
   */
  const firstSection =
    sections[0] || null;

  const legacyImageUrl =
    lesson.imageUrl ||
    firstSection?.imageUrl ||
    "";

  const legacyTheoryText =
    lesson.theoryText ||
    firstSection?.description ||
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
                  Crea la lezione, aggiungi
                  sezioni e prepara le domande
                  del quiz in un unico posto.
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
      <!-- =================================================
           1. INFORMAZIONI PRINCIPALI
           ================================================= -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>1</span>

          <div>
            <h3>
              Informazioni principali
            </h3>

            <p>
              Titolo, classificazione,
              ordine e stato della lezione.
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
                Es. Definizione di strada
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
                definizione-di-strada
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
              max="180"
              step="1"
              value="${Number(
                lesson.estimatedMinutes ||
                3
              )}"
              required
            />

            <small>
              Tempo medio di studio
              in minuti.
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
                      first.order || 0
                    ) -
                    Number(
                      second.order || 0
                    )
                )
                .map(
                  (argomento) => `
                    <option
                      value="${escapeHtml(
                        argomento.id
                      )}"
                      ${
                        String(
                          argomento.id
                        ) ===
                        String(
                          lesson.argomentoId
                        )
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
              Subtopic *
            </span>

            <select
              id="adminLessonSubtopic"
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

          <label
            class="
              admin-form-field
              admin-form-field-full
            "
          >
            <span>
              Introduzione breve
            </span>

            <textarea
              id="adminLessonSummary"
              rows="4"
              placeholder="
                Presenta brevemente
                l'obiettivo della lezione...
              "
            >${escapeHtml(
              lesson.summary
            )}</textarea>
          </label>
        </div>
      </section>

      <!-- =================================================
           2. SEZIONI DELLA LEZIONE
           ================================================= -->

      <section
        class="
          admin-form-section
          admin-sections-builder
        "
      >
        <div
          class="
            admin-form-section-title
            admin-builder-main-heading
          "
        >
          <span>2</span>

          <div>
            <h3>
              Sezioni della lezione
            </h3>

            <p>
              Ogni sezione può avere
              immagine, descrizione,
              audio e video propri.
            </p>
          </div>

          <button
            id="adminAddLessonSectionButton"
            class="btn btn-primary"
            type="button"
          >
            + Aggiungi sezione
          </button>
        </div>

        <div class="admin-theory-floating-actions">
  <button
    id="floatingAddSectionButton"
    class="admin-theory-floating-button"
    type="button"
  >
    ＋ Aggiungi sezione
  </button>

  <button
    id="floatingAddQuestionButton"
    class="
      admin-theory-floating-button
      admin-theory-floating-question
    "
    type="button"
  >
    ＋ Aggiungi domanda
  </button>
</div>

        <div
          id="adminLessonSectionsList"
          class="
            admin-lesson-sections-list
          "
        >
          ${sections
            .map(
              (
                section,
                index
              ) =>
                renderLessonSectionCard(
                  section,
                  index,
                  sections.length
                )
            )
            .join("")}
        </div>

        <div
          class="
            admin-builder-bottom-action
          "
        >
          <button
            id="adminAddLessonSectionBottomButton"
            class="
              btn
              btn-secondary
            "
            type="button"
          >
            + Aggiungi un'altra sezione
          </button>
        </div>
      </section>

      <!-- =================================================
           3. MEMORIZZAZIONE GENERALE
           ================================================= -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>3</span>

          <div>
            <h3>
              Memorizzazione generale
            </h3>

            <p>
              Suggerimenti validi per
              l'intera lezione.
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
                Il concetto principale
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
                L'errore che gli studenti
                commettono spesso...
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
              Comportamento corretto
            </span>

            <textarea
              id="adminLessonCorrectBehavior"
              rows="5"
              placeholder="
                Qual è il comportamento
                corretto?
              "
            >${escapeHtml(
              lesson.correctBehavior
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

      <!-- =================================================
           4. DOMANDE DELLA LEZIONE
           ================================================= -->

      <section
        class="
          admin-form-section
          admin-questions-builder
        "
      >
        <div
          class="
            admin-form-section-title
            admin-builder-main-heading
          "
        >
          <span>4</span>

          <div>
            <h3>
              Domande della lezione
            </h3>

            <p>
              Le domande saranno usate
              nel quiz della lezione,
              nei quiz progressivi e
              nelle simulazioni.
            </p>
          </div>

          <button
            id="adminAddLessonQuestionButton"
            class="btn btn-primary"
            type="button"
          >
            + Aggiungi domanda
          </button>
        </div>

        <div
          id="adminLessonQuestionsList"
          class="
            admin-lesson-questions-list
          "
        >
          ${
            lessonQuestions.length > 0
              ? lessonQuestions
                  .map(
                    (
                      question,
                      index
                    ) =>
                      renderLessonQuestionCard(
                        question,
                        index,
                        lessonQuestions.length
                      )
                  )
                  .join("")
              : `
                  <div
                    class="
                      admin-empty-question-list
                    "
                  >
                    <span>❓</span>

                    <h4>
                      Nessuna domanda aggiunta
                    </h4>

                    <p>
                      Puoi salvare una bozza
                      senza domande oppure
                      aggiungerle adesso.
                    </p>

                    <button
                      id="adminEmptyAddQuestionButton"
                      class="
                        btn
                        btn-secondary
                      "
                      type="button"
                    >
                      + Crea la prima domanda
                    </button>
                  </div>
                `
          }
        </div>
      </section>

      <!-- =================================================
           LEGACY COMPATIBILITY
           Questi field verranno rimossi dopo
           il completamento della migrazione.
           ================================================= -->

      <div
        class="
          admin-legacy-fields
        "
        hidden
        aria-hidden="true"
      >
        <input
          id="adminLessonImageUrl"
          type="hidden"
          value="${escapeHtml(
            legacyImageUrl
          )}"
        />

        <textarea
          id="adminLessonTheoryText"
        >${escapeHtml(
          legacyTheoryText
        )}</textarea>
      </div>

      <!-- =================================================
           5. SALVATAGGIO
           ================================================= -->

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
            ${
              sections.length
            }
            ${
              sections.length === 1
                ? "sezione"
                : "sezioni"
            }
            ·
            ${
              lessonQuestions.length
            }
            ${
              lessonQuestions.length === 1
                ? "domanda"
                : "domande"
            }
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
  renderSubtopicOptions();
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
    id="adminOpenQuestionsButton"
    class="btn btn-secondary"
    type="button"
  >
    ❓ Domande quiz
  </button>

  <button
  id="adminOpenVideosButton"
  class="btn btn-secondary"
  type="button"
>
  🎬 Video lezioni
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
    "#adminOpenQuestionsButton"
  )
  ?.addEventListener(
    "click",
    () => {
      onOpenAdminQuestions?.();
    }
  );

  document
  .querySelector(
    "#adminOpenVideosButton"
  )
  ?.addEventListener(
    "click",
    () => {
      onOpenAdminVideos?.();
    }
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

function updateSelectedLessonField(
  fieldName,
  value
) {
  state.selectedLesson = {
    ...state.selectedLesson,
    [fieldName]: value
  };
}

function updateLessonSection(
  sectionId,
  fieldName,
  value
) {
  state.selectedLesson.sections =
    state.selectedLesson.sections.map(
      (section) =>
        String(section.id) ===
        String(sectionId)
          ? {
              ...section,
              [fieldName]: value
            }
          : section
    );
}

function updateLessonQuestion(
  questionId,
  fieldName,
  value
) {
  state.selectedLesson
    .lessonQuestions =
    state.selectedLesson
      .lessonQuestions
      .map(
        (question) =>
          String(question.id) ===
          String(questionId)
            ? {
                ...question,
                [fieldName]: value
              }
            : question
      );
}

function synchronizeMainEditorFields() {
  const fieldMappings = [
    {
      selector:
        "#adminLessonTitle",
      field: "title",
      transform:
        (value) =>
          String(value || "").trim()
    },
    {
      selector:
        "#adminLessonSlug",
      field: "slug",
      transform:
        (value) =>
          String(value || "").trim()
    },
    {
      selector:
        "#adminLessonOrder",
      field: "order",
      transform:
        (value) =>
          Math.max(
            1,
            Number(value || 1)
          )
    },
    {
      selector:
        "#adminLessonEstimatedMinutes",
      field:
        "estimatedMinutes",
      transform:
        (value) =>
          Math.max(
            1,
            Number(value || 1)
          )
    },
    {
      selector:
        "#adminLessonArgomento",
      field: "argomentoId"
    },
    {
      selector:
        "#adminLessonTopic",
      field: "topicId"
    },
    {
      selector:
        "#adminLessonSubtopic",
      field: "subtopicId"
    },
    {
      selector:
        "#adminLessonStatus",
      field: "status"
    },
    {
      selector:
        "#adminLessonSummary",
      field: "summary",
      transform:
        (value) =>
          String(value || "").trim()
    },
    {
      selector:
        "#adminLessonRemember",
      field: "remember",
      transform:
        (value) =>
          String(value || "").trim()
    },
    {
      selector:
        "#adminLessonCommonMistake",
      field:
        "commonMistake",
      transform:
        (value) =>
          String(value || "").trim()
    },
    {
      selector:
        "#adminLessonCorrectBehavior",
      field:
        "correctBehavior",
      transform:
        (value) =>
          String(value || "").trim()
    },
    {
      selector:
        "#adminLessonMagicTrick",
      field: "magicTrick",
      transform:
        (value) =>
          String(value || "").trim()
    }
  ];

  fieldMappings.forEach(
    ({
      selector,
      field,
      transform
    }) => {
      const element =
        document.querySelector(
          selector
        );

      if (!element) {
        return;
      }

      const rawValue =
        element.value;

      state.selectedLesson[field] =
        transform
          ? transform(rawValue)
          : rawValue;
    }
  );
}

function synchronizeSectionFields() {
  document
    .querySelectorAll(
      ".admin-section-input"
    )
    .forEach((input) => {
      const sectionId =
        input.dataset.sectionId;

      const fieldName =
        input.dataset.sectionField;

      if (
        !sectionId ||
        !fieldName
      ) {
        return;
      }

      updateLessonSection(
        sectionId,
        fieldName,
        input.value
      );
    });

  state.selectedLesson.sections =
    state.selectedLesson.sections
      .map(
        (section, index) => ({
          ...section,

          title:
            String(
              section.title || ""
            ).trim(),

          imageUrl:
            String(
              section.imageUrl || ""
            ).trim(),

          imageAlt:
            String(
              section.imageAlt || ""
            ).trim(),

          imageCaption:
            String(
              section.imageCaption ||
              ""
            ).trim(),

          description:
            String(
              section.description ||
              ""
            ).trim(),

          audioText:
            String(
              section.audioText || ""
            ).trim(),

          audioUrl:
            String(
              section.audioUrl || ""
            ).trim(),

          youtubeUrl:
            String(
              section.youtubeUrl || ""
            ).trim(),

          order: index + 1
        })
      );
}

function synchronizeQuestionFields() {
  document
    .querySelectorAll(
      ".admin-question-input"
    )
    .forEach((input) => {
      const questionId =
        input.dataset.questionId;

      const fieldName =
        input.dataset.questionField;

      if (
        !questionId ||
        !fieldName
      ) {
        return;
      }

      updateLessonQuestion(
        questionId,
        fieldName,
        input.value
      );
    });

  document
    .querySelectorAll(
      ".admin-question-answer-input:checked"
    )
    .forEach((input) => {
      const questionId =
        input.dataset.questionId;

      if (!questionId) {
        return;
      }

      updateLessonQuestion(
        questionId,
        "answer",
        input.value === "true"
      );
    });

  state.selectedLesson
    .lessonQuestions =
    state.selectedLesson
      .lessonQuestions
      .map(
        (question, index) => ({
          ...question,

          question:
            String(
              question.question || ""
            ).trim(),

          explanation:
            String(
              question.explanation ||
              ""
            ).trim(),

          imageUrl:
            String(
              question.imageUrl || ""
            ).trim(),

          order: index + 1
        })
      );
}

function synchronizeCompleteEditor() {
  synchronizeMainEditorFields();
  synchronizeSectionFields();
  synchronizeQuestionFields();

  const firstSection =
    state.selectedLesson
      .sections[0];

  /*
   * পুরোনো reader ও পুরোনো lesson
   * compatibility বজায় রাখতে
   * প্রথম section-এর data legacy
   * field-এও রাখা হচ্ছে।
   */
  state.selectedLesson.imageUrl =
    firstSection?.imageUrl || "";

  state.selectedLesson.theoryText =
    firstSection?.description || "";
}

function reorderEditorItems(
  items,
  itemId,
  direction
) {
  const currentIndex =
    items.findIndex(
      (item) =>
        String(item.id) ===
        String(itemId)
    );

  if (currentIndex < 0) {
    return items;
  }

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= items.length
  ) {
    return items;
  }

  const reorderedItems =
    [...items];

  const currentItem =
    reorderedItems[currentIndex];

  reorderedItems[currentIndex] =
    reorderedItems[targetIndex];

  reorderedItems[targetIndex] =
    currentItem;

  return reorderedItems.map(
    (item, index) => ({
      ...item,
      order: index + 1
    })
  );
}

function addLessonSection() {
  synchronizeCompleteEditor();

  const nextOrder =
    state.selectedLesson
      .sections.length + 1;

  state.selectedLesson.sections = [
    ...state.selectedLesson.sections,

    createEmptyLessonSection(
      nextOrder
    )
  ];

  renderEditor();

  requestAnimationFrame(() => {
    const sectionCards =
      document.querySelectorAll(
        ".admin-lesson-section-editor"
      );

    const lastSection =
      sectionCards[
        sectionCards.length - 1
      ];

    lastSection
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    lastSection
      ?.querySelector(
        '[data-section-field="title"]'
      )
      ?.focus();
  });
}

function deleteLessonSection(
  sectionId
) {
  synchronizeCompleteEditor();

  if (
    state.selectedLesson
      .sections.length <= 1
  ) {
    setMessage(
      "La lezione deve contenere almeno una sezione.",
      "error"
    );

    return;
  }

  const selectedSection =
    state.selectedLesson
      .sections
      .find(
        (section) =>
          String(section.id) ===
          String(sectionId)
      );

  const hasContent =
    Boolean(
      selectedSection?.title ||
      selectedSection?.imageUrl ||
      selectedSection
        ?.description ||
      selectedSection?.audioText ||
      selectedSection?.audioUrl ||
      selectedSection?.youtubeUrl
    );

  if (
    hasContent &&
    !window.confirm(
      "Vuoi eliminare questa sezione e tutto il suo contenuto?"
    )
  ) {
    return;
  }

  state.selectedLesson.sections =
    state.selectedLesson
      .sections
      .filter(
        (section) =>
          String(section.id) !==
          String(sectionId)
      )
      .map(
        (section, index) => ({
          ...section,
          order: index + 1
        })
      );

  renderEditor();

  setMessage(
    "Sezione rimossa. Salva la lezione per confermare.",
    "success"
  );
}

function moveLessonSectionInEditor(
  sectionId,
  direction
) {
  synchronizeCompleteEditor();

  state.selectedLesson.sections =
    reorderEditorItems(
      state.selectedLesson.sections,
      sectionId,
      direction
    );

  renderEditor();
}

function addLessonQuestion() {
  synchronizeCompleteEditor();

  const nextOrder =
    state.selectedLesson
      .lessonQuestions.length + 1;

  state.selectedLesson
    .lessonQuestions = [
      ...state.selectedLesson
        .lessonQuestions,

      createEmptyLessonQuestion(
        nextOrder
      )
    ];

  renderEditor();

  requestAnimationFrame(() => {
    const questionCards =
      document.querySelectorAll(
        ".admin-lesson-question-editor"
      );

    const lastQuestion =
      questionCards[
        questionCards.length - 1
      ];

    lastQuestion
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    lastQuestion
      ?.querySelector(
        '[data-question-field="question"]'
      )
      ?.focus();
  });
}

function deleteLessonQuestion(
  questionId
) {
  synchronizeCompleteEditor();

  const selectedQuestion =
    state.selectedLesson
      .lessonQuestions
      .find(
        (question) =>
          String(question.id) ===
          String(questionId)
      );

  const hasContent =
    Boolean(
      selectedQuestion?.question ||
      selectedQuestion
        ?.explanation ||
      selectedQuestion?.imageUrl
    );

  if (
    hasContent &&
    !window.confirm(
      "Vuoi eliminare definitivamente questa domanda dalla lezione?"
    )
  ) {
    return;
  }

  state.selectedLesson
    .lessonQuestions =
    state.selectedLesson
      .lessonQuestions
      .filter(
        (question) =>
          String(question.id) !==
          String(questionId)
      )
      .map(
        (question, index) => ({
          ...question,
          order: index + 1
        })
      );

  renderEditor();

  setMessage(
    "Domanda rimossa. Salva la lezione per confermare.",
    "success"
  );
}

function moveLessonQuestionInEditor(
  questionId,
  direction
) {
  synchronizeCompleteEditor();

  state.selectedLesson
    .lessonQuestions =
    reorderEditorItems(
      state.selectedLesson
        .lessonQuestions,
      questionId,
      direction
    );

  renderEditor();
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

  const subtopicSelect =
    document.querySelector(
      "#adminLessonSubtopic"
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

  /*
   * Titolo থেকে automatic slug
   */
  if (
    titleInput &&
    slugInput
  ) {
    titleInput.addEventListener(
      "input",
      () => {
        state.selectedLesson.title =
          titleInput.value;

        if (
          !slugInput.dataset
            .manuallyEdited
        ) {
          slugInput.value =
            createSlug(
              titleInput.value
            );

          state.selectedLesson.slug =
            slugInput.value;
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

        state.selectedLesson.slug =
          slugInput.value;
      }
    );
  }

  /*
   * Argomento → Topic
   */
  argomentoSelect
    ?.addEventListener(
      "change",
      () => {
        synchronizeCompleteEditor();

        state.selectedLesson
          .argomentoId =
          argomentoSelect.value;

        state.selectedLesson
          .topicId = "";

        state.selectedLesson
          .subtopicId = "";

        renderTopicOptions();
        renderSubtopicOptions();
      }
    );

  /*
   * Topic → Subtopic
   */
  topicSelect
    ?.addEventListener(
      "change",
      () => {
        synchronizeCompleteEditor();

        state.selectedLesson
          .topicId =
          topicSelect.value;

        state.selectedLesson
          .subtopicId = "";

        renderSubtopicOptions();
      }
    );

  subtopicSelect
    ?.addEventListener(
      "change",
      () => {
        state.selectedLesson
          .subtopicId =
          subtopicSelect.value;
      }
    );

  /*
   * Section input update
   */
  document
    .querySelectorAll(
      ".admin-section-input"
    )
    .forEach((input) => {
      const updateValue = () => {
        const sectionId =
          input.dataset.sectionId;

        const fieldName =
          input.dataset.sectionField;

        if (
          !sectionId ||
          !fieldName
        ) {
          return;
        }

        updateLessonSection(
          sectionId,
          fieldName,
          input.value
        );
      };

      input.addEventListener(
        "input",
        updateValue
      );

      input.addEventListener(
        "change",
        () => {
          updateValue();

          if (
            input.dataset
              .sectionField ===
            "imageUrl"
          ) {
            synchronizeCompleteEditor();
            renderEditor();
          }
        }
      );
    });

  /*
   * Add Section
   */
  document
    .querySelector(
      "#adminAddLessonSectionButton"
    )
    ?.addEventListener(
      "click",
      addLessonSection
    );

  document
    .querySelector(
      "#adminAddLessonSectionBottomButton"
    )
    ?.addEventListener(
      "click",
      addLessonSection
    );

  /*
   * Move/Delete Section
   */
  document
    .querySelectorAll(
      "[data-section-action]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const sectionId =
            button.dataset.sectionId;

          const action =
            button.dataset
              .sectionAction;

          if (
            !sectionId ||
            !action
          ) {
            return;
          }

          if (
            action === "move-up"
          ) {
            moveLessonSectionInEditor(
              sectionId,
              "up"
            );

            return;
          }

          if (
            action === "move-down"
          ) {
            moveLessonSectionInEditor(
              sectionId,
              "down"
            );

            return;
          }

          if (
            action === "delete"
          ) {
            deleteLessonSection(
              sectionId
            );
          }
        }
      );
    });

  /*
   * Question input update
   */
  document
    .querySelectorAll(
      ".admin-question-input"
    )
    .forEach((input) => {
      const updateValue = () => {
        const questionId =
          input.dataset.questionId;

        const fieldName =
          input.dataset.questionField;

        if (
          !questionId ||
          !fieldName
        ) {
          return;
        }

        updateLessonQuestion(
          questionId,
          fieldName,
          input.value
        );
      };

      input.addEventListener(
        "input",
        updateValue
      );

      input.addEventListener(
        "change",
        updateValue
      );
    });

  /*
   * True / False
   */
  document
    .querySelectorAll(
      ".admin-question-answer-input"
    )
    .forEach((input) => {
      input.addEventListener(
        "change",
        () => {
          if (!input.checked) {
            return;
          }

          updateLessonQuestion(
            input.dataset.questionId,
            "answer",
            input.value === "true"
          );
        }
      );
    });

  /*
   * Add Question
   */
  document
    .querySelector(
      "#adminAddLessonQuestionButton"
    )
    ?.addEventListener(
      "click",
      addLessonQuestion
    );

  document
    .querySelector(
      "#adminEmptyAddQuestionButton"
    )
    ?.addEventListener(
      "click",
      addLessonQuestion
    );

      /*
   * Floating quick-add buttons
   */
  document
    .querySelector(
      "#floatingAddSectionButton"
    )
    ?.addEventListener(
      "click",
      addLessonSection
    );

  document
    .querySelector(
      "#floatingAddQuestionButton"
    )
    ?.addEventListener(
      "click",
      addLessonQuestion
    );

  /*
   * Move/Delete Question
   */
  document
    .querySelectorAll(
      "[data-question-action]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const questionId =
            button.dataset.questionId;

          const action =
            button.dataset
              .questionAction;

          if (
            !questionId ||
            !action
          ) {
            return;
          }

          if (
            action === "move-up"
          ) {
            moveLessonQuestionInEditor(
              questionId,
              "up"
            );

            return;
          }

          if (
            action === "move-down"
          ) {
            moveLessonQuestionInEditor(
              questionId,
              "down"
            );

            return;
          }

          if (
            action === "delete"
          ) {
            deleteLessonQuestion(
              questionId
            );
          }
        }
      );
    });

  /*
   * Save
   */
  saveDraftButton
    ?.addEventListener(
      "click",
      () => {
        synchronizeCompleteEditor();
        saveLesson("draft");
      }
    );

  publishButton
    ?.addEventListener(
      "click",
      () => {
        synchronizeCompleteEditor();
        saveLesson(
          "published"
        );
      }
    );

  newLessonButton
    ?.addEventListener(
      "click",
      openNewLesson
    );
}

  function collectFormData(
  forcedStatus
) {
  synchronizeCompleteEditor();

  const sections =
    state.selectedLesson.sections
      .map(
        (section, index) => ({
          ...section,

          order: index + 1,

          title:
            String(
              section.title || ""
            ).trim(),

          imageUrl:
            String(
              section.imageUrl || ""
            ).trim(),

          imageAlt:
            String(
              section.imageAlt || ""
            ).trim(),

          imageCaption:
            String(
              section.imageCaption || ""
            ).trim(),

          description:
            String(
              section.description || ""
            ).trim(),

          audioText:
            String(
              section.audioText ||
              section.description ||
              ""
            ).trim(),

          audioUrl:
            String(
              section.audioUrl || ""
            ).trim(),

          youtubeUrl:
            String(
              section.youtubeUrl || ""
            ).trim()
        })
      );

  const lessonQuestions =
    state.selectedLesson
      .lessonQuestions
      .map(
        (question, index) => ({
          id:
            String(
              question.id || ""
            ).trim(),

          question:
            String(
              question.question || ""
            ).trim(),

          answer:
            question.answer === true,

          explanation:
            String(
              question.explanation || ""
            ).trim(),

          imageUrl:
            String(
              question.imageUrl || ""
            ).trim(),

          order: index + 1,

          status:
            forcedStatus ===
            "published"
              ? "published"
              : "draft",

          published:
            forcedStatus ===
            "published"
        })
      );

  const firstSection =
    sections[0] || null;

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

    subtopicId:
      document
        .querySelector(
          "#adminLessonSubtopic"
        )
        .value,

    status:
      forcedStatus ||
      document
        .querySelector(
          "#adminLessonStatus"
        )
        .value,

    published:
      forcedStatus ===
      "published",

    summary:
      document
        .querySelector(
          "#adminLessonSummary"
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

    sections,

    sectionCount:
      sections.length,

    lessonQuestions,

    questionCount:
      lessonQuestions.length,

    /*
     * পুরোনো reader compatibility।
     * প্রথম Section-এর data legacy
     * field-এও রাখা হচ্ছে।
     */
    theoryText:
      firstSection?.description ||
      "",

    imageUrl:
      firstSection?.imageUrl ||
      "",

    imageAlt:
      firstSection?.imageAlt ||
      "",

    imageCaption:
      firstSection
        ?.imageCaption ||
      "",

    imageStoragePath:
      state.selectedLesson
        .imageStoragePath ||
      "",

    schemaVersion: 2
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

   if (
  !Array.isArray(
    formData.sections
  ) ||
  formData.sections.length === 0
) {
  setMessage(
    "Aggiungi almeno una sezione alla lezione.",
    "error"
  );

  return;
}

const incompleteSectionIndex =
  formData.sections.findIndex(
    (section) =>
      !section.title ||
      !section.description
  );

if (
  incompleteSectionIndex >= 0
) {
  setMessage(
    `Completa il titolo e la spiegazione della sezione ${
      incompleteSectionIndex + 1
    }.`,
    "error"
  );

  return;
}

const incompleteQuestionIndex =
  formData.lessonQuestions
    .findIndex(
      (question) =>
        !question.question ||
        !question.explanation
    );

if (
  incompleteQuestionIndex >= 0
) {
  setMessage(
    `Completa la domanda e la spiegazione della domanda ${
      incompleteQuestionIndex + 1
    }.`,
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
  ...lesson,

  sections:
    getLessonSections(
      lesson
    ),

  lessonQuestions:
    normalizeLessonQuestions(
      lesson.lessonQuestions ||
      []
    )
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

  order:
    nextOrder,

  sections: [
    createEmptyLessonSection(1)
  ],

  lessonQuestions: []
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