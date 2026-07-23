
export function showMinisterialExam(
  app,
  options
) {
  const {
    questions,
    durationMinutes,
    maximumErrors,
    initialState = null,
    onFinish,
    onExit
  } = options;

  if (!Array.isArray(questions)) {
    showExamError(
      "Le domande dell'esame non sono disponibili."
    );

    return;
  }

  if (questions.length === 0) {
    showExamError(
      "Non ci sono abbastanza domande per avviare l'esame."
    );

    return;
  }

  function getValidInitialState() {
  if (
    !initialState ||
    typeof initialState !== "object"
  ) {
    return null;
  }

  const savedQuestionIds =
    initialState.questionIds;

  const currentQuestionIds =
    questions.map(
      (question) => question.id
    );

  const hasValidQuestionIds =
    Array.isArray(savedQuestionIds) &&
    savedQuestionIds.length ===
      currentQuestionIds.length &&
    savedQuestionIds.every(
      (questionId, index) =>
        questionId ===
        currentQuestionIds[index]
    );

  if (!hasValidQuestionIds) {
    return null;
  }

  const savedCurrentIndex =
    Number(initialState.currentIndex);

  const savedRemainingSeconds =
    Number(initialState.remainingSeconds);

  const hasValidCurrentIndex =
    Number.isInteger(savedCurrentIndex) &&
    savedCurrentIndex >= 0 &&
    savedCurrentIndex <
      questions.length;

  const maximumDurationSeconds =
    durationMinutes * 60;

  const hasValidRemainingTime =
    Number.isFinite(
      savedRemainingSeconds
    ) &&
    savedRemainingSeconds > 0 &&
    savedRemainingSeconds <=
      maximumDurationSeconds;

  if (
    !hasValidCurrentIndex ||
    !hasValidRemainingTime
  ) {
    return null;
  }

  return initialState;
}

const validInitialState =
  getValidInitialState();

let currentIndex =
  validInitialState
    ? Number(
        validInitialState.currentIndex
      )
    : 0;

let remainingSeconds =
  validInitialState
    ? Math.floor(
        Number(
          validInitialState
            .remainingSeconds
        )
      )
    : durationMinutes * 60;

let timerId = null;
let examFinished = false;

const selectedAnswers = {};

const flaggedQuestionIds =
  new Set();

const EXAM_STORAGE_KEY =
  "mshPatenteMinisterialExamDraft";

if (
  validInitialState &&
  validInitialState.selectedAnswers &&
  typeof validInitialState
    .selectedAnswers === "object"
) {
  const validQuestionIds =
    new Set(
      questions.map(
        (question) => question.id
      )
    );

  Object.entries(
    validInitialState.selectedAnswers
  ).forEach(
    ([
      questionId,
      selectedAnswer
    ]) => {
      const isValidAnswer =
        selectedAnswer === true ||
        selectedAnswer === false;

      if (
        validQuestionIds.has(
          questionId
        ) &&
        isValidAnswer
      ) {
        selectedAnswers[
          questionId
        ] = selectedAnswer;
      }
    }
  );
}
if (
  validInitialState &&
  Array.isArray(
    validInitialState.flaggedQuestionIds
  )
) {
  const validQuestionIds =
    new Set(
      questions.map(
        (question) => question.id
      )
    );

  validInitialState.flaggedQuestionIds
    .forEach((questionId) => {
      if (
        validQuestionIds.has(questionId)
      ) {
        flaggedQuestionIds.add(
          questionId
        );
      }
    });
}
  function showExamError(message) {
    app.innerHTML = `
      <main class="page">
        <section class="card">
          <p class="eyebrow">
            SCHEDA MINISTERIALE
          </p>

          <h1>
            Esame non disponibile
          </h1>

          <p class="subtitle">
            ${message}
          </p>

          <button
            id="examErrorBackButton"
            class="btn btn-primary"
          >
            Torna alla dashboard
          </button>
        </section>
      </main>
    `;

    document
      .querySelector("#examErrorBackButton")
      .addEventListener(
        "click",
        onExit
      );
  }

  function formatTime(totalSeconds) {
    const safeSeconds =
      Math.max(0, totalSeconds);

    const minutes =
      Math.floor(safeSeconds / 60);

    const seconds =
      safeSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

function saveExamState() {
  if (examFinished) {
    return;
  }

  const examState = {
  version: 1,
  mode: "ministerial",
  resumed:
    Boolean(validInitialState),
  currentIndex,
    remainingSeconds,
    selectedAnswers: {
  ...selectedAnswers
},
flaggedQuestionIds: [
  ...flaggedQuestionIds
],
questionIds: questions.map(
  (question) => question.id
),
    durationMinutes,
    maximumErrors,
    updatedAt:
      new Date().toISOString()
  };

  try {
    localStorage.setItem(
      EXAM_STORAGE_KEY,
      JSON.stringify(examState)
    );
  } catch (error) {
    console.error(
      "Impossibile salvare l'esame:",
      error
    );
  }
}

function clearSavedExamState() {
  try {
    localStorage.removeItem(
      EXAM_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "Impossibile eliminare il salvataggio:",
      error
    );
  }
}

function handleExamPageLeave() {
  saveExamState();
}

  function getAnsweredCount() {
    return Object.keys(
      selectedAnswers
    ).length;
  }

  function getUnansweredCount() {
    return (
      questions.length -
      getAnsweredCount()
    );
  }

  function getCurrentAnswer() {
    const currentQuestion =
      questions[currentIndex];

    return selectedAnswers[
      currentQuestion.id
    ];
  }

  function renderExam() {
  const currentQuestion =
    questions[currentIndex];

  const currentAnswer =
    getCurrentAnswer();

  const answeredCount =
    getAnsweredCount();

    const flaggedCount =
  flaggedQuestionIds.size;

const currentQuestionIsFlagged =
  flaggedQuestionIds.has(
    currentQuestion.id
  );

  const unansweredCount =
    getUnansweredCount();

  const progressPercentage =
    Math.round(
      (
        answeredCount /
        questions.length
      ) * 100
    );

  const questionGroups = [];

  for (
    let startIndex = 0;
    startIndex < questions.length;
    startIndex += 10
  ) {
    const endIndex =
  Math.min(
    startIndex + 10,
    questions.length
  );

const isCurrentGroup =
  currentIndex >= startIndex &&
  currentIndex < endIndex;

questionGroups.push({
  startIndex,
  endIndex,
  isCurrentGroup
});
  }

  const hasQuestionImage =
    Boolean(currentQuestion.image);

  app.innerHTML = `
    <main class="ministerial-exam-page">
      <section class="ministerial-exam-shell">

        <header class="ministerial-real-header">
          <div class="ministerial-real-brand">
            <div class="ministerial-real-emblem">
              🇮🇹
            </div>

            <div>
              <p class="ministerial-real-ministry">
                Ministero delle Infrastrutture
                e dei Trasporti
              </p>

              <h1>
                Scheda Esame
              </h1>

              <p class="ministerial-real-subtitle">
                Simulazione patente di guida
              </p>
            </div>
          </div>

          <div class="ministerial-real-type">
            <span>Categoria</span>
            <strong>B</strong>
          </div>
        </header>

        <section class="ministerial-question-groups">
          ${questionGroups
            .map(
  ({
    startIndex,
    endIndex,
    isCurrentGroup
  }) => `
                <div
  class="
    ministerial-question-group
    ${
      isCurrentGroup
        ? "ministerial-question-group-current"
        : ""
    }
  "
>
                  <div class="ministerial-group-label">
                    Domande da
                    ${startIndex + 1}
                    a
                    ${endIndex}
                  </div>

                  <div class="ministerial-group-numbers">
                    ${questions
                      .slice(
                        startIndex,
                        endIndex
                      )
                      .map(
                        (
                          question,
                          localIndex
                        ) => {
                          const questionIndex =
                            startIndex +
                            localIndex;

                          const answered =
                            selectedAnswers[
                              question.id
                            ] !== undefined;

                          const active =
                            questionIndex ===
                            currentIndex;
const unanswered =
  !answered;
  const flagged =
  flaggedQuestionIds.has(
    question.id
  );
                          return `
                            <button
                              class="
  exam-question-number
  ministerial-number-button
  ${
    answered
      ? "exam-question-answered"
      : ""
  }
  ${
    unanswered
      ? "exam-question-unanswered"
      : ""
  }
  ${
  flagged
    ? "exam-question-flagged"
    : ""
}
${

    active
      ? "exam-question-current"
      : ""
  }
"
                              data-question-index="${questionIndex}"
                              aria-label="Vai alla domanda ${
                                questionIndex + 1
                              }"
                            >
                              ${questionIndex + 1}
                            </button>
                          `;
                        }
                      )
                      .join("")}
                  </div>
                </div>
              `
            )
            .join("")}
        </section>

      <div class="ministerial-question-legend">
  <div class="ministerial-question-legend-item">
    <span
      class="
        ministerial-question-legend-box
        legend-current
      "
    ></span>

    <span>
      Domanda attuale
    </span>
  </div>

  <div class="ministerial-question-legend-item">
    <span
      class="
        ministerial-question-legend-box
        legend-answered
      "
    ></span>

    <span>
      Risposta data
    </span>
  </div>

  <div class="ministerial-question-legend-item">
    <span
      class="
        ministerial-question-legend-box
        legend-unanswered
      "
    ></span>

    <span>
      Senza risposta
    </span>
  </div>

  <div class="ministerial-question-legend-item">
    <span
      class="
        ministerial-question-legend-box
        legend-flagged
      "
    >
      ★
    </span>

    <span>
      Da rivedere (${flaggedCount})
    </span>
  </div>
</div>

<section class="ministerial-status-strip">
          <div>
            <span>Domanda attuale</span>
            <strong>
              ${currentIndex + 1}
              /
              ${questions.length}
            </strong>
          </div>

          <div>
            <span>Risposte date</span>
            <strong>
              ${answeredCount}
            </strong>
          </div>

          <div>
            <span>Da rispondere</span>
            <strong>
              ${unansweredCount}
            </strong>
          </div>

          <div>
            <span>Completamento</span>
            <strong>
              ${progressPercentage}%
            </strong>
          </div>
        </section>

        <section class="ministerial-work-area">

         <div class="ministerial-image-panel">
  ${
    hasQuestionImage
      ? `
        <button
          id="openQuestionImageButton"
          class="ministerial-image-button"
          type="button"
          aria-label="Ingrandisci l'immagine della domanda"
        >
          <img
            id="ministerialQuestionImage"
            class="ministerial-question-image"
            src="${currentQuestion.image}"
            alt="Immagine relativa alla domanda ${
              currentIndex + 1
            }"
          >

          <span class="ministerial-image-zoom-label">
            🔍 Ingrandisci
          </span>
        </button>

        <div
          id="questionImageFallback"
          class="ministerial-image-placeholder"
          hidden
        >
          <span>⚠️</span>

          <strong>
            Immagine non disponibile
          </strong>

          <p>
            Non è stato possibile caricare
            l'immagine della domanda.
          </p>
        </div>
      `
      : `
        <div class="ministerial-image-placeholder">
          <span>🛣️</span>

          <strong>
            Nessuna immagine
          </strong>

          <p>
            Questa domanda non richiede
            un'immagine.
          </p>
        </div>
      `
  }
</div>

          <div class="ministerial-question-area">

           <div class="ministerial-question-titlebar">
  <div class="ministerial-question-title-info">
    <span>
      Domanda numero
    </span>

    <strong>
      ${currentIndex + 1}
    </strong>
  </div>

  <button
    id="toggleQuestionFlagButton"
    class="
      ministerial-flag-button
      ${
        currentQuestionIsFlagged
          ? "ministerial-flag-button-active"
          : ""
      }
    "
    type="button"
    aria-pressed="${
      currentQuestionIsFlagged
        ? "true"
        : "false"
    }"
  >
    <span aria-hidden="true">
      ${
        currentQuestionIsFlagged
          ? "★"
          : "☆"
      }
    </span>

    <span>
      ${
        currentQuestionIsFlagged
          ? "Segnata per dopo"
          : "Segna per dopo"
      }
    </span>
  </button>
</div>

            <div class="ministerial-question-text">
              <p>
                ${currentQuestion.question}
              </p>
            </div>

            <div class="ministerial-answer-area">
              <button
                id="ministerialTrueButton"
                class="
                  exam-answer-button
                  ministerial-answer-button
                  ${
                    currentAnswer === true
                      ? "exam-answer-selected ministerial-answer-selected"
                      : ""
                  }
                "
                type="button"
              >
                <span class="ministerial-answer-label">
                  Vero
                </span>

                <span class="ministerial-answer-symbol">
                  V
                </span>
              </button>

              <button
                id="ministerialFalseButton"
                class="
                  exam-answer-button
                  ministerial-answer-button
                  ${
                    currentAnswer === false
                      ? "exam-answer-selected ministerial-answer-selected"
                      : ""
                  }
                "
                type="button"
              >
                <span class="ministerial-answer-label">
                  Falso
                </span>

                <span class="ministerial-answer-symbol">
                  F
                </span>
              </button>
            </div>

          </div>
        </section>

        <footer class="ministerial-bottom-bar">

          <div
            id="examTimer"
            class="
              exam-timer
              ministerial-bottom-timer
              ${
                remainingSeconds <= 300
                  ? "exam-timer-warning"
                  : ""
              }
            "
          >
            <span>Tempo a disposizione</span>

            <strong>
              ${formatTime(
                remainingSeconds
              )}
            </strong>
          </div>

          <div class="ministerial-candidate-box">
            <span>
              Candidato
            </span>

            <strong>
              Simulazione MSH Patente
            </strong>
          </div>

          <div class="ministerial-bottom-actions">

            <button
              id="previousExamQuestion"
              class="ministerial-navigation-button"
              type="button"
              ${
                currentIndex === 0
                  ? "disabled"
                  : ""
              }
            >
              <span>◀</span>
              Precedente
            </button>

            ${
              currentIndex <
              questions.length - 1
                ? `
                  <button
                    id="nextExamQuestion"
                    class="ministerial-navigation-button"
                    type="button"
                  >
                    Successiva
                    <span>▶</span>
                  </button>
                `
                : `
                  <button
                    id="openExamSubmit"
                    class="
                      ministerial-navigation-button
                      ministerial-submit-button
                    "
                    type="button"
                  >
                    Consegna esame
                    <span>📤</span>
                  </button>
                `
            }

          </div>
        </footer>

        <section class="ministerial-secondary-actions">
          <button
            id="examSubmitSidebarButton"
            class="btn btn-danger"
            type="button"
          >
            Consegna esame
          </button>

          <button
            id="exitMinisterialExamButton"
            class="exam-exit-button"
            type="button"
          >
            Abbandona la simulazione
          </button>
        </section>

      </section>
    </main>

    <div
      id="examModalContainer"
    ></div>
  `;

  attachExamListeners();

  }

  function attachExamListeners() {
    const flagButton =
  document.querySelector(
    "#toggleQuestionFlagButton"
  );

if (flagButton) {
  flagButton.addEventListener(
    "click",
    toggleCurrentQuestionFlag
  );
}
    document
      .querySelector(
        "#ministerialTrueButton"
      )
      .addEventListener(
        "click",
        () => selectAnswer(true)
      );

    document
      .querySelector(
        "#ministerialFalseButton"
      )
      .addEventListener(
        "click",
        () => selectAnswer(false)
      );

    const previousButton =
      document.querySelector(
        "#previousExamQuestion"
      );

    if (previousButton) {
      previousButton.addEventListener(
        "click",
        goToPreviousQuestion
      );
    }

    const nextButton =
      document.querySelector(
        "#nextExamQuestion"
      );

    if (nextButton) {
      nextButton.addEventListener(
        "click",
        goToNextQuestion
      );
    }

    const finalQuestionButton =
      document.querySelector(
        "#openExamSubmit"
      );

    if (finalQuestionButton) {
      finalQuestionButton.addEventListener(
        "click",
        openSubmitConfirmation
      );
    }

    document
      .querySelector(
        "#examSubmitSidebarButton"
      )
      .addEventListener(
        "click",
        openSubmitConfirmation
      );

    document
      .querySelector(
        "#exitMinisterialExamButton"
      )
      .addEventListener(
        "click",
        openExitConfirmation
      );

    document
      .querySelectorAll(
        ".exam-question-number"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const index =
              Number(
                button.dataset
                  .questionIndex
              );

            goToQuestion(index);
          }
        );
      });
      const questionImage =
  document.querySelector(
    "#ministerialQuestionImage"
  );

const questionImageFallback =
  document.querySelector(
    "#questionImageFallback"
  );

const openImageButton =
  document.querySelector(
    "#openQuestionImageButton"
  );

if (
  questionImage &&
  questionImageFallback &&
  openImageButton
) {
  questionImage.addEventListener(
    "error",
    () => {
      openImageButton.hidden = true;
      questionImageFallback.hidden = false;
    }
  );

  openImageButton.addEventListener(
    "click",
    openQuestionImageModal
  );
}
  }

  function toggleCurrentQuestionFlag() {
  const currentQuestion =
    questions[currentIndex];

  if (
    flaggedQuestionIds.has(
      currentQuestion.id
    )
  ) {
    flaggedQuestionIds.delete(
      currentQuestion.id
    );
  } else {
    flaggedQuestionIds.add(
      currentQuestion.id
    );
  }

  saveExamState();
  renderExam();
}
  function selectAnswer(answer) {
  const currentQuestion =
    questions[currentIndex];

  selectedAnswers[
    currentQuestion.id
  ] = answer;

  saveExamState();
  renderExam();
}

  function goToQuestion(index) {
  if (
    index < 0 ||
    index >= questions.length
  ) {
    return;
  }

  currentIndex = index;

  saveExamState();
  renderExam();
}

  function goToPreviousQuestion() {
  goToQuestion(
    currentIndex - 1
  );
}

