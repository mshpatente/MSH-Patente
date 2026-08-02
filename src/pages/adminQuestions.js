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
  loadAdminQuestions,
  getAdminQuestion,
  createQuestion,
  updateQuestion,
  archiveQuestion,
  restoreQuestion,
  permanentlyDeleteQuestion,
  uploadQuestionImage,
  removeQuestionImage
} from "../services/adminQuestionService.js";


/*
|--------------------------------------------------------------------------
| সাধারণ Helper Functions
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Empty Question
|--------------------------------------------------------------------------
*/

function getArgomentoTitle(argomentoId) {
  if (!argomentoId) {
    return "Nessun argomento";
  }

  const argomento =
    argomenti.find(
      (item) =>
        item.id === argomentoId
    );

  return (
    argomento?.title ||
    argomento?.name ||
    argomentoId
  );
}

function getTopicTitle(topicId) {
  if (!topicId) {
    return "Nessun topic";
  }

  const topic =
    topics.find(
      (item) =>
        item.id === topicId
    );

  return (
    topic?.title ||
    topic?.name ||
    topicId
  );
}

function createEmptyQuestion() {
  return {
    id: "",

    argomentoId: "",
    topicId: "",

    subtopicId: "",
subtopicTitle: "",
lessonId: "",

    question: "",
    answer: true,
    explanation: "",

    imageUrl: "",
    imageStoragePath: "",

    order: 1,

    status: "draft",
    published: false
  };
}


/*
|--------------------------------------------------------------------------
| নতুন Question ID
|--------------------------------------------------------------------------
*/

function createQuestionId() {
  const randomPart =
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `question-${randomPart}`;
}


/*
|--------------------------------------------------------------------------
| Admin Questions Page
|--------------------------------------------------------------------------
*/

