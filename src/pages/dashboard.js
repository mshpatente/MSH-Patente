import {
  openMinisterialFlow
} from "./ministerialFlow.js";

import {
  initializeFounderFooter,
  renderFounderFooter
} from "../components/founderFooter.js";

import {
  magicTricks
} from "../data/magicTricks.js";

export function showDashboard(
  app,
  user,
  stats,
  courseProgress,
  errorStatistics,
  theorySummary,
  actions
) {
  const totalQuestions =
    Number(stats.totalQuestions) || 0;

  const correctAnswers =
    Number(stats.correctAnswers) || 0;

  const wrongAnswers =
    Number(stats.wrongAnswers) || 0;

  const completedQuizzes =
    Number(stats.completedQuizzes) || 0;

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
  } = courseProgress || {};

  const {
    totalLessons:
      totalTheoryLessons = 0,

    completedLessons:
      completedTheoryLessons = 0,

    percentage:
      theoryPercentage = 0,

    lastLesson:
      lastTheoryLesson = null
  } = theorySummary || {};

  const activeErrors =
    Number(
      errorStatistics?.activeCount
    ) || 0;

  const totalXp =
    Number(stats.xp) || 0;

  const xpPerLevel = 250;

  const level =
    Math.floor(
      totalXp / xpPerLevel
    ) + 1;

  const currentLevelXp =
    totalXp % xpPerLevel;

  const remainingXp =
    currentLevelXp === 0
      ? xpPerLevel
      : xpPerLevel -
        currentLevelXp;

  const nextLevel =
    level + 1;

  app.innerHTML = `
    <main class="page mobile-dashboard-page">
      <section
        class="
          card
          wide-card
          dashboard-card
          compact-dashboard
        "
      >
        <header class="compact-dashboard-header">
          <div class="compact-dashboard-user">
            <p class="eyebrow">
              AREA STUDENTE
            </p>

            <h1>
              Benvenuto,
              ${studentName}
            </h1>

            <p class="student-email">
              ${user.email || ""}
            </p>
          </div>

          <div class="compact-dashboard-header-actions">
            <button
              id="openProfileButton"
              class="
                compact-header-button
                compact-profile-button
              "
              type="button"
            >
              <span>👤</span>
              <strong>Profilo</strong>
            </button>

            <button
              id="logoutButton"
              class="
                compact-header-button
                compact-logout-button
              "
              type="button"
            >
              <span>↪</span>
              <strong>Logout</strong>
            </button>
          </div>
        </header>

       <section class="compact-progress-overview">
  <article
    class="
      compact-progress-item
      compact-progress-course
    "
  >
    <span class="compact-progress-label">
      Progresso
    </span>

    <div
      class="compact-progress-circle"
      style="
        --dashboard-progress:
        ${coursePercentage * 3.6}deg;
      "
    >
      <strong>
        ${coursePercentage}%
      </strong>
    </div>

    <small>
      ${completedTopics}/${totalTopics}
      topic
    </small>
  </article>

  <article
    class="
      compact-progress-item
      compact-progress-level
    "
  >
    <span class="compact-progress-label">
      Livello
    </span>

    <div class="compact-level-badge">
      ${level}
    </div>

    <strong class="compact-xp-value">
      ${currentLevelXp}/${xpPerLevel} XP
    </strong>
  </article>

  <article
    class="
      compact-progress-item
      compact-progress-next-level
    "
  >
    <span class="compact-progress-label">
      Prossimo livello
    </span>

    <div class="compact-trophy">
      🏆
    </div>

    <strong class="compact-xp-value">
      ${remainingXp} XP
      al livello ${nextLevel}
    </strong>
  </article>

  <article
    class="
      compact-progress-item
      compact-progress-license
    "
  >
    <span class="compact-progress-label">
      Corso
    </span>

    <div class="compact-course-icon">
      📗
    </div>

    <strong class="compact-xp-value">
      Patente B
    </strong>
  </article>
</section>

        <section class="compact-stat-grid">
          <article class="compact-stat-card">
            <span class="compact-stat-icon">
              📗
            </span>

            <strong>
              ${completedQuizzes}
            </strong>

            <small>
              Quiz
            </small>
          </article>

          <article class="compact-stat-card">
            <span class="compact-stat-icon">
              ❓
            </span>

            <strong>
              ${totalQuestions}
            </strong>

            <small>
              Domande
            </small>
          </article>

          <article class="compact-stat-card">
            <span class="compact-stat-icon">
              ✅
            </span>

            <strong>
              ${correctAnswers}
            </strong>

            <small>
              Corrette
            </small>
          </article>

          <article class="compact-stat-card">
            <span class="compact-stat-icon">
              ❌
            </span>

            <strong>
              ${wrongAnswers}
            </strong>

            <small>
              Sbagliate
            </small>
          </article>

          <article class="compact-stat-card">
            <span class="compact-stat-icon">
              📊
            </span>

            <strong>
              ${percentage}%
            </strong>

            <small>
              Media
            </small>
          </article>
        </section>

        <section class="compact-dashboard-section">
          <h2 class="compact-section-title">
            AREA STUDIO
          </h2>

          <div class="compact-study-grid">
            <button
              id="openTheoryButton"
              class="
                compact-study-tile
                compact-theory-tile
              "
              type="button"
            >
              <span class="compact-study-icon">
                📚
              </span>

              <strong>
                Studia la teoria
              </strong>

              <small>
                ${theoryPercentage}%
              </small>
            </button>

            <button
  id="openVideoLessonsButton"
  class="
    compact-study-tile
    compact-video-tile
  "
  type="button"
>
  <span class="compact-study-icon">
    🎬
  </span>

  <strong>
    Video lezioni
  </strong>

  <small>
    Spiegazioni YouTube
  </small>
</button>

            <button
              id="openMagicTricksButton"
              class="
                compact-study-tile
                compact-magic-tile
              "
              type="button"
            >
              <span class="compact-study-icon">
                🪄
              </span>

              <strong>
                Trucco Magico
              </strong>

              <small>
                ${magicTricks.length}
                disponibili
              </small>
            </button>


            <button
              id="openDictionaryButton"
              class="
                compact-study-tile
                compact-dictionary-tile
              "
              type="button"
            >
              <span class="compact-study-icon">📖</span>
              <strong>Dizionario stradale</strong>
              <small>Italiano → বাংলা</small>
            </button>

            <button
              id="startArgomentiButton"
              class="
                compact-study-tile
                compact-quiz-tile
              "
              type="button"
            >
              <span class="compact-study-icon">
                📋
              </span>

              <strong>
                Quiz per
                Argomento
              </strong>

              <small>
                ${totalQuestions}
                domande
              </small>
            </button>

            <button
              id="startMinisterialButton"
              class="
                compact-study-tile
                compact-ministerial-tile
              "
              type="button"
            >
              <span class="compact-study-icon">
                🏛️
              </span>

              <strong>
  Simulazione
  Esame
</strong>

<small>
  Esercitazione completa
</small>
            </button>

            <button
              id="startAdaptiveQuizButton"
              class="
                compact-study-tile
                compact-adaptive-tile
              "
              type="button"
            >
              <span class="compact-study-icon">
                🧠
              </span>

              <strong>
                Allenamento
                Intelligente
              </strong>

              <small>
                ${
                  activeErrors > 0
                    ? `${activeErrors} aree da migliorare`
                    : "Modalità esplorazione"
                }
              </small>
            </button>

            <button
              id="openErrorsButton"
              class="
                compact-study-tile
                compact-errors-tile
              "
              type="button"
            >
              <span class="compact-study-icon">
                🎯
              </span>

              <strong>
                I miei errori
              </strong>

              <small>
                ${activeErrors}
                da ripassare
              </small>
            </button>
<button
  id="bookMedicalVisitButton"
  class="
    compact-study-tile
    compact-medical-tile
  "
  type="button"
>
  <span class="compact-study-icon">
    🩺
  </span>

  <strong>
    Prenota visita medica
  </strong>

  <small>
    Prenotazione visita
  </small>
</button>

<button
  id="openPracticalGuideButton"
  class="
    compact-study-tile
    compact-practical-tile
  "
  type="button"
>
  <span class="compact-study-icon">
    🚗
  </span>

  <strong>
    Guida pratica
  </strong>

  <small>
    Preparati alla guida
  </small>
</button>


            ${
  stats.role === "admin"
    ? `
        <button
          id="openAdminTheoryButton"
          class="
            compact-study-tile
            compact-admin-tile
          "
          type="button"
        >
          <span class="compact-study-icon">
            🛠️
          </span>

          <strong>
            Gestione teoria
          </strong>

          <small>
            Lezioni e contenuti
          </small>
        </button>

        <button
          id="openAdminVideosButton"
          class="
            compact-study-tile
            compact-admin-tile
          "
          type="button"
        >
          <span class="compact-study-icon">
            🎬
          </span>

          <strong>
            Gestione video
          </strong>

          <small>
            Video YouTube
          </small>
        </button>