function goToNextQuestion() {
  goToQuestion(
    currentIndex + 1
  );
}

function handleExamKeyboard(event) {
  if (examFinished) {
    return;
  }

  const modalContainer =
    document.querySelector(
      "#examModalContainer"
    );

  const modalIsOpen =
    modalContainer &&
    modalContainer.innerHTML.trim() !== "";

  if (modalIsOpen) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeExamModal();
    }

    return;
  }

  const activeElement =
    document.activeElement;

  const isTyping =
    activeElement &&
    (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.tagName === "SELECT"
    );

  if (isTyping) {
    return;
  }

  const pressedKey =
    event.key.toLowerCase();

  if (pressedKey === "v") {
    event.preventDefault();
    selectAnswer(true);
    return;
  }

  if (pressedKey === "f") {
    event.preventDefault();
    selectAnswer(false);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();

    if (currentIndex > 0) {
      goToPreviousQuestion();
    }

    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();

    if (
      currentIndex <
      questions.length - 1
    ) {
      goToNextQuestion();
    }

    return;
  }

  if (
    event.key === "Enter" &&
    currentIndex ===
      questions.length - 1
  ) {
    event.preventDefault();
    openSubmitConfirmation();
  }
}

function openQuestionImageModal() {
  const currentQuestion =
    questions[currentIndex];

  if (!currentQuestion.image) {
    return;
  }

  const modalContainer =
    document.querySelector(
      "#examModalContainer"
    );

  if (!modalContainer) {
    return;
  }

  modalContainer.innerHTML = `
    <div
      class="
        exam-modal-backdrop
        question-image-modal-backdrop
      "
      id="questionImageModalBackdrop"
    >
      <section class="question-image-modal">
        <div class="question-image-modal-header">
          <div>
            <p class="eyebrow">
              DOMANDA ${currentIndex + 1}
            </p>

            <h2>
              Immagine della domanda
            </h2>
          </div>

          <button
            id="closeQuestionImageModal"
            class="question-image-modal-close"
            type="button"
            aria-label="Chiudi immagine"
          >
            ✕
          </button>
        </div>

        <div class="question-image-modal-content">
          <img
            src="${currentQuestion.image}"
            alt="Immagine ingrandita della domanda ${
              currentIndex + 1
            }"
          >
        </div>

        <p class="question-image-modal-hint">
          Premi ESC o clicca fuori dall'immagine
          per chiudere.
        </p>
      </section>
    </div>
  `;

  document
    .querySelector(
      "#closeQuestionImageModal"
    )
    .addEventListener(
      "click",
      closeExamModal
    );

  document
    .querySelector(
      "#questionImageModalBackdrop"
    )
    .addEventListener(
      "click",
      (event) => {
        if (
          event.target.id ===
          "questionImageModalBackdrop"
        ) {
          closeExamModal();
        }
      }
    );
}

  function openSubmitConfirmation() {
    const unansweredCount =
      getUnansweredCount();

    const modalContainer =
      document.querySelector(
        "#examModalContainer"
      );

    modalContainer.innerHTML = `
      <div class="exam-modal-backdrop">
        <section class="exam-modal">
          <div class="exam-modal-icon">
            ${
              unansweredCount > 0
                ? "⚠️"
                : "📋"
            }
          </div>

          <h2>
            Consegna la scheda?
          </h2>

          <p>
            ${
              unansweredCount > 0
                ? `
                  Hai ancora
                  <strong>
                    ${unansweredCount}
                  </strong>
                  ${
                    unansweredCount === 1
                      ? "domanda senza risposta"
                      : "domande senza risposta"
                  }.
                  Le risposte mancanti saranno
                  considerate errate.
                `
                : `
                  Hai risposto a tutte le domande.
                  Dopo la consegna non potrai
                  modificare le risposte.
                `
            }
          </p>

          <div class="exam-modal-actions">
            <button
              id="cancelExamSubmit"
              class="btn btn-secondary"
            >
              Continua l'esame
            </button>

            <button
              id="confirmExamSubmit"
              class="btn btn-danger"
            >
              Consegna
            </button>
          </div>
        </section>
      </div>
    `;

    document
      .querySelector(
        "#cancelExamSubmit"
      )
      .addEventListener(
        "click",
        closeExamModal
      );

    document
      .querySelector(
        "#confirmExamSubmit"
      )
      .addEventListener(
        "click",
        () => finishExam("submitted")
      );
  }

  function openExitConfirmation() {
    const modalContainer =
      document.querySelector(
        "#examModalContainer"
      );

    modalContainer.innerHTML = `
      <div class="exam-modal-backdrop">
        <section class="exam-modal">
          <div class="exam-modal-icon">
            🚪
          </div>

          <h2>
            Abbandonare l'esame?
          </h2>

          <p>
            Le risposte di questa simulazione
            non saranno salvate.
          </p>

          <div class="exam-modal-actions">
            <button
              id="cancelExamExit"
              class="btn btn-secondary"
            >
              Rimani
            </button>

            <button
              id="confirmExamExit"
              class="btn btn-danger"
            >
              Abbandona
            </button>
          </div>
        </section>
      </div>
    `;

    document
      .querySelector(
        "#cancelExamExit"
      )
      .addEventListener(
        "click",
        closeExamModal
      );

    document
      .querySelector(
        "#confirmExamExit"
      )
      .addEventListener(
        "click",
        exitExam
      );
  }

  function closeExamModal() {
    const modalContainer =
      document.querySelector(
        "#examModalContainer"
      );

    if (modalContainer) {
      modalContainer.innerHTML = "";
    }
  }

  function startTimer() {
    stopTimer();

    timerId = window.setInterval(
      () => {
        remainingSeconds -= 1;

updateTimerDisplay();

if (
  remainingSeconds > 0 &&
  remainingSeconds % 5 === 0
) {
  saveExamState();
}

if (remainingSeconds <= 0) {
          finishExam("time-expired");
        }
      },
      1000
    );
  }

  function updateTimerDisplay() {
    const timer =
      document.querySelector(
        "#examTimer"
      );

    if (!timer) {
      return;
    }

    timer.innerHTML = `
      <span>Tempo rimasto</span>

      <strong>
        ${formatTime(
          remainingSeconds
        )}
      </strong>
    `;

    if (remainingSeconds <= 300) {
      timer.classList.add(
        "exam-timer-warning"
      );
    }
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

function finishExam(reason) {
  if (examFinished) {
    return;
  }

  examFinished = true;

  stopTimer();

  document.removeEventListener(
    "keydown",
    handleExamKeyboard
  );

  window.removeEventListener(
    "pagehide",
    handleExamPageLeave
  );

  clearSavedExamState();

  const answers =
    questions.map((question) => {
      const selectedAnswer =
        selectedAnswers[
          question.id
        ];

      const answered =
        selectedAnswer !== undefined;

      const isCorrect =
        answered &&
        selectedAnswer ===
          question.answer;

      return {
        questionId:
          question.id,

        selectedAnswer:
          answered
            ? selectedAnswer
            : null,

        correctAnswer:
          question.answer,

        answered,
        isCorrect
      };
    });

  const correctAnswers =
    answers.filter(
      (answer) =>
        answer.isCorrect
    ).length;

  const wrongAnswers =
    answers.filter(
      (answer) =>
        !answer.isCorrect
    ).length;

  const unansweredAnswers =
    answers.filter(
      (answer) =>
        !answer.answered
    ).length;

  const passed =
    wrongAnswers <=
    maximumErrors;

  const totalDurationSeconds =
    durationMinutes * 60;

  const usedSeconds =
    Math.max(
      0,
      totalDurationSeconds -
        remainingSeconds
    );

  onFinish({
    mode: "ministerial",
    reason,
    totalQuestions:
      questions.length,
    correctAnswers,
    wrongAnswers,
    unansweredAnswers,
    passed,
    maximumErrors,
    durationSeconds:
      usedSeconds,
    allowedDurationSeconds:
      totalDurationSeconds,
    answers
  });
}

 function exitExam() {
  if (examFinished) {
    return;
  }

  examFinished = true;

  stopTimer();

  document.removeEventListener(
    "keydown",
    handleExamKeyboard
  );

  window.removeEventListener(
    "pagehide",
    handleExamPageLeave
  );

  clearSavedExamState();

  onExit();
}

document.addEventListener(
  "keydown",
  handleExamKeyboard
);

window.addEventListener(
  "pagehide",
  handleExamPageLeave
);

saveExamState();
renderExam();
startTimer();
}