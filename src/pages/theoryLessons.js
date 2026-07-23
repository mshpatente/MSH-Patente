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

export function showTheoryLessons(
  app,
  argomento,
  topic,
  lessonList,
  completedLessonIds,
  actions
) {
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

  const totalMinutes =
    topicLessons.reduce(
      (total, lesson) =>
        total +
        (
          Number(
            lesson.estimatedMinutes
          ) || 0
        ),
      0
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

  app.innerHTML = `
    <main class="page">
      <section class="card wide-card">
        <div class="page-header">
          <button
            id="backToTheoryTopicsButton"
            class="back-button"
            type="button"
          >
            ← Topic
          </button>

          <p class="eyebrow">
            ${topic.icon}
            ${argomento.title}
          </p>

          <h1>
            ${topic.title}
          </h1>

          <p class="subtitle">
            ${topic.description}
          </p>

          <div class="theory-lessons-summary">
            <span>
              📖 ${topicLessons.length}
              ${
                topicLessons.length === 1
                  ? "lezione"
                  : "lezioni"
              }
            </span>

            <span>
              ⏱️ ${totalMinutes} minuti
            </span>

            <span>
              ✅ ${completedCount}
              completate
            </span>
          </div>

          <div
            class="
              theory-topic-progress-card
            "
          >
            <div
              class="
                theory-topic-progress-info
              "
            >
              <span>
                Progresso del topic
              </span>

              <strong>
                ${progressPercentage}%
              </strong>
            </div>

            <div
              class="
                theory-topic-progress-track
              "
            >
              <div
                class="
                  theory-topic-progress-fill
                "
                style="
                  width:
                  ${progressPercentage}%;
                "
              ></div>
            </div>
          </div>
        </div>
 <div class="theory-search-box">
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
      Tutte le lezioni
    </option>

    <option value="completed">
      ✅ Completate
    </option>

    <option value="pending">
      📖 Da studiare
    </option>

    <option value="magic">
      ✨ Con trucco magico
    </option>

    <option value="short">
      ⏱️ Brevi — massimo 5 minuti
    </option>
  </select>
</div>

        ${
          topicLessons.length > 0
            ? `
              <div class="theory-lessons-list">
                ${topicLessons
                  .map(
                    (
                      lesson,
                      index
                    ) => {
                      const completed =
                        completedLessonIds.has(
                          lesson.id
                        );

                      return `
                     <article
  class="
    theory-lesson-card
    ${
      completed
        ? "theory-lesson-card-completed"
        : ""
    }
  "
  data-lesson-id="${lesson.id}"
>
                          <div
                            class="
                              theory-lesson-number
                            "
                          >
                            ${
                              completed
                                ? "✓"
                                : index + 1
                            }
                          </div>

                          <div
                            class="
                              theory-lesson-card-content
                            "
                          >
                            <div
                              class="
                                theory-lesson-title-row
                              "
                            >
                              <p class="eyebrow">
                                LEZIONE
                                ${index + 1}
                              </p>

                              ${
                                completed
                                  ? `
                                    <span
                                      class="
                                        theory-completed-badge
                                      "
                                    >
                                      ✓ Completata
                                    </span>
                                  `
                                  : ""
                              }
                            </div>

                            <h2>
                              ${lesson.title}
                            </h2>

                            <p>
                              ${lesson.subtitle}
                            </p>

                            <div
                              class="
                                theory-lesson-meta
                              "
                            >
                              <span>
                                ⏱️
                                ${
                                  Number(
                                    lesson
                                      .estimatedMinutes
                                  ) || 0
                                }
                                min
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
                            </div>
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
                            "
                            data-lesson-id="${lesson.id}"
                            type="button"
                          >
                            ${
                              completed
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
  Prova a cambiare la ricerca
  o il filtro selezionato.
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

                <p>
                  Le lezioni di questo topic
                  saranno pubblicate prossimamente.
                </p>
              </div>
            `
        }
      </section>
    </main>
  `;

  document
  .querySelector(
    "#backToTheoryTopicsButton"
  )
  ?.addEventListener(
    "click",
    actions.onBack
  );

const searchInput =
  document.querySelector(
    "#theoryLessonSearch"
  );

const filterSelect =
  document.querySelector(
    "#theoryLessonFilter"
  );

function lessonMatchesFilter(
  lesson,
  selectedFilter
) {
  const isCompleted =
    completedLessonIds.has(
      lesson.id
    );

  switch (selectedFilter) {
    case "completed":
      return isCompleted;

    case "pending":
      return !isCompleted;

    case "magic":
      return Boolean(
        String(
          lesson.magicTrick || ""
        ).trim()
      );

    case "short":
      return (
        Number(
          lesson.estimatedMinutes
        ) || 0
      ) <= 5;

    case "all":
    default:
      return true;
  }
}

function applyLessonFilters() {
  const normalizedSearch =
    normalizeSearchText(
      searchInput?.value || ""
    );

  const selectedFilter =
    filterSelect?.value || "all";

  const lessonCards = Array.from(
    document.querySelectorAll(
      ".theory-lesson-card"
    )
  );

  let visibleLessonCount = 0;

  lessonCards.forEach((card) => {
    const lessonId =
      card.dataset.lessonId?.trim();

    const lesson =
      topicLessons.find(
        (item) =>
          String(item.id) ===
          String(lessonId)
      );

    if (!lesson) {
      card.style.display = "none";
      return;
    }

    const matchesSearch =
      !normalizedSearch ||
      getLessonSearchText(
        lesson
      ).includes(
        normalizedSearch
      );

    const matchesFilter =
      lessonMatchesFilter(
        lesson,
        selectedFilter
      );

    const shouldShow =
      matchesSearch &&
      matchesFilter;

    card.style.display =
      shouldShow
        ? ""
        : "none";

    if (shouldShow) {
      visibleLessonCount += 1;
    }
  });

  const searchEmptyState =
    document.querySelector(
      "#theorySearchEmptyState"
    );

  if (searchEmptyState) {
    searchEmptyState.style.display =
      visibleLessonCount === 0
        ? ""
        : "none";
  }
}

searchInput?.addEventListener(
  "input",
  applyLessonFilters
);

filterSelect?.addEventListener(
  "change",
  applyLessonFilters
);

applyLessonFilters();

document
  .querySelectorAll(
    ".open-theory-lesson-button"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const lessonId =
          button.dataset.lessonId
            ?.trim();

        const selectedLesson =
          topicLessons.find(
            (lesson) =>
              String(lesson.id) ===
              String(lessonId)
          );

        if (!selectedLesson) {
          console.error(
            "Theory lesson non trovata:",
            lessonId
          );

          return;
        }

        actions.onSelectLesson(
          selectedLesson,
          topicLessons
        );
      }
    );
  });
}