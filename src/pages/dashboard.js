import {
  openMinisterialFlow
} from "./ministerialFlow.js";

export function showDashboard(
  app,
  user,
  stats,
  courseProgress,
  errorStatistics,
  actions
) {
  const totalQuestions =
    Number(
      stats.totalQuestions
    ) || 0;

  const correctAnswers =
    Number(
      stats.correctAnswers
    ) || 0;

  const wrongAnswers =
    Number(
      stats.wrongAnswers
    ) || 0;

  const completedQuizzes =
    Number(
      stats.completedQuizzes
    ) || 0;

  const percentage =
    totalQuestions > 0
      ? Math.round(
          (
            correctAnswers /
            totalQuestions
          ) * 100
        )
      : 0;

  const studentName =
    stats.name ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Studente";

  const {
    totalTopics = 0,
    completedTopics = 0,
    coursePercentage = 0,
    lastTopic = null
  } = courseProgress;

  const activeErrors =
    Number(
      errorStatistics.activeCount
    ) || 0;

  const masteredErrors =
    Number(
      errorStatistics.masteredCount
    ) || 0;

  const ministerialAttempts =
    Number(
      stats.ministerialAttempts
    ) || 0;

  const ministerialPassed =
    Number(
      stats.ministerialPassed
    ) || 0;

  const lastMinisterialPassed =
    stats.lastMinisterialPassed;

  const lastMinisterialErrors =
    Number(
      stats.lastMinisterialErrors
    );

    const totalXp =
  Number(stats.xp) || 0;

const xpPerLevel = 250;

const level =
  Math.floor(totalXp / xpPerLevel) + 1;

const currentLevelXp =
  totalXp % xpPerLevel;

const xpPercentage =
  Math.round(
    (currentLevelXp / xpPerLevel) * 100
  );
  app.innerHTML = `
    <main class="page">
      <section class="card wide-card dashboard-card">
        <header class="dashboard-header">
          <div>
            <p class="eyebrow">
              AREA STUDENTE
            </p>

            <h1>
              Benvenuto, ${studentName}
            </h1>

            <p class="student-email">
              ${user.email}
            </p>
          </div>

          <button
            id="logoutButton"
            class="btn btn-danger"
          >
            Logout
          </button>
        </header>

        <section class="course-progress-card">
          <div class="course-progress-header">
            <div>
              <p class="eyebrow">
                PROGRESSO DEL CORSO
              </p>

              <h2>
                Il tuo percorso Patente B
              </h2>

              <p>
                Hai completato
                <strong>
                  ${completedTopics}
                  di
                  ${totalTopics}
                </strong>
                topic disponibili.
              </p>
            </div>

            <div class="course-progress-percentage">
              ${coursePercentage}%
            </div>
          </div>

          <div class="course-progress-track">
            <div
              class="course-progress-fill"
              style="
                width:
                ${coursePercentage}%
              "
            ></div>
          </div>
        </section>

<section class="achievement-progress-card">
  <div class="achievement-progress-header">
    <div>
      <p class="eyebrow">
        I MIEI PROGRESSI
      </p>

      <h2>
        Livello ${level}
      </h2>

      <p>
        Hai accumulato
        <strong>${totalXp} XP</strong>
        in totale.
      </p>
    </div>

    <div class="achievement-level-badge">
      <span>🏆</span>
      <strong>${level}</strong>
    </div>
  </div>

  <div class="achievement-xp-info">
    <span>
      ${currentLevelXp} / ${xpPerLevel} XP
    </span>

    <span>
      ${xpPerLevel - currentLevelXp} XP al prossimo livello
    </span>
  </div>

  <div class="achievement-progress-track">
    <div
      class="achievement-progress-fill"
      style="width: ${xpPercentage}%"
    ></div>
  </div>
</section>

        <div class="stats-grid">
          <article class="stat-card">
            <span>
              Quiz completati
            </span>

            <strong>
              ${completedQuizzes}
            </strong>
          </article>

          <article class="stat-card">
            <span>
              Domande completate
            </span>

            <strong>
              ${totalQuestions}
            </strong>
          </article>

          <article class="stat-card">
            <span>
              Risposte corrette
            </span>

            <strong>
              ${correctAnswers}
            </strong>
          </article>

          <article class="stat-card">
            <span>
              Risposte sbagliate
            </span>

            <strong>
              ${wrongAnswers}
            </strong>
          </article>

          <article class="stat-card percentage-card">
            <span>
              Percentuale complessiva
            </span>

            <strong>
              ${percentage}%
            </strong>
          </article>
        </div>

        ${
          lastTopic
            ? `
              <section class="continue-study-card">
                <div class="continue-study-icon">
                  ${lastTopic.icon}
                </div>

                <div class="continue-study-content">
                  <p class="eyebrow">
                    CONTINUA LO STUDIO
                  </p>

                  <h2>
                    ${lastTopic.title}
                  </h2>

                  <p>
                    ${lastTopic.argomentoTitle}
                    · Miglior risultato:
                    ${lastTopic.bestScore}%
                  </p>
                </div>

                <button
                  id="continueStudyButton"
                  class="btn btn-primary"
                >
                  Continua
                </button>
              </section>
            `
            : ""
        }

        <div class="dashboard-actions">
          <article class="dashboard-action-card">
            <div class="dashboard-action-icon">
              📖
            </div>

            <div>
              <h2>
                Quiz per Argomento
              </h2>

              <p>
                Studia un topic alla volta
                e sblocca il quiz completo.
              </p>
            </div>

            <button
              id="startArgomentiButton"
              class="btn btn-primary"
            >
              Scegli argomento
            </button>
          </article>

          <article
            class="dashboard-action-card error-action-card"
          >
            <div class="dashboard-action-icon error-icon">
              🎯
            </div>

            <div>
              <h2>
                I miei errori
              </h2>

              <p>
                ${activeErrors}
                ${
                  activeErrors === 1
                    ? "domanda da ripassare"
                    : "domande da ripassare"
                }
                ·
                ${masteredErrors}
                superate
              </p>
            </div>

            <button
              id="openErrorsButton"
              class="btn ${
                activeErrors > 0
                  ? "btn-warning"
                  : "btn-secondary"
              }"
            >
              ${
                activeErrors > 0
                  ? "Ripassa ora"
                  : "Visualizza"
              }
            </button>
          </article>

          <article class="dashboard-action-card ministerial-action-card">
            <div class="dashboard-action-icon ministerial-action-icon">
              🇮🇹
            </div>

            <div>
              <p class="eyebrow">
                SIMULAZIONE REALE
              </p>

              <h2>
                Scheda Ministeriale
              </h2>

              <p>
                30 domande · 20 minuti ·
                massimo 3 errori
              </p>

              ${
                ministerialAttempts > 0
                  ? `
                    <div class="ministerial-dashboard-stats">
                      <span>
                        Tentativi:
                        <strong>
                          ${ministerialAttempts}
                        </strong>
                      </span>

                      <span>
                        Promosso:
                        <strong>
                          ${ministerialPassed}
                        </strong>
                      </span>

                      ${
                        typeof
                          lastMinisterialPassed ===
                          "boolean"
                          ? `
                            <span
                              class="${
                                lastMinisterialPassed
                                  ? "last-exam-passed"
                                  : "last-exam-failed"
                              }"
                            >
                              Ultimo:
                              ${
                                lastMinisterialPassed
                                  ? "PROMOSSO"
                                  : "BOCCIATO"
                              }
                              ·
                              ${lastMinisterialErrors}
                              errori
                            </span>
                          `
                          : ""
                      }
                    </div>
                  `
                  : `
                    <div class="ministerial-first-attempt">
                      Nessuna simulazione completata.
                    </div>
                  `
              }
            </div><div class="ministerial-dashboard-actions">
  <button
    id="openExamHistoryButton"
    class="btn btn-secondary"
  >
    Visualizza cronologia
  </button>

  <button
    id="startMinisterialButton"
    class="btn btn-ministerial"
  >
    Inizia esame
  </button>
</div>

<footer class="dashboard-footer">
  <p>
    MSH Patente v1.0
  </p>

  <p>
    © 2026 MSH Patente
  </p>
</footer>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#logoutButton"
    )
    .addEventListener(
      "click",
      actions.onLogout
    );

  document
    .querySelector(
      "#startArgomentiButton"
    )
    .addEventListener(
      "click",
      actions.onStartArgomenti
    );

  document
    .querySelector(
      "#openErrorsButton"
    )
    .addEventListener(
      "click",
      actions.onOpenErrors
    );
const examHistoryButton =
  document.querySelector(
    "#openExamHistoryButton"
  );

if (examHistoryButton) {
  examHistoryButton.addEventListener(
    "click",
    () => {
      actions.onOpenExamHistory();
    }
  );
}
  document
    .querySelector(
      "#startMinisterialButton"
    )
    .addEventListener(
      "click",
      () => {
        openMinisterialFlow(
          app,
          user,
          {
            onBack:
              actions.onReloadDashboard
          }
        );
      }
    );

  const continueButton =
    document.querySelector(
      "#continueStudyButton"
    );

  if (
    continueButton &&
    lastTopic
  ) {
    continueButton.addEventListener(
      "click",
      () => {
        actions.onContinueStudy(
          lastTopic
        );
      }
    );
  }
}