import {
  collection,
  getDocs,
  limit,
  orderBy,
  query
} from "firebase/firestore";

import { db } from "../firebase.js";
import { questions } from "../data/questions.js";

/**
 * Firestore থেকে ব্যবহারকারীর ministerial exam history দেখায়।
 *
 * Required:
 * user
 * onBack
 *
 * Optional:
 * container
 */
export async function showExamHistory({
  user,
  onBack,
  container = document.querySelector("#app")
}) {
  if (!container) {
    throw new Error("#app container পাওয়া যায়নি।");
  }

  if (!user?.uid) {
    container.innerHTML = `
      <main class="exam-history-page">
        <section class="exam-history-error">
          <h1>Accesso richiesto</h1>
          <p>La cronologia degli esami è disponibile dopo il login.</p>
        </section>
      </main>
    `;
    return;
  }

  container.innerHTML = createLoadingTemplate();

  try {
    const attempts = await loadExamAttempts(user.uid);
    renderExamHistory({
      container,
      attempts,
      onBack
    });
  } catch (error) {
    console.error("Exam history loading error:", error);

    container.innerHTML = `
      <main class="exam-history-page">
        <section class="exam-history-error">
          <div class="exam-history-error-icon">⚠️</div>

          <h1>Impossibile caricare la cronologia</h1>

          <p>
            Si è verificato un errore durante il caricamento degli esami.
          </p>

          <button
            type="button"
            class="exam-history-primary-button"
            id="exam-history-back-error"
          >
            Torna alla dashboard
          </button>
        </section>
      </main>
    `;

    document
      .querySelector("#exam-history-back-error")
      ?.addEventListener("click", () => {
        onBack?.();
      });
  }
}

async function loadExamAttempts(uid) {
  const attemptsReference = collection(
    db,
    "users",
    uid,
    "examAttempts"
  );

  const attemptsQuery = query(
    attemptsReference,
    orderBy("createdAt", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(attemptsQuery);

  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data()
  }));
}

function renderExamHistory({
  container,
  attempts,
  onBack
}) {
  const statistics = calculateStatistics(attempts);

  container.innerHTML = `
    <main class="exam-history-page">
      <header class="exam-history-header">
        <button
          type="button"
          class="exam-history-back-button"
          id="exam-history-back"
          aria-label="Torna alla dashboard"
        >
          ←
        </button>

        <div>
          <p class="exam-history-eyebrow">
            Scheda Ministeriale
          </p>

          <h1>Cronologia esami</h1>

          <p>
            Controlla i tuoi risultati e rivedi gli errori.
          </p>
        </div>
      </header>

      ${createStatisticsTemplate(statistics)}

      <section class="exam-history-content">
        <div class="exam-history-section-heading">
          <div>
            <p class="exam-history-eyebrow">
              Ultimi risultati
            </p>

            <h2>I tuoi esami</h2>
          </div>

          <span class="exam-history-count">
            ${attempts.length}
            ${attempts.length === 1 ? "esame" : "esami"}
          </span>
        </div>

        ${
          attempts.length === 0
            ? createEmptyTemplate()
            : createAttemptsTemplate(attempts)
        }
      </section>
    </main>
  `;

  document
    .querySelector("#exam-history-back")
    ?.addEventListener("click", () => {
      onBack?.();
    });

  document
    .querySelectorAll("[data-exam-attempt-index]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const attemptIndex = Number(
          button.dataset.examAttemptIndex
        );

        const attempt = attempts[attemptIndex];

        if (!attempt) {
          return;
        }

        renderAttemptDetails({
          container,
          attempt,
          attemptNumber: attempts.length - attemptIndex,
          onBackToHistory: () => {
            renderExamHistory({
              container,
              attempts,
              onBack
            });
          }
        });
      });
    });
}

function calculateStatistics(attempts) {
  const totalAttempts = attempts.length;

  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      passedAttempts: 0,
      failedAttempts: 0,
      passRate: 0,
      averageErrors: 0,
      bestErrors: 0,
      currentStreak: 0
    };
  }

  const passedAttempts = attempts.filter(
    (attempt) => Boolean(attempt.passed)
  ).length;

  const failedAttempts = totalAttempts - passedAttempts;

  const errorValues = attempts.map(getAttemptErrors);

  const totalErrors = errorValues.reduce(
    (sum, currentErrors) => sum + currentErrors,
    0
  );

  const averageErrors = totalErrors / totalAttempts;
  const bestErrors = Math.min(...errorValues);

  let currentStreak = 0;

  for (const attempt of attempts) {
    if (!attempt.passed) {
      break;
    }

    currentStreak += 1;
  }

  return {
    totalAttempts,
    passedAttempts,
    failedAttempts,
    passRate: Math.round(
      (passedAttempts / totalAttempts) * 100
    ),
    averageErrors: Number(averageErrors.toFixed(1)),
    bestErrors,
    currentStreak
  };
}

