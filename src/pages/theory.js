import {
  argomenti
} from "../data/argomenti.js";

import {
  topics
} from "../data/topics.js";


export function showTheory(
  app,
  lessonList,
  completedLessonIds,
  actions
) {
  const publishedLessons =
    lessonList.filter(
      (lesson) =>
        lesson.published === true
    );

  app.innerHTML = `
    <main class="page">
      <section class="card wide-card">
        <div class="page-header">
          <button
            id="backFromTheoryButton"
            class="back-button"
            type="button"
          >
            ← Dashboard
          </button>

          <p class="eyebrow">
            STUDIA
          </p>

          <h1>
            Studia la teoria
          </h1>

          <p class="subtitle">
            Scegli un argomento e impara
            con lezioni, immagini e trucchi magici.
          </p>
        </div>

        <div class="topics-grid">
          ${[...argomenti]
            .sort(
              (first, second) =>
                first.order -
                second.order
            )
            .map((argomento) => {
              const argomentoTopics =
                topics.filter(
                  (topic) =>
                    topic.argomentoId ===
                    argomento.id
                );

              const argomentoLessons =
                publishedLessons.filter(
                  (lesson) =>
                    lesson.argomentoId ===
                    argomento.id
                );

              const completedCount =
                argomentoLessons.filter(
                  (lesson) =>
                    completedLessonIds.has(
                      lesson.id
                    )
                ).length;

              const progressPercentage =
                argomentoLessons.length > 0
                  ? Math.round(
                      (
                        completedCount /
                        argomentoLessons.length
                      ) * 100
                    )
                  : 0;

              const available =
                argomentoLessons.length > 0;

              const fullyCompleted =
                available &&
                completedCount ===
                  argomentoLessons.length;

              return `
                <article
                  class="
                    topic-card
                    argomento-card
                    theory-argomento-card
                    ${
                      fullyCompleted
                        ? "theory-card-completed"
                        : ""
                    }
                  "
                  style="
                    --topic-color:
                    ${argomento.color};
                  "
                >
                  ${
                    fullyCompleted
                      ? `
                        <div
                          class="
                            argomento-unlocked-badge
                          "
                        >
                          🏆 Completato
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
                    ${argomentoLessons.length}
                    lezioni
                  </p>

                  ${
                    available
                      ? `
                        <div
                          class="
                            theory-card-progress
                          "
                        >
                          <div
                            class="
                              theory-card-progress-info
                            "
                          >
                            <span>
                              ${completedCount} /
                              ${argomentoLessons.length}
                              completate
                            </span>

                            <strong>
                              ${progressPercentage}%
                            </strong>
                          </div>

                          <div
                            class="
                              theory-card-progress-track
                            "
                          >
                            <div
                              class="
                                theory-card-progress-fill
                              "
                              style="
                                width:
                                ${progressPercentage}%;
                              "
                            ></div>
                          </div>
                        </div>

                        <div
                          class="
                            theory-available-badge
                          "
                        >
                          ${
                            fullyCompleted
                              ? "✅ Studio completato"
                              : "📚 Lezioni disponibili"
                          }
                        </div>
                      `
                      : `
                        <div
                          class="
                            theory-coming-badge
                          "
                        >
                          Prossimamente
                        </div>
                      `
                  }

                  <button
                    class="
                      btn
                      topic-button
                      open-theory-argomento-button
                    "
                    data-argomento-id="${argomento.id}"
                    ${available ? "" : "disabled"}
                    type="button"
                  >
                    ${
                      !available
                        ? "Non disponibile"
                        : completedCount > 0
                          ? "Continua a studiare"
                          : "Visualizza lezioni"
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
      "#backFromTheoryButton"
    )
    .addEventListener(
      "click",
      actions.onBack
    );

  document
    .querySelectorAll(
      ".open-theory-argomento-button"
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
                String(argomento.id) ===
                String(argomentoId)
            );

          if (!selectedArgomento) {
            console.error(
              "Theory argomento non trovato:",
              argomentoId
            );

            return;
          }

          actions.onSelectArgomento(
            selectedArgomento
          );
        }
      );
    });
}