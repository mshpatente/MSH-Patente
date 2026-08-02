import {
  closeTapDictionary,
  enableTapDictionary
} from "../utils/tapDictionary.js";

import {
  getPreferredLessonLanguage,
  getTranslatedLesson,
  savePreferredLessonLanguage
} from "../utils/lessonTranslations.js";

import {
  getSpeechState,
  isTextToSpeechSupported,
  pauseSpeech,
  resumeSpeech,
  speakText,
  stopSpeech
} from "../utils/textToSpeech.js";

import {
  getLessonNote,
  getLessonReadingPosition,
  getReaderPreferences,
  isLessonBookmarked,
  isLessonFavourite,
  saveLastOpenedLesson,
  saveLessonNote,
  saveLessonReadingPosition,
  saveReaderPreferences,
  toggleLessonBookmark,
  toggleLessonFavourite
} from "../utils/theoryReaderStorage.js";

const LANGUAGES = {
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

const LABELS = {
  it: {
    back: "Lezioni",
    lesson: "Lezione",
    of: "di",
    minutes: "min",
    summary: "In breve",
    theory: "Spiegazione",
    remember: "Da ricordare",
    warning: "Errore comune",
    correct: "Comportamento corretto",
    listen: "Ascolta",
    pause: "Pausa",
    resume: "Riprendi",
    stop: "Stop",
    audioReady: "Audio pronto",
    audioPlaying: "Lettura in corso...",
    audioPaused: "Audio in pausa",
    audioCompleted: "Lettura completata",
    notes: "I miei appunti",
    notesHint:
      "Scrivi qui appunti personali. Il salvataggio è automatico.",
    saved: "Salvato",
    complete: "Ho completato questa lezione",
    completed: "Lezione completata",
    previous: "Lezione precedente",
    lessonQuiz:"Quiz di questa lezione",
    progressiveQuiz:"Quiz progressivo",
    next: "Lezione successiva",
    last: "Ultima lezione",
    bookmark: "Segnalibro",
    favourite: "Preferita",
    zoom: "Ingrandisci immagine",
    continueReading: "Riprendi dal punto salvato"
  },
  en: {
    back: "Lessons",
    lesson: "Lesson",
    of: "of",
    minutes: "min",
    summary: "Summary",
    theory: "Explanation",
    remember: "Remember",
    warning: "Common mistake",
    correct: "Correct behaviour",
    listen: "Listen",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    audioReady: "Audio ready",
    audioPlaying: "Reading...",
    audioPaused: "Audio paused",
    audioCompleted: "Reading completed",
    notes: "My notes",
    notesHint:
      "Write personal notes here. They are saved automatically.",
    saved: "Saved",
    complete: "I completed this lesson",
    completed: "Lesson completed",
     lessonQuiz:"Quiz for this lesson",
     progressiveQuiz:"Quiz progressivo",
    previous: "Previous lesson",
    next: "Next lesson",
    last: "Last lesson",
    bookmark: "Bookmark",
    favourite: "Favourite",
    zoom: "Zoom image",
    continueReading: "Continue from saved position"
  },
  bn: {
    back: "লেসনসমূহ",
    lesson: "লেসন",
    of: "এর মধ্যে",
    minutes: "মিনিট",
    summary: "সংক্ষেপে",
    theory: "বিস্তারিত ব্যাখ্যা",
    remember: "মনে রাখুন",
    warning: "সাধারণ ভুল",
    correct: "সঠিক আচরণ",
    listen: "শুনুন",
    pause: "বিরতি",
    resume: "আবার শুনুন",
    stop: "বন্ধ করুন",
    audioReady: "অডিও প্রস্তুত",
    audioPlaying: "পড়ে শোনানো হচ্ছে...",
    audioPaused: "অডিও বিরতিতে আছে",
    audioCompleted: "পড়া শেষ হয়েছে",
    notes: "আমার নোট",
    notesHint:
      "এখানে ব্যক্তিগত নোট লিখুন। স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।",
    saved: "সংরক্ষিত",
    complete: "আমি এই লেসন সম্পন্ন করেছি",
    completed: "লেসন সম্পন্ন",
    lessonQuiz:"এই লেসনের কুইজ",
    progressiveQuiz:
"প্রগ্রেসিভ কুইজ",
    previous: "আগের লেসন",
    next: "পরের লেসন",
    last: "শেষ লেসন",
    bookmark: "বুকমার্ক",
    favourite: "প্রিয়",
    zoom: "ছবি বড় করুন",
    continueReading: "সংরক্ষিত স্থান থেকে শুরু করুন"
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

function safeLanguage(language) {
  return LANGUAGES[language]
    ? language
    : "it";
}

function translateSafely(
  lesson,
  language
) {
  try {
    return (
      getTranslatedLesson(
        lesson,
        language
      ) || lesson
    );
  } catch (error) {
    console.error(
      "Theory translation error:",
      error
    );

    return lesson;
  }
}

function renderParagraphs(value) {
  const text = normalizeText(value);

  if (!text) {
    return "";
  }

  return text
    .split(/\n\s*\n/)
    .map(
      (paragraph) => `
        <p class="theory-v2-paragraph">
          ${escapeHtml(paragraph)}
        </p>
      `
    )
    .join("");
}

function renderInformationSection({
  value,
  title,
  icon,
  className = ""
}) {
  if (!normalizeText(value)) {
    return "";
  }

  return `
    <section
      class="
        theory-v2-information
        ${className}
      "
    >
      <div class="theory-v2-information-icon">
        ${icon}
      </div>

      <div>
        <h2>${escapeHtml(title)}</h2>
        ${renderParagraphs(value)}
      </div>
    </section>
  `;
}

function renderLegacyBlock(
  block,
  labels
) {
  if (!block || !block.type) {
    return "";
  }

  if (block.type === "paragraph") {
    return `
      <section class="theory-v2-book-section">
        ${renderParagraphs(block.text)}
      </section>
    `;
  }

  if (block.type === "important") {
    return renderInformationSection({
      value: block.text,
      title:
        block.title || labels.remember,
      icon: "💡",
      className:
        "theory-v2-information-important"
    });
  }

  if (block.type === "warning") {
    return renderInformationSection({
      value: block.text,
      title:
        block.title || labels.warning,
      icon: "⚠️",
      className:
        "theory-v2-information-warning"
    });
  }

  return "";
}

function getSpeechText(lesson) {
  return [
    lesson.title,
    lesson.subtitle,
    lesson.summary,
    lesson.theoryText,
    lesson.remember,
    lesson.commonMistake,
    lesson.correctBehavior,
    ...(Array.isArray(lesson.content)
      ? lesson.content.flatMap(
          (block) => [
            block?.title,
            block?.text
          ]
        )
      : []),
    lesson.magicTrick
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(". ");
}

function createSafeSectionId(
  section,
  index
) {
  return String(
    section?.id ||
    `lesson-section-${index + 1}`
  )
    .trim()
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-"
    );
}

function getYouTubeEmbedUrl(
  value
) {
  const rawUrl =
    normalizeText(value);

  if (!rawUrl) {
    return "";
  }

  try {
    const url =
      new URL(rawUrl);

    let videoId = "";

    if (
      url.hostname.includes(
        "youtu.be"
      )
    ) {
      videoId =
        url.pathname
          .replace(/^\/+/, "")
          .split("/")[0];
    }

    if (
      url.hostname.includes(
        "youtube.com"
      )
    ) {
      if (
        url.pathname.startsWith(
          "/watch"
        )
      ) {
        videoId =
          url.searchParams.get("v") ||
          "";
      } else if (
        url.pathname.startsWith(
          "/shorts/"
        ) ||
        url.pathname.startsWith(
          "/embed/"
        )
      ) {
        videoId =
          url.pathname
            .split("/")
            .filter(Boolean)[1] ||
          "";
      }
    }

    if (!videoId) {
      return "";
    }

    return (
      `https://www.youtube-nocookie.com/embed/` +
      encodeURIComponent(videoId)
    );
  } catch {
    return "";
  }
}

function getReaderSections(
  displayedLesson,
  originalLesson
) {
  const sourceSections =
    Array.isArray(
      displayedLesson?.sections
    ) &&
    displayedLesson.sections.length > 0
      ? displayedLesson.sections
      : Array.isArray(
            originalLesson?.sections
          )
        ? originalLesson.sections
        : [];

  const normalizedSections =
    sourceSections
      .map(
        (section, index) => ({
          id:
            createSafeSectionId(
              section,
              index
            ),

          title:
            normalizeText(
              section?.title
            ),

          description:
            normalizeText(
              section?.description ||
              section?.theoryText
            ),

          imageUrl:
            normalizeText(
              section?.imageUrl
            ),

          imageAlt:
            normalizeText(
              section?.imageAlt ||
              section?.title
            ),

          imageCaption:
            normalizeText(
              section?.imageCaption
            ),

          audioText:
            normalizeText(
              section?.audioText ||
              section?.description
            ),

          audioUrl:
            normalizeText(
              section?.audioUrl
            ),

          youtubeUrl:
            normalizeText(
              section?.youtubeUrl
            ),

          order:
            Number(
              section?.order ||
              index + 1
            )
        })
      )
      .filter(
        (section) =>
          section.title ||
          section.description ||
          section.imageUrl ||
          section.audioUrl ||
          section.youtubeUrl
      )
      .sort(
        (first, second) =>
          first.order -
          second.order
      );

  if (
    normalizedSections.length > 0
  ) {
    return normalizedSections;
  }

  /*
   * পুরোনো lesson-এর জন্য
   * backward compatibility।
   */
  return [
    {
      id: "legacy-lesson-section",

      title:
        normalizeText(
          displayedLesson?.title ||
          originalLesson?.title
        ),

      description:
        normalizeText(
          displayedLesson?.theoryText ||
          originalLesson?.theoryText
        ),

      imageUrl:
        normalizeText(
          displayedLesson?.imageUrl ||
          originalLesson?.imageUrl
        ),

      imageAlt:
        normalizeText(
          displayedLesson?.imageAlt ||
          displayedLesson?.title ||
          originalLesson?.title
        ),

      imageCaption:
        normalizeText(
          displayedLesson
            ?.imageCaption ||
          originalLesson
            ?.imageCaption
        ),

      audioText:
        getSpeechText(
          displayedLesson ||
          originalLesson
        ),

      audioUrl:
        normalizeText(
          displayedLesson?.audioUrl ||
          originalLesson?.audioUrl
        ),

      youtubeUrl:
        normalizeText(
          displayedLesson
            ?.youtubeUrl ||
          originalLesson
            ?.youtubeUrl
        ),

      order: 1
    }
  ];
}

function renderReaderSection(
  section,
  index,
  labels
) {
  const sectionId =
    createSafeSectionId(
      section,
      index
    );

  const youtubeEmbedUrl =
    getYouTubeEmbedUrl(
      section.youtubeUrl
    );

  const hasSpeechText =
    Boolean(
      normalizeText(
        section.audioText ||
        section.description
      )
    );

  return `
    <section
      class="
        theory-v2-lesson-section
      "
      data-reader-section-id="${escapeHtml(
        sectionId
      )}"
    >
      <header
        class="
          theory-v2-lesson-section-header
        "
      >
        <span
          class="
            theory-v2-lesson-section-number
          "
        >
          ${index + 1}
        </span>

        <div>
          <p class="eyebrow">
            SEZIONE ${index + 1}
          </p>

          <h2>
            ${escapeHtml(
              section.title ||
              `${labels.theory} ${
                index + 1
              }`
            )}
          </h2>
        </div>
      </header>

      ${
        section.imageUrl
          ? `
              <figure
                class="
                  theory-v2-section-image
                "
              >
                <button
                  class="
                    theory-v2-image-button
                    theory-v2-section-image-button
                  "
                  data-section-image-url="${escapeHtml(
                    section.imageUrl
                  )}"
                  data-section-image-alt="${escapeHtml(
                    section.imageAlt ||
                    section.title
                  )}"
                  type="button"
                  aria-label="${escapeHtml(
                    labels.zoom
                  )}"
                >
                  <img
                    src="${escapeHtml(
                      section.imageUrl
                    )}"
                    alt="${escapeHtml(
                      section.imageAlt ||
                      section.title
                    )}"
                    loading="lazy"
                  />

                  <span
                    class="
                      theory-v2-image-zoom-label
                    "
                  >
                    🔍 ${labels.zoom}
                  </span>
                </button>

                ${
                  section.imageCaption
                    ? `
                        <figcaption>
                          ${escapeHtml(
                            section.imageCaption
                          )}
                        </figcaption>
                      `
                    : ""
                }
              </figure>
            `
          : ""
      }

      ${
        section.description
          ? `
              <div
                class="
                  theory-v2-section-description
                "
              >
                ${renderParagraphs(
                  section.description
                )}
              </div>
            `
          : ""
      }

      ${
        section.audioUrl ||
        hasSpeechText
          ? `
              <section
                class="
                  theory-v2-audio
                  theory-v2-section-audio
                "
                data-section-audio-container="${escapeHtml(
                  sectionId
                )}"
              >
                <div
                  class="
                    theory-v2-audio-heading
                  "
                >
                  <span>🎧</span>

                  <div>
                    <strong>
                      ${labels.listen}
                    </strong>

                    <small
                      data-section-audio-status="${escapeHtml(
                        sectionId
                      )}"
                    >
                      ${labels.audioReady}
                    </small>
                  </div>
                </div>

                ${
                  section.audioUrl
                    ? `
                        <audio
                          class="
                            theory-v2-section-recorded-audio
                          "
                          data-section-recorded-audio="${escapeHtml(
                            sectionId
                          )}"
                          controls
                          preload="metadata"
                          src="${escapeHtml(
                            section.audioUrl
                          )}"
                        ></audio>
                      `
                    : ""
                }

                ${
                  hasSpeechText &&
                  isTextToSpeechSupported()
                    ? `
                        <div
                          class="
                            theory-v2-audio-actions
                          "
                        >
                          <button
                            class="
                              btn
                              btn-primary
                              theory-v2-section-play
                            "
                            data-section-audio-action="play"
                            data-section-id="${escapeHtml(
                              sectionId
                            )}"
                            data-section-speech-text="${escapeHtml(
                              section.audioText ||
                              section.description
                            )}"
                            type="button"
                          >
                            ▶ ${labels.listen}
                          </button>

                          <button
                            class="
                              btn
                              btn-secondary
                            "
                            data-section-audio-action="pause"
                            data-section-id="${escapeHtml(
                              sectionId
                            )}"
                            type="button"
                          >
                            ⏸ ${labels.pause}
                          </button>

                          <button
                            class="
                              btn
                              btn-secondary
                            "
                            data-section-audio-action="stop"
                            data-section-id="${escapeHtml(
                              sectionId
                            )}"
                            type="button"
                          >
                            ⏹ ${labels.stop}
                          </button>

                          <label
                            class="
                              theory-v2-rate-control
                            "
                          >
                            <span>
                              Velocità
                            </span>

                            <select
                              data-section-speech-rate="${escapeHtml(
                                sectionId
                              )}"
                            >
                              <option value="0.7">
                                0.7×
                              </option>

                              <option value="0.9">
                                0.9×
                              </option>

                              <option value="1">
                                1×
                              </option>

                              <option value="1.2">
                                1.2×
                              </option>

                              <option value="1.4">
                                1.4×
                              </option>
                            </select>
                          </label>
                        </div>
                      `
                    : ""
                }
              </section>
            `
          : ""
      }

      ${
        youtubeEmbedUrl
          ? `
              <section
                class="
                  theory-v2-section-video
                "
              >
                <div
                  class="
                    theory-v2-section-video-heading
                  "
                >
                  <span>▶️</span>

                  <div>
                    <strong>
                      Video della sezione
                    </strong>

                    <small>
                      Contenuto video
                      di approfondimento
                    </small>
                  </div>
                </div>

                <div
                  class="
                    theory-v2-section-video-frame
                  "
                >
                  <iframe
                    src="${escapeHtml(
                      youtubeEmbedUrl
                    )}"
                    title="${escapeHtml(
                      section.title ||
                      "Video lezione"
                    )}"
                    loading="lazy"
                    allow="
                      accelerometer;
                      autoplay;
                      clipboard-write;
                      encrypted-media;
                      gyroscope;
                      picture-in-picture;
                      web-share
                    "
                    allowfullscreen
                  ></iframe>
                </div>
              </section>
            `
          : ""
      }
    </section>
  `;
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
    storageScope = "guest",
    actions
  }
) {
  stopSpeech();
  closeTapDictionary();

  const language =
    safeLanguage(
      getPreferredLessonLanguage()
    );

  const languageInfo =
    LANGUAGES[language];

  const labels =
    LABELS[language] || LABELS.it;

  const displayedLesson =
    translateSafely(
      lesson,
      language
    );

  const preferences =
    getReaderPreferences(
      storageScope
    );

  const lessonId =
    String(lesson.id);

  let bookmarked =
    isLessonBookmarked(
      storageScope,
      lessonId
    );

  let favourite =
    isLessonFavourite(
      storageScope,
      lessonId
    );

  const savedNote =
    getLessonNote(
      storageScope,
      lessonId
    );

  const savedPosition =
    getLessonReadingPosition(
      storageScope,
      lessonId
    );

  saveLastOpenedLesson(
    storageScope,
    {
      lessonId,
      topicId: topic.id,
      argomentoId: argomento.id,
      title: lesson.title
    }
  );

  const legacyContent =
    Array.isArray(
      displayedLesson.content
    )
      ? displayedLesson.content
          .map(
            (block) =>
              renderLegacyBlock(
                block,
                labels
              )
          )
          .join("")
      : "";

  const standardContent = [
    renderInformationSection({
      value: displayedLesson.summary,
      title: labels.summary,
      icon: "📌",
      className:
        "theory-v2-information-summary"
    }),
    renderInformationSection({
      value: displayedLesson.theoryText,
      title: labels.theory,
      icon: "📘",
      className:
        "theory-v2-information-theory"
    }),
    renderInformationSection({
      value: displayedLesson.remember,
      title: labels.remember,
      icon: "💡",
      className:
        "theory-v2-information-important"
    }),
    renderInformationSection({
      value:
        displayedLesson.commonMistake,
      title: labels.warning,
      icon: "⚠️",
      className:
        "theory-v2-information-warning"
    }),
    renderInformationSection({
      value:
        displayedLesson.correctBehavior,
      title: labels.correct,
      icon: "✅",
      className:
        "theory-v2-information-correct"
    })
  ].join("");

  const content =
    standardContent || legacyContent;

 const readerSections =
  getReaderSections(
    displayedLesson,
    lesson
  );

const renderedSections =
  readerSections
    .map(
      (section, index) =>
        renderReaderSection(
          section,
          index,
          labels
        )
    )
    .join("");

  app.innerHTML = `
    <main
      class="
        page
        theory-v2-page
        theory-v2-theme-${preferences.theme}
        theory-v2-font-${preferences.fontSize}
      "
      lang="${escapeHtml(
        languageInfo.voice
      )}"
    >
      <div
        id="theoryReadingProgress"
        class="theory-v2-reading-progress"
      >
        <div
          id="theoryReadingProgressFill"
          class="theory-v2-reading-progress-fill"
          style="width: ${savedPosition}%"
        ></div>
      </div>

      <section
        class="
          card
          wide-card
          theory-v2-reader-card
        "
      >
        <header class="theory-v2-toolbar">
          <button
            id="backToTheoryLessonsButton"
            class="back-button"
            type="button"
          >
            ← ${labels.back}
          </button>

          <div class="theory-v2-toolbar-actions">
            <label class="theory-v2-select">
              <span class="visually-hidden">
                Language
              </span>

              <select
                id="theoryLessonLanguageSelect"
                aria-label="Lesson language"
              >
                ${Object.values(
                  LANGUAGES
                )
                  .map(
                    (item) => `
                      <option
                        value="${item.code}"
                        ${
                          item.code === language
                            ? "selected"
                            : ""
                        }
                      >
                        ${item.flag} ${item.name}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </label>

            <button
              id="bookmarkTheoryLessonButton"
              class="
                theory-v2-icon-button
                ${
                  bookmarked
                    ? "theory-v2-icon-button-active"
                    : ""
                }
              "
              type="button"
              aria-pressed="${bookmarked}"
              title="${labels.bookmark}"
            >
              ${bookmarked ? "🔖" : "⭐"}
            </button>

            <button
              id="favouriteTheoryLessonButton"
              class="
                theory-v2-icon-button
                ${
                  favourite
                    ? "theory-v2-icon-button-active"
                    : ""
                }
              "
              type="button"
              aria-pressed="${favourite}"
              title="${labels.favourite}"
            >
              ${favourite ? "❤️" : "🤍"}
            </button>
          </div>
        </header>

        <section class="theory-v2-controls">
          <div class="theory-v2-control-group">
            <span>🌙</span>

            <button
              class="theory-v2-control-button"
              data-reader-theme="light"
              type="button"
            >
              Light
            </button>

            <button
              class="theory-v2-control-button"
              data-reader-theme="sepia"
              type="button"
            >
              Sepia
            </button>

            <button
              class="theory-v2-control-button"
              data-reader-theme="dark"
              type="button"
            >
              Dark
            </button>
          </div>

          <div class="theory-v2-control-group">
            <span>📏</span>

            <button
              class="theory-v2-control-button"
              data-reader-font="small"
              type="button"
            >
              A-
            </button>

            <button
              class="theory-v2-control-button"
              data-reader-font="medium"
              type="button"
            >
              A
            </button>

            <button
              class="theory-v2-control-button"
              data-reader-font="large"
              type="button"
            >
              A+
            </button>
          </div>
        </section>

        ${
          savedPosition >= 8 &&
          savedPosition < 95
            ? `
              <button
                id="continueReadingButton"
                class="
                  btn
                  btn-secondary
                  theory-v2-continue-button
                "
                type="button"
              >
                🔖 ${labels.continueReading}
                (${savedPosition}%)
              </button>
            `
            : ""
        }

        <article
          id="theoryReaderArticle"
          class="theory-v2-book"
        >
          <header class="theory-v2-book-header">
            <p class="eyebrow">
              ${escapeHtml(
                topic.icon || "📖"
              )}
              ${escapeHtml(
                argomento.title || ""
              )}
            </p>

            <h1>
              ${escapeHtml(
                displayedLesson.title ||
                lesson.title ||
                ""
              )}
            </h1>

            ${
              displayedLesson.subtitle
                ? `
                  <p class="subtitle">
                    ${escapeHtml(
                      displayedLesson.subtitle
                    )}
                  </p>
                `
                : ""
            }

            <div class="theory-v2-meta">
              <span>
                📖 ${labels.lesson}
                ${lessonNumber}
                ${labels.of}
                ${totalLessons}
              </span>

              <span>
                ⏱️ ${
                  Number(
                    displayedLesson
                      .estimatedMinutes
                  ) ||
                  Number(
                    lesson.estimatedMinutes
                  ) ||
                  0
                } ${labels.minutes}
              </span>

              ${
                completed
                  ? `
                    <span
                      class="theory-v2-completed-badge"
                    >
                      ✅ ${labels.completed}
                    </span>
                  `
                  : ""
              }
            </div>
          </header>

          ${
            language === "it"
              ? `
                <div class="tap-dictionary-hint">
                  <span aria-hidden="true">👆</span>

                  <p>
                    Tocca una parola italiana
                    per vedere il significato
                    in বাংলা.
                  </p>
                </div>
              `
              : ""
          }

          <section class="theory-v2-sections-list">
            ${
              renderedSections ||
              `
                <div class="theory-v2-empty">
                  📘

                  <p>
                    Contenuto in preparazione.
                  </p>
                </div>
              `
            }
          </section>

          ${
            displayedLesson.magicTrick
              ? `
                <section class="theory-v2-magic">
                  <span>✨</span>

                  <div>
                    <p class="eyebrow">
                      TRUCCO MAGICO
                    </p>

                    <h2>Ricorda così</h2>

                    <p>
                      ${escapeHtml(
                        displayedLesson.magicTrick
                      )}
                    </p>
                  </div>
                </section>
              `
              : ""
          }

          <section class="theory-v2-notes">
            <div class="theory-v2-notes-header">
              <div>
                <p class="eyebrow">
                  📝 ${labels.notes}
                </p>

                <h2>${labels.notes}</h2>
              </div>

              <span
                id="theoryNoteStatus"
                class="theory-v2-note-status"
              >
                ${labels.saved}
              </span>
            </div>

            <textarea
              id="theoryLessonNote"
              rows="7"
              placeholder="${escapeHtml(
                labels.notesHint
              )}"
            >${escapeHtml(savedNote)}</textarea>
          </section>
        </article>

        <section class="theory-v2-completion">
          ${
            completed
              ? `
                <div class="theory-v2-completed-message">
                  ✅ ${labels.completed}
                </div>
              `
              : `
                <button
                  id="completeTheoryLessonButton"
                  class="
                    btn
                    btn-primary
                    full-width
                  "
                  type="button"
                >
                  ✅ ${labels.complete}
                </button>
              `
          }
        </section>

        <section
          class="
            theory-v2-lesson-quiz
          "
        >
          <button
            id="startTheoryLessonQuizButton"
            class="
              btn
              btn-secondary
              full-width
            "
            type="button"
          >
            🧠 ${labels.lessonQuiz}
          </button>
        </section>

