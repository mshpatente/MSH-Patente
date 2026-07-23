import { argomenti } from "../data/argomenti.js";
import { topics } from "../data/topics.js";
import { questions } from "../data/questions.js";

export function showArgomenti(
  app,
  progress,
  actions
) {
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
            ESERCITAZIONE
          </p>

          <h1>
            Quiz per Argomento
          </h1>

          <p class="subtitle">
            Scegli un argomento per vedere i topic disponibili.
          </p>
        </div>

        <div class="topics-grid">
          ${argomenti
            .sort(
              (first, second) =>
                first.order - second.order
            )
            .map((argomento) => {
              const argomentoTopics =
                topics.filter(
                  (topic) =>
                    topic.argomentoId ===
                    argomento.id
                );

              const questionCount =
                questions.filter(
                  (question) =>
                    question.argomentoId ===
                    argomento.id
                ).length;

              const completedCount =
                argomentoTopics.filter(
                  (topic) =>
                    progress[topic.id]
                      ?.completed === true
                ).length;

              const progressPercentage =
                argomentoTopics.length > 0
                  ? Math.round(
                      (
                        completedCount /
                        argomentoTopics.length
                      ) * 100
                    )
                  : 0;

              const unlocked =
                argomentoTopics.length > 0 &&
                completedCount ===
                  argomentoTopics.length;

              return `
                <article
                  class="topic-card argomento-card"
                  style="
                    --topic-color:
                    ${argomento.color}
                  "
                >
                  ${
                    unlocked
                      ? `
                        <div
                          class="argomento-unlocked-badge"
                        >
                          🏆 Quiz completo
                        </div>
                      `
                      : ""
                  }

                  <div class="topic-icon">
                    ${argomento.icon}
                  </div>

                  <h2>
                    ${argomento.title}
                  </h2>

                  <p class="topic-description">
                    ${argomento.description}
                  </p>

                  <p class="topic-count">
                    ${argomentoTopics.length}
                    topic ·
                    ${questionCount}
                    domande
                  </p>

                  <div class="argomento-card-progress">
                    <div
                      class="argomento-card-progress-info"
                    >
                      <span>
                        ${completedCount} /
                        ${argomentoTopics.length}
                        completati
                      </span>

                      <strong>
                        ${progressPercentage}%
                      </strong>
                    </div>

                    <div
                      class="argomento-card-progress-track"
                    >
                      <div
                        class="argomento-card-progress-fill"
                        style="
                          width:
                          ${progressPercentage}%
                        "
                      ></div>
                    </div>
                  </div>

                  <button
                    class="
                      btn
                      topic-button
                      open-argomento-button
                    "
                   data-argomento-id="${argomento.id}"
                    "
                  >
                    ${
                      completedCount > 0
                        ? "Continua argomento"
                        : "Visualizza topic"
                    }
                  </button>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#backDashboardButton"
    )
    .addEventListener(
      "click",
      actions.onBack
    );

  document
    .querySelectorAll(
      ".open-argomento-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const argomentoId =
  button.dataset.argomentoId
    ?.trim();

          const selectedArgomento =
            argomenti.find(
              (argomento) =>
                argomento.id ===
                argomentoId
            );

          if (selectedArgomento) {
            actions.onSelectArgomento(
              selectedArgomento
            );
          }
        }
      );
    });
}