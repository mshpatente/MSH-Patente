import {
  officialTopics as topics
} from "../data/officialTopics.js";

import {
  officialSubtopics
} from "../data/officialSubtopics.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function showTheoryTopics(
  app,
  argomento,
  lessonList,
  videoList,
  completedLessonIds,
  actions
) {
  const safeLessons =
    Array.isArray(lessonList)
      ? lessonList
      : [];

  const safeVideos =
    Array.isArray(videoList)
      ? videoList
      : [];

  const safeCompletedIds =
    completedLessonIds instanceof Set
      ? completedLessonIds
      : new Set(
          Array.isArray(
            completedLessonIds
          )
            ? completedLessonIds
            : []
        );

  const argomentoTopics =
    topics
      .filter(
        (topic) =>
          String(
            topic.argomentoId
          ) ===
          String(argomento.id)
      )
      .sort(
        (first, second) =>
          Number(first.order || 0) -
          Number(second.order || 0)
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
            ${escapeHtml(
              argomento.icon || ""
            )}
            ${escapeHtml(
              argomento.title
            )}
          </p>

          <h1>
            Scegli un topic
          </h1>

          <p class="subtitle">
            Leggi le lezioni teoriche oppure
            guarda le spiegazioni video.
          </p>
        </div>

        <div class="topics-grid">
          ${argomentoTopics
            .map((topic) => {
              const topicLessons =
                safeLessons
                  .filter(
                    (lesson) =>
                      String(
                        lesson.topicId
                      ) ===
                        String(topic.id) &&
                      String(
                        lesson.argomentoId
                      ) ===
                        String(
                          argomento.id
                        ) &&
                      lesson.published ===
                        true
                  )
                  .sort(
                    (first, second) =>
                      Number(
                        first.order || 0
                      ) -
                      Number(
                        second.order || 0
                      )
                  );

              const topicVideos =
                safeVideos
                  .filter(
                    (video) =>
                      String(
                        video.topicId
                      ) ===
                        String(topic.id) &&
                      String(
                        video.argomentoId
                      ) ===
                        String(
                          argomento.id
                        ) &&
                      video.status ===
                        "published"
                  )
                  .sort(
                    (first, second) =>
                      Number(
                        first.order || 0
                      ) -
                      Number(
                        second.order || 0
                      )
                  );

              const videoCount =
                topicVideos.length;

              const completedCount =
                topicLessons.filter(
                  (lesson) =>
                    safeCompletedIds.has(
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

             const topicSubtopics =
  officialSubtopics.filter(
    (subtopic) =>
      String(subtopic.topicId) ===
      String(topic.id) &&
      String(subtopic.argomentoId) ===
      String(argomento.id)
  );

const hasSubtopics =
  topicSubtopics.length > 0;

const hasLessons =
  topicLessons.length > 0;

const hasVideos =
  videoCount > 0;

const available =
  hasSubtopics;

              const completed =
                hasLessons &&
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
                    ${escapeHtml(
                      argomento.color ||
                      "#2563eb"
                    )};
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
                    ${escapeHtml(
                      topic.icon || "📘"
                    )}
                  </div>

                  <h2>
                    ${escapeHtml(
                      topic.title
                    )}
                  </h2>

                  <p class="topic-description">
                    ${escapeHtml(
                      topic.description || ""
                    )}
                  </p>

                  <div
                    class="
                      theory-topic-content-summary
                    "
                  >
                  <span>
  🗂️
  ${topicSubtopics.length}
  ${
    topicSubtopics.length === 1
      ? "sottotopic"
      : "sottotopic"
  }
</span>
                    <span>
                      📖
                      ${topicLessons.length}
                      ${
                        topicLessons.length ===
                        1
                          ? "lezione"
                          : "lezioni"
                      }
                    </span>

                    <span>
                      🎬
                      ${videoCount}
                      ${
                        videoCount === 1
                          ? "video"
                          : "video"
                      }
                    </span>

                    ${
                      totalMinutes > 0
                        ? `
                          <span>
                            ⏱ ${totalMinutes} min
                          </span>
                        `
                        : ""
                    }
                  </div>

                  ${
                    hasLessons
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
                      `
                      : ""
                  }

                  ${
  available
    ? `
      <div
        class="
          theory-topic-availability
        "
      >
        <span
          class="
            theory-available-badge
          "
        >
          🗂️
          ${topicSubtopics.length}
          sottotopic disponibili
        </span>

        ${
          hasLessons
            ? `
              <span
                class="
                  theory-available-badge
                "
              >
                ${
                  completed
                    ? "✅ Teoria completata"
                    : "📖 Lezioni disponibili"
                }
              </span>
            `
            : ""
        }

        ${
          hasVideos
            ? `
              <span
                class="
                  theory-video-available-badge
                "
              >
                🎬 Video disponibili
              </span>
            `
            : ""
        }
      </div>
    `
    : `
      <div
        class="
          theory-coming-badge
        "
      >
        Nessun sottotopic disponibile
      </div>
    `
}

                  <div
                    class="
                      theory-topic-card-actions
                    "
                  >
                    <button
                      class="
                        btn
                        topic-button
                        open-theory-topic-button
                      "
                      data-topic-id="${escapeHtml(
                        topic.id
                      )}"
                      type="button"
                     ${
  available
    ? ""
    : "disabled"
}
                    >
                     ${
  !available
    ? "Sottotopic non disponibili"
    : hasLessons
      ? completedCount > 0
        ? "Continua la teoria"
        : "Apri la teoria"
      : "Apri i sottotopic"
}
                      }
                    </button>

                    <button
                      class="
                        btn
                        btn-secondary
                        topic-video-button
                        open-topic-videos-button
                      "
                      data-topic-id="${escapeHtml(
                        topic.id
                      )}"
                      type="button"
                      ${
                        hasVideos
                          ? ""
                          : "disabled"
                      }
                    >
                      ${
                        hasVideos
                          ? `🎬 Guarda ${
                              videoCount === 1
                                ? "il video"
                                : `${videoCount} video`
                            }`
                          : "Nessun video"
                      }
                    </button>
                  </div>
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
    ?.addEventListener(
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

          actions.onSelectTopic?.(
            selectedTopic
          );
        }
      );
    });

  document
    .querySelectorAll(
      ".open-topic-videos-button"
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
              "Video topic non trovato:",
              topicId
            );

            return;
          }

          actions.onOpenTopicVideos?.(
            selectedTopic
          );
        }
      );
    });
}