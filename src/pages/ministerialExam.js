export function showMinisterialExam(
  app,
  options
) {
  const {
    questions,
    durationMinutes,
    maximumErrors,
    onFinish,
    onExit
  } = options;

  let currentIndex = 0;

  let remainingSeconds =
    durationMinutes * 60;

  let timerId = null;
  let examFinished = false;

  const selectedAnswers = {};

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

    const progressPercentage =
      Math.round(
        (
          answeredCount /
          questions.length
        ) * 100
      );

    app.innerHTML = `
      <main class="exam-page">
        <section class="exam-shell">
          <header class="exam-header">
            <div class="exam-brand">
              <p class="eyebrow">
                SIMULAZIONE UFFICIALE
              </p>

              <h1>
                Scheda Ministeriale
              </h1>

              <p>
                ${questions.length} domande ·
                Massimo ${maximumErrors} errori
              </p>
            </div>

            <div
              id="examTimer"
              class="exam-timer ${
                remainingSeconds <= 300
                  ? "exam-timer-warning"
                  : ""
              }"
            >
              <span>Tempo rimasto</span>

              <strong>
                ${formatTime(
                  remainingSeconds
                )}
              </strong>
            </div>
          </header>

          <div class="exam-progress-section">
            <div class="exam-progress-info">
              <span>
                ${answeredCount} di
                ${questions.length}
                risposte
              </span>

              <strong>
                ${progressPercentage}%
              </strong>
            </div>

            <div class="exam-progress-track">
              <div
                class="exam-progress-fill"
                style="
                  width:
                  ${progressPercentage}%
                "
              ></div>
            </div>
          </div>

          <div class="exam-layout">
            <section class="exam-question-panel">
              <div class="exam-question-header">
                <div>
                  <p class="eyebrow">
                    DOMANDA
                  </p>

                  <h2>
                    ${currentIndex + 1}
                    di
                    ${questions.length}
                  </h2>
                </div>

                <span
                  class="exam-answer-status ${
                    currentAnswer ===
                    undefined
                      ? "answer-status-pending"
                      : "answer-status-given"
                  }"
                >
                  ${
                    currentAnswer ===
                    undefined
                      ? "Da rispondere"
                      : "Risposta data"
                  }
                </span>
              </div>

              <div class="exam-question-box">
                <p>
                  ${currentQuestion.question}
                </p>
              </div>

              <div class="exam-answer-grid">
                <button
                  id="ministerialTrueButton"
                  class="
                    exam-answer-button
                    ${
                      currentAnswer === true
                        ? "exam-answer-selected"
                        : ""
                    }
                  "
                >
                  <span class="exam-answer-letter">
                    V
                  </span>

                  <span>VERO</span>
                </button>

                <button
                  id="ministerialFalseButton"
                  class="
                    exam-answer-button
                    ${
                      currentAnswer === false
                        ? "exam-answer-selected"
                        : ""
                    }
                  "
                >
                  <span class="exam-answer-letter">
                    F
                  </span>

                  <span>FALSO</span>
                </button>
              </div>

              <div class="exam-navigation">
                <button
                  id="previousExamQuestion"
                  class="btn btn-secondary"
                  ${
                    currentIndex === 0
                      ? "disabled"
                      : ""
                  }
                >
                  ← Precedente
                </button>

                ${
                  currentIndex <
                  questions.length - 1
                    ? `
                      <button
                        id="nextExamQuestion"
                        class="btn btn-primary"
                      >
                        Successiva →
                      </button>
                    `
                    : `
                      <button
                        id="openExamSubmit"
                        class="btn btn-primary"
                      >
                        Consegna esame
                      </button>
                    `
                }
              </div>
            </section>

            <aside class="exam-overview-panel">
              <div class="exam-overview-header">
                <div>
                  <p class="eyebrow">
                    PANORAMICA
                  </p>

                  <h2>
                    Domande
                  </h2>
                </div>

                <span>
                  ${getUnansweredCount()}
                  mancanti
                </span>
              </div>

              <div class="exam-question-grid">
                ${questions
                  .map(
                    (
                      question,
                      index
                    ) => {
                      const answered =
                        selectedAnswers[
                          question.id
                        ] !== undefined;

                      const active =
                        index ===
                        currentIndex;

                      return `
                        <button
                          class="
                            exam-question-number
                            ${
                              answered
                                ? "exam-question-answered"
                                : ""
                            }
                            ${
                              active
                                ? "exam-question-current"
                                : ""
                            }
                          "
                          data-question-index="${index}"
                        >
                          ${index + 1}
                        </button>
                      `;
                    }
                  )
                  .join("")}
              </div>

              <div class="exam-legend">
                <div>
                  <span
                    class="
                      legend-box
                      legend-current
                    "
                  ></span>

                  Domanda attuale
                </div>

                <div>
                  <span
                    class="
                      legend-box
                      legend-answered
                    "
                  ></span>

                  Risposta data
                </div>

                <div>
                  <span
                    class="
                      legend-box
                      legend-pending
                    "
                  ></span>

                  Da rispondere
                </div>
              </div>

              <button
                id="examSubmitSidebarButton"
                class="btn btn-danger full-width"
              >
                Consegna esame
              </button>

              <button
                id="exitMinisterialExamButton"
                class="exam-exit-button"
              >
                Abbandona la simulazione
              </button>
            </aside>
          </div>
        </section>
      </main>

      <div
        id="examModalContainer"
      ></div>
    `;

    attachExamListeners();
  }

  function attachExamListeners() {
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
  }

  function selectAnswer(answer) {
    const currentQuestion =
      questions[currentIndex];

    selectedAnswers[
      currentQuestion.id
    ] = answer;

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
    onExit();
  }

  renderExam();
  startTimer();
}