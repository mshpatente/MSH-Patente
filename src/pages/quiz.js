import { auth } from "../firebase.js";
import {
  getSpeechState,
  isTextToSpeechSupported,
  speakText,
  stopSpeech
} from "../utils/textToSpeech.js";
import {
  createCloudDraftId,
  deleteCloudDraft,
  loadCloudDraft,
  resolveLatestDraft,
  saveCloudDraft,
  syncPendingCloudDraft
} from "../services/cloudSyncService.js";

const DEFAULT_COUNTS = [5, 10, 20, 30];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(items) {
  const output = [...items];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[randomIndex]] = [
      output[randomIndex],
      output[index]
    ];
  }

  return output;
}

function normalizeBoolean(value) {
  if (value === true || value === "true" || value === 1) return true;
  if (value === false || value === "false" || value === 0) return false;
  return null;
}

function formatDuration(secondsValue) {
  const seconds = Math.max(0, Number(secondsValue) || 0);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;

  return `${String(minutesPart).padStart(2, "0")}:${String(
    secondsPart
  ).padStart(2, "0")}`;
}

export function showQuiz(app, options = {}) {
  const sourceQuestions = Array.isArray(options.questions)
    ? options.questions.filter(
        (question) =>
          question?.id &&
          typeof question.question === "string" &&
          normalizeBoolean(question.answer) !== null
      )
    : [];

  const {
    title = "Quiz",
    onFinish,
    onBack,
    storageKey = "msh-quiz-session",
    accentColor = "#2563eb",
    showSetup = true,
    countOptions = DEFAULT_COUNTS,
    allowShuffle = true
  } = options;

  let quizQuestions = [];
  let currentIndex = 0;
  let answers = {};
  let flaggedIds = new Set();
  let elapsedBeforeStart = 0;
  let startedAt = Date.now();
  let timerId = null;
  let isFinishing = false;
  let cloudSaveTimerId = null;

    function resetQuestionAudioButton() {
    const audioButton =
      document.querySelector(
        "#quizQuestionAudioButton"
      );

    if (!audioButton) {
      return;
    }

    audioButton.innerHTML =
      "<span aria-hidden='true'>🔊</span> Ascolta la domanda";

    audioButton.setAttribute(
      "aria-pressed",
      "false"
    );
  }

  function toggleQuestionAudio() {
    const question =
      quizQuestions[currentIndex];

    const audioButton =
      document.querySelector(
        "#quizQuestionAudioButton"
      );

    if (
      !question ||
      !audioButton ||
      !isTextToSpeechSupported()
    ) {
      return;
    }

    const speechState =
      getSpeechState();

    if (
      speechState === "playing" ||
      speechState === "paused"
    ) {
      stopSpeech();
      resetQuestionAudioButton();
      return;
    }

    const started =
      speakText(
        question.question,
        {
          language: "it",
          rate: 0.9,

          onStart: () => {
            const currentButton =
              document.querySelector(
                "#quizQuestionAudioButton"
              );

            if (!currentButton) {
              return;
            }

            currentButton.innerHTML =
              "<span aria-hidden='true'>⏹</span> Ferma audio";

            currentButton.setAttribute(
              "aria-pressed",
              "true"
            );
          },

          onEnd: () => {
            resetQuestionAudioButton();
          },

          onError: (error) => {
            console.error(
              "Quiz question audio error:",
              error
            );

            resetQuestionAudioButton();
          }
        }
      );

    if (!started) {
      resetQuestionAudioButton();
    }
  }

  const syncUser =
    options.user ||
    auth.currentUser;

  const cloudDraftId =
    createCloudDraftId(
      storageKey
    );

  if (!app) {
    throw new Error("Quiz container non disponibile.");
  }

  if (sourceQuestions.length === 0) {
    renderEmpty();
    return;
  }

  initializeQuiz();

  async function initializeQuiz() {
    const localSession =
      loadSession();

    let cloudSession = null;

    if (syncUser?.uid) {
      await syncPendingCloudDraft({
        user: syncUser,
        draftId: cloudDraftId
      });

      cloudSession =
        await loadCloudDraft({
          user: syncUser,
          draftId: cloudDraftId
        });
    }

    const latestSession =
      validateSession(
        resolveLatestDraft(
          localSession,
          cloudSession
        )
      );

    if (latestSession) {
      saveLocalSession(
        latestSession
      );

      renderResume(
        latestSession
      );

      return;
    }

    if (showSetup) {
      renderSetup();
      return;
    }

    startQuiz(
      sourceQuestions.length,
      allowShuffle
    );
  }

  function renderEmpty() {
    app.innerHTML = `
      <main class="page quiz-v2-page">
        <section class="card quiz-v2-empty">
          <div class="quiz-v2-empty-icon">📭</div>
          <p class="eyebrow">QUIZ NON DISPONIBILE</p>
          <h1>Nessuna domanda disponibile</h1>
          <p class="subtitle">
            Non ci sono ancora domande valide per questo quiz.
          </p>
          <button id="quizEmptyBack" class="btn btn-primary" type="button">
            Torna indietro
          </button>
        </section>
      </main>
    `;

    document
      .querySelector("#quizEmptyBack")
      ?.addEventListener("click", () => onBack?.());
  }

  function renderSetup() {
    stopTimer();

    const available = sourceQuestions.length;
    const counts = [
      ...new Set(
        countOptions
          .map(Number)
          .filter(
            (count) =>
              Number.isInteger(count) &&
              count > 0 &&
              count < available
          )
      ),
      available
    ].sort((first, second) => first - second);

    const defaultCount =
      counts.find((count) => count >= 10) ?? available;

    app.innerHTML = `
      <main class="page quiz-v2-page">
        <section
          class="card quiz-v2-setup"
          style="--quiz-accent: ${escapeHtml(accentColor)}"
        >
          <button id="quizSetupBack" class="back-button" type="button">
            ← Indietro
          </button>

          <header class="quiz-v2-setup-header">
            <div class="quiz-v2-hero-icon">🧠</div>
            <p class="eyebrow">PREPARA IL TUO ALLENAMENTO</p>
            <h1>${escapeHtml(title)}</h1>
                        <p class="subtitle">
              Scegli il numero di domande e l'ordine.
              Il progresso viene salvato automaticamente
              sul dispositivo e nel cloud.
            </p>
          </header>

          <form id="quizSetupForm" class="quiz-v2-setup-form">
            <fieldset class="quiz-v2-fieldset">
              <legend>Numero di domande</legend>
              <div class="quiz-v2-count-grid">
                ${counts
                  .map(
                    (count) => `
                      <label class="quiz-v2-choice">
                        <input
                          type="radio"
                          name="questionCount"
                          value="${count}"
                          ${count === defaultCount ? "checked" : ""}
                        />
                        <strong>${count === available ? "Tutte" : count}</strong>
                        <small>${count} ${count === 1 ? "domanda" : "domande"}</small>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </fieldset>

            <fieldset class="quiz-v2-fieldset">
              <legend>Ordine</legend>
              <div class="quiz-v2-order-grid">
                <label class="quiz-v2-choice quiz-v2-order-choice">
                  <input
                    type="radio"
                    name="questionOrder"
                    value="random"
                    ${allowShuffle ? "checked" : "disabled"}
                  />
                  <span>🔀</span>
                  <div>
                    <strong>Casuale</strong>
                    <small>Ordine diverso ad ogni tentativo</small>
                  </div>
                </label>

                <label class="quiz-v2-choice quiz-v2-order-choice">
                  <input
                    type="radio"
                    name="questionOrder"
                    value="sequential"
                    ${allowShuffle ? "" : "checked"}
                  />
                  <span>📚</span>
                  <div>
                    <strong>Originale</strong>
                    <small>Segue l'ordine del database</small>
                  </div>
                </label>
              </div>
            </fieldset>

            <div class="quiz-v2-setup-summary">
              <div><span>Disponibili</span><strong>${available}</strong></div>
              <div><span>Salvataggio</span><strong>Automatico</strong></div>
              <div><span>Revisione</span><strong>Inclusa</strong></div>
            </div>

            <button class="btn btn-primary full-width quiz-v2-start" type="submit">
              Inizia il quiz
            </button>
          </form>
        </section>
      </main>
    `;

    document
      .querySelector("#quizSetupBack")
      ?.addEventListener("click", () => onBack?.());

    document
      .querySelector("#quizSetupForm")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        startQuiz(
          Number(data.get("questionCount")),
          data.get("questionOrder") === "random"
        );
      });
  }

  function renderResume(session) {
    const total = session.questionIds?.length || 0;
    const answered = Object.keys(session.answers || {}).length;

    app.innerHTML = `
      <main class="page quiz-v2-page">
        <section class="card quiz-v2-resume">
          <div class="quiz-v2-resume-icon">⏯️</div>
          <p class="eyebrow">QUIZ IN SOSPESO</p>
          <h1>Vuoi continuare?</h1>
          <p class="subtitle">
            Abbiamo trovato un quiz non terminato: <strong>${escapeHtml(
              session.title || title
            )}</strong>.
          </p>

          <div class="quiz-v2-resume-stats">
            <div><span>Risposte</span><strong>${answered}/${total}</strong></div>
            <div><span>Domanda</span><strong>${Math.min(
              Number(session.currentIndex || 0) + 1,
              total
            )}</strong></div>
            <div><span>Tempo</span><strong>${formatDuration(
              session.elapsedSeconds
            )}</strong></div>
          </div>

          <div class="quiz-v2-resume-actions">
            <button id="quizRestart" class="btn btn-secondary" type="button">
              Ricomincia
            </button>
            <button id="quizResume" class="btn btn-primary" type="button">
              Continua
            </button>
          </div>

          <button id="quizResumeBack" class="quiz-v2-text-button" type="button">
            Torna indietro
          </button>
        </section>
      </main>
    `;

    document
      .querySelector("#quizResume")
      ?.addEventListener("click", () => resumeQuiz(session));

    document
      .querySelector("#quizRestart")
      ?.addEventListener("click", () => {
        clearSession();
        showSetup ? renderSetup() : startQuiz(sourceQuestions.length, true);
      });

    document
      .querySelector("#quizResumeBack")
      ?.addEventListener("click", () => onBack?.());
  }

  function startQuiz(questionCount, useShuffle) {
    const count = Math.max(
      1,
      Math.min(Number(questionCount) || sourceQuestions.length, sourceQuestions.length)
    );

    const ordered = useShuffle ? shuffle(sourceQuestions) : [...sourceQuestions];

    quizQuestions = ordered.slice(0, count);
    currentIndex = 0;
    answers = {};
    flaggedIds = new Set();
    elapsedBeforeStart = 0;
    startedAt = Date.now();
    isFinishing = false;

    saveSession();
    startTimer();
    renderQuestion();
  }

  function resumeQuiz(session) {
    const questionMap = new Map(
      sourceQuestions.map((question) => [String(question.id), question])
    );

    quizQuestions = (session.questionIds || [])
      .map((questionId) => questionMap.get(String(questionId)))
      .filter(Boolean);

    if (quizQuestions.length === 0) {
      clearSession();
      renderSetup();
      return;
    }

    currentIndex = Math.min(
      Math.max(Number(session.currentIndex) || 0, 0),
      quizQuestions.length - 1
    );

    answers = session.answers && typeof session.answers === "object"
      ? session.answers
      : {};

    flaggedIds = new Set(
      Array.isArray(session.flaggedIds)
        ? session.flaggedIds.map(String)
        : []
    );

    elapsedBeforeStart = Number(session.elapsedSeconds) || 0;
    startedAt = Date.now();
    isFinishing = false;

    startTimer();
    renderQuestion();
  }

  function renderQuestion() {
  stopSpeech();

  const question = quizQuestions[currentIndex];

    if (!question) {
      renderReview();
      return;
    }

    const questionId = String(question.id);
    const savedAnswer = answers[questionId] || null;
    const selectedAnswer = normalizeBoolean(savedAnswer?.selectedAnswer);
    const answered = Boolean(savedAnswer);
    const answeredCount = getAnsweredCount();
    const progress = (answeredCount / quizQuestions.length) * 100;
    const flagged = flaggedIds.has(questionId);

    app.innerHTML = `
      <main class="page quiz-v2-page">
        <section
          class="card quiz-card quiz-v2-card"
          style="--quiz-accent: ${escapeHtml(accentColor)}"
        >
          <header class="quiz-v2-header">
            <button id="quizExit" class="back-button" type="button">← Esci</button>
            <div class="quiz-v2-header-actions">
              <button
                id="quizFlag"
                class="quiz-v2-pill ${flagged ? "is-active" : ""}"
                type="button"
              >
                ${flagged ? "🚩 Segnalata" : "⚑ Segnala"}
              </button>
              <span id="quizTimer" class="quiz-v2-pill">
                ⏱ ${formatDuration(getElapsedSeconds())}
              </span>
            </div>
          </header>

          <div class="quiz-topbar">
            <div>
              <p class="eyebrow">${escapeHtml(title)}</p>
              <h1>Domanda ${currentIndex + 1}</h1>
            </div>
            <div class="quiz-counter">
              ${currentIndex + 1} / ${quizQuestions.length}
            </div>
          </div>

          <div class="quiz-v2-progress-info">
            <span>${answeredCount} risposte date</span>
            <strong>${Math.round(progress)}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>

          <div class="quiz-score quiz-v2-score">
            <span>✅ Corrette: ${getCorrectCount()}</span>
            <span>❌ Sbagliate: ${getWrongCount()}</span>
            <span>⚪ Mancanti: ${quizQuestions.length - answeredCount}</span>
          </div>

          ${
            question.image
              ? `
                <figure class="quiz-v2-image">
                  <img
                    src="${escapeHtml(question.image)}"
                    alt="Immagine della domanda"
                    loading="lazy"
                  />
                </figure>
              `
              : ""
          }

          <div class="question-box quiz-v2-question-box">
  <p>${escapeHtml(question.question)}</p>

  <button
    id="quizQuestionAudioButton"
    class="question-audio-button"
    type="button"
    aria-label="Ascolta la domanda in italiano"
    aria-pressed="false"
    ${isTextToSpeechSupported() ? "" : "disabled"}
  >
    <span aria-hidden="true">
      ${isTextToSpeechSupported() ? "🔊" : "🔇"}
    </span>

    ${
      isTextToSpeechSupported()
        ? "Ascolta la domanda"
        : "Audio non disponibile"
    }
  </button>
</div>

<div class="answer-grid quiz-v2-answer-grid">
            <button
              id="quizTrue"
              class="answer-button ${answerClass(
                true,
                selectedAnswer,
                question.answer,
                answered
              )}"
              type="button"
              ${answered ? "disabled" : ""}
            >
              <span class="quiz-v2-answer-symbol">V</span>
              VERO
            </button>

            <button
              id="quizFalse"
              class="answer-button ${answerClass(
                false,
                selectedAnswer,
                question.answer,
                answered
              )}"
              type="button"
              ${answered ? "disabled" : ""}
            >
              <span class="quiz-v2-answer-symbol">F</span>
              FALSO
            </button>
          </div>

          <div id="feedbackContainer">
            ${
              answered
                ? feedbackTemplate(question, savedAnswer)
                : `
                  <div class="quiz-v2-hint">
                    Seleziona VERO o FALSO. Puoi anche saltare la domanda
                    e completarla durante la revisione finale.
                  </div>
                `
            }
          </div>

          <footer class="quiz-v2-navigation">
            <button
              id="quizPrevious"
              class="btn btn-secondary"
              type="button"
              ${currentIndex === 0 ? "disabled" : ""}
            >
              ← Precedente
            </button>

            <button id="quizMap" class="btn quiz-v2-map-button" type="button">
              Mappa domande
            </button>

            <button id="quizNext" class="btn btn-primary" type="button">
              ${
                currentIndex === quizQuestions.length - 1
                  ? "Riepilogo"
                  : answered
                    ? "Prossima →"
                    : "Salta →"
              }
            </button>
          </footer>
        </section>
      </main>
    `;

    document
  .querySelector("#quizExit")
  ?.addEventListener(
    "click",
    () => {
      stopSpeech();
      requestExit();
    }
  );
  document
  .querySelector(
    "#quizQuestionAudioButton"
  )
  ?.addEventListener(
    "click",
    toggleQuestionAudio
  );
    document.querySelector("#quizFlag")?.addEventListener("click", toggleFlag);
    document.querySelector("#quizTrue")?.addEventListener("click", () => checkAnswer(true));
    document.querySelector("#quizFalse")?.addEventListener("click", () => checkAnswer(false));
    document.querySelector("#quizPrevious")?.addEventListener("click", previousQuestion);
    document.querySelector("#quizNext")?.addEventListener("click", nextQuestion);
    document.querySelector("#quizMap")?.addEventListener("click", renderMap);
  }

  function answerClass(value, selected, correct, answered) {
    if (!answered) return "";

    if (value === normalizeBoolean(correct)) return "correct-answer";
    if (value === selected) return "wrong-answer";
    return "quiz-v2-muted-answer";
  }

  function feedbackTemplate(question, answer) {
    const correct = Boolean(answer?.isCorrect);

    return `
      <div class="feedback-box ${correct ? "feedback-correct" : "feedback-wrong"}">
        <div class="quiz-v2-feedback-title">
          <span>${correct ? "✅" : "❌"}</span>
          <div>
            <h2>${correct ? "Risposta corretta" : "Risposta sbagliata"}</h2>
            <small>
              Risposta corretta:
              <strong>${normalizeBoolean(question.answer) ? "VERO" : "FALSO"}</strong>
            </small>
          </div>
        </div>
        <p>${escapeHtml(question.explanation || "Spiegazione non disponibile.")}</p>
      </div>
    `;
  }

  function checkAnswer(selectedAnswer) {
    const question = quizQuestions[currentIndex];
    if (!question) return;

    const questionId = String(question.id);
    if (answers[questionId]) return;

    const correctAnswer = normalizeBoolean(question.answer);

    answers[questionId] = {
      questionId,
      selectedAnswer,
      correctAnswer,
      isCorrect: selectedAnswer === correctAnswer
    };

    saveSession();
    renderQuestion();
  }

  function previousQuestion() {
    if (currentIndex <= 0) return;
    currentIndex -= 1;
    saveSession();
    renderQuestion();
  }

  function nextQuestion() {
    if (currentIndex < quizQuestions.length - 1) {
      currentIndex += 1;
      saveSession();
      renderQuestion();
      return;
    }

    renderReview();
  }

  function toggleFlag() {
    const question = quizQuestions[currentIndex];
    if (!question) return;

    const id = String(question.id);
    flaggedIds.has(id) ? flaggedIds.delete(id) : flaggedIds.add(id);
    saveSession();
    renderQuestion();
  }

  function renderMap() {
    app.innerHTML = `
      <main class="page quiz-v2-page">
        <section class="card quiz-v2-map-card">
          <header class="quiz-v2-map-header">
            <div>
              <p class="eyebrow">NAVIGAZIONE QUIZ</p>
              <h1>Mappa domande</h1>
              <p class="subtitle">
                Apri direttamente una domanda e controlla il suo stato.
              </p>
            </div>
            <button id="quizCloseMap" class="btn btn-primary" type="button">
              Torna al quiz
            </button>
          </header>

          <div class="quiz-v2-legend">
            <span>🔵 Corrente</span>
            <span>🟢 Corretta</span>
            <span>🔴 Sbagliata</span>
            <span>⚪ Mancante</span>
            <span>🚩 Segnalata</span>
          </div>

          <div class="quiz-v2-map-grid">
            ${quizQuestions
              .map((question, index) => {
                const id = String(question.id);
                const answer = answers[id];
                const status = !answer
                  ? "is-empty"
                  : answer.isCorrect
                    ? "is-correct"
                    : "is-wrong";

                return `
                  <button
                    class="quiz-v2-map-item ${status} ${
                      index === currentIndex ? "is-current" : ""
                    }"
                    data-index="${index}"
                    type="button"
                  >
                    <strong>${index + 1}</strong>
                    ${flaggedIds.has(id) ? "<span>🚩</span>" : ""}
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
      </main>
    `;

    document.querySelector("#quizCloseMap")?.addEventListener("click", renderQuestion);
    document.querySelectorAll(".quiz-v2-map-item").forEach((button) => {
      button.addEventListener("click", () => {
        currentIndex = Number(button.dataset.index);
        saveSession();
        renderQuestion();
      });
    });
  }

  function renderReview() {
    const unansweredCount = quizQuestions.length - getAnsweredCount();

    app.innerHTML = `
      <main class="page quiz-v2-page">
        <section class="card quiz-v2-review">
          <button id="quizReviewBack" class="back-button" type="button">
            ← Torna al quiz
          </button>
          <p class="eyebrow">CONTROLLO FINALE</p>
          <h1>Riepilogo del quiz</h1>
          <p class="subtitle">
            Controlla le risposte prima di consegnare. Le domande senza
            risposta saranno considerate errate.
          </p>

          <div class="quiz-v2-review-stats">
            <div><span>✅</span><strong>${getCorrectCount()}</strong><small>Corrette</small></div>
            <div><span>❌</span><strong>${getWrongCount()}</strong><small>Sbagliate</small></div>
            <div><span>⚪</span><strong>${unansweredCount}</strong><small>Mancanti</small></div>
            <div><span>🚩</span><strong>${flaggedIds.size}</strong><small>Segnalate</small></div>
          </div>

          <div class="${unansweredCount ? "quiz-v2-warning" : "quiz-v2-success"}">
            ${
              unansweredCount
                ? `Hai ${unansweredCount} ${
                    unansweredCount === 1 ? "domanda senza risposta" : "domande senza risposta"
                  }.`
                : "✅ Hai risposto a tutte le domande."
            }
          </div>

          <div class="quiz-v2-review-list">
            ${quizQuestions
              .map((question, index) => {
                const id = String(question.id);
                const answer = answers[id];
                const label = !answer
                  ? "Senza risposta"
                  : answer.isCorrect
                    ? "Corretta"
                    : "Sbagliata";
                const status = !answer
                  ? "is-empty"
                  : answer.isCorrect
                    ? "is-correct"
                    : "is-wrong";

                return `
                  <button
                    class="quiz-v2-review-item ${status}"
                    data-index="${index}"
                    type="button"
                  >
                    <span class="quiz-v2-review-number">${index + 1}</span>
                    <span class="quiz-v2-review-question">${escapeHtml(question.question)}</span>
                    <span class="quiz-v2-review-label">
                      ${flaggedIds.has(id) ? "🚩 " : ""}${label}
                    </span>
                  </button>
                `;
              })
              .join("")}
          </div>

          <div class="quiz-v2-review-actions">
            <button id="quizCompleteMissing" class="btn btn-secondary" type="button">
              ${unansweredCount ? "Completa le mancanti" : "Mappa domande"}
            </button>
            <button id="quizFinish" class="btn btn-primary" type="button">
              Consegna il quiz
            </button>
          </div>
        </section>
      </main>
    `;

    document.querySelector("#quizReviewBack")?.addEventListener("click", renderQuestion);
    document.querySelector("#quizFinish")?.addEventListener("click", finishQuiz);
    document.querySelector("#quizCompleteMissing")?.addEventListener("click", () => {
      const firstMissing = quizQuestions.findIndex(
        (question) => !answers[String(question.id)]
      );

      if (firstMissing >= 0) {
        currentIndex = firstMissing;
        saveSession();
        renderQuestion();
      } else {
        renderMap();
      }
    });

    document.querySelectorAll(".quiz-v2-review-item").forEach((button) => {
      button.addEventListener("click", () => {
        currentIndex = Number(button.dataset.index);
        saveSession();
        renderQuestion();
      });
    });
  }

  function finishQuiz() {
    if (isFinishing) return;
    isFinishing = true;
    stopTimer();

    const completedAnswers = quizQuestions.map((question) => {
      const questionId = String(question.id);
      const savedAnswer = answers[questionId];

      if (savedAnswer) {
        return {
          questionId,
          selectedAnswer: normalizeBoolean(savedAnswer.selectedAnswer),
          correctAnswer: normalizeBoolean(question.answer),
          isCorrect: Boolean(savedAnswer.isCorrect)
        };
      }

      return {
        questionId,
        selectedAnswer: null,
        correctAnswer: normalizeBoolean(question.answer),
        isCorrect: false,
        unanswered: true
      };
    });

    const correctAnswers = completedAnswers.filter((answer) => answer.isCorrect).length;
    const wrongAnswers = completedAnswers.length - correctAnswers;
    const unansweredAnswers = completedAnswers.filter((answer) => answer.unanswered).length;
    const durationSeconds = getElapsedSeconds();

    clearSession();

    onFinish?.({
      totalQuestions: quizQuestions.length,
      correctAnswers,
      wrongAnswers,
      unansweredAnswers,
      durationSeconds,
      averageSecondsPerQuestion:
        quizQuestions.length > 0
          ? Math.round(durationSeconds / quizQuestions.length)
          : 0,
      flaggedQuestionIds: [...flaggedIds],
      answers: completedAnswers
    });
  }

  function requestExit() {
    if (getAnsweredCount() === 0) {
      clearSession();
      stopTimer();
      onBack?.();
      return;
    }

    const exit = window.confirm(
      "Vuoi uscire? Il progresso resterà salvato su questo dispositivo."
    );

    if (!exit) return;

    saveSession();
    stopTimer();
    onBack?.();
  }

  function getAnsweredCount() {
    return quizQuestions.filter((question) => answers[String(question.id)]).length;
  }

  function getCorrectCount() {
    return Object.values(answers).filter((answer) => answer?.isCorrect === true).length;
  }

  function getWrongCount() {
    return Object.values(answers).filter((answer) => answer?.isCorrect === false).length;
  }

  function getElapsedSeconds() {
    return elapsedBeforeStart + Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  }

  function startTimer() {
    stopTimer();
    timerId = window.setInterval(() => {
      const element = document.querySelector("#quizTimer");
      if (element) {
        element.textContent = `⏱ ${formatDuration(getElapsedSeconds())}`;
      }
      saveSession();
    }, 1000);
  }

  function stopTimer() {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
  }

  function createSessionData() {
    return {
      version: 3,
      title,

      questionIds:
        quizQuestions.map(
          (question) =>
            String(question.id)
        ),

      currentIndex,
      answers,

      flaggedIds:
        [...flaggedIds],

      elapsedSeconds:
        getElapsedSeconds(),

      updatedAt:
        new Date().toISOString(),

      updatedAtMs:
        Date.now()
    };
  }

  function saveLocalSession(
    session
  ) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(session)
      );
    } catch (error) {
      console.warn(
        "Quiz local saving error:",
        error
      );
    }
  }

  function scheduleCloudSave(
    session
  ) {
    if (!syncUser?.uid) {
      return;
    }

    if (cloudSaveTimerId) {
      window.clearTimeout(
        cloudSaveTimerId
      );
    }

    /*
     * Local save তাৎক্ষণিক।
     * Cloud save debounce করা হয়েছে যাতে
     * timer প্রতি second-এ Firestore write না করে।
     */
    cloudSaveTimerId =
      window.setTimeout(
        () => {
          cloudSaveTimerId = null;

          saveCloudDraft({
            user: syncUser,
            draftId:
              cloudDraftId,
            draft:
              session
          });
        },
        1500
      );
  }

  function saveSession() {
    if (
      quizQuestions.length === 0
    ) {
      return;
    }

    const session =
      createSessionData();

    saveLocalSession(
      session
    );

    scheduleCloudSave(
      session
    );
  }

  function validateSession(
    session
  ) {
    if (
      !session ||
      typeof session !== "object" ||
      !Array.isArray(
        session.questionIds
      ) ||
      session.questionIds.length === 0
    ) {
      return null;
    }

    const availableIds =
      new Set(
        sourceQuestions.map(
          (question) =>
            String(question.id)
        )
      );

    const hasValidQuestion =
      session.questionIds.some(
        (id) =>
          availableIds.has(
            String(id)
          )
      );

    if (!hasValidQuestion) {
      return null;
    }

    return session;
  }

    function loadSession() {
    try {
      const raw =
        localStorage.getItem(
          storageKey
        );

      if (!raw) {
        return null;
      }

      const session =
        JSON.parse(raw);

      const validSession =
        validateSession(
          session
        );

      if (!validSession) {
        clearLocalSession();
        return null;
      }

      return validSession;
    } catch (error) {
      console.warn(
        "Quiz local loading error:",
        error
      );

      clearLocalSession();

      return null;
    }
  }

  function clearLocalSession() {
    try {
      localStorage.removeItem(
        storageKey
      );
    } catch (error) {
      console.warn(
        "Quiz local clearing error:",
        error
      );
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(
        storageKey
      );
    } catch (error) {
      console.warn(
        "Quiz local clearing error:",
        error
      );
    }
  }

  function clearSession() {
     clearLocalSession();

    if (cloudSaveTimerId) {
      window.clearTimeout(
        cloudSaveTimerId
      );

      cloudSaveTimerId = null;
    }

    if (syncUser?.uid) {
      deleteCloudDraft({
        user: syncUser,
        draftId: cloudDraftId
      });
    }
  }
}