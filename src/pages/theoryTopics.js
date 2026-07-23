import {
  topics
} from "../data/topics.js";

export function showTheoryTopics(
  app,
  argomento,
  lessonList,
  completedLessonIds,
  actions
) {
  const argomentoTopics =
    topics
      .filter(
        (topic) =>
          topic.argomentoId ===
          argomento.id
      )
      .sort(
        (first, second) =>
          first.order - second.order
      );

  app.innerHTML = `
    <main class="page">
      <section class="card wide-card">
        <div class="page-header">
          <button
            id="backToTheoryButton"
            class="back-button"
            type="button"
          >
            ← Teoria
          </button>

          <p class="eyebrow">
            ${argomento.icon}
            ${argomento.title}
          </p>

          <h1>
            Scegli un topic
          </h1>

          <p class="subtitle">
            Seleziona un topic per vedere
            tutte le lezioni disponibili.
          </p>
        </div>

        <div class="topics-grid">
          ${argomentoTopics
            .map((topic) => {
  const topicLessons =
  lessonList
    .filter(
      (lesson) =>
        lesson.topicId ===
          topic.id &&
        lesson.argomentoId ===
          argomento.id &&
        lesson.published === true
    )
    .sort(
      (first, second) =>
        first.order - second.order
    );

              const completedCount =
                topicLessons.filter(
                  (lesson) =>
                    completedLessonIds.has(
                      lesson.id
                    )
                ).length;

              const progressPercentage =
                topicLessons.length > 0
                  ? Math.round(
                      (
                        completedCount /
                        topicLessons.length
                      ) * 100
                    )
                  : 0;

              const available =
                topicLessons.length > 0;

              const completed =
                available &&
                completedCount ===
                  topicLessons.length;

              const totalMinutes =
                topicLessons.reduce(
                  (total, lesson) =>
                    total +
                    (
                      Number(
                        lesson
                          .estimatedMinutes
                      ) || 0
                    ),
                  0
                );

              return `
                <article
                  class="
                    topic-card
                    theory-topic-card
                    ${
                      completed
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
                    completed
                      ? `
                        <div
                          class="
                            argomento-unlocked-badge
                          "
                        >
                          ✓ Completato
                        </div>
                      `
                      : ""
                  }

                  <div class="topic-icon">
                    ${topic.icon}
                  </div>

                  <h2>
                    ${topic.title}
                  </h2>

                  <p class="topic-description">
                    ${topic.description}
                  </p>

                  <p class="topic-count">
                    ${topicLessons.length}
                    ${
                      topicLessons.length === 1
                        ? "lezione"
                        : "lezioni"
                    }

                    ${
                      totalMinutes > 0
                        ? ` · ${totalMinutes} min`
                        : ""
                    }
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
                              ${topicLessons.length}
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
                            completed
                              ? "✅ Topic completato"
                              : "📖 Teoria disponibile"
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
                      open-theory-topic-button
                    "
                    data-topic-id="${topic.id}"
                    type="button"
                    ${available ? "" : "disabled"}
                  >
                    ${
                      !available
                        ? "Non disponibile"
                        : completedCount > 0
                          ? "Continua"
                          : "Apri le lezioni"
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
      "#backToTheoryButton"
    )
    .addEventListener(
      "click",
      actions.onBack
    );

  document
    .querySelectorAll(
      ".open-theory-topic-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const topicId =
            button.dataset.topicId
              ?.trim();

          const selectedTopic =
            argomentoTopics.find(
              (topic) =>
                String(topic.id) ===
                String(topicId)
            );

          if (!selectedTopic) {
            console.error(
              "Theory topic non trovato:",
              topicId
            );

            return;
          }

          actions.onSelectTopic(
            selectedTopic
          );
        }
      );
    });
}