function createStatisticsTemplate(statistics) {
  return `
    <section class="exam-history-statistics">
      <article class="exam-history-stat-card">
        <span class="exam-history-stat-icon">📝</span>

        <div>
          <span>Esami totali</span>
          <strong>${statistics.totalAttempts}</strong>
        </div>
      </article>

      <article class="exam-history-stat-card exam-history-stat-success">
        <span class="exam-history-stat-icon">✅</span>

        <div>
          <span>Promossi</span>
          <strong>${statistics.passedAttempts}</strong>
        </div>
      </article>

      <article class="exam-history-stat-card exam-history-stat-danger">
        <span class="exam-history-stat-icon">❌</span>

        <div>
          <span>Bocciati</span>
          <strong>${statistics.failedAttempts}</strong>
        </div>
      </article>

      <article class="exam-history-stat-card">
        <span class="exam-history-stat-icon">📈</span>

        <div>
          <span>Percentuale promossi</span>
          <strong>${statistics.passRate}%</strong>
        </div>
      </article>

      <article class="exam-history-stat-card">
        <span class="exam-history-stat-icon">🎯</span>

        <div>
          <span>Media errori</span>
          <strong>${formatDecimal(statistics.averageErrors)}</strong>
        </div>
      </article>

      <article class="exam-history-stat-card">
        <span class="exam-history-stat-icon">🏆</span>

        <div>
          <span>Miglior risultato</span>
          <strong>${statistics.bestErrors} errori</strong>
        </div>
      </article>

      <article class="exam-history-stat-card">
        <span class="exam-history-stat-icon">🔥</span>

        <div>
          <span>Serie attuale</span>
          <strong>${statistics.currentStreak}</strong>
        </div>
      </article>
    </section>
  `;
}

