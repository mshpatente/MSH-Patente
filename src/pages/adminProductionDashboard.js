import {
  loadProductionDashboard
} from "../services/productionDashboardService.js";

function formatNumber(value) {
  return new Intl.NumberFormat(
    "it-IT"
  ).format(
    Number(value) || 0
  );
}

export async function showAdminProductionDashboard({
  container,
  onBack,
  onOpenReviewQueue,
  onOpenKnowledgeEngine
}) {
  container.innerHTML = `
    <main class="page admin-production-page">
      <section
        class="
          card
          wide-card
          admin-production-shell
        "
      >
        <header class="admin-production-header">
          <div>
            <button
              id="productionBackButton"
              class="back-button"
              type="button"
            >
              ← Dashboard
            </button>

            <p class="eyebrow">
              CONTENT PRODUCTION
            </p>

            <h1>
              Production Dashboard
            </h1>

            <p class="subtitle">
              Controlla domande, concetti,
              lezioni e pubblicazioni.
            </p>
          </div>

          <button
            id="productionRefreshButton"
            class="btn btn-secondary"
            type="button"
          >
            ↻ Aggiorna
          </button>
        </header>

        <p
          id="productionMessage"
          class="message"
        ></p>

        <section
          id="productionDashboardContent"
          class="production-dashboard-content"
        >
          <div class="production-loading">
            <div class="loading-spinner"></div>

            <p>
              Caricamento statistiche...
            </p>
          </div>
        </section>
      </section>
    </main>
  `;

  const content =
    document.querySelector(
      "#productionDashboardContent"
    );

  const message =
    document.querySelector(
      "#productionMessage"
    );

  const refreshButton =
    document.querySelector(
      "#productionRefreshButton"
    );

  function renderDashboard(
    statistics
  ) {
    if (!content) {
      return;
    }

    const pendingReview =
      Number(
        statistics.pendingReview
      ) || 0;

    const approvedQuestions =
      Number(
        statistics.approvedQuestions
      ) || 0;

    const rejectedQuestions =
      Number(
        statistics.rejectedQuestions
      ) || 0;

    const concepts =
      Number(
        statistics.concepts
      ) || 0;

    const lessonDrafts =
      Number(
        statistics.lessonDrafts
      ) || 0;

    const lessonVersions =
      Number(
        statistics.lessonVersions
      ) || 0;

    const publishedLessons =
      Number(
        statistics.publishedLessons
      ) || 0;

    const readyToPublish =
      Math.max(
        0,
        lessonDrafts -
        publishedLessons
      );

    content.innerHTML = `
      <section class="production-summary-grid">
        <article
          class="
            production-summary-card
            production-summary-question
          "
        >
          <span class="production-summary-icon">
            🛡️
          </span>

          <div>
            <small>
              Da revisionare
            </small>

            <strong>
              ${formatNumber(
                pendingReview
              )}
            </strong>
          </div>
        </article>

        <article
          class="
            production-summary-card
            production-summary-approved
          "
        >
          <span class="production-summary-icon">
            ✅
          </span>

          <div>
            <small>
              Domande ufficiali
            </small>

            <strong>
              ${formatNumber(
                approvedQuestions
              )}
            </strong>
          </div>
        </article>

        <article
          class="
            production-summary-card
            production-summary-concept
          "
        >
          <span class="production-summary-icon">
            🧠
          </span>

          <div>
            <small>
              Concetti
            </small>

            <strong>
              ${formatNumber(
                concepts
              )}
            </strong>
          </div>
        </article>

        <article
          class="
            production-summary-card
            production-summary-published
          "
        >
          <span class="production-summary-icon">
            📘
          </span>

          <div>
            <small>
              Lezioni pubblicate
            </small>

            <strong>
              ${formatNumber(
                publishedLessons
              )}
            </strong>
          </div>
        </article>
      </section>

      <section class="production-work-grid">
        <article class="production-work-card">
          <header>
            <div>
              <span class="production-work-icon">
                🛡️
              </span>

              <div>
                <p class="eyebrow">
                  QUESTION QUEUE
                </p>

                <h2>
                  Domande
                </h2>
              </div>
            </div>
          </header>

          <dl class="production-stat-list">
            <div>
              <dt>
                In revisione
              </dt>

              <dd>
                ${formatNumber(
                  pendingReview
                )}
              </dd>
            </div>

            <div>
              <dt>
                Ufficiali
              </dt>

              <dd>
                ${formatNumber(
                  approvedQuestions
                )}
              </dd>
            </div>

            <div>
              <dt>
                Rifiutate
              </dt>

              <dd>
                ${formatNumber(
                  rejectedQuestions
                )}
              </dd>
            </div>
          </dl>

          <button
            id="productionContinueReviewButton"
            class="btn btn-primary"
            type="button"
          >
            Continua revisione
          </button>
        </article>

        <article class="production-work-card">
          <header>
            <div>
              <span class="production-work-icon">
                🧠
              </span>

              <div>
                <p class="eyebrow">
                  KNOWLEDGE ENGINE
                </p>

                <h2>
                  Lezioni
                </h2>
              </div>
            </div>
          </header>

          <dl class="production-stat-list">
            <div>
              <dt>
                Concetti
              </dt>

              <dd>
                ${formatNumber(
                  concepts
                )}
              </dd>
            </div>

            <div>
              <dt>
                Bozze
              </dt>

              <dd>
                ${formatNumber(
                  lessonDrafts
                )}
              </dd>
            </div>

            <div>
              <dt>
                Versioni salvate
              </dt>

              <dd>
                ${formatNumber(
                  lessonVersions
                )}
              </dd>
            </div>
          </dl>

          <button
            id="productionContinueLessonsButton"
            class="btn btn-primary"
            type="button"
          >
            Continua lezioni
          </button>
        </article>

        <article class="production-work-card">
          <header>
            <div>
              <span class="production-work-icon">
                🚀
              </span>

              <div>
                <p class="eyebrow">
                  PUBLISH QUEUE
                </p>

                <h2>
                  Pubblicazione
                </h2>
              </div>
            </div>
          </header>

          <div class="production-publish-number">
            <strong>
              ${formatNumber(
                readyToPublish
              )}
            </strong>

            <span>
              possibili bozze da controllare
            </span>
          </div>

          <dl class="production-stat-list">
            <div>
              <dt>
                Pubblicate
              </dt>

              <dd>
                ${formatNumber(
                  publishedLessons
                )}
              </dd>
            </div>

            <div>
              <dt>
                Totale bozze
              </dt>

              <dd>
                ${formatNumber(
                  lessonDrafts
                )}
              </dd>
            </div>
          </dl>

          <button
            id="productionOpenPublishButton"
            class="btn btn-primary"
            type="button"
          >
            Apri Knowledge Engine
          </button>
        </article>

        <article class="production-work-card">
          <header>
            <div>
              <span class="production-work-icon">
                📊
              </span>

              <div>
                <p class="eyebrow">
                  PRODUCTION HEALTH
                </p>

                <h2>
                  Stato generale
                </h2>
              </div>
            </div>
          </header>

          <div class="production-health-list">
            <div>
              <span>
                Question workflow
              </span>

              <strong
                class="${
                  pendingReview > 0
                    ? "is-warning"
                    : "is-good"
                }"
              >
                ${
                  pendingReview > 0
                    ? `${formatNumber(
                        pendingReview
                      )} in attesa`
                    : "Completo"
                }
              </strong>
            </div>

            <div>
              <span>
                Lesson workflow
              </span>

              <strong
                class="${
                  lessonDrafts >
                  publishedLessons
                    ? "is-warning"
                    : "is-good"
                }"
              >
                ${
                  lessonDrafts >
                  publishedLessons
                    ? "Da controllare"
                    : "Aggiornato"
                }
              </strong>
            </div>

            <div>
              <span>
                Version history
              </span>

              <strong
                class="${
                  lessonVersions > 0
                    ? "is-good"
                    : "is-warning"
                }"
              >
                ${
                  lessonVersions > 0
                    ? "Attiva"
                    : "Vuota"
                }
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section class="production-next-action">
        <div>
          <p class="eyebrow">
            PROSSIMO LAVORO
          </p>

          <h2>
            ${
              pendingReview > 0
                ? "Continua dalla revisione delle domande"
                : lessonDrafts >
                    publishedLessons
                  ? "Continua dalla preparazione delle lezioni"
                  : "La produzione è aggiornata"
            }
          </h2>

          <p>
            ${
              pendingReview > 0
                ? `${formatNumber(
                    pendingReview
                  )} domande aspettano una decisione.`
                : lessonDrafts >
                    publishedLessons
                  ? "Controlla le bozze e pubblica le lezioni pronte."
                  : "Puoi iniziare a inserire nuove domande e lezioni."
            }
          </p>
        </div>

        <button
          id="productionNextActionButton"
          class="btn btn-primary"
          type="button"
        >
          Continua
        </button>
      </section>
    `;

    document
      .querySelector(
        "#productionContinueReviewButton"
      )
      ?.addEventListener(
        "click",
        onOpenReviewQueue
      );

    document
      .querySelector(
        "#productionContinueLessonsButton"
      )
      ?.addEventListener(
        "click",
        onOpenKnowledgeEngine
      );

    document
      .querySelector(
        "#productionOpenPublishButton"
      )
      ?.addEventListener(
        "click",
        onOpenKnowledgeEngine
      );

    document
      .querySelector(
        "#productionNextActionButton"
      )
      ?.addEventListener(
        "click",
        () => {
          if (
            pendingReview > 0
          ) {
            onOpenReviewQueue();

            return;
          }

          onOpenKnowledgeEngine();
        }
      );
  }

  async function loadDashboard() {
    if (refreshButton) {
      refreshButton.disabled =
        true;

      refreshButton.textContent =
        "Caricamento...";
    }

    if (message) {
      message.textContent =
        "";

      message.className =
        "message";
    }

    try {
      const statistics =
        await loadProductionDashboard();

      renderDashboard(
        statistics
      );
    } catch (error) {
      console.error(
        "Production dashboard loading error:",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Impossibile caricare le statistiche.";

        message.className =
          "message error";
      }

      if (content) {
        content.innerHTML = `
          <section class="production-error">
            <span>⚠️</span>

            <h2>
              Caricamento non riuscito
            </h2>

            <p>
              Controlla la Console e riprova.
            </p>
          </section>
        `;
      }
    } finally {
      if (refreshButton) {
        refreshButton.disabled =
          false;

        refreshButton.textContent =
          "↻ Aggiorna";
      }
    }
  }

  document
    .querySelector(
      "#productionBackButton"
    )
    ?.addEventListener(
      "click",
      onBack
    );

  refreshButton
    ?.addEventListener(
      "click",
      loadDashboard
    );

  await loadDashboard();
}