import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import { db } from "../firebase.js";

import {
  addExperience
} from "../utils/progressSystem.js";
const XP_REWARDS = {
  ministerialPassed: 100,
  ministerialFailed: 40
};
import { questions } from "../data/questions.js";

import {
  ministerialExamConfig
} from "../config/examConfig.js";

import {
  showMinisterialExam
} from "./ministerialExam.js";

export function openMinisterialFlow(
  app,
  user,
  actions
) {
  showMinisterialStartPage(
    app,
    user,
    actions
  );
}

function showMinisterialStartPage(
  app,
  user,
  actions
) {
  const config =
    ministerialExamConfig;

  const availableQuestions =
    questions.length;

  const enoughQuestions =
    availableQuestions >=
    config.questionCount;

  app.innerHTML = `
    <main class="page">
      <section class="card ministerial-start-card">
        <button
          id="ministerialBackButton"
          class="back-button"
        >
          ← Dashboard
        </button>

        <div class="ministerial-start-hero">
          <div class="ministerial-start-icon">
            🇮🇹
          </div>

          <p class="eyebrow">
            SIMULAZIONE D'ESAME
          </p>

          <h1>
            Scheda Ministeriale
          </h1>

          <p class="subtitle">
            Allenati in una simulazione completa,
            senza suggerimenti e senza vedere subito
            le risposte corrette.
          </p>
        </div>

        <div class="exam-rules-grid">
          <article class="exam-rule-card">
            <div class="exam-rule-icon">
              📋
            </div>

            <span>Domande</span>

            <strong>
              ${config.questionCount}
            </strong>
          </article>

          <article class="exam-rule-card">
            <div class="exam-rule-icon">
              ⏱️
            </div>

            <span>Tempo</span>

            <strong>
              ${config.durationMinutes}
              min
            </strong>
          </article>

          <article class="exam-rule-card">
            <div class="exam-rule-icon">
              ❌
            </div>

            <span>Errori ammessi</span>

            <strong>
              ${config.maximumErrors}
            </strong>
          </article>

          <article class="exam-rule-card">
            <div class="exam-rule-icon">
              ✅
            </div>

            <span>Risultato</span>

            <strong class="exam-rule-result">
              Promosso
            </strong>
          </article>
        </div>

        <section class="exam-instructions">
          <p class="eyebrow">
            PRIMA DI INIZIARE
          </p>

          <h2>
            Come funziona
          </h2>

          <div class="exam-instruction-list">
            <div>
              <span>1</span>

              <p>
                Puoi spostarti liberamente tra
                le domande.
              </p>
            </div>

            <div>
              <span>2</span>

              <p>
                Puoi modificare una risposta
                prima della consegna.
              </p>
            </div>

            <div>
              <span>3</span>

              <p>
                Le domande senza risposta vengono
                considerate errate.
              </p>
            </div>

            <div>
              <span>4</span>

              <p>
                Con più di
                ${config.maximumErrors}
                errori il risultato sarà
                BOCCIATO.
              </p>
            </div>
          </div>
        </section>

        ${
          enoughQuestions
            ? `
              <div class="exam-ready-message">
                <span>✓</span>

                <div>
                  <strong>
                    Simulazione pronta
                  </strong>

                  <p>
                    Sono disponibili
                    ${availableQuestions}
                    domande nel database locale.
                  </p>
                </div>
              </div>

              <button
                id="startMinisterialExamButton"
                class="btn btn-primary full-width ministerial-start-button"
              >
                Inizia la simulazione
              </button>
            `
            : `
              <div class="exam-not-ready-message">
                <span>⚠️</span>

                <div>
                  <strong>
                    Domande insufficienti
                  </strong>

                  <p>
                    Per avviare una scheda servono almeno
                    ${config.questionCount}
                    domande. Attualmente ne sono disponibili
                    ${availableQuestions}.
                  </p>
                </div>
              </div>

              <button
                class="btn full-width ministerial-start-button"
                disabled
              >
                Simulazione non disponibile
              </button>
            `
        }

        <p class="exam-start-warning">
          Quando inizi, il timer partirà immediatamente.
        </p>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#ministerialBackButton"
    )
    .addEventListener(
      "click",
      actions.onBack
    );

  const startButton =
    document.querySelector(
      "#startMinisterialExamButton"
    );

  if (startButton) {
    startButton.addEventListener(
      "click",
      () => {
        startMinisterialExam(
          app,
          user,
          actions
        );
      }
    );
  }
}

function startMinisterialExam(
  app,
  user,
  actions
) {
  const config =
    ministerialExamConfig;

  const selectedQuestions =
    selectRandomQuestions(
      questions,
      config.questionCount
    );

  showMinisterialExam(
    app,
    {
      questions:
        selectedQuestions,

      durationMinutes:
        config.durationMinutes,

      maximumErrors:
        config.maximumErrors,

      onExit: () => {
        showMinisterialStartPage(
          app,
          user,
          actions
        );
      },

      onFinish: (result) => {
        saveMinisterialResult(
          app,
          user,
          result,
          selectedQuestions,
          actions
        );
      }
    }
  );
}

function selectRandomQuestions(
  sourceQuestions,
  questionCount
) {
  const shuffled =
    [...sourceQuestions];

  for (
    let index =
      shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      shuffled[index],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled.slice(
    0,
    questionCount
  );
}

async function saveMinisterialResult(
  app,
  user,
  result,
  examQuestions,
  actions
) {
  showMinisterialResultPage(
    app,
    result,
    examQuestions,
    {
      saving: true,

      onDashboard:
        actions.onBack,

      onRepeat: () => {
        startMinisterialExam(
          app,
          user,
          actions
        );
      }
    }
  );

  try {
    const percentage =
      result.totalQuestions > 0
        ? Math.round(
            (
              result.correctAnswers /
              result.totalQuestions
            ) * 100
          )
        : 0;

    const examAttempt = {
      mode: "ministerial",
      passed: result.passed,
      reason: result.reason,

      totalQuestions:
        result.totalQuestions,

      correctAnswers:
        result.correctAnswers,

      wrongAnswers:
        result.wrongAnswers,

      unansweredAnswers:
        result.unansweredAnswers,

      maximumErrors:
        result.maximumErrors,

      percentage,

      durationSeconds:
        result.durationSeconds,

      allowedDurationSeconds:
        result.allowedDurationSeconds,

      answers:
        result.answers,

      questionIds:
        examQuestions.map(
          (question) =>
            question.id
        ),

      createdAt:
        serverTimestamp()
    };

    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "examAttempts"
      ),
      examAttempt
    );

    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        completedQuizzes:
          increment(1),

        totalQuestions:
          increment(
            result.totalQuestions
          ),

        correctAnswers:
          increment(
            result.correctAnswers
          ),

        wrongAnswers:
          increment(
            result.wrongAnswers
          ),

        ministerialAttempts:
          increment(1),

        ministerialPassed:
          result.passed
            ? increment(1)
            : increment(0),

        ministerialFailed:
          result.passed
            ? increment(0)
            : increment(1),

        lastMinisterialPassed:
          result.passed,

        lastMinisterialErrors:
          result.wrongAnswers,

        lastMinisterialPercentage:
          percentage,

        lastQuizMode:
          "ministerial",

        lastQuizPercentage:
          percentage,

        lastQuizAt:
          serverTimestamp(),

        lastMinisterialAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    const earnedXp =
  result.passed
    ? XP_REWARDS.ministerialPassed
    : XP_REWARDS.ministerialFailed;

await addExperience(
  user,
  earnedXp
);
    updateMinisterialSavingMessage(
  result.passed
    ? `Risultato salvato. Hai guadagnato ${earnedXp} XP!`
    : `Risultato salvato. Hai guadagnato ${earnedXp} XP.`,
  "success"
);
  } catch (error) {
    console.error(
      "Ministerial exam saving error:",
      error
    );

    updateMinisterialSavingMessage(
      "L'esame è terminato, ma il risultato non è stato salvato.",
      "error"
    );
  }

  enableMinisterialResultButtons();
}

function showMinisterialResultPage(
  app,
  result,
  examQuestions,
  options
) {
  const percentage =
    result.totalQuestions > 0
      ? Math.round(
          (
            result.correctAnswers /
            result.totalQuestions
          ) * 100
        )
      : 0;

  const resultLabel =
    result.passed
      ? ministerialExamConfig
          .passingLabel
      : ministerialExamConfig
          .failingLabel;

  const resultDescription =
    result.passed
      ? `
        Hai superato la simulazione con
        ${result.wrongAnswers}
        ${
          result.wrongAnswers === 1
            ? "errore"
            : "errori"
        }.
      `
      : `
        Hai commesso
        ${result.wrongAnswers}
        errori. Il massimo consentito è
        ${result.maximumErrors}.
      `;

  const formattedDuration =
    formatDuration(
      result.durationSeconds
    );
const congratulationsPanel =
  result.passed
    ? `
        <section class="ministerial-congratulations">
          <div class="ministerial-congratulations-icon">
            🎉
          </div>

          <div class="ministerial-congratulations-content">
            <p class="eyebrow">
              OBIETTIVO RAGGIUNTO
            </p>

            <h2>
              Congratulazioni!
            </h2>

            <p>
              Hai superato la simulazione ministeriale
              con
              <strong>
                ${result.correctAnswers}
                risposte corrette su
                ${result.totalQuestions}
              </strong>
              e
              <strong>
                ${result.wrongAnswers}
                ${
                  result.wrongAnswers === 1
                    ? "errore"
                    : "errori"
                }
              </strong>.
            </p>

            <p class="ministerial-congratulations-message">
              Ottimo risultato. Continua ad allenarti
              per arrivare preparato all'esame reale.
            </p>
          </div>
        </section>
      `
    : "";

  const wrongReviewItems =
    result.answers
      .filter(
        (answer) =>
          !answer.isCorrect
      )
      .map((answer) => {
        const question =
          examQuestions.find(
            (item) =>
              item.id ===
              answer.questionId
          );

        if (!question) {
          return "";
        }

        return `
          <article class="exam-review-item">
            <div class="exam-review-question-number">
              ${examQuestions.findIndex(
                (item) =>
                  item.id ===
                  question.id
              ) + 1}
            </div>

            <div class="exam-review-content">
              <h3>
                ${question.question}
              </h3>

              <div class="exam-review-answers">
                <span class="review-wrong-answer">
                  Tua risposta:
                  ${
                    answer.answered
                      ? (
                          answer.selectedAnswer
                            ? "VERO"
                            : "FALSO"
                        )
                      : "NON DATA"
                  }
                </span>

                <span class="review-correct-answer">
                  Risposta corretta:
                  ${
                    answer.correctAnswer
                      ? "VERO"
                      : "FALSO"
                  }
                </span>
              </div>

              <p>
                ${question.explanation}
              </p>
            </div>
          </article>
        `;
      })
      .join("");

  app.innerHTML = `
    <main class="page ministerial-result-page">
      <section class="card ministerial-result-card">
        <div
          class="ministerial-result-hero ${
            result.passed
              ? "ministerial-result-passed"
              : "ministerial-result-failed"
          }"
        >
          <div class="ministerial-result-icon">
            ${
              result.passed
                ? "🏆"
                : "📚"
            }
          </div>

          <p class="eyebrow">
            ESITO DELLA SIMULAZIONE
          </p>

          <h1>
            ${resultLabel}
          </h1>

          <p>
            ${resultDescription}
          </p>
        </div>

        <div class="ministerial-result-stats">
          <article>
            <span>Corrette</span>

            <strong>
              ${result.correctAnswers}
            </strong>
          </article>

          <article>
            <span>Errori</span>

            <strong>
              ${result.wrongAnswers}
            </strong>
          </article>

          <article>
            <span>Non risposte</span>

            <strong>
              ${result.unansweredAnswers}
            </strong>
          </article>

          <article>
            <span>Percentuale</span>

            <strong>
              ${percentage}%
            </strong>
          </article>

          <article>
            <span>Tempo utilizzato</span>

            <strong>
              ${formattedDuration}
            </strong>
          </article>
        </div>

        ${congratulationsPanel}
        <p
          id="ministerialSavingMessage"
          class="message success"
        >
          ${
            options.saving
              ? "Salvataggio del risultato..."
              : ""
          }
        </p>

        ${
          result.wrongAnswers > 0
            ? `
              <section class="exam-review-section">
                <div class="exam-review-header">
                  <p class="eyebrow">
                    REVISIONE
                  </p>

                  <h2>
                    Controlla gli errori
                  </h2>

                  <p>
                    Studia le spiegazioni prima
                    di ripetere la simulazione.
                  </p>
                </div>

                <div class="exam-review-list">
                  ${wrongReviewItems}
                </div>
              </section>
            `
            : `
              <section class="perfect-exam-message">
                <div>⭐</div>

                <h2>
                  Esame perfetto
                </h2>

                <p>
                  Hai risposto correttamente
                  a tutte le domande.
                </p>
              </section>
            `
        }

        <div class="ministerial-result-actions">
          <button
            id="repeatMinisterialButton"
            class="btn btn-secondary"
            disabled
          >
            Nuova simulazione
          </button>

          <button
            id="ministerialDashboardButton"
            class="btn btn-primary"
            disabled
          >
            Torna alla dashboard
          </button>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#repeatMinisterialButton"
    )
    .addEventListener(
      "click",
      options.onRepeat
    );

  document
    .querySelector(
      "#ministerialDashboardButton"
    )
    .addEventListener(
      "click",
      options.onDashboard
    );
}

function formatDuration(
  totalSeconds
) {
  const safeSeconds =
    Math.max(
      0,
      Number(totalSeconds) || 0
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

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

function updateMinisterialSavingMessage(
  message,
  type
) {
  const element =
    document.querySelector(
      "#ministerialSavingMessage"
    );

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.className =
    `message ${type}`;
}

function enableMinisterialResultButtons() {
  const repeatButton =
    document.querySelector(
      "#repeatMinisterialButton"
    );

  const dashboardButton =
    document.querySelector(
      "#ministerialDashboardButton"
    );

  if (repeatButton) {
    repeatButton.disabled = false;
  }

  if (dashboardButton) {
    dashboardButton.disabled = false;
  }
}