function createAttemptsTemplate(attempts) {
  return `
    <div class="exam-history-list">
      ${attempts
        .map((attempt, index) => {
          const passed = Boolean(attempt.passed);
          const errors = getAttemptErrors(attempt);
          const correctAnswers = getCorrectAnswers(attempt);
          const totalQuestions = getTotalQuestions(attempt);
          const percentage = getAttemptPercentage(attempt);
          const duration = formatDuration(attempt.durationSeconds ??
attempt.duration);
          const date = formatAttemptDate(attempt);
          const unanswered = getUnansweredCount(attempt);

          return `
            <article
              class="exam-history-item ${
                passed
                  ? "exam-history-item-passed"
                  : "exam-history-item-failed"
              }"
            >
              <div class="exam-history-item-status">
                <div
                  class="exam-history-result-icon ${
                    passed
                      ? "exam-history-result-icon-passed"
                      : "exam-history-result-icon-failed"
                  }"
                >
                  ${passed ? "✓" : "×"}
                </div>

                <div>
                  <span class="exam-history-attempt-label">
                    Esame ${attempts.length - index}
                  </span>

                  <strong
                    class="${
                      passed
                        ? "exam-history-passed-text"
                        : "exam-history-failed-text"
                    }"
                  >
                    ${passed ? "PROMOSSO" : "BOCCIATO"}
                  </strong>

                  <time>${escapeHtml(date)}</time>
                </div>
              </div>

              <div class="exam-history-item-metrics">
                <div>
                  <span>Errori</span>
                  <strong>${errors}</strong>
                </div>

                <div>
                  <span>Corrette</span>
                  <strong>
                    ${correctAnswers}/${totalQuestions}
                  </strong>
                </div>

                <div>
                  <span>Punteggio</span>
                  <strong>${percentage}%</strong>
                </div>

                <div>
                  <span>Tempo</span>
                  <strong>${escapeHtml(duration)}</strong>
                </div>

                <div>
                  <span>Non risposte</span>
                  <strong>${unanswered}</strong>
                </div>
              </div>

              <button
                type="button"
                class="exam-history-review-button"
                data-exam-attempt-index="${index}"
              >
                Rivedi esame
                <span aria-hidden="true">→</span>
              </button>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAttemptDetails({
  container,
  attempt,
  attemptNumber,
  onBackToHistory
}) {
  const passed = Boolean(attempt.passed);
  const errors = getAttemptErrors(attempt);
  const totalQuestions = getTotalQuestions(attempt);
  const correctAnswers = getCorrectAnswers(attempt);
  const percentage = getAttemptPercentage(attempt);
  const duration = formatDuration(attempt.durationSeconds ??
attempt.duration);
  const date = formatAttemptDate(attempt);

  const attemptQuestions = buildAttemptQuestions(attempt);

  container.innerHTML = `
    <main class="exam-review-page">
      <header class="exam-history-header">
        <button
          type="button"
          class="exam-history-back-button"
          id="exam-review-back"
          aria-label="Torna alla cronologia"
        >
          ←
        </button>

        <div>
          <p class="exam-history-eyebrow">
            Revisione esame
          </p>

          <h1>Esame ${attemptNumber}</h1>

          <p>${escapeHtml(date)}</p>
        </div>
      </header>

      <section
        class="exam-review-summary ${
          passed
            ? "exam-review-summary-passed"
            : "exam-review-summary-failed"
        }"
      >
        <div class="exam-review-summary-result">
          <div
            class="exam-history-result-icon ${
              passed
                ? "exam-history-result-icon-passed"
                : "exam-history-result-icon-failed"
            }"
          >
            ${passed ? "✓" : "×"}
          </div>

          <div>
            <span>Risultato</span>

            <h2>${passed ? "PROMOSSO" : "BOCCIATO"}</h2>
          </div>
        </div>

        <div class="exam-review-summary-grid">
          <div>
            <span>Errori</span>
            <strong>${errors}</strong>
          </div>

          <div>
            <span>Risposte corrette</span>
            <strong>${correctAnswers}/${totalQuestions}</strong>
          </div>

          <div>
            <span>Punteggio</span>
            <strong>${percentage}%</strong>
          </div>

          <div>
            <span>Tempo</span>
            <strong>${escapeHtml(duration)}</strong>
          </div>
        </div>
      </section>

      <section class="exam-review-content">
        <div class="exam-history-section-heading">
          <div>
            <p class="exam-history-eyebrow">
              Domande e risposte
            </p>

            <h2>Revisione completa</h2>
          </div>

          <span class="exam-history-count">
            ${attemptQuestions.length} domande
          </span>
        </div>

        ${
          attemptQuestions.length > 0
            ? createReviewQuestionsTemplate(attemptQuestions)
            : createMissingQuestionsTemplate()
        }
      </section>
    </main>
  `;

  document
    .querySelector("#exam-review-back")
    ?.addEventListener("click", () => {
      onBackToHistory?.();
    });
}

function buildAttemptQuestions(attempt) {
  const questionIds = Array.isArray(attempt.questionIds)
    ? attempt.questionIds
    : [];

  const savedAnswers = attempt.answers ?? {};

  return questionIds
    .map((questionId, questionIndex) => {
      const question = findQuestion(questionId);

      if (!question) {
        return null;
      }

      const selectedAnswer = getSavedAnswer(
        savedAnswers,
        questionId,
        questionIndex
      );

      const correctAnswer = getCorrectAnswer(question);

      const isAnswered =
        selectedAnswer !== null &&
        selectedAnswer !== undefined &&
        selectedAnswer !== "";

      const isCorrect =
        isAnswered &&
        normalizeAnswer(selectedAnswer) ===
          normalizeAnswer(correctAnswer);

      return {
        question,
        questionId,
        questionIndex,
        selectedAnswer,
        correctAnswer,
        isAnswered,
        isCorrect
      };
    })
    .filter(Boolean);
}