<button
  id="openAdminPremiumUsersButton"
  class="
    compact-study-tile
    compact-admin-tile
    compact-admin-premium-tile
  "
  type="button"
>
  <span class="compact-study-icon">
    👥
  </span>

  <strong>
    Gestione Premium
  </strong>

  <small>
    Utenti, scadenze e dispositivi
  </small>
</button>
      `
    : ""
}

          </div>
        </section>

        ${
          lastTopic ||
          lastTheoryLesson
            ? `
              <section class="compact-dashboard-section">
                <h2 class="compact-section-title">
                  AZIONI RAPIDE
                </h2>

                <div class="compact-quick-actions">
                  ${
                    lastTheoryLesson
                      ? `
                        <button
                          id="continueTheoryButton"
                          class="
                            compact-quick-button
                            compact-quick-blue
                          "
                          type="button"
                        >
                          <span>🕒</span>

                          <strong>
                            Continua:
                            ${lastTheoryLesson.title}
                          </strong>

                          <span>›</span>
                        </button>
                      `
                      : ""
                  }

                  ${
                    lastTopic
                      ? `
                        <button
                          id="continueStudyButton"
                          class="
                            compact-quick-button
                            compact-quick-green
                          "
                          type="button"
                        >
                          <span>
                            ${lastTopic.icon || "📘"}
                          </span>

                          <strong>
                            Continua:
                            ${lastTopic.title}
                          </strong>

                          <span>›</span>
                        </button>
                      `
                      : ""
                  }

                  <button
                    id="openExamHistoryButton"
                    class="
                      compact-quick-button
                      compact-quick-orange
                    "
                    type="button"
                  >
                    <span>📊</span>

                    <strong>
                      Cronologia esami
                    </strong>

                    <span>›</span>
                  </button>
                </div>
              </section>
            `
            : `
              <section class="compact-dashboard-section">
                <h2 class="compact-section-title">
                  AZIONI RAPIDE
                </h2>

                <div class="compact-quick-actions">
                  <button
                    id="openExamHistoryButton"
                    class="
                      compact-quick-button
                      compact-quick-orange
                    "
                    type="button"
                  >
                    <span>📊</span>

                    <strong>
                      Cronologia esami
                    </strong>

                    <span>›</span>
                  </button>
                </div>
              </section>
            `
        }

          ${renderFounderFooter(
  stats.role === "admin"
)}
      </section>
    </main>
  `;
initializeFounderFooter();

  document
    .querySelector(
      "#openProfileButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenProfile
    );

  document
    .querySelector(
      "#logoutButton"
    )
    ?.addEventListener(
      "click",
      actions.onLogout
    );

  document
    .querySelector(
      "#openTheoryButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenTheory
    );

    document
  .querySelector(
    "#openVideoLessonsButton"
  )
  ?.addEventListener(
    "click",
    () => {
      if (
        typeof actions
          .onOpenVideoLessons ===
        "function"
      ) {
        actions.onOpenVideoLessons();
      }
    }
  );

  document
    .querySelector(
      "#continueTheoryButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenTheory
    );

  document
    .querySelector(
      "#openMagicTricksButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenMagicTricks
    );

  document
    .querySelector(
      "#startArgomentiButton"
    )
    ?.addEventListener(
      "click",
      actions.onStartArgomenti
    );
   document
    .querySelector(
      "#startAdaptiveQuizButton"
    )
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof actions
            .onStartAdaptiveQuiz ===
          "function"
        ) {
          actions.onStartAdaptiveQuiz();
        }
      }
    );

  document
    .querySelector(
      "#openErrorsButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenErrors
    );


  document
    .querySelector("#openDictionaryButton")
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof actions.onOpenDictionary ===
          "function"
        ) {
          actions.onOpenDictionary();
        }
      }
    );

  document
    .querySelector(
      "#openAdminTheoryButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenAdminTheory
    );

    document
  .querySelector(
    "#openAdminVideosButton"
  )
  ?.addEventListener(
    "click",
    () => {
      if (
        typeof actions
          .onOpenAdminVideos ===
        "function"
      ) {
        actions.onOpenAdminVideos();
      }
    }
  );

document
  .querySelector(
    "#openAdminPremiumUsersButton"
  )
  ?.addEventListener(
    "click",
    () => {
      if (
        typeof actions
          .onOpenAdminPremiumUsers ===
        "function"
      ) {
        actions
          .onOpenAdminPremiumUsers();
      }
    }
  );

  document
    .querySelector(
      "#openExamHistoryButton"
    )
    ?.addEventListener(
      "click",
      actions.onOpenExamHistory
    );

  document
    .querySelector(
      "#startMinisterialButton"
    )
    ?.addEventListener(
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

  const continueStudyButton =
    document.querySelector(
      "#continueStudyButton"
    );

  if (
    continueStudyButton &&
    lastTopic
  ) {
    continueStudyButton?.addEventListener(
  "click",
  () => {
    if (
      typeof actions.onContinueStudy === "function"
    ) {
      actions.onContinueStudy(lastTopic);
    }
  }
);

  }
}