export async function showAdminQuestions(
  app,
  user,
  {
    onBack
  } = {}
) {
  /*
  |--------------------------------------------------------------------------
  | Page State
  |--------------------------------------------------------------------------
  */

  const state = {
    questions: [],

    selectedQuestion:
      createEmptyQuestion(),

    searchText: "",
    statusFilter: "all",
    argomentoFilter: "all",
    topicFilter: "all",
    sortBy: "order-asc",

    saving: false,
    uploading: false,
    loading: true,

    pendingImageFile: null,
    pendingImagePreviewUrl: "",

    imageStoragePathToDelete: ""
  };


  /*
  |--------------------------------------------------------------------------
  | Selected Argomento-এর Topics
  |--------------------------------------------------------------------------
  */

  function getSelectedArgomentoTopics() {
  if (
    !state.selectedQuestion
      .argomentoId
  ) {
    return [];
  }

  return topics
    .filter(
      (topic) =>
        topic.argomentoId ===
        state.selectedQuestion
          .argomentoId
    )
    .sort(
      (first, second) =>
        Number(first.order || 0) -
        Number(second.order || 0)
    );
}

/*
|--------------------------------------------------------------------------
| Sidebar Topic Filter Options
|--------------------------------------------------------------------------
*/

function renderTopicFilterOptions() {
  const topicFilter =
    document.querySelector(
      "#adminQuestionTopicFilter"
    );

  if (!topicFilter) {
    return;
  }

  const availableTopics =
    state.argomentoFilter === "all"
      ? topics
      : topics.filter(
          (topic) =>
            topic.argomentoId ===
            state.argomentoFilter
        );

  topicFilter.innerHTML = `
    <option value="all">
      Tutti i topic
    </option>

    ${availableTopics
      .slice()
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
      )
      .map(
        (topic) => `
          <option
            value="${escapeHtml(
              topic.id
            )}"
            ${
              state.topicFilter ===
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

/*
|--------------------------------------------------------------------------
| Topic Dropdown
|--------------------------------------------------------------------------
*/


  function renderTopicOptions() {
    const topicSelect =
      document.querySelector(
        "#adminQuestionTopic"
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
                state.selectedQuestion
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
  const subtopicSelect =
    document.querySelector(
      "#adminQuestionSubtopic"
    );

  if (!subtopicSelect) {
    return;
  }

  const availableSubtopics =
    officialSubtopics
      .filter(
        (subtopic) =>
          subtopic.topicId ===
          state.selectedQuestion.topicId
      )
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
      );

  subtopicSelect.innerHTML = `
    <option value="">
      Seleziona subtopic
    </option>

    ${availableSubtopics
      .map(
        (subtopic) => `
          <option
            value="${escapeHtml(
              subtopic.id
            )}"
            ${
              subtopic.id ===
              state.selectedQuestion.subtopicId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(
              subtopic.title
            )}
          </option>
        `
      )
      .join("")}
  `;
}

  /*
  |--------------------------------------------------------------------------
  | Phase 1 Temporary Editor
  |--------------------------------------------------------------------------
  |
  | পরবর্তী Phase-এ এই function-এর মধ্যে সম্পূর্ণ Question Form আসবে।
  |
  */

  function renderEditor() {
  const editorContainer =
    document.querySelector(
      "#adminQuestionEditor"
    );

  if (!editorContainer) {
    return;
  }

  const question =
    state.selectedQuestion;

  const hasQuestion =
    Boolean(question.id);

    const existingQuestion =
  state.questions.some(
    (item) =>
      item.id === question.id
  );

  /*
  |--------------------------------------------------------------------------
  | কোনো Question নির্বাচন করা না থাকলে
  |--------------------------------------------------------------------------
  */

  if (!hasQuestion) {
    editorContainer.innerHTML = `
      <div class="admin-editor-header">
        <div>
          <p class="eyebrow">
            EDITOR DOMANDA
          </p>

          <h2>
            Seleziona o crea una domanda
          </h2>

          <p class="admin-editor-subtitle">
            Premi “Nuova domanda”
            per iniziare.
          </p>
        </div>
      </div>

      <div class="admin-empty-list">
        <span>❓</span>

        <h3>
          Nessuna domanda selezionata
        </h3>

        <p>
          Crea una nuova domanda
          per aprire l'editor.
        </p>

        <button
          id="adminEditorNewQuestionButton"
          class="btn btn-primary"
          type="button"
        >
          + Nuova domanda
        </button>
      </div>
    `;

    document
      .querySelector(
        "#adminEditorNewQuestionButton"
      )
      ?.addEventListener(
        "click",
        openNewQuestion
      );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Argomento Options
  |--------------------------------------------------------------------------
  */

  const argomentoOptions =
    argomenti
      .slice()
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
      )
      .map(
        (argomento) => {
          const argomentoTitle =
            argomento.title ||
            argomento.name ||
            argomento.id;

          return `
            <option
              value="${escapeHtml(
                argomento.id
              )}"
              ${
                argomento.id ===
                question.argomentoId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                argomentoTitle
              )}
            </option>
          `;
        }
      )
      .join("");

  /*
  |--------------------------------------------------------------------------
  | Question Form
  |--------------------------------------------------------------------------
  */

  editorContainer.innerHTML = `
    <div class="admin-editor-header">
      <div>
       <p class="eyebrow">
  ${
    existingQuestion
      ? "MODIFICA DOMANDA"
      : "NUOVA DOMANDA"
  }
</p>

<h2>
  ${
    existingQuestion
      ? "Modifica la domanda"
      : "Crea una nuova domanda"
  }
</h2>

        <p class="admin-document-id">
          ID:
          ${escapeHtml(
            question.id
          )}
        </p>
      </div>

      <span
        class="
          admin-status-badge
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

    <form
      id="adminQuestionForm"
      class="admin-editor-form"
    >
      <!-- Question Text -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>❓</span>

          <div>
            <h3>
              Testo della domanda
            </h3>

            <p>
              Scrivi la frase che sarà
              mostrata durante il quiz.
            </p>
          </div>
        </div>

        <label class="admin-form-field">
          <span>
            Domanda *
          </span>

          <textarea
            id="adminQuestionText"
            rows="5"
            maxlength="500"
            placeholder="Scrivi qui la domanda..."
            required
          >${escapeHtml(
            question.question
          )}</textarea>

          <small>
            Massimo 500 caratteri
          </small>
        </label>
      </section>

      <!-- Correct Answer -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>✓</span>

          <div>
            <h3>
              Risposta corretta
            </h3>

            <p>
              Seleziona se la frase
              è vera oppure falsa.
            </p>
          </div>
        </div>

        <div class="admin-answer-choice-grid">
          <label class="admin-answer-choice">
            <input
              id="adminQuestionAnswerTrue"
              type="radio"
              name="adminQuestionAnswer"
              value="true"
              ${
                question.answer === true
                  ? "checked"
                  : ""
              }
            />

            <span>
              <strong>
                Vero
              </strong>

              <small>
                La frase è corretta
              </small>
            </span>
          </label>

          <label class="admin-answer-choice">
            <input
              id="adminQuestionAnswerFalse"
              type="radio"
              name="adminQuestionAnswer"
              value="false"
              ${
                question.answer === false
                  ? "checked"
                  : ""
              }
            />

            <span>
              <strong>
                Falso
              </strong>

              <small>
                La frase non è corretta
              </small>
            </span>
          </label>
        </div>
      </section>

      <!-- Classification -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>📚</span>

          <div>
            <h3>
              Classificazione
            </h3>

            <p>
              Collega la domanda a un
              argomento e a un topic.
            </p>
          </div>
        </div>

        <div class="admin-form-grid">
          <label class="admin-form-field">
            <span>
              Argomento *
            </span>

            <select
              id="adminQuestionArgomento"
              required
            >
              <option value="">
                Seleziona argomento
              </option>

              ${argomentoOptions}
            </select>
          </label>

          <label class="admin-form-field">
            <span>
              Topic *
            </span>

            <select
              id="adminQuestionTopic"
              required
            >
              <option value="">
                Seleziona prima
                un argomento
              </option>
            </select>
          </label>
          <label class="admin-form-field">
    <span>Subtopic *</span>

    <select
        id="adminQuestionSubtopic"
        required
    ></select>
</label>
        </div>
      </section>

            <!-- Smart Quiz Classification -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>🧠</span>

          <div>
            <h3>
              Classificazione Smart Quiz
            </h3>

            <p>
              Collega facoltativamente la domanda
              a un sottoargomento e a una lezione.
            </p>
          </div>
        </div>

        <div class="admin-form-grid">
          <label class="admin-form-field">
            <span>
              Lesson ID
            </span>

            <input
              id="adminQuestionLessonId"
              type="text"
              maxlength="150"
              placeholder="Esempio: lesson-dosso"
              value="${escapeHtml(
                question.lessonId || ""
              )}"
            />

            <small>
              ID della lezione collegata
            </small>
          </label>
        </div>
      </section>

      <!-- Explanation -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>💡</span>

          <div>
            <h3>
              Spiegazione
            </h3>

            <p>
              Spiega perché la risposta
              è vera oppure falsa.
            </p>
          </div>
        </div>

        <label class="admin-form-field">
          <span>
            Spiegazione
          </span>

          <textarea
            id="adminQuestionExplanation"
            rows="5"
            maxlength="1000"
            placeholder="Scrivi una spiegazione..."
          >${escapeHtml(
            question.explanation
          )}</textarea>

          <small>
            Massimo 1000 caratteri
          </small>
        </label>
      </section>

      <!-- Order and Status -->

      <section class="admin-form-section">
        <div class="admin-form-section-title">
          <span>⚙️</span>

          <div>
            <h3>
              Impostazioni
            </h3>

            <p>
              Configura ordine e stato
              della domanda.
            </p>
          </div>
        </div>

        <div class="admin-form-grid">
          <label class="admin-form-field">
            <span>
              Ordine
            </span>

            <input
              id="adminQuestionOrder"
              type="number"
              min="1"
              step="1"
              value="${Number(
                question.order || 1
              )}"
            />
          </label>

          <label class="admin-form-field">
            <span>
              Stato
            </span>

            <select
              id="adminQuestionStatus"
            >
              <option
                value="draft"
                ${
                  question.status ===
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
                  question.status ===
                  "published"
                    ? "selected"
                    : ""
                }
              >
                Pubblicata
              </option>
            </select>
          </label>
        </div>
      </section>

      <!-- Image -->

      <section class="admin-form-section">
  <div class="admin-form-section-title">
    <span>🖼️</span>

    <div>
      <h3>Immagine</h3>

      <p>
        Carica un'immagine opzionale
        per questa domanda.
      </p>
    </div>
  </div>

  <label class="admin-form-field">
    <span>File immagine</span>

    <input
      id="adminQuestionImage"
      type="file"
      accept="image/*"
    />
  </label>

  <div id="adminQuestionImagePreview">
    ${
      state.pendingImagePreviewUrl
        ? `
          <img
            src="${escapeHtml(state.pendingImagePreviewUrl)}"
            alt="Anteprima"
            style="
              max-width:220px;
              border-radius:8px;
            "
          />
        `
        : question.imageUrl
        ? `
          <img
            src="${escapeHtml(question.imageUrl)}"
            alt="Anteprima"
            style="
              max-width:220px;
              border-radius:8px;
            "
          />
        `
        : `<p>Nessuna immagine selezionata.</p>`
    }
  </div>
</section>

      <!-- Temporary Form Message -->

      <p
        id="adminQuestionFormMessage"
        class="message"
      ></p>

      <!-- Actions -->

      <div class="admin-editor-actions">
  ${
    existingQuestion &&
    question.status !== "archived"
      ? `
        <button
          id="adminQuestionArchiveButton"
          class="btn btn-secondary"
          type="button"
        >
          Archivia
        </button>
      `
      : ""
  }

  ${
    existingQuestion &&
    question.status === "archived"
      ? `
        <button
          id="adminQuestionRestoreButton"
          class="btn btn-secondary"
          type="button"
        >
          Ripristina
        </button>
      `
      : ""
  }

  ${
  existingQuestion &&
  question.status === "archived"
    ? `
      <button
        id="adminQuestionDeleteButton"
        class="btn btn-secondary"
        type="button"
      >
        Elimina definitivamente
      </button>
    `
    : ""
}

  <button
    id="adminQuestionCancelButton"
    class="btn btn-secondary"
    type="button"
  >
    Annulla
  </button>

  <button
    id="adminQuestionSaveDraftButton"
    class="btn btn-secondary"
    type="button"
  >
    ${
      existingQuestion
        ? "Salva modifiche"
        : "Salva bozza"
    }
  </button>

  <button
    id="adminQuestionPublishButton"
    class="btn btn-primary"
    type="button"
  >
    Pubblica
  </button>

    </form>
  `;

  /*
  |--------------------------------------------------------------------------
  | Topic Options তৈরি করা
  |--------------------------------------------------------------------------
  */

renderTopicOptions();
renderSubtopicOptions();

/*
|--------------------------------------------------------------------------
| Form State Listeners
|--------------------------------------------------------------------------
*/

  document
    .querySelector(
      "#adminQuestionText"
    )
    ?.addEventListener(
      "input",
      (event) => {
        state.selectedQuestion.question =
          event.target.value;
      }
    );

  document
    .querySelector(
      "#adminQuestionExplanation"
    )
    ?.addEventListener(
      "input",
      (event) => {
        state.selectedQuestion.explanation =
          event.target.value;
      }
    );

  document
    .querySelector(
      "#adminQuestionAnswerTrue"
    )
    ?.addEventListener(
      "change",
      () => {
        state.selectedQuestion.answer =
          true;
      }
    );

  document
    .querySelector(
      "#adminQuestionAnswerFalse"
    )
    ?.addEventListener(
      "change",
      () => {
        state.selectedQuestion.answer =
          false;
      }
    );

  document
    .querySelector(
      "#adminQuestionArgomento"
    )
    ?.addEventListener(
      "change",
      (event) => {
        state.selectedQuestion.argomentoId =
          event.target.value;

        state.selectedQuestion.topicId = "";
state.selectedQuestion.subtopicId = "";
state.selectedQuestion.subtopicTitle = "";

renderTopicOptions();
renderSubtopicOptions();
      }
    );

  document
    .querySelector(
      "#adminQuestionTopic"
    )
    ?.addEventListener(
      "change",
      (event) => {
        state.selectedQuestion.topicId =
event.target.value;

state.selectedQuestion.subtopicId = "";
state.selectedQuestion.subtopicTitle = "";

renderSubtopicOptions();
      }
    );

      document
.querySelector("#adminQuestionSubtopic")
?.addEventListener(
"change",
(event)=>{

const subtopicId =
event.target.value;

const selectedSubtopic =
officialSubtopics.find(
(subtopic)=>
subtopic.id===subtopicId
);

state.selectedQuestion.subtopicId =
subtopicId;

state.selectedQuestion.subtopicTitle =
selectedSubtopic?.title || "";

});

  document
    .querySelector(
      "#adminQuestionLessonId"
    )
    ?.addEventListener(
      "input",
      (event) => {
        state.selectedQuestion.lessonId =
          event.target.value;
      }
    );

  document
    .querySelector(
      "#adminQuestionOrder"
    )
    ?.addEventListener(
      "input",
      (event) => {
        const order =
          Number(event.target.value);

        state.selectedQuestion.order =
          Number.isFinite(order) &&
          order >= 1
            ? order
            : 1;
      }
    );

  document
    .querySelector(
      "#adminQuestionStatus"
    )
    ?.addEventListener(
      "change",
      (event) => {
        const status =
          event.target.value;

        state.selectedQuestion.status =
          status;

        state.selectedQuestion.published =
          status === "published";
      }
    );
    document
  .querySelector("#adminQuestionImage")
  ?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    state.pendingImageFile = file;

    if (state.pendingImagePreviewUrl) {
      URL.revokeObjectURL(
        state.pendingImagePreviewUrl
      );
    }

    state.pendingImagePreviewUrl =
      URL.createObjectURL(file);

    renderEditor();
  });

  document
  .querySelector(
    "#adminQuestionArchiveButton"
  )
  ?.addEventListener(
    "click",
    archiveSelectedQuestion
  );

  document
  .querySelector(
    "#adminQuestionRestoreButton"
  )
  ?.addEventListener(
    "click",
    restoreSelectedQuestion
  );

  document
  .querySelector(
    "#adminQuestionDeleteButton"
  )
  ?.addEventListener(
    "click",
    deleteSelectedQuestion
  );

  /*
  |--------------------------------------------------------------------------
  | Cancel Button
  |--------------------------------------------------------------------------
  */

  document
    .querySelector(
      "#adminQuestionCancelButton"
    )
    ?.addEventListener(
      "click",
      () => {
        state.selectedQuestion =
          createEmptyQuestion();

        renderEditor();
        renderQuestionList();
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Form Submit বন্ধ রাখা
  |--------------------------------------------------------------------------
  */

  document
    .querySelector(
      "#adminQuestionForm"
    )
    ?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
      }
    );