function createReviewQuestionsTemplate(reviewQuestions) {
  return `
    <div class="exam-review-question-list">
      ${reviewQuestions
        .map((reviewItem, index) => {
          const {
            question,
            selectedAnswer,
            correctAnswer,
            isAnswered,
            isCorrect
          } = reviewItem;

          const questionText = getQuestionText(question);
          const explanation = getQuestionExplanation(question);

          const statusClass = !isAnswered
            ? "exam-review-question-unanswered"
            : isCorrect
              ? "exam-review-question-correct"
              : "exam-review-question-wrong";

          const statusLabel = !isAnswered
            ? "NON RISPOSTA"
            : isCorrect
              ? "CORRETTA"
              : "ERRATA";

          const statusIcon = !isAnswered
            ? "–"
            : isCorrect
              ? "✓"
              : "×";

          return `
            <article class="exam-review-question ${statusClass}">
              <div class="exam-review-question-header">
                <div class="exam-review-question-number">
                  ${index + 1}
                </div>

                <span class="exam-review-question-status">
                  ${statusIcon}
                  ${statusLabel}
                </span>
              </div>

              <h3>${escapeHtml(questionText)}</h3>

              <div class="exam-review-answer-grid">
                <div
                  class="exam-review-answer-box ${
                    isCorrect
                      ? "exam-review-answer-correct"
                      : "exam-review-answer-user"
                  }"
                >
                  <span>La tua risposta</span>

                  <strong>
                    ${
                      isAnswered
                        ? escapeHtml(
                            formatAnswer(selectedAnswer)
                          )
                        : "Nessuna risposta"
                    }
                  </strong>
                </div>

                ${
                  isCorrect
                    ? ""
                    : `
                      <div class="exam-review-answer-box exam-review-answer-correct">
                        <span>Risposta corretta</span>

                        <strong>
                          ${escapeHtml(
                            formatAnswer(correctAnswer)
                          )}
                        </strong>
                      </div>
                    `
                }
              </div>

              ${
                explanation
                  ? `
                    <div class="exam-review-explanation">
                      <strong>Spiegazione</strong>
                      <p>${escapeHtml(explanation)}</p>
                    </div>
                  `
                  : ""
              }
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function createLoadingTemplate() {
  return `
    <main class="exam-history-page">
      <section class="exam-history-loading">
        <div class="exam-history-spinner"></div>

        <h1>Caricamento cronologia</h1>

        <p>Attendi qualche secondo...</p>
      </section>
    </main>
  `;
}

function createEmptyTemplate() {
  return `
    <section class="exam-history-empty">
      <div class="exam-history-empty-icon">📝</div>

      <h3>Nessun esame completato</h3>

      <p>
        Completa una Scheda Ministeriale per vedere qui
        statistiche, risultati e revisione degli errori.
      </p>
    </section>
  `;
}

function createMissingQuestionsTemplate() {
  return `
    <section class="exam-history-empty">
      <div class="exam-history-empty-icon">🔎</div>

      <h3>Domande non disponibili</h3>

      <p>
        Il risultato dell’esame è stato salvato, ma non è
        stato possibile associare le domande originali.
      </p>
    </section>
  `;
}

function findQuestion(questionId) {
  return questions.find((question) => {
    const availableIds = [
      question.id,
      question.questionId,
      question.uid,
      question.code
    ];

    return availableIds.some(
      (availableId) =>
        String(availableId) === String(questionId)
    );
  });
}

function getSavedAnswer(
  savedAnswers,
  questionId,
  questionIndex
) {
  if (Array.isArray(savedAnswers)) {
    const answerItem = savedAnswers[questionIndex];

    if (
      answerItem &&
      typeof answerItem === "object" &&
      !Array.isArray(answerItem)
    ) {
      return (
        answerItem.answer ??
        answerItem.selectedAnswer ??
        answerItem.value ??
        null
      );
    }

    return answerItem ?? null;
  }

  if (
    savedAnswers &&
    typeof savedAnswers === "object"
  ) {
    const answerItem =
      savedAnswers[questionId] ??
      savedAnswers[String(questionId)] ??
      savedAnswers[questionIndex] ??
      savedAnswers[String(questionIndex)];

    if (
      answerItem &&
      typeof answerItem === "object" &&
      !Array.isArray(answerItem)
    ) {
      return (
        answerItem.answer ??
        answerItem.selectedAnswer ??
        answerItem.value ??
        null
      );
    }

    return answerItem ?? null;
  }

  return null;
}

function getQuestionText(question) {
  return (
    question.question ??
    question.text ??
    question.domanda ??
    question.title ??
    "Domanda"
  );
}

function getCorrectAnswer(question) {
  return (
    question.correctAnswer ??
    question.correct ??
    question.answer ??
    question.rispostaCorretta ??
    question.isTrue ??
    null
  );
}

function getQuestionExplanation(question) {
  return (
    question.explanation ??
    question.spiegazione ??
    question.description ??
    ""
  );
}

function getAttemptErrors(attempt) {
  const possibleValues = [
    attempt.errors,
    attempt.errorCount,
    attempt.wrongAnswers,
    attempt.incorrectAnswers,
    attempt.statistics?.errors,
    attempt.statistics?.wrongAnswers
  ];

  const savedErrors = possibleValues.find(
    (value) => Number.isFinite(Number(value))
  );

  if (savedErrors !== undefined) {
    return Number(savedErrors);
  }

  const totalQuestions = getTotalQuestions(attempt);
  const correctAnswers = getCorrectAnswers(attempt);

  return Math.max(totalQuestions - correctAnswers, 0);
}

