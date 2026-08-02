import {
  getBookmarkedLessonIds,
  getFavouriteLessonIds,
  getLessonReadingPosition
} from "../utils/theoryReaderStorage.js";

import {
  officialSubtopics
} from "../data/officialSubtopics.js";

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function collectSearchableText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return [];
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(
      collectSearchableText
    );
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap(
      collectSearchableText
    );
  }

  return [];
}

function getLessonSearchText(lesson) {
  return normalizeSearchText(
    collectSearchableText(
      lesson
    ).join(" ")
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function showTheoryLessons(
  app,
  argomento,
  topic,
  lessonList,
  completedLessonIds,
  actions
) {
  const storageScope =
    actions.storageScope || "guest";

  const subtopicAccessMap =
    actions.subtopicAccessMap
      instanceof Map
      ? actions.subtopicAccessMap
      : new Map();

  const premiumAccessAllowed =
    actions.isAdmin === true ||
    actions.premiumAccessAllowed ===
      true;

  function getAccessLevel(
    subtopicId
  ) {
    return (
      subtopicAccessMap.get(
        String(
          subtopicId || ""
        )
      ) === "premium"
        ? "premium"
        : "free"
    );
  }

  function isSubtopicLocked(
    subtopicId
  ) {
    return (
      getAccessLevel(
        subtopicId
      ) === "premium" &&
      !premiumAccessAllowed
    );
  }

  const bookmarkedIds =
    getBookmarkedLessonIds(
      storageScope
    );

  const favouriteIds =
    getFavouriteLessonIds(
      storageScope
    );

  const topicLessons =
  lessonList
    .filter(
      (lesson) =>
        String(lesson.topicId) ===
          String(topic.id) &&
        String(lesson.argomentoId) ===
          String(argomento.id) &&
        lesson.published === true
    )
    .sort(
      (first, second) =>
        Number(first.order || 0) -
        Number(second.order || 0)
    );

      const topicSubtopics =
  officialSubtopics
    .filter(
      (subtopic) =>
        subtopic.argomentoId ===
          argomento.id &&
        subtopic.topicId ===
          topic.id
    )
    .sort(
      (first, second) =>
        first.order -
        second.order
    );
    const firstSubtopicWithLessons =
  topicSubtopics.find(
    (subtopic) =>
      topicLessons.some(
        (lesson) =>
          String(lesson.subtopicId) ===
          String(subtopic.id)
      )
  );

const firstAccessibleSubtopicWithLessons =
  topicSubtopics.find(
    (subtopic) =>
      !isSubtopicLocked(
        subtopic.id
      ) &&
      topicLessons.some(
        (lesson) =>
          String(
            lesson.subtopicId
          ) ===
          String(
            subtopic.id
          )
      )
  );

const firstAccessibleSubtopic =
  topicSubtopics.find(
    (subtopic) =>
      !isSubtopicLocked(
        subtopic.id
      )
  );

let selectedSubtopicId =
  firstAccessibleSubtopicWithLessons
    ?.id ||
  firstAccessibleSubtopic?.id ||
  firstSubtopicWithLessons?.id ||
  topicSubtopics[0]?.id ||
  null;

function getVisibleLessons() {
  return selectedSubtopicId
    ? topicLessons.filter(
        (lesson) =>
          String(lesson.subtopicId) ===
          String(selectedSubtopicId)
      )
    : topicLessons;
}

let visibleLessons =
  getVisibleLessons();

 const completedCount =
  visibleLessons.filter(
    (lesson) =>
      completedLessonIds.has(
        lesson.id
      )
  ).length;

  const progressPercentage =
  visibleLessons.length > 0
    ? Math.round(
        (
          completedCount /
          visibleLessons.length
        ) * 100
      )
    : 0;

  const totalMinutes =
  visibleLessons.reduce(
    (total, lesson) =>
      total +
      (
        Number(
          lesson.estimatedMinutes
        ) || 0
      ),
    0
  );

  app.innerHTML = `
    <main class="page theory-v2-lessons-page">
      <section class="card wide-card">
        <header class="page-header">
          <button
            id="backToTheoryTopicsButton"
            class="back-button"
            type="button"
          >
            ← Topic
          </button>

          <p class="eyebrow">
            ${escapeHtml(topic.icon || "📖")}
            ${escapeHtml(argomento.title)}
          </p>

          <h1>${escapeHtml(topic.title)}</h1>

          <p class="subtitle">
            ${escapeHtml(
              topic.description || ""
            )}
          </p>

          <div class="theory-v2-lessons-summary">
  <span id="theoryVisibleLessonCount">
    📖 ${visibleLessons.length}
    lezioni
  </span>

  <span id="theoryVisibleLessonMinutes">
    ⏱️ ${totalMinutes} minuti
  </span>

  <span id="theoryVisibleCompletedCount">
    ✅ ${completedCount} completate
  </span>
</div>

          <div class="theory-v2-topic-progress">
            <div>
              <span>Progresso del topic</span>
              <strong id="theoryVisibleProgressText">
  ${progressPercentage}%
</strong>
            </div>

            <div class="theory-v2-topic-progress-track">
              <div
  id="theoryVisibleProgressFill"
  class="theory-v2-topic-progress-fill"
  style="
    width:
    ${progressPercentage}%;
  "
></div>
            </div>
          </div>
        </header>

        ${
  topicSubtopics.length > 0
    ? `
      <div class="theory-v2-subtopics">

        ${topicSubtopics
          .map(
            (subtopic) => {
              const accessLevel =
                getAccessLevel(
                  subtopic.id
                );

              const locked =
                isSubtopicLocked(
                  subtopic.id
                );

              return `
                <button
                  class="
                    theory-v2-subtopic-card
                    ${
                      String(
                        selectedSubtopicId
                      ) ===
                      String(
                        subtopic.id
                      )
                        ? "active"
                        : ""
                    }
                    ${
                      locked
                        ? "theory-v2-subtopic-locked"
                        : ""
                    }
                  "
                  type="button"
                  data-subtopic-id="${escapeHtml(
                    subtopic.id
                  )}"
                  data-access-level="${accessLevel}"
                  aria-label="${escapeHtml(
                    locked
                      ? `${subtopic.title}, Premium bloccato`
                      : subtopic.title
                  )}"
                >
                  <span
                    class="
                      theory-v2-subtopic-title-row
                    "
                  >
                    <strong>
                      ${escapeHtml(
                        subtopic.title
                      )}
                    </strong>

                    <span
                      class="
                        theory-v2-access-badge
                        ${
                          accessLevel ===
                          "premium"
                            ? "theory-v2-access-premium"
                            : "theory-v2-access-free"
                        }
                      "
                    >
                      ${
                        accessLevel ===
                        "premium"
                          ? locked
                            ? "🔒 Premium"
                            : "🔓 Premium"
                          : "✓ Gratis"
                      }
                    </span>
                  </span>

                  ${
                    subtopic.description
                      ? `
                        <small>
                          ${escapeHtml(
                            subtopic.description
                          )}
                        </small>
                      `
                      : ""
                  }
                </button>
              `;
            }
          )
          .join("")}

      </div>
    `
    : ""
}
        <div class="theory-v2-search">
          <input
            id="theoryLessonSearch"
            type="search"
            placeholder="🔍 Cerca una lezione..."
            autocomplete="off"
          />

          <select
            id="theoryLessonFilter"
            aria-label="Filtra le lezioni"
          >
            <option value="all">
              Tutte
            </option>

            <option value="completed">
              ✅ Completate
            </option>

            <option value="pending">
              📖 Da studiare
            </option>

            <option value="bookmarked">
              🔖 Segnalibri
            </option>

            <option value="favourite">
              ❤️ Preferite
            </option>

            <option value="continue">
              🕒 In corso
            </option>

            <option value="magic">
              ✨ Trucco magico
            </option>
          </select>
        </div>

        ${
          topicLessons.length > 0
            ? `
              <div class="theory-v2-lessons-list">
                ${topicLessons.map(
                    (lesson, index) => {
                      const completed =
                        completedLessonIds.has(
                          lesson.id
                        );

                      const bookmarked =
                        bookmarkedIds.has(
                          String(lesson.id)
                        );

                      const favourite =
                        favouriteIds.has(
                          String(lesson.id)
                        );

                      const readingPosition =
                        getLessonReadingPosition(
                          storageScope,
                          lesson.id
                        );

                      const lessonLocked =
                        isSubtopicLocked(
                          lesson.subtopicId
                        );

                      return `
                        <article
  class="
    theory-v2-lesson-card
    ${
      completed
        ? "theory-v2-lesson-completed"
        : ""
    }
    ${
      lessonLocked
        ? "theory-v2-lesson-locked"
        : ""
    }
  "
  data-lesson-id="${lesson.id}"
  data-subtopic-id="${
    lesson.subtopicId || ""
  }"
>
                          <div class="theory-v2-lesson-number">
                            ${
                              completed
                                ? "✓"
                                : index + 1
                            }
                          </div>

                          <div class="theory-v2-lesson-content">
                            <div class="theory-v2-lesson-labels">
                              <span class="eyebrow">
                                LEZIONE ${index + 1}
                              </span>

                              ${
                                lessonLocked
                                  ? `
                                    <span
                                      class="
                                        theory-v2-access-badge
                                        theory-v2-access-premium
                                      "
                                    >
                                      🔒 Premium
                                    </span>
                                  `
                                  : ""
                              }

                              ${
                                bookmarked
                                  ? "<span>🔖</span>"
                                  : ""
                              }

                              ${
                                favourite
                                  ? "<span>❤️</span>"
                                  : ""
                              }
                            </div>

                            <h2>
                              ${escapeHtml(
                                lesson.title
                              )}
                            </h2>

                            <p>
                              ${escapeHtml(
                                lesson.subtitle ||
                                ""
                              )}
                            </p>

                            <div class="theory-v2-lesson-meta">
                              <span>
                                ⏱️ ${
                                  Number(
                                    lesson.estimatedMinutes
                                  ) || 0
                                } min
                              </span>

                              ${
                                lesson.magicTrick
                                  ? `
                                    <span>
                                      ✨ Trucco magico
                                    </span>
                                  `
                                  : ""
                              }

                              ${
                                readingPosition >= 5 &&
                                readingPosition < 100
                                  ? `
                                    <span>
                                      🕒 ${readingPosition}%
                                    </span>
                                  `
                                  : ""
                              }
                            </div>

                            ${
                              readingPosition > 0
                                ? `
                                  <div class="theory-v2-card-progress">
                                    <div
                                      style="
                                        width:
                                        ${readingPosition}%;
                                      "
                                    ></div>
                                  </div>
                                `
                                : ""
                            }
                          </div>

                          <button
                            class="
                              btn
                              ${
                                completed
                                  ? "btn-secondary"
                                  : "btn-primary"
                              }
                              open-theory-lesson-button
                              ${
                                lessonLocked
                                  ? "theory-v2-premium-locked-button"
                                  : ""
                              }
                            "
                            data-lesson-id="${
                              lesson.id
                            }"
                            type="button"
                          >
                            ${
                              lessonLocked
                                ? "🔒 Premium"
                                : readingPosition >= 5 &&
                                    readingPosition < 100
                                  ? "Continua"
                                  : completed
                                    ? "Ripassa"
                                    : "Apri lezione"
                            }
                          </button>
                        </article>
                      `;
                    }
                  )
                  .join("")}
              </div>

              <div
                id="theorySearchEmptyState"
                class="empty-state"
                hidden
              >
                <div class="empty-state-icon">
                  🔍
                </div>

                <h2>
                  Nessuna lezione trovata
                </h2>

                <p>
                  Cambia ricerca o filtro.
                </p>
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  📚
                </div>

                <h2>
                  Nessuna lezione disponibile
                </h2>
              </div>
            `
        }
      </section>
    </main>
  `;

  app
    .querySelector(
      "#backToTheoryTopicsButton"
    )
    ?.addEventListener(
      "click",
      actions.onBack
    );

  const searchInput =
    app.querySelector(
      "#theoryLessonSearch"
    );

  const filterSelect =
    app.querySelector(
      "#theoryLessonFilter"
    );

    function updateSubtopicStatistics() {
  visibleLessons =
    getVisibleLessons();

  const visibleCompletedCount =
    visibleLessons.filter(
      (lesson) =>
        completedLessonIds.has(
          lesson.id
        )
    ).length;

  const visibleMinutes =
    visibleLessons.reduce(
      (total, lesson) =>
        total +
        (
          Number(
            lesson.estimatedMinutes
          ) || 0
        ),
      0
    );

  const visibleProgress =
    visibleLessons.length > 0
      ? Math.round(
          (
            visibleCompletedCount /
            visibleLessons.length
          ) * 100
        )
      : 0;

  const lessonCountElement =
    app.querySelector(
      "#theoryVisibleLessonCount"
    );

  const minutesElement =
    app.querySelector(
      "#theoryVisibleLessonMinutes"
    );

  const completedElement =
    app.querySelector(
      "#theoryVisibleCompletedCount"
    );

  const progressTextElement =
    app.querySelector(
      "#theoryVisibleProgressText"
    );

  const progressFillElement =
    app.querySelector(
      "#theoryVisibleProgressFill"
    );

  if (lessonCountElement) {
    lessonCountElement.textContent =
      `📖 ${visibleLessons.length} lezioni`;
  }

  if (minutesElement) {
    minutesElement.textContent =
      `⏱️ ${visibleMinutes} minuti`;
  }

  if (completedElement) {
    completedElement.textContent =
      `✅ ${visibleCompletedCount} completate`;
  }

  if (progressTextElement) {
    progressTextElement.textContent =
      `${visibleProgress}%`;
  }

  if (progressFillElement) {
    progressFillElement.style.width =
      `${visibleProgress}%`;
  }
}

  function matchesFilter(
    lesson,
    selectedFilter
  ) {
    const completed =
      completedLessonIds.has(
        lesson.id
      );

    const lessonId =
      String(lesson.id);

    const readingPosition =
      getLessonReadingPosition(
        storageScope,
        lesson.id
      );

    switch (selectedFilter) {
      case "completed":
        return completed;

      case "pending":
        return !completed;

      case "bookmarked":
        return bookmarkedIds.has(
          lessonId
        );

      case "favourite":
        return favouriteIds.has(
          lessonId
        );

      case "continue":
        return (
          readingPosition >= 5 &&
          readingPosition < 100
        );

      case "magic":
        return Boolean(
          String(
            lesson.magicTrick || ""
          ).trim()
        );

      default:
        return true;
    }
  }

  function applyFilters() {
    const search =
      normalizeSearchText(
        searchInput?.value || ""
      );

    const filter =
      filterSelect?.value || "all";

    let visibleCount = 0;

    app
      .querySelectorAll(
        ".theory-v2-lesson-card"
      )
      .forEach((card) => {
      const lesson =
  topicLessons.find(
    (item) =>
      String(item.id) ===
      String(
        card.dataset.lessonId
      )
  );

        const belongsToSelectedSubtopic =
  !selectedSubtopicId ||
  String(lesson?.subtopicId) ===
    String(selectedSubtopicId);

const visible =
  Boolean(lesson) &&
  belongsToSelectedSubtopic &&
  (
    !search ||
    getLessonSearchText(
      lesson
    ).includes(search)
  ) &&
  matchesFilter(
    lesson,
    filter
  );

        card.hidden = !visible;

        if (visible) {
          visibleCount += 1;
        }
      });

    const emptyState =
      app.querySelector(
        "#theorySearchEmptyState"
      );

    if (emptyState) {
      emptyState.hidden =
        visibleCount > 0;
    }
  }

  searchInput?.addEventListener(
    "input",
    applyFilters
  );

  filterSelect?.addEventListener(
    "change",
    applyFilters
  );

app
  .querySelectorAll(
    ".theory-v2-subtopic-card"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const subtopicId =
          button.dataset.subtopicId;

        if (
          isSubtopicLocked(
            subtopicId
          )
        ) {
          const subtopic =
            topicSubtopics.find(
              (item) =>
                String(item.id) ===
                String(subtopicId)
            );

          actions
            .onLockedSubtopic?.(
              subtopic
            );

          return;
        }

        selectedSubtopicId =
          subtopicId;

        app
          .querySelectorAll(
            ".theory-v2-subtopic-card"
          )
          .forEach(
            (subtopicButton) => {
              subtopicButton.classList.toggle(
                "active",
                String(
                  subtopicButton.dataset
                    .subtopicId
                ) ===
                  String(
                    selectedSubtopicId
                  )
              );
            }
          );

        updateSubtopicStatistics();
        applyFilters();
      }
    );
  });

  app
    .querySelectorAll(
      ".open-theory-lesson-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const lesson =
            topicLessons.find(
              (item) =>
                String(item.id) ===
                String(
                  button.dataset.lessonId
                )
            );

          if (!lesson) {
            return;
          }

          if (
            isSubtopicLocked(
              lesson.subtopicId
            )
          ) {
            const subtopic =
              topicSubtopics.find(
                (item) =>
                  String(item.id) ===
                  String(
                    lesson.subtopicId
                  )
              );

            actions
              .onLockedSubtopic?.(
                subtopic
              );

            return;
          }

          actions.onSelectLesson(
            lesson,
            getVisibleLessons()
          );
        }
      );
    });

  updateSubtopicStatistics();
applyFilters();
}