<section
  class="
    theory-v2-progressive-quiz
  "
>
  <button
    id="startTheoryProgressiveQuizButton"
    class="
      btn
      btn-primary
      full-width
    "
    type="button"
  >
    📈 ${labels.progressiveQuiz}
  </button>

  <small
    class="
      theory-v2-progressive-hint
    "
  >
    Include le domande delle lezioni completate.
  </small>
</section>

        <nav class="theory-v2-navigation">
          <button
            id="previousTheoryLessonButton"
            class="btn btn-secondary"
            type="button"
            ${previousLesson ? "" : "disabled"}
          >
            ← ${labels.previous}
          </button>

          <button
            id="nextTheoryLessonButton"
            class="btn btn-primary"
            type="button"
            ${nextLesson ? "" : "disabled"}
          >
            ${
              nextLesson
                ? `${labels.next} →`
                : labels.last
            }
          </button>
        </nav>
      </section>

      <dialog
  id="theorySectionImageDialog"
  class="theory-v2-image-dialog"
>
  <button
    id="closeTheorySectionImageDialog"
    class="theory-v2-dialog-close"
    type="button"
    aria-label="Close"
  >
    ✕
  </button>

  <img
    id="theorySectionDialogImage"
    src=""
    alt=""
  />
</dialog>
    </main>
  `;

  const page =
    app.querySelector(
      ".theory-v2-page"
    );

  const article =
    app.querySelector(
      "#theoryReaderArticle"
    );

  const disableTapDictionary =
    language === "it"
      ? enableTapDictionary(article)
      : () => {};

  const progressFill =
    app.querySelector(
      "#theoryReadingProgressFill"
    );

  function applyReaderPreferences(
    nextPreferences
  ) {
    const current =
      getReaderPreferences(
        storageScope
      );

    const merged = {
      ...current,
      ...nextPreferences
    };

    page.className = `
      page
      theory-v2-page
      theory-v2-theme-${merged.theme}
      theory-v2-font-${merged.fontSize}
    `.trim();

    saveReaderPreferences(
      storageScope,
      merged
    );
  }

  app
    .querySelectorAll(
      "[data-reader-theme]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          applyReaderPreferences({
            theme:
              button.dataset.readerTheme
          });
        }
      );
    });

  app
    .querySelectorAll(
      "[data-reader-font]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          applyReaderPreferences({
            fontSize:
              button.dataset.readerFont
          });
        }
      );
    });

  app
    .querySelector(
      "#bookmarkTheoryLessonButton"
    )
    ?.addEventListener(
      "click",
      (event) => {
        bookmarked =
          toggleLessonBookmark(
            storageScope,
            lessonId
          );

        event.currentTarget
          .classList.toggle(
            "theory-v2-icon-button-active",
            bookmarked
          );

        event.currentTarget
          .setAttribute(
            "aria-pressed",
            String(bookmarked)
          );

        event.currentTarget.textContent =
          bookmarked ? "🔖" : "⭐";
      }
    );

  app
    .querySelector(
      "#favouriteTheoryLessonButton"
    )
    ?.addEventListener(
      "click",
      (event) => {
        favourite =
          toggleLessonFavourite(
            storageScope,
            lessonId
          );

        event.currentTarget
          .classList.toggle(
            "theory-v2-icon-button-active",
            favourite
          );

        event.currentTarget
          .setAttribute(
            "aria-pressed",
            String(favourite)
          );

        event.currentTarget.textContent =
          favourite ? "❤️" : "🤍";
      }
    );

  const noteInput =
    app.querySelector(
      "#theoryLessonNote"
    );

  const noteStatus =
    app.querySelector(
      "#theoryNoteStatus"
    );

  let noteTimer = null;

  noteInput?.addEventListener(
    "input",
    () => {
      if (noteStatus) {
        noteStatus.textContent = "…";
      }

      window.clearTimeout(noteTimer);

      noteTimer = window.setTimeout(
        () => {
          saveLessonNote(
            storageScope,
            lessonId,
            noteInput.value
          );

          if (noteStatus) {
            noteStatus.textContent =
              labels.saved;
          }
        },
        450
      );
    }
  );

  const languageSelect =
    app.querySelector(
      "#theoryLessonLanguageSelect"
    );

  languageSelect?.addEventListener(
    "change",
    () => {
      cleanup();

      savePreferredLessonLanguage(
        safeLanguage(
          languageSelect.value
        )
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
          storageScope,
          actions
        }
      );
    }
  );

  let activeSpeechSectionId = "";

function getSectionAudioStatus(
  sectionId
) {
  return app.querySelector(
    `[data-section-audio-status="${CSS.escape(
      sectionId
    )}"]`
  );
}