function getCorrectAnswers(attempt) {
  const possibleValues = [
    attempt.correctAnswers,
    attempt.correctCount,
    attempt.score,
    attempt.statistics?.correctAnswers,
    attempt.statistics?.correct
  ];

  const savedCorrectAnswers = possibleValues.find(
    (value) => Number.isFinite(Number(value))
  );

  if (savedCorrectAnswers !== undefined) {
    return Number(savedCorrectAnswers);
  }

  const totalQuestions = getTotalQuestions(attempt);
  const errors = Number(
    attempt.errors ??
      attempt.errorCount ??
      attempt.statistics?.errors ??
      0
  );

  return Math.max(totalQuestions - errors, 0);
}

function getTotalQuestions(attempt) {
  const possibleValues = [
    attempt.totalQuestions,
    attempt.questionCount,
    attempt.statistics?.totalQuestions,
    attempt.questionIds?.length
  ];

  const totalQuestions = possibleValues.find(
    (value) =>
      Number.isFinite(Number(value)) &&
      Number(value) > 0
  );

  return totalQuestions !== undefined
    ? Number(totalQuestions)
    : 30;
}

function getAttemptPercentage(attempt) {
  const savedPercentage = Number(
    attempt.percentage ??
      attempt.statistics?.percentage
  );

  if (Number.isFinite(savedPercentage)) {
    return Math.round(savedPercentage);
  }

  const totalQuestions = getTotalQuestions(attempt);

  if (totalQuestions === 0) {
    return 0;
  }

  return Math.round(
    (getCorrectAnswers(attempt) / totalQuestions) * 100
  );
}

function getUnansweredCount(attempt) {
  const possibleValues = [
  attempt.unansweredAnswers,
  attempt.unanswered,
  attempt.unansweredCount,
  attempt.statistics?.unansweredAnswers,
  attempt.statistics?.unanswered
];


  const savedValue = possibleValues.find(
    (value) => Number.isFinite(Number(value))
  );

  if (savedValue !== undefined) {
    return Number(savedValue);
  }

  return 0;
}

function formatAttemptDate(attempt) {
  const rawDate =
    attempt.createdAt ??
    attempt.completedAt ??
    attempt.finishedAt ??
    attempt.timestamp;

  if (!rawDate) {
    return "Data non disponibile";
  }

  let date;

  if (typeof rawDate.toDate === "function") {
    date = rawDate.toDate();
  } else if (rawDate.seconds) {
    date = new Date(rawDate.seconds * 1000);
  } else {
    date = new Date(rawDate);
  }

  if (Number.isNaN(date.getTime())) {
    return "Data non disponibile";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDuration(durationValue) {
  const duration = Number(durationValue);

  if (!Number.isFinite(duration) || duration < 0) {
    return "—";
  }

  /*
   * 1200-এর বেশি হলে millisecond হিসেবে ধরা হচ্ছে।
   * অন্যথায় second হিসেবে ধরা হচ্ছে।
   */
  const totalSeconds =
    duration > 1200
      ? Math.floor(duration / 1000)
      : Math.floor(duration);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatAnswer(answer) {
  if (typeof answer === "boolean") {
    return answer ? "VERO" : "FALSO";
  }

  const normalizedAnswer = String(answer)
    .trim()
    .toLowerCase();

  if (
    normalizedAnswer === "true" ||
    normalizedAnswer === "vero" ||
    normalizedAnswer === "v"
  ) {
    return "VERO";
  }

  if (
    normalizedAnswer === "false" ||
    normalizedAnswer === "falso" ||
    normalizedAnswer === "f"
  ) {
    return "FALSO";
  }

  return String(answer);
}

function normalizeAnswer(answer) {
  if (typeof answer === "boolean") {
    return answer;
  }

  const normalizedAnswer = String(answer)
    .trim()
    .toLowerCase();

  if (
    normalizedAnswer === "true" ||
    normalizedAnswer === "vero" ||
    normalizedAnswer === "v" ||
    normalizedAnswer === "1"
  ) {
    return true;
  }

  if (
    normalizedAnswer === "false" ||
    normalizedAnswer === "falso" ||
    normalizedAnswer === "f" ||
    normalizedAnswer === "0"
  ) {
    return false;
  }

  return normalizedAnswer;
}

function formatDecimal(value) {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 1
  }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}