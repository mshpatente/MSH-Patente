function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizeIdentifier(value) {
  return String(
    value || ""
  ).trim();
}


function normalizeCompletedLessonIds(
  completedLessonIds
) {
  return new Set(
    Array.from(
      completedLessonIds || []
    )
      .map(normalizeIdentifier)
      .filter(Boolean)
  );
}


function buildSelectableLessons({
  lessons,
  completedLessonIds,
  questions,
  argomentoId,
  topicId
}) {
  const safeArgomentoId =
    normalizeIdentifier(
      argomentoId
    );

  const safeTopicId =
    normalizeIdentifier(
      topicId
    );

  const completedIds =
    normalizeCompletedLessonIds(
      completedLessonIds
    );

  const safeQuestions =
    Array.isArray(questions)
      ? questions
      : [];

  return (
    Array.isArray(lessons)
      ? lessons
      : []
  )
    .filter((lesson) => {
      const lessonId =
        normalizeIdentifier(
          lesson?.id
        );

      const lessonArgomentoId =
        normalizeIdentifier(
          lesson?.argomentoId
        );

      const lessonTopicId =
        normalizeIdentifier(
          lesson?.topicId
        );

      return (
        lessonId &&
        completedIds.has(
          lessonId
        ) &&
        lessonArgomentoId ===
          safeArgomentoId &&
        lessonTopicId ===
          safeTopicId
      );
    })
    .map((lesson) => {
      const lessonId =
        normalizeIdentifier(
          lesson.id
        );

      const questionCount =
        safeQuestions.filter(
          (question) =>
            normalizeIdentifier(
              question.argomentoId
            ) ===
              safeArgomentoId &&
            normalizeIdentifier(
              question.topicId
            ) ===
              safeTopicId &&
            normalizeIdentifier(
              question.lessonId
            ) ===
              lessonId
        ).length;

      return {
        ...lesson,

        id:
          lessonId,

        title:
          String(
            lesson.title ||
            lesson.subtopicTitle ||
            "Lezione"
          ).trim(),

        questionCount,

        selectable:
          questionCount > 0
      };
    })
    .sort(
      (firstLesson, secondLesson) =>
        Number(
          firstLesson.order || 0
        ) -
        Number(
          secondLesson.order || 0
        )
    );
}


export function showProgressiveQuizSetup(
  app,
  {
    argomento,
    topic,
    lessons = [],
    completedLessonIds = [],
    questions = [],
    onBack,
    onStart
  } = {}
) {
  if (!app) {
    throw new Error(
      "Progressive quiz container non disponibile."
    );
  }

  const selectableLessons =
    buildSelectableLessons({
      lessons,
      completedLessonIds,
      questions,

      argomentoId:
        argomento?.id,

      topicId:
        topic?.id
    });

  const lessonsWithQuestions =
    selectableLessons.filter(
      (lesson) =>
        lesson.selectable
    );

  const initialSelectedIds =
    new Set(
      lessonsWithQuestions.map(
        (lesson) =>
          lesson.id
      )
    );

  let selectedLessonIds =
    initialSelectedIds;

  render();

  function getSelectedLessons() {
    return selectableLessons.filter(
      (lesson) =>
        lesson.selectable &&
        selectedLessonIds.has(
          lesson.id
        )
    );
  }


  function getSelectedQuestionCount() {
    return getSelectedLessons()
      .reduce(
        (
          total,
          lesson
        ) =>
          total +
          Number(
            lesson.questionCount || 0
          ),
        0
      );
  }


  function render() {
    const selectedLessons =
      getSelectedLessons();

    const selectedQuestionCount =
      getSelectedQuestionCount();

    const allSelectableSelected =
      lessonsWithQuestions.length > 0 &&
      selectedLessons.length ===
        lessonsWithQuestions.length;

    app.innerHTML = `
      <main
        class="
          page
          progressive-quiz-page
        "
      >
        <section
          class="
            card
            wide-card
            progressive-quiz-card
          "
        >
          <button
            id="progressiveQuizSetupBack"
            class="back-button"
            type="button"
          >
            ← Indietro
          </button>

          <header
            class="
              progressive-quiz-header
            "
          >
            <div
              class="
                progressive-quiz-icon
              "
            >
              📈
            </div>

            <p class="eyebrow">
              ALLENAMENTO PROGRESSIVO
            </p>

            <h1>
              Seleziona le lezioni
            </h1>

            <p class="subtitle">
              ${
                escapeHtml(
                  topic?.title ||
                  "Topic"
                )
              }
            </p>

            <p
              class="
                progressive-quiz-description
              "
            >
              Scegli le lezioni completate
              che vuoi includere nel quiz.
            </p>
          </header>

          ${
            selectableLessons.length === 0
              ? `
                <div
                  class="
                    progressive-quiz-empty
                  "
                >
                  <span>📭</span>

                  <h2>
                    Nessuna lezione disponibile
                  </h2>

                  <p>
                    Completa almeno una lezione
                    di questo topic per creare
                    un quiz progressivo.
                  </p>
                </div>
              `
              : `
                <div
                  class="
                    progressive-quiz-toolbar
                  "
                >
                  <button
                    id="selectAllProgressiveLessons"
                    class="
                      btn
                      btn-secondary
                    "
                    type="button"
                    ${
                      allSelectableSelected
                        ? "disabled"
                        : ""
                    }
                  >
                    Seleziona tutte
                  </button>

                  <button
                    id="clearProgressiveLessons"
                    class="
                      btn
                      btn-secondary
                    "
                    type="button"
                    ${
                      selectedLessons.length === 0
                        ? "disabled"
                        : ""
                    }
                  >
                    Deseleziona tutte
                  </button>
                </div>

                <div
                  class="
                    progressive-lesson-list
                  "
                >
                  ${
                    selectableLessons
                      .map(
                        (lesson) => {
                          const checked =
                            selectedLessonIds.has(
                              lesson.id
                            );

                          const disabled =
                            !lesson.selectable;

                          return `
                            <label
                              class="
                                progressive-lesson-item
                                ${
                                  checked
                                    ? "is-selected"
                                    : ""
                                }
                                ${
                                  disabled
                                    ? "is-disabled"
                                    : ""
                                }
                              "
                            >
                              <input
                                class="
                                  progressive-lesson-checkbox
                                "
                                type="checkbox"
                                value="${escapeHtml(
                                  lesson.id
                                )}"
                                ${
                                  checked
                                    ? "checked"
                                    : ""
                                }
                                ${
                                  disabled
                                    ? "disabled"
                                    : ""
                                }
                              />

                              <span
                                class="
                                  progressive-lesson-check
                                "
                              >
                                ${
                                  disabled
                                    ? "—"
                                    : checked
                                      ? "✓"
                                      : ""
                                }
                              </span>

                              <span
                                class="
                                  progressive-lesson-content
                                "
                              >
                                <strong>
                                  ${escapeHtml(
                                    lesson.title
                                  )}
                                </strong>

                                <small>
                                  ${
                                    lesson.questionCount
                                  }
                                  ${
                                    lesson.questionCount === 1
                                      ? "domanda"
                                      : "domande"
                                  }
                                </small>
                              </span>

                              ${
                                disabled
                                  ? `
                                    <span
                                      class="
                                        progressive-lesson-status
                                      "
                                    >
                                      Nessuna domanda
                                    </span>
                                  `
                                  : ""
                              }
                            </label>
                          `;
                        }
                      )
                      .join("")
                  }
                </div>
              `
          }

          <section
            class="
              progressive-quiz-summary
            "
          >
            <div>
              <span>
                Lezioni selezionate
              </span>

              <strong>
                ${selectedLessons.length}
              </strong>
            </div>

            <div>
              <span>
                Domande disponibili
              </span>

              <strong>
                ${selectedQuestionCount}
              </strong>
            </div>

            <div>
              <span>
                Lezioni completate
              </span>

              <strong>
                ${selectableLessons.length}
              </strong>
            </div>
          </section>

          <p
            id="progressiveQuizSetupMessage"
            class="
              message
              progressive-quiz-message
            "
          ></p>

          <button
            id="startSelectedProgressiveQuiz"
            class="
              btn
              btn-primary
              full-width
              progressive-quiz-start
            "
            type="button"
            ${
              selectedQuestionCount <= 0
                ? "disabled"
                : ""
            }
          >
            Inizia il quiz
            ${
              selectedQuestionCount > 0
                ? `(${selectedQuestionCount})`
                : ""
            }
          </button>
        </section>
      </main>
    `;

    attachListeners();
  }


  function attachListeners() {
    app
      .querySelector(
        "#progressiveQuizSetupBack"
      )
      ?.addEventListener(
        "click",
        () => {
          if (
            typeof onBack ===
            "function"
          ) {
            onBack();
          }
        }
      );

    app
      .querySelector(
        "#selectAllProgressiveLessons"
      )
      ?.addEventListener(
        "click",
        () => {
          selectedLessonIds =
            new Set(
              lessonsWithQuestions.map(
                (lesson) =>
                  lesson.id
              )
            );

          render();
        }
      );

    app
      .querySelector(
        "#clearProgressiveLessons"
      )
      ?.addEventListener(
        "click",
        () => {
          selectedLessonIds =
            new Set();

          render();
        }
      );

    app
      .querySelectorAll(
        ".progressive-lesson-checkbox"
      )
      .forEach(
        (checkbox) => {
          checkbox.addEventListener(
            "change",
            (event) => {
              const lessonId =
                normalizeIdentifier(
                  event.currentTarget
                    .value
                );

              const nextSelectedIds =
                new Set(
                  selectedLessonIds
                );

              if (
                event.currentTarget
                  .checked
              ) {
                nextSelectedIds.add(
                  lessonId
                );
              } else {
                nextSelectedIds.delete(
                  lessonId
                );
              }

              selectedLessonIds =
                nextSelectedIds;

              render();
            }
          );
        }
      );

    app
      .querySelector(
        "#startSelectedProgressiveQuiz"
      )
      ?.addEventListener(
        "click",
        () => {
          const selectedLessons =
            getSelectedLessons();

          const selectedQuestionCount =
            getSelectedQuestionCount();

          const messageElement =
            app.querySelector(
              "#progressiveQuizSetupMessage"
            );

          if (
            selectedLessons.length === 0 ||
            selectedQuestionCount === 0
          ) {
            if (messageElement) {
              messageElement.textContent =
                "Seleziona almeno una lezione con domande disponibili.";

              messageElement.className =
                "message error progressive-quiz-message";
            }

            return;
          }

          if (
            typeof onStart ===
            "function"
          ) {
            onStart({
              selectedLessonIds:
                selectedLessons.map(
                  (lesson) =>
                    lesson.id
                ),

              selectedLessons,

              questionCount:
                selectedQuestionCount
            });
          }
        }
      );
  }
}