document
  .querySelector(
    "#adminQuestionSaveDraftButton"
  )
  ?.addEventListener(
    "click",
    () => {
      saveQuestion("draft");
    }
  );

document
  .querySelector("#adminQuestionPublishButton")
  ?.addEventListener("click", () => {
    saveQuestion("published");
  });

}


/*
|--------------------------------------------------------------------------
| Form Data সংগ্রহ
|--------------------------------------------------------------------------
*/

function collectFormData(forcedStatus) {
  const questionText =
    document
      .querySelector(
        "#adminQuestionText"
      )
      ?.value
      .trim() || "";

  const explanation =
    document
      .querySelector(
        "#adminQuestionExplanation"
      )
      ?.value
      .trim() || "";

  const argomentoId =
    document
      .querySelector(
        "#adminQuestionArgomento"
      )
      ?.value || "";

  const topicId =
    document
      .querySelector(
        "#adminQuestionTopic"
      )
      ?.value || "";

  const subtopicId =
document.querySelector(
"#adminQuestionSubtopic"
)?.value || "";

const selectedSubtopic =
officialSubtopics.find(
(subtopic)=>
subtopic.id===subtopicId
);

const subtopicTitle =
selectedSubtopic?.title || "";

  const lessonId =
    document
      .querySelector(
        "#adminQuestionLessonId"
      )
      ?.value
      .trim() || "";

  const answerValue =
    document
      .querySelector(
        'input[name="adminQuestionAnswer"]:checked'
      )
      ?.value;

  const orderValue =
    Number(
      document
        .querySelector(
          "#adminQuestionOrder"
        )
        ?.value || 1
    );

  const selectedStatus =
    document
      .querySelector(
        "#adminQuestionStatus"
      )
      ?.value || "draft";

  const status =
    forcedStatus ||
    selectedStatus;

  return {
    id:
      state.selectedQuestion.id,

    question:
      questionText,

    answer:
  answerValue === undefined
    ? null
    : answerValue === "true",

    explanation,

    argomentoId,

    topicId,

        subtopicId,

    subtopicTitle,

    lessonId,

    order:
      Number.isFinite(orderValue) &&
      orderValue >= 1
        ? orderValue
        : 1,

    status,

    published:
      status === "published",

    imageUrl:
      state.selectedQuestion.imageUrl ||
      "",

    imageStoragePath:
      state.selectedQuestion
        .imageStoragePath ||
      ""
  };
}

  /*
  |--------------------------------------------------------------------------
  | Nuova Domanda
  |--------------------------------------------------------------------------
  */

  /*
|--------------------------------------------------------------------------
| Form Message
|--------------------------------------------------------------------------
*/

