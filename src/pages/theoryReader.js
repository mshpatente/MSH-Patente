import {
  getPreferredLessonLanguage,
  getTranslatedLesson,
  savePreferredLessonLanguage
} from "../utils/lessonTranslations.js";

import {
  isTextToSpeechSupported,
  speakText,
  stopSpeech
} from "../utils/textToSpeech.js";

const READER_LANGUAGES = {
  it: {
    code: "it",
    voice: "it",
    flag: "🇮🇹",
    name: "Italiano"
  },

  en: {
    code: "en",
    voice: "en",
    flag: "🇬🇧",
    name: "English"
  },

  bn: {
    code: "bn",
    voice: "bn",
    flag: "🇧🇩",
    name: "বাংলা"
  }
};

const READER_LABELS = {
  it: {
    back: "Lezioni",
    lesson: "Lezione",
    of: "di",
    minutes: "min",

    summary: "In breve",
    theory: "Spiegazione",
    remember: "Da ricordare",
    commonMistake: "Errore comune",
    correctBehavior: "Comportamento corretto",

    magicEyebrow: "TRUCCO MAGICO",
    magicTitle: "Ricorda così",

    listenTitle: "Ascolta la lezione",
    listenDescription:
      "La lezione verrà letta ad alta voce.",
    listen: "Ascolta",
    resume: "Riprendi",
    pause: "Riavvia",
    stop: "Stop",
    audioReady: "Audio pronto",
    audioPlaying: "Lettura in corso...",
    audioPaused: "Audio in pausa",
    audioResumed: "Riproduzione ripresa",
    audioStopped: "Audio interrotto",
    audioCompleted: "Lettura completata",
    audioUnsupported:
      "La lettura audio non è supportata da questo browser.",

    imagePlaceholder: "Immagine della lezione",
    imageAdmin:
      "Sarà aggiunta dall'Admin Panel",

    emptyContent:
      "Il contenuto di questa lezione sarà disponibile a breve.",

    completedTitle: "Lezione completata",
    completedText:
      "Questa lezione è stata aggiunta ai tuoi progressi.",
    completeButton:
      "Ho completato questa lezione",

    previous: "Lezione precedente",
    next: "Lezione successiva",
    last: "Ultima lezione",

    completedBadge: "Completata"
  },

  en: {
    back: "Lessons",
    lesson: "Lesson",
    of: "of",
    minutes: "min",

    summary: "Summary",
    theory: "Explanation",
    remember: "Remember",
    commonMistake: "Common mistake",
    correctBehavior: "Correct behaviour",

    magicEyebrow: "MEMORY TRICK",
    magicTitle: "Remember it this way",

    listenTitle: "Listen to the lesson",
    listenDescription:
      "The lesson will be read aloud.",
    listen: "Listen",
    resume: "Resume",
    pause: "Restart",
    stop: "Stop",
    audioReady: "Audio ready",
    audioPlaying: "Reading...",
    audioPaused: "Audio paused",
    audioResumed: "Audio resumed",
    audioStopped: "Audio stopped",
    audioCompleted: "Reading completed",
    audioUnsupported:
      "Audio reading is not supported by this browser.",

    imagePlaceholder: "Lesson image",
    imageAdmin:
      "It will be added from the Admin Panel",

    emptyContent:
      "The content of this lesson will be available soon.",

    completedTitle: "Lesson completed",
    completedText:
      "This lesson has been added to your progress.",
    completeButton:
      "I completed this lesson",

    previous: "Previous lesson",
    next: "Next lesson",
    last: "Last lesson",

    completedBadge: "Completed"
  },

  bn: {
    back: "লেসনসমূহ",
    lesson: "লেসন",
    of: "এর মধ্যে",
    minutes: "মিনিট",

    summary: "সংক্ষেপে",
    theory: "বিস্তারিত ব্যাখ্যা",
    remember: "মনে রাখুন",
    commonMistake: "সাধারণ ভুল",
    correctBehavior: "সঠিক আচরণ",

    magicEyebrow: "মনে রাখার কৌশল",
    magicTitle: "এভাবে মনে রাখুন",

    listenTitle: "লেসন শুনুন",
    listenDescription:
      "লেসনের সম্পূর্ণ লেখা পড়ে শোনানো হবে।",
    listen: "শুনুন",
    resume: "আবার শুনুন",
    pause: "আবার শুরু করুন",
    stop: "বন্ধ করুন",
    audioReady: "অডিও প্রস্তুত",
    audioPlaying: "পড়ে শোনানো হচ্ছে...",
    audioPaused: "অডিও বিরতিতে আছে",
    audioResumed: "অডিও আবার শুরু হয়েছে",
    audioStopped: "অডিও বন্ধ হয়েছে",
    audioCompleted: "পড়া শেষ হয়েছে",
    audioUnsupported:
      "এই ব্রাউজারে অডিও পড়ার সুবিধা নেই।",

    imagePlaceholder: "লেসনের ছবি",
    imageAdmin:
      "Admin Panel থেকে ছবি যোগ করা হবে",

    emptyContent:
      "এই লেসনের বিষয়বস্তু শীঘ্রই পাওয়া যাবে।",

    completedTitle: "লেসন সম্পন্ন হয়েছে",
    completedText:
      "এই লেসনটি আপনার অগ্রগতিতে যোগ হয়েছে।",
    completeButton:
      "আমি এই লেসন সম্পন্ন করেছি",

    previous: "আগের লেসন",
    next: "পরের লেসন",
    last: "শেষ লেসন",

    completedBadge: "সম্পন্ন"
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function renderParagraphs(value) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(/\n\s*\n/)
    .map(
      (paragraph) => `
        <p class="theory-reader-paragraph">
          ${escapeHtml(paragraph)}
        </p>
      `
    )
    .join("");
}

function getSafeLanguage(language) {
  return READER_LANGUAGES[language]
    ? language
    : "it";
}

function getReaderLabels(language) {
  return (
    READER_LABELS[
      getSafeLanguage(language)
    ] ||
    READER_LABELS.it
  );
}

function translateLessonSafely(
  lesson,
  language
) {
  try {
    return (
      getTranslatedLesson(
        lesson,
        language
      ) ||
      lesson
    );
  } catch (error) {
    console.error(
      "Errore traduzione lezione:",
      error
    );

    return lesson;
  }
}

export function showTheoryReader(
  app,
  {
    argomento,
    topic,
    lesson,
    lessonNumber,
    totalLessons,
    previousLesson,
    nextLesson,
    completed,
    actions
  }
) {
  stopSpeech();

  const selectedLanguage =
    getSafeLanguage(
      getPreferredLessonLanguage()
    );

  const languageInformation =
    READER_LANGUAGES[
      selectedLanguage
    ];

  const labels =
    getReaderLabels(
      selectedLanguage
    );

  const displayedLesson =
    translateLessonSafely(
      lesson,
      selectedLanguage
    );

  function renderLegacyContentBlock(
    block
  ) {
    if (
      !block ||
      !block.type
    ) {
      return "";
    }

    if (
      block.type ===
      "paragraph"
    ) {
      return `
        <div
          class="
            theory-reader-text-section
          "
        >
          ${renderParagraphs(
            block.text
          )}
        </div>
      `;
    }

    if (
      block.type ===
      "important"
    ) {
      return `
        <section
          class="
            theory-information-box
            theory-important-box
          "
        >
          <div
            class="
              theory-information-icon
            "
          >
            💡
          </div>

          <div>
            <h2>
              ${
                escapeHtml(
                  block.title ||
                  labels.remember
                )
              }
            </h2>

            ${renderParagraphs(
              block.text
            )}
          </div>
        </section>
      `;
    }

    if (
      block.type ===
      "warning"
    ) {
      return `
        <section
          class="
            theory-information-box
            theory-warning-box
          "
        >
          <div
            class="
              theory-information-icon
            "
          >
            ⚠️
          </div>

          <div>
            <h2>
              ${
                escapeHtml(
                  block.title ||
                  labels.commonMistake
                )
              }
            </h2>

            ${renderParagraphs(
              block.text
            )}
          </div>
        </section>
      `;
    }

    return "";
  }

  function renderStandardSection({
    value,
    title,
    icon,
    className = ""
  }) {
    const normalizedValue =
      normalizeText(value);

    if (!normalizedValue) {
      return "";
    }

    return `
      <section
        class="
          theory-information-box
          theory-v2-section
          ${className}
        "
      >
        <div
          class="
            theory-information-icon
          "
        >
          ${icon}
        </div>

        <div>
          <h2>
            ${escapeHtml(title)}
          </h2>

          ${renderParagraphs(
            normalizedValue
          )}
        </div>
      </section>
    `;
  }

  const legacyContent =
    Array.isArray(
      displayedLesson.content
    )
      ? displayedLesson.content
          .map(
            renderLegacyContentBlock
          )
          .join("")
      : "";

  const newFormatContent = [
    renderStandardSection({
      value:
        displayedLesson.summary,
      title: labels.summary,
      icon: "📌",
      className:
        "theory-summary-box"
    }),

    renderStandardSection({
      value:
        displayedLesson.theoryText,
      title: labels.theory,
      icon: "📘",
      className:
        "theory-explanation-box"
    }),

    renderStandardSection({
      value:
        displayedLesson.remember,
      title: labels.remember,
      icon: "💡",
      className:
        "theory-important-box"
    }),

    renderStandardSection({
      value:
        displayedLesson.commonMistake,
      title:
        labels.commonMistake,
      icon: "⚠️",
      className:
        "theory-warning-box"
    }),

    renderStandardSection({
      value:
        displayedLesson.correctBehavior,
      title:
        labels.correctBehavior,
      icon: "✅",
      className:
        "theory-correct-behavior-box"
    })
  ].join("");

  const lessonContent =
    newFormatContent ||
    legacyContent;

  const lessonSpeechText = [
    displayedLesson.title,
    displayedLesson.subtitle,
    displayedLesson.summary,
    displayedLesson.theoryText,
    displayedLesson.remember,
    displayedLesson.commonMistake,
    displayedLesson.correctBehavior,

    ...(Array.isArray(
      displayedLesson.content
    )
      ? displayedLesson.content
          .flatMap(
            (block) => [
              block?.title,
              block?.text
            ]
          )
      : []),

    displayedLesson.magicTrick
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(". ");

  const progressPercentage =
    totalLessons > 0
      ? Math.round(
          (
            lessonNumber /
            totalLessons
          ) * 100
        )
      : 0;

  app.innerHTML = `
    <main
      class="page"
      lang="${
        escapeHtml(
          languageInformation.voice
        )
      }"
    >
      <section
        class="
          card
          wide-card
          theory-reader-card
        "
      >
        <div
          class="
            theory-reader-topbar
          "
        >
          <button
            id="backToTheoryLessonsButton"
            class="back-button"
            type="button"
          >
            ← ${labels.back}
          </button>

          <div
            class="
              theory-reader-topbar-actions
            "
          >
            <label
              class="
                theory-language-selector
              "
            >
              <span
                class="
                  visually-hidden
                "
              >
                Language
              </span>

              <select
                id="theoryLessonLanguageSelect"
                aria-label="Lesson language"
              >
                ${Object.values(
                  READER_LANGUAGES
                )
                  .map(
                    (
                      language
                    ) => `
                      <option
                        value="${
                          language.code
                        }"
                        ${
                          selectedLanguage ===
                          language.code
                            ? "selected"
                            : ""
                        }
                      >
                        ${language.flag}
                        ${language.name}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </label>

            <div
              class="
                theory-reader-counter
              "
            >
              ${labels.lesson}
              ${lessonNumber}
              ${labels.of}
              ${totalLessons}
            </div>
          </div>
        </div>

        <div
          class="
            theory-reader-progress
          "
        >
          <div
            class="
              theory-reader-progress-fill
            "
            style="
              width:
              ${progressPercentage}%;
            "
          ></div>
        </div>

        <article
          id="protectedTheoryContent"
          class="
            theory-reader-content
            protected-theory-content
          "
        >
          <header
            class="
              theory-reader-header
            "
          >
            <p class="eyebrow">
              ${
                escapeHtml(
                  topic.icon || ""
                )
              }

              ${
                escapeHtml(
                  argomento.title || ""
                )
              }

              ·
              ${labels.lesson.toUpperCase()}
              ${lessonNumber}
            </p>

            <h1>
              ${
                escapeHtml(
                  displayedLesson.title ||
                  lesson.title ||
                  ""
                )
              }
            </h1>

            ${
              displayedLesson.subtitle
                ? `
                  <p class="subtitle">
                    ${
                      escapeHtml(
                        displayedLesson
                          .subtitle
                      )
                    }
                  </p>
                `
                : ""
            }

            <div
              class="
                theory-reader-meta
              "
            >
              <span>
                ⏱️
                ${
                  Number(
                    displayedLesson
                      .estimatedMinutes
                  ) ||
                  Number(
                    lesson
                      .estimatedMinutes
                  ) ||
                  0
                }
                ${labels.minutes}
              </span>

              <span>
                📖
                ${
                  escapeHtml(
                    topic.title || ""
                  )
                }
              </span>

              ${
                completed
                  ? `
                    <span
                      class="
                        theory-completed-meta
                      "
                    >
                      ✓
                      ${
                        labels
                          .completedBadge
                      }
                    </span>
                  `
                  : ""
              }
            </div>
          </header>

          ${
            displayedLesson.imageUrl
              ? `
                <figure
                  class="
                    theory-reader-image-wrapper
                  "
                >
                  <img
                    class="
                      theory-reader-image
                    "
                    src="${
                      escapeHtml(
                        displayedLesson
                          .imageUrl
                      )
                    }"
                    alt="${
                      escapeHtml(
                        displayedLesson
                          .imageAlt ||
                        displayedLesson
                          .title ||
                        ""
                      )
                    }"
                    draggable="false"
                    loading="lazy"
                    onerror="
                      this.closest(
                        '.theory-reader-image-wrapper'
                      ).style.display='none';
                    "
                  />

                  <div
                    class="
                      theory-image-protection-layer
                    "
                    aria-hidden="true"
                  ></div>

                  ${
                    displayedLesson
                      .imageCaption
                      ? `
                        <figcaption>
                          ${
                            escapeHtml(
                              displayedLesson
                                .imageCaption
                            )
                          }
                        </figcaption>
                      `
                      : ""
                  }
                </figure>
              `
              : `
                <div
                  class="
                    theory-image-placeholder
                  "
                >
                  <span>🖼️</span>

                  <p>
                    ${
                      labels
                        .imagePlaceholder
                    }
                  </p>

                  <small>
                    ${
                      labels.imageAdmin
                    }
                  </small>
                </div>
              `
          }

          <section
            class="
              theory-audio-player
            "
            aria-label="${
              escapeHtml(
                labels.listenTitle
              )
            }"
          >
            <div
              class="
                theory-audio-player-header
              "
            >
              <span
                class="
                  theory-audio-main-icon
                "
              >
                🔊
              </span>

              <div>
                <strong>
                  ${labels.listenTitle}
                </strong>

                <small>
                  ${
                    labels
                      .listenDescription
                  }
                </small>
              </div>
            </div>

            ${
              isTextToSpeechSupported()
                ? `
                  <div
                    class="
                      theory-audio-actions
                    "
                  >
                  
                  <button
  id="playTheoryAudioButton"
  class="
    btn
    btn-primary
  "
  type="button"
>
  ▶
  ${labels.listen}
</button>


                    <button
                      id="stopTheoryAudioButton"
                      class="
                        btn
                        btn-secondary
                      "
                      type="button"
                    >
                      ⏹
                      ${labels.stop}
                    </button>
                  </div>

                  <p
                    id="theoryAudioStatus"
                    class="
                      theory-audio-status
                    "
                    aria-live="polite"
                  >
                    ${labels.audioReady}
                  </p>
                `
                : `
                  <p
                    class="
                      theory-audio-unavailable
                    "
                  >
                    ${
                      labels
                        .audioUnsupported
                    }
                  </p>
                `
            }
          </section>

          <section
            class="
              theory-reader-body
            "
          >
            ${
              lessonContent
                ? lessonContent
                : `
                  <div
                    class="
                      theory-content-empty
                    "
                  >
                    <span>📘</span>

                    <p>
                      ${
                        labels
                          .emptyContent
                      }
                    </p>
                  </div>
                `
            }
          </section>

          ${
            displayedLesson.magicTrick
              ? `
                <section
                  class="
                    magic-trick-card
                  "
                >
                  <div
                    class="
                      magic-trick-header
                    "
                  >
                    <span>✨</span>

                    <div>
                      <p class="eyebrow">
                        ${
                          labels
                            .magicEyebrow
                        }
                      </p>

                      <h2>
                        ${
                          labels
                            .magicTitle
                        }
                      </h2>
                    </div>
                  </div>

                  <p
                    class="
                      magic-trick-text
                    "
                  >
                    ${
                      escapeHtml(
                        displayedLesson
                          .magicTrick
                      )
                    }
                  </p>
                </section>
              `
              : ""
          }
        </article>

        <section
          class="
            theory-completion-section
          "
        >
          ${
            completed
              ? `
                <div
                  class="
                    theory-completed-message
                  "
                >
                  <span>✅</span>

                  <div>
                    <strong>
                      ${
                        labels
                          .completedTitle
                      }
                    </strong>

                    <p>
                      ${
                        labels
                          .completedText
                      }
                    </p>
                  </div>
                </div>
              `
              : `
                <button
                  id="completeTheoryLessonButton"
                  class="
                    btn
                    btn-primary
                    complete-theory-lesson-button
                  "
                  type="button"
                >
                  ✓
                  ${
                    labels
                      .completeButton
                  }
                </button>
              `
          }
        </section>

        <nav
          class="
            theory-reader-navigation
          "
        >
          <button
            id="previousTheoryLessonButton"
            class="
              btn
              btn-secondary
            "
            type="button"
            ${
              previousLesson
                ? ""
                : "disabled"
            }
          >
            ← ${labels.previous}
          </button>

          <button
            id="nextTheoryLessonButton"
            class="
              btn
              btn-primary
            "
            type="button"
            ${
              nextLesson
                ? ""
                : "disabled"
            }
          >
            ${
              nextLesson
                ? `${labels.next} →`
                : labels.last
            }
          </button>
        </nav>
      </section>
    </main>
  `;

  const languageSelect =
    document.querySelector(
      "#theoryLessonLanguageSelect"
    );

  languageSelect?.addEventListener(
    "change",
    () => {
      const nextLanguage =
        getSafeLanguage(
          languageSelect.value
        );

      stopSpeech();

      savePreferredLessonLanguage(
        nextLanguage
      );

      showTheoryReader(
        app,
        {
          argomento,
          topic,
          lesson,
          lessonNumber,
          totalLessons,
          previousLesson,
          nextLesson,
          completed,
          actions
        }
      );
    }
  );

 const audioStatus =
  document.querySelector(
    "#theoryAudioStatus"
  );

const playAudioButton =
  document.querySelector(
    "#playTheoryAudioButton"
  );

const stopAudioButton =
  document.querySelector(
    "#stopTheoryAudioButton"
  );

function setAudioStatus(
  message
) {
  if (audioStatus) {
    audioStatus.textContent =
      message;
  }
}

playAudioButton?.addEventListener(
  "click",
  () => {
    stopSpeech();

    speakText(
      lessonSpeechText,
      {
        language:
          languageInformation.voice,

        onStart: () => {
          setAudioStatus(
            labels.audioPlaying
          );
        },

        onEnd: () => {
          setAudioStatus(
            labels.audioCompleted
          );
        },

        onError: (
          error
        ) => {
          setAudioStatus(
            error.message ||
            labels.audioUnsupported
          );
        }
      }
    );
  }
);

stopAudioButton?.addEventListener(
  "click",
  () => {
    stopSpeech();

    setAudioStatus(
      labels.audioStopped
    );
  }
);

document
  .querySelector(
    "#backToTheoryLessonsButton"
  )
    ?.addEventListener(
      "click",
      () => {
        stopSpeech();
        actions.onBack();
      }
    );

  document
    .querySelector(
      "#completeTheoryLessonButton"
    )
    ?.addEventListener(
      "click",
      () => {
        actions.onComplete(
          lesson
        );
      }
    );

  const previousButton =
    document.querySelector(
      "#previousTheoryLessonButton"
    );

  if (
    previousButton &&
    previousLesson
  ) {
    previousButton.addEventListener(
      "click",
      () => {
        stopSpeech();

        actions.onPrevious(
          previousLesson
        );
      }
    );
  }

  const nextButton =
    document.querySelector(
      "#nextTheoryLessonButton"
    );

  if (
    nextButton &&
    nextLesson
  ) {
    nextButton.addEventListener(
      "click",
      () => {
        stopSpeech();

        actions.onNext(
          nextLesson
        );
      }
    );
  }

  const protectedContent =
    document.querySelector(
      "#protectedTheoryContent"
    );

  if (!protectedContent) {
    return;
  }

  const preventProtectedAction =
    (event) => {
      event.preventDefault();
    };

  protectedContent.addEventListener(
    "contextmenu",
    preventProtectedAction
  );

  protectedContent.addEventListener(
    "copy",
    preventProtectedAction
  );

  protectedContent.addEventListener(
    "cut",
    preventProtectedAction
  );

  protectedContent.addEventListener(
    "dragstart",
    preventProtectedAction
  );

  protectedContent.addEventListener(
    "selectstart",
    preventProtectedAction
  );

  protectedContent.addEventListener(
    "keydown",
    (event) => {
      const blockedShortcut =
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        [
          "c",
          "x",
          "a",
          "s",
          "u"
        ].includes(
          event.key.toLowerCase()
        );

      if (blockedShortcut) {
        event.preventDefault();
      }
    }
  );
}