function resetSectionAudioStatuses(
  exceptSectionId = ""
) {
  app
    .querySelectorAll(
      "[data-section-audio-status]"
    )
    .forEach((status) => {
      const sectionId =
        status.dataset
          .sectionAudioStatus;

      if (
        sectionId !==
        exceptSectionId
      ) {
        status.textContent =
          labels.audioReady;
      }
    });
}

function stopAllRecordedAudio(
  exceptSectionId = ""
) {
  app
    .querySelectorAll(
      ".theory-v2-section-recorded-audio"
    )
    .forEach((audio) => {
      const sectionId =
        audio.dataset
          .sectionRecordedAudio;

      if (
        sectionId !==
        exceptSectionId
      ) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
}

function clearActiveAudioSections(
  exceptSectionId = ""
) {
  app
    .querySelectorAll(
      ".theory-v2-section-audio"
    )
    .forEach((container) => {
      const sectionId =
        container.dataset
          .sectionAudioContainer;

      container.classList.toggle(
        "theory-v2-section-audio-active",
        sectionId ===
          exceptSectionId
      );
    });
}

app
  .querySelectorAll(
    "[data-section-speech-rate]"
  )
  .forEach((select) => {
    select.value =
      String(
        preferences.speechRate
      );

    select.addEventListener(
      "change",
      () => {
        saveReaderPreferences(
          storageScope,
          {
            speechRate:
              Number(
                select.value
              )
          }
        );
      }
    );
  });

app
  .querySelectorAll(
    '[data-section-audio-action="play"]'
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const sectionId =
          button.dataset.sectionId;

        const speechText =
          button.dataset
            .sectionSpeechText ||
          "";

        const status =
          getSectionAudioStatus(
            sectionId
          );

        const rateSelect =
          app.querySelector(
            `[data-section-speech-rate="${CSS.escape(
              sectionId
            )}"]`
          );

        if (
          getSpeechState() ===
            "paused" &&
          activeSpeechSectionId ===
            sectionId
        ) {
          resumeSpeech();

          if (status) {
            status.textContent =
              labels.audioPlaying;
          }

          clearActiveAudioSections(
            sectionId
          );

          return;
        }

        stopSpeech();
        stopAllRecordedAudio();
        resetSectionAudioStatuses(
          sectionId
        );

        activeSpeechSectionId =
          sectionId;

        clearActiveAudioSections(
          sectionId
        );

        speakText(
          speechText,
          {
            language:
              languageInfo.voice,

            rate:
              Number(
                rateSelect?.value
              ) ||
              preferences.speechRate,

            onStart: () => {
              if (status) {
                status.textContent =
                  labels.audioPlaying;
              }
            },

            onPause: () => {
              if (status) {
                status.textContent =
                  labels.audioPaused;
              }
            },

            onResume: () => {
              if (status) {
                status.textContent =
                  labels.audioPlaying;
              }
            },

            onEnd: () => {
              if (status) {
                status.textContent =
                  labels.audioCompleted;
              }

              activeSpeechSectionId =
                "";

              clearActiveAudioSections();
            },

            onError: (error) => {
              if (status) {
                status.textContent =
                  error.message ||
                  labels.audioReady;
              }

              activeSpeechSectionId =
                "";

              clearActiveAudioSections();
            }
          }
        );
      }
    );
  });

app
  .querySelectorAll(
    '[data-section-audio-action="pause"]'
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const sectionId =
          button.dataset.sectionId;

        if (
          activeSpeechSectionId !==
          sectionId
        ) {
          return;
        }

        if (pauseSpeech()) {
          const status =
            getSectionAudioStatus(
              sectionId
            );

          if (status) {
            status.textContent =
              labels.audioPaused;
          }
        }
      }
    );
  });

app
  .querySelectorAll(
    '[data-section-audio-action="stop"]'
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const sectionId =
          button.dataset.sectionId;

        stopSpeech();

        activeSpeechSectionId =
          "";

        const status =
          getSectionAudioStatus(
            sectionId
          );

        if (status) {
          status.textContent =
            labels.audioReady;
        }

        clearActiveAudioSections();
      }
    );
  });

app
  .querySelectorAll(
    ".theory-v2-section-recorded-audio"
  )
  .forEach((audio) => {
    const sectionId =
      audio.dataset
        .sectionRecordedAudio;

    audio.addEventListener(
      "play",
      () => {
        stopSpeech();

        activeSpeechSectionId =
          "";

        stopAllRecordedAudio(
          sectionId
        );

        resetSectionAudioStatuses(
          sectionId
        );

        clearActiveAudioSections(
          sectionId
        );

        const status =
          getSectionAudioStatus(
            sectionId
          );

        if (status) {
          status.textContent =
            labels.audioPlaying;
        }
      }
    );

    audio.addEventListener(
      "pause",
      () => {
        if (audio.ended) {
          return;
        }

        const status =
          getSectionAudioStatus(
            sectionId
          );

        if (status) {
          status.textContent =
            labels.audioPaused;
        }
      }
    );

    audio.addEventListener(
      "ended",
      () => {
        const status =
          getSectionAudioStatus(
            sectionId
          );

        if (status) {
          status.textContent =
            labels.audioCompleted;
        }

        clearActiveAudioSections();
      }
    );
  });

const sectionImageDialog =
  app.querySelector(
    "#theorySectionImageDialog"
  );

const sectionDialogImage =
  app.querySelector(
    "#theorySectionDialogImage"
  );

app
  .querySelectorAll(
    ".theory-v2-section-image-button"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        if (!sectionDialogImage) {
          return;
        }

        sectionDialogImage.src =
          button.dataset
            .sectionImageUrl ||
          "";

        sectionDialogImage.alt =
          button.dataset
            .sectionImageAlt ||
          "";

        if (
          typeof sectionImageDialog
            ?.showModal ===
          "function"
        ) {
          sectionImageDialog
            .showModal();
        } else {
          sectionImageDialog
            ?.setAttribute(
              "open",
              ""
            );
        }
      }
    );
  });

app
  .querySelector(
    "#closeTheorySectionImageDialog"
  )
  ?.addEventListener(
    "click",
    () => {
      sectionImageDialog
        ?.close?.();
    }
  );

sectionImageDialog
  ?.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        sectionImageDialog
      ) {
        sectionImageDialog
          .close?.();
      }
    }
  );

  function updateReadingProgress() {
    if (!article) {
      return;
    }

    const articleRect =
      article.getBoundingClientRect();

    const articleTop =
      window.scrollY +
      articleRect.top;

    const articleHeight =
      Math.max(
        1,
        article.offsetHeight -
        window.innerHeight * 0.55
      );

    const travelled =
      window.scrollY - articleTop +
      window.innerHeight * 0.25;

    const percentage =
      Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (
              travelled /
              articleHeight
            ) * 100
          )
        )
      );

    if (progressFill) {
      progressFill.style.width =
        `${percentage}%`;
    }

    saveLessonReadingPosition(
      storageScope,
      lessonId,
      percentage
    );
  }

  let scrollFrame = null;

  const onScroll = () => {
    if (scrollFrame) {
      return;
    }

    scrollFrame =
      window.requestAnimationFrame(
        () => {
          scrollFrame = null;
          updateReadingProgress();
        }
      );
  };

  window.addEventListener(
    "scroll",
    onScroll,
    {
      passive: true
    }
  );

  app
    .querySelector(
      "#continueReadingButton"
    )
    ?.addEventListener(
      "click",
      () => {
        if (!article) {
          return;
        }

        const target =
          article.offsetTop +
          (
            article.offsetHeight *
            savedPosition
          ) /
          100 -
          90;

        window.scrollTo({
          top: Math.max(0, target),
          behavior: "smooth"
        });
      }
    );

  const cleanup = () => {
    disableTapDictionary();
    closeTapDictionary();
    stopSpeech();
    window.removeEventListener(
      "scroll",
      onScroll
    );
    window.clearTimeout(noteTimer);
  };

  app
    .querySelector(
      "#backToTheoryLessonsButton"
    )
    ?.addEventListener(
      "click",
      () => {
        cleanup();
        actions.onBack();
      }
    );

  app
    .querySelector(
      "#completeTheoryLessonButton"
    )
    ?.addEventListener(
      "click",
      () => {
        cleanup();
        actions.onComplete(lesson);
      }
    );

    app
  .querySelector(
    "#startTheoryLessonQuizButton"
  )
  ?.addEventListener(
    "click",
    () => {
      cleanup();

      if (
        typeof actions?.onStartQuiz ===
        "function"
      ) {
        actions.onStartQuiz(
          lesson
        );
      }
    }
  );

app
  .querySelector(
    "#startTheoryProgressiveQuizButton"
  )
  ?.addEventListener(
    "click",
    () => {
      cleanup();

      if (
        typeof actions
          ?.onStartProgressiveQuiz ===
        "function"
      ) {
        actions
          .onStartProgressiveQuiz();
      }
    }
  );

  if (previousLesson) {
    app
      .querySelector(
        "#previousTheoryLessonButton"
      )
      ?.addEventListener(
        "click",
        () => {
          cleanup();
          actions.onPrevious(
            previousLesson
          );
        }
      );
  }

  if (nextLesson) {
    app
      .querySelector(
        "#nextTheoryLessonButton"
      )
      ?.addEventListener(
        "click",
        () => {
          cleanup();
          actions.onNext(
            nextLesson
          );
        }
      );
  }

  window.setTimeout(
    updateReadingProgress,
    50
  );
}
