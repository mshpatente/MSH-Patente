export function showWrongAnswers(
  app,
  wrongAnswers,
  statistics,
  actions
) {
  const activeCount = wrongAnswers.length;
  const masteredCount =
    Number(statistics.masteredCount) || 0;

  app.innerHTML = `
    <main class="page">
      <section class="card wide-card">
        <div class="page-header">
          <button
            id="backDashboardButton"
            class="back-button"
          >
            ← Dashboard
          </button>

          <p class="eyebrow">
            RIPASSO PERSONALIZZATO
          </p>

          <h1>I miei errori</h1>

          <p class="subtitle">
            Ripassa le domande sbagliate.
            Una domanda viene superata dopo due risposte
            corrette consecutive.
          </p>
        </div>

        <div class="error-summary-grid">
          <article class="error-summary-card active-errors">
            <span>Da ripassare</span>
            <strong>${activeCount}</strong>
          </article>

          <article class="error-summary-card mastered-errors">
            <span>Domande superate</span>
            <strong>${masteredCount}</strong>
          </article>
        </div>

        ${
          activeCount > 0
            ? `
              <section class="error-review-banner">
                <div class="error-review-icon">
                  🎯
                </div>

                <div>
                  <p class="eyebrow">
                    ALLENAMENTO MIRATO
                  </p>

                  <h2>
                    Ripassa ${activeCount}
                    ${
                      activeCount === 1
                        ? "domanda"
                        : "domande"
                    }
                  </h2>

                  <p>
                    Le domande saranno presentate
                    in ordine casuale.
                  </p>
                </div>

                <button
                  id="startErrorsQuizButton"
                  class="btn btn-primary"
                >
                  Inizia ripasso
                </button>
              </section>

              <div class="wrong-answers-list">
                ${wrongAnswers
                  .map((item) => {
                    const progress =
                      Math.min(
                        Number(item.correctStreak) || 0,
                        2
                      );

                    return `
                      <article class="wrong-answer-card">
                        <div class="wrong-answer-header">
                          <div>
                            <span class="wrong-topic-name">
                              ${item.argomentoTitle}
                              ·
                              ${item.topicTitle}
                            </span>

                            <h3>
                              ${item.question}
                            </h3>
                          </div>

                          <span class="wrong-count-badge">
                            ${item.wrongCount || 1}
                            ${
                              Number(item.wrongCount) === 1
                                ? "errore"
                                : "errori"
                            }
                          </span>
                        </div>

                        <div class="mastery-progress">
                          <div class="mastery-progress-info">
                            <span>
                              Risposte corrette consecutive
                            </span>

                            <strong>
                              ${progress} / 2
                            </strong>
                          </div>

                          <div class="mastery-progress-track">
                            <div
                              class="mastery-progress-fill"
                              style="width: ${(progress / 2) * 100}%"
                            ></div>
                          </div>
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </div>
            `
            : `
              <section class="empty-errors-card">
                <div class="empty-errors-icon">
                  🏆
                </div>

                <h2>
                  Nessun errore da ripassare
                </h2>

                <p>
                  Hai superato tutte le domande presenti
                  nella tua lista degli errori.
                </p>

                <button
                  id="goToArgomentiButton"
                  class="btn btn-primary"
                >
                  Continua ad esercitarti
                </button>
              </section>
            `
        }
      </section>
    </main>
  `;

  document
    .querySelector("#backDashboardButton")
    .addEventListener(
      "click",
      actions.onBack
    );

  const startButton =
    document.querySelector(
      "#startErrorsQuizButton"
    );

  if (startButton) {
    startButton.addEventListener(
      "click",
      actions.onStartReview
    );
  }

  const argomentiButton =
    document.querySelector(
      "#goToArgomentiButton"
    );

  if (argomentiButton) {
    argomentiButton.addEventListener(
      "click",
      actions.onGoToArgomenti
    );
  }
}