function setFormMessage(
  message,
  type = "success"
) {
  const element =
    document.querySelector(
      "#adminQuestionFormMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = message;
  element.className =
    `message ${type}`;
}

function clearFormMessage() {
  const element =
    document.querySelector(
      "#adminQuestionFormMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "message";
}

/*
|--------------------------------------------------------------------------
| Save Question
|--------------------------------------------------------------------------
*/

async function saveQuestion(forcedStatus) {
  if (state.saving) {
    return;
  }

  clearFormMessage();

  const questionData =
    collectFormData(forcedStatus);

  if (!questionData.question) {
    setFormMessage(
      "Inserisci il testo della domanda.",
      "error"
    );

    document
      .querySelector(
        "#adminQuestionText"
      )
      ?.focus();

    return;
  }

  if (
  questionData.question.length < 10
) {
  setFormMessage(
    "La domanda deve contenere almeno 10 caratteri.",
    "error"
  );

  document
    .querySelector(
      "#adminQuestionText"
    )
    ?.focus();

  return;
}

  if (!questionData.argomentoId) {
    setFormMessage(
      "Seleziona un argomento.",
      "error"
    );

    document
      .querySelector(
        "#adminQuestionArgomento"
      )
      ?.focus();

    return;
  }

  if (!questionData.topicId) {
    setFormMessage(
      "Seleziona un topic.",
      "error"
    );

    document
      .querySelector(
        "#adminQuestionTopic"
      )
      ?.focus();

    return;
  }
  if (!questionData.subtopicId) {

setFormMessage(
"Seleziona un subtopic.",
"error"
);

document
.querySelector(
"#adminQuestionSubtopic"
)
?.focus();

return;

}

  const selectedTopic =
    topics.find(
      (topic) =>
        topic.id ===
        questionData.topicId
    );

  if (
    !selectedTopic ||
    selectedTopic.argomentoId !==
      questionData.argomentoId
  ) {
    setFormMessage(
      "Il topic selezionato non appartiene all'argomento scelto.",
      "error"
    );

    document
      .querySelector(
        "#adminQuestionTopic"
      )
      ?.focus();

    return;
  }
  const selectedSubtopic =
officialSubtopics.find(
(subtopic)=>
subtopic.id===
questionData.subtopicId
);

if(
!selectedSubtopic ||
selectedSubtopic.topicId !==
questionData.topicId
){

setFormMessage(
"Il subtopic selezionato non appartiene al topic scelto.",
"error"
);

document
.querySelector(
"#adminQuestionSubtopic"
)
?.focus();

return;

}

if (questionData.answer === null) {
  setFormMessage(
    "Seleziona la risposta corretta (Vero o Falso).",
    "error"
  );

  document
    .querySelector(
      "#adminQuestionAnswerTrue"
    )
    ?.focus();

  return;
}

if (
  !Number.isInteger(questionData.order) ||
  questionData.order < 1
) {
  setFormMessage(
    "L'ordine deve essere un numero intero maggiore di zero.",
    "error"
  );

  document
    .querySelector(
      "#adminQuestionOrder"
    )
    ?.focus();

  return;
}

  state.saving = true;

  const saveDraftButton =
    document.querySelector(
      "#adminQuestionSaveDraftButton"
    );

  const publishButton =
    document.querySelector(
      "#adminQuestionPublishButton"
    );

  if (saveDraftButton) {
    saveDraftButton.disabled = true;
  }

  if (publishButton) {
    publishButton.disabled = true;
  }

  setFormMessage(
    "Salvataggio in corso...",
    "success"
  );

  try {
    if (state.pendingImageFile) {
  state.uploading = true;

  setFormMessage(
    "Caricamento immagine in corso...",
    "success"
  );

  const uploadedImage =
    await uploadQuestionImage(
      user,
      state.pendingImageFile,
      questionData.id
    );

  questionData.imageUrl =
    uploadedImage.imageUrl;

  questionData.imageStoragePath =
    uploadedImage.imageStoragePath;
}
    const existingQuestion =
      state.questions.find(
        (question) =>
          question.id === questionData.id
      );

    if (existingQuestion) {
      await updateQuestion(
        user,
        questionData.id,
        questionData
      );
    } else {
      await createQuestion(
        user,
        questionData
      );
    }

    if (state.pendingImagePreviewUrl) {
  URL.revokeObjectURL(
    state.pendingImagePreviewUrl
  );
}

state.pendingImageFile = null;
state.pendingImagePreviewUrl = "";
    state.questions =
  await loadAdminQuestions(user);

const refreshedQuestion =
  state.questions.find(
    (item) =>
      item.id === questionData.id
  );

state.selectedQuestion =
  refreshedQuestion
    ? {
        ...createEmptyQuestion(),
        ...refreshedQuestion
      }
    : createEmptyQuestion();

renderQuestionList();
renderEditor();

setFormMessage(
  questionData.status === "published"
    ? "Domanda pubblicata con successo."
    : "Bozza salvata con successo.",
  "success"
);
  } catch (error) {
    console.error(
      "Admin question save error:",
      error
    );

  

console.error(error);
    setFormMessage(
      error.message ||
        "Errore durante il salvataggio.",
      "error"
    );
  } finally {
    state.saving = false;
    state.uploading = false;

    const currentSaveDraftButton =
      document.querySelector(
        "#adminQuestionSaveDraftButton"
      );

    const currentPublishButton =
      document.querySelector(
        "#adminQuestionPublishButton"
      );

    if (currentSaveDraftButton) {
      currentSaveDraftButton.disabled =
        false;
    }

    if (currentPublishButton) {
      currentPublishButton.disabled =
        false;
    }
  }
}

async function archiveSelectedQuestion() {
  const questionId =
    state.selectedQuestion?.id;

  if (!questionId) {
    return;
  }

  const confirmed =
    window.confirm(
      "Vuoi archiviare questa domanda?"
    );

  if (!confirmed) {
    return;
  }

  if (state.saving) {
    return;
  }

  state.saving = true;

  const archiveButton =
    document.querySelector(
      "#adminQuestionArchiveButton"
    );

  if (archiveButton) {
    archiveButton.disabled = true;
  }

  clearFormMessage();

  setFormMessage(
    "Archiviazione in corso...",
    "success"
  );

  try {
    await archiveQuestion(
      user,
      questionId
    );

    state.questions =
      await loadAdminQuestions(user);

    const archivedQuestion =
      state.questions.find(
        (question) =>
          question.id === questionId
      );

    state.selectedQuestion =
      archivedQuestion
        ? {
            ...createEmptyQuestion(),
            ...archivedQuestion
          }
        : createEmptyQuestion();

    renderQuestionList();
    renderEditor();

    setFormMessage(
      "Domanda archiviata con successo.",
      "success"
    );
  } catch (error) {
    console.error(
      "Admin question archive error:",
      error
    );

    setFormMessage(
      error.message ||
        "Errore durante l'archiviazione.",
      "error"
    );
  } finally {
    state.saving = false;

    const currentArchiveButton =
      document.querySelector(
        "#adminQuestionArchiveButton"
      );

    if (currentArchiveButton) {
      currentArchiveButton.disabled =
        false;
    }
  }
}

async function restoreSelectedQuestion() {
  const questionId =
    state.selectedQuestion?.id;

  if (!questionId) {
    return;
  }

  const confirmed =
    window.confirm(
      "Vuoi ripristinare questa domanda come bozza?"
    );

  if (!confirmed) {
    return;
  }

  if (state.saving) {
    return;
  }

  state.saving = true;

  const restoreButton =
    document.querySelector(
      "#adminQuestionRestoreButton"
    );

  if (restoreButton) {
    restoreButton.disabled = true;
  }

  clearFormMessage();

  setFormMessage(
    "Ripristino in corso...",
    "success"
  );

  try {
    await restoreQuestion(
      user,
      questionId
    );

    state.questions =
      await loadAdminQuestions(user);

    const restoredQuestion =
      state.questions.find(
        (question) =>
          question.id === questionId
      );

    state.selectedQuestion =
      restoredQuestion
        ? {
            ...createEmptyQuestion(),
            ...restoredQuestion
          }
        : createEmptyQuestion();

    renderQuestionList();
    renderEditor();

    setFormMessage(
      "Domanda ripristinata come bozza.",
      "success"
    );
  } catch (error) {
    console.error(
      "Admin question restore error:",
      error
    );

    setFormMessage(
      error.message ||
        "Errore durante il ripristino.",
      "error"
    );
  } finally {
    state.saving = false;

    const currentRestoreButton =
      document.querySelector(
        "#adminQuestionRestoreButton"
      );

    if (currentRestoreButton) {
      currentRestoreButton.disabled =
        false;
    }
  }
}

async function deleteSelectedQuestion() {
  const question =
    state.selectedQuestion;

  const questionId =
    question?.id;

  if (!questionId) {
    return;
  }

  if (question.status !== "archived") {
    window.alert(
      "Solo le domande archiviate possono essere eliminate definitivamente."
    );

    return;
  }

  const firstConfirmation =
    window.confirm(
      "Vuoi eliminare definitivamente questa domanda?"
    );

  if (!firstConfirmation) {
    return;
  }

  const secondConfirmation =
    window.confirm(
      "Questa operazione è irreversibile. Confermi l'eliminazione?"
    );

  if (!secondConfirmation) {
    return;
  }

  if (state.saving) {
    return;
  }

  state.saving = true;

  const deleteButton =
    document.querySelector(
      "#adminQuestionDeleteButton"
    );

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  clearFormMessage();

  setFormMessage(
    "Eliminazione definitiva in corso...",
    "success"
  );

  try {
    await permanentlyDeleteQuestion(
      user,
      questionId
    );

    if (
      state.pendingImagePreviewUrl
    ) {
      URL.revokeObjectURL(
        state.pendingImagePreviewUrl
      );
    }

    state.pendingImageFile = null;
    state.pendingImagePreviewUrl = "";
    state.imageStoragePathToDelete = "";

    state.questions =
      await loadAdminQuestions(user);

    state.selectedQuestion =
      createEmptyQuestion();

    renderQuestionList();
    renderEditor();

    const pageMessage =
      document.querySelector(
        "#adminQuestionMessage"
      );

    if (pageMessage) {
      pageMessage.textContent =
        "Domanda eliminata definitivamente.";

      pageMessage.className =
        "message success";
    }
  } catch (error) {
    console.error(
      "Admin question permanent delete error:",
      error
    );

    setFormMessage(
      error.message ||
        "Errore durante l'eliminazione definitiva.",
      "error"
    );
  } finally {
    state.saving = false;

    const currentDeleteButton =
      document.querySelector(
        "#adminQuestionDeleteButton"
      );

    if (currentDeleteButton) {
      currentDeleteButton.disabled =
        false;
    }
  }
}

  function openNewQuestion() {
    const existingOrders =
      state.questions.map(
        (question) =>
          Number(
            question.order || 0
          )
      );

    const nextOrder =
      existingOrders.length > 0
        ? Math.max(
            ...existingOrders
          ) + 1
        : 1;

    state.selectedQuestion = {
      ...createEmptyQuestion(),

      id: createQuestionId(),

      order: nextOrder
    };

    renderEditor();

    document
      .querySelector(
        "#adminQuestionEditor"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }


  /*
  |--------------------------------------------------------------------------
  | Phase 1 Question List
  |--------------------------------------------------------------------------
  */

/*
|--------------------------------------------------------------------------
| Existing Question Open
|--------------------------------------------------------------------------
*/

async function openExistingQuestion(
  questionId
) {
  try {
    const question =
      await getAdminQuestion(
        user,
        questionId
      );

    if (!question) {
      throw new Error(
        "Domanda non trovata."
      );
    }

    state.selectedQuestion = {
      ...createEmptyQuestion(),
      ...question
    };

    renderQuestionList();
    renderEditor();

    document
      .querySelector(
        "#adminQuestionEditor"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  } catch (error) {
    console.error(
      "Admin question open error:",
      error
    );

    const messageElement =
      document.querySelector(
        "#adminQuestionMessage"
      );

    if (messageElement) {
      messageElement.textContent =
        error.message ||
        "Errore durante l'apertura della domanda.";

      messageElement.className =
        "message error";
    }
  }
}

function getQuestionTimestamp(question) {
  const createdAt =
    question?.createdAt;

  if (!createdAt) {
    return 0;
  }

  if (
    typeof createdAt.toMillis ===
    "function"
  ) {
    return createdAt.toMillis();
  }

  if (
    typeof createdAt.seconds ===
    "number"
  ) {
    return (
      createdAt.seconds * 1000
    );
  }

  const timestamp =
    new Date(createdAt).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function getFilteredQuestions() {
  const searchText =
    normalizeSearchText(
      state.searchText
    );

  return state.questions
    .filter((question) => {
      const matchesStatus =
        state.statusFilter === "all" ||
        question.status ===
          state.statusFilter;

      const matchesArgomento =
        state.argomentoFilter === "all" ||
        question.argomentoId ===
          state.argomentoFilter;

      const matchesTopic =
        state.topicFilter === "all" ||
        question.topicId ===
          state.topicFilter;

      const searchableText =
        normalizeSearchText(
          [
            question.question,
            question.explanation,
            question.argomentoId,
            question.subtopicId,
question.subtopicTitle,
question.lessonId,
            getArgomentoTitle(
              question.argomentoId
            ),
            getTopicTitle(
              question.topicId
            ),
            getStatusLabel(
              question.status
            )
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
        matchesTopic &&
        matchesSearch
      );
    })
    .sort((first, second) => {
      switch (state.sortBy) {
        case "order-desc":
          return (
            Number(second.order || 0) -
            Number(first.order || 0)
          );

        case "title-asc":
          return String(
            first.question || ""
          ).localeCompare(
            String(
              second.question || ""
            ),
            "it",
            {
              sensitivity: "base"
            }
          );

        case "title-desc":
          return String(
            second.question || ""
          ).localeCompare(
            String(
              first.question || ""
            ),
            "it",
            {
              sensitivity: "base"
            }
          );

        case "newest":
          return (
            getQuestionTimestamp(second) -
            getQuestionTimestamp(first)
          );

        case "oldest":
          return (
            getQuestionTimestamp(first) -
            getQuestionTimestamp(second)
          );

        case "order-asc":
        default:
          return (
            Number(first.order || 0) -
            Number(second.order || 0)
          );
      }
    });
}

  function renderQuestionList() {
    const listContainer =
      document.querySelector(
        "#adminQuestionList"
      );

    const resultCount =
  document.querySelector(
    "#adminQuestionResultCount"
  );

if (
  !listContainer ||
  !resultCount
) {
  return;
}

const filteredQuestions =
  getFilteredQuestions();

resultCount.textContent =
  `${filteredQuestions.length} ${
    filteredQuestions.length === 1
      ? "domanda"
      : "domande"
  }`;
    if (
  filteredQuestions.length === 0
) {
      listContainer.innerHTML = `
        <div class="admin-empty-list">
          <span>❓</span>

          <h3>
            Nessuna domanda trovata
          </h3>

          <p>
            Crea la prima domanda
            della piattaforma.
          </p>

          <button
            id="adminEmptyNewQuestionButton"
            class="btn btn-primary"
            type="button"
          >
            + Nuova domanda
          </button>
        </div>
      `;

      document
        .querySelector(
          "#adminEmptyNewQuestionButton"
        )
        ?.addEventListener(
          "click",
          openNewQuestion
        );

      return;
    }

    listContainer.innerHTML =
  filteredQuestions
    .map(
          (question) => `
            <article
              class="
                admin-lesson-list-item
                ${
                  state.selectedQuestion
                    .id === question.id
                    ? "admin-lesson-selected"
                    : ""
                }
              "
            >
              <button
                class="
                  admin-lesson-main-button
                "
                type="button"
                data-question-id="${escapeHtml(
                  question.id
                )}"
              >
                <div
                  class="
                    admin-lesson-thumbnail
                  "
                >
                  ${
                    question.imageUrl
                      ? `
                        <img
                          src="${escapeHtml(
                            question.imageUrl
                          )}"
                          alt=""
                        />
                      `
                      : `
                        <span>❓</span>
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
                        question.question ||
                        "Domanda senza testo"
                      )}
                    </strong>

                    <span
                      class="
                        admin-status-badge
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

                  <p>
  ${escapeHtml(
    getArgomentoTitle(
      question.argomentoId
    )
  )}
</p>

<small>
  ${escapeHtml(
    getTopicTitle(
      question.topicId
    )
  )}

  ·

  ${
    question.answer === true
      ? "Vero"
      : "Falso"
  }

  · Ordine

  ${Number(
    question.order || 0
  )}
</small>
                  <small>
                    ${
                      question.answer === true
                        ? "Vero"
                        : "Falso"
                    }

                    · Ordine

                    ${Number(
                      question.order || 0
                    )}
                  </small>
                </div>
              </button>
            </article>
          `
        )
        .join("");
        document
  .querySelectorAll(
    "[data-question-id]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      async () => {
        const questionId =
          button.dataset.questionId;

        if (!questionId) {
          return;
        }

        await openExistingQuestion(
          questionId
        );
      }
    );
  });
  }


  /*
  |--------------------------------------------------------------------------
  | সম্পূর্ণ Phase 1 Page
  |--------------------------------------------------------------------------
  */

  function renderPage() {
    app.innerHTML = `
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
                id="backFromAdminQuestionsButton"
                class="back-button"
                type="button"
              >
                ← Dashboard
              </button>

              <p class="eyebrow">
                AMMINISTRAZIONE
              </p>

              <h1>
                Gestione domande quiz
              </h1>

              <p class="subtitle">
                Crea, modifica e organizza
                le domande Vero o Falso.
              </p>
            </div>

            <div class="admin-header-actions">
              <button
                id="adminQuestionRefreshButton"
                class="btn btn-secondary"
                type="button"
              >
                ↻ Aggiorna
              </button>

              <button
                id="adminHeaderNewQuestionButton"
                class="btn btn-primary"
                type="button"
              >
                + Nuova domanda
              </button>
            </div>
          </header>

          <p
            id="adminQuestionMessage"
            class="message"
          ></p>

          <section class="admin-summary-grid">
            <article>
              <span>
                Tutte
              </span>

              <strong>
                ${state.questions.length}
              </strong>
            </article>

            <article>
              <span>
                Pubblicate
              </span>

              <strong>
                ${
                  state.questions.filter(
                    (question) =>
                      question.status ===
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
                  state.questions.filter(
                    (question) =>
                      question.status ===
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
                  state.questions.filter(
                    (question) =>
                      question.status ===
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
  id="adminQuestionSearch"
  type="search"
  placeholder="Cerca una domanda..."
  value="${escapeHtml(
    state.searchText
  )}"
/>

                </label>
                <label class="admin-form-field">
  <span>Stato</span>

  <select
  id="adminQuestionStatusFilter"
>
  <option
    value="all"
    ${
      state.statusFilter === "all"
        ? "selected"
        : ""
    }
  >
    Tutti
  </option>

  <option
    value="draft"
    ${
      state.statusFilter === "draft"
        ? "selected"
        : ""
    }
  >
    Bozza
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
    Pubblicata
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
    Archiviata
  </option>
</select>
</label>

<label class="admin-form-field">
  <span>Argomento</span>

  <select id="adminQuestionArgomentoFilter">

    <option value="all">
      Tutti gli argomenti
    </option>

    ${argomenti
      .slice()
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
      )
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
              argomento.title ||
              argomento.name ||
              argomento.id
            )}
          </option>
        `
      )
      .join("")}

  </select>
</label>
<label class="admin-form-field">
  <span>Topic</span>

  <select id="adminQuestionTopicFilter">

    <option value="all">
      Tutti i topic
    </option>

    ${topics
      .slice()
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
      )
      .map(
        (topic) => `
          <option
            value="${escapeHtml(
              topic.id
            )}"
            ${
              state.topicFilter ===
              topic.id
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

  </select>
</label>
<label class="admin-form-field">
  <span>Ordina per</span>

  <select id="adminQuestionSort">

    <option
      value="order-asc"
      ${
        state.sortBy === "order-asc"
          ? "selected"
          : ""
      }
    >
      Ordine (crescente)
    </option>

    <option
      value="order-desc"
      ${
        state.sortBy === "order-desc"
          ? "selected"
          : ""
      }
    >
      Ordine (decrescente)
    </option>

    <option
      value="title-asc"
      ${
        state.sortBy === "title-asc"
          ? "selected"
          : ""
      }
    >
      Titolo (A-Z)
    </option>

    <option
      value="title-desc"
      ${
        state.sortBy === "title-desc"
          ? "selected"
          : ""
      }
    >
      Titolo (Z-A)
    </option>

    <option
      value="newest"
      ${
        state.sortBy === "newest"
          ? "selected"
          : ""
      }
    >
      Più recenti
    </option>

    <option
      value="oldest"
      ${
        state.sortBy === "oldest"
          ? "selected"
          : ""
      }
    >
      Meno recenti
    </option>

  </select>
</label>
                <div class="admin-sidebar-result-row">
                  <strong
                    id="adminQuestionResultCount"
                  >
                    0 domande
                  </strong>
                </div>
              </div>

              <div
                id="adminQuestionList"
                class="
                  admin-theory-lesson-list
                "
              ></div>
            </aside>

            <section
              id="adminQuestionEditor"
              class="admin-theory-editor"
            ></section>
          </section>
        </section>
      </main>
    `;

    document
      .querySelector(
        "#backFromAdminQuestionsButton"
      )
      ?.addEventListener(
        "click",
        () => {
          onBack?.();
        }
      );

    document
      .querySelector(
        "#adminHeaderNewQuestionButton"
      )
      ?.addEventListener(
        "click",
        openNewQuestion
      );

    document
      .querySelector(
        "#adminQuestionRefreshButton"
      )
      ?.addEventListener(
        "click",
        refreshQuestions
      );
      document
  .querySelector(
    "#adminQuestionSearch"
  )
  ?.addEventListener(
    "input",
    (event) => {
      state.searchText =
      
        event.target.value;

      renderQuestionList();
    }
  );

  document
  .querySelector(
    "#adminQuestionStatusFilter"
  )
  ?.addEventListener(
    "change",
    (event) => {
      state.statusFilter =
        event.target.value;

      renderQuestionList();
    }
  );
document
  .querySelector(
    "#adminQuestionArgomentoFilter"
  )
  ?.addEventListener(
    "change",
    (event) => {
      state.argomentoFilter =
        event.target.value;

      state.topicFilter = "all";

      renderTopicFilterOptions();

      renderQuestionList();
    }
  );

  document
  .querySelector(
    "#adminQuestionTopicFilter"
  )
  ?.addEventListener(
    "change",
    (event) => {
      state.topicFilter =
        event.target.value;

      renderQuestionList();
    }
  );

  document
  .querySelector(
    "#adminQuestionSort"
  )
  ?.addEventListener(
    "change",
    (event) => {
      state.sortBy =
        event.target.value;

      renderQuestionList();
    }
  );

renderTopicFilterOptions();

renderQuestionList();

renderEditor();
}

  /*
  |--------------------------------------------------------------------------
  | Firestore থেকে Questions Reload
  |--------------------------------------------------------------------------
  */

  async function refreshQuestions() {
    try {
      state.questions =
        await loadAdminQuestions(user);

      renderPage();
    } catch (error) {
      console.error(
        "Admin questions refresh error:",
        error
      );

      const messageElement =
        document.querySelector(
          "#adminQuestionMessage"
        );

      if (messageElement) {
        messageElement.textContent =
          error.message ||
          "Errore durante il caricamento.";

        messageElement.className =
          "message error";
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Initial Loading Screen
  |--------------------------------------------------------------------------
  */

  app.innerHTML = `
    <main class="page">
      <section class="card loading-card">
        <div class="loading-spinner"></div>

        <p>
          Caricamento domande...
        </p>
      </section>
    </main>
  `;


  /*
  |--------------------------------------------------------------------------
  | Initial Firestore Load
  |--------------------------------------------------------------------------
  */

  try {
    state.questions =
      await loadAdminQuestions(user);

    state.loading = false;

    renderPage();
  } catch (error) {
    console.error(
      "Admin questions page error:",
      error
    );

    app.innerHTML = `
      <main class="page">
        <section
          class="
            card
            admin-access-error
          "
        >
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
            ${escapeHtml(
              error.message ||
              "Non hai i permessi necessari."
            )}
          </p>

          <button
            id="adminQuestionsAccessBackButton"
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
        "#adminQuestionsAccessBackButton"
      )
      ?.addEventListener(
        "click",
        () => {
          onBack?.();
        }
      );
  }
}