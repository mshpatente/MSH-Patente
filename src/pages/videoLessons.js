import {
  loadVideoProgress,
  markVideoCompleted
} from "../services/videoProgressService.js";

import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

import {
  createYouTubeEmbedUrl,
  loadPublishedTheoryVideos
} from "../services/videoService.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getArgomentoById(
  argomentoId
) {
  return argomenti.find(
    (argomento) =>
      String(argomento.id) ===
      String(argomentoId)
  );
}

function getTopicById(topicId) {
  return topics.find(
    (topic) =>
      String(topic.id) ===
      String(topicId)
  );
}

function sortByOrder(
  first,
  second
) {
  return (
    Number(first?.order || 0) -
    Number(second?.order || 0)
  );
}

export async function showVideoLessons({
  container,
  user,
  initialArgomentoId = "",
  initialTopicId = "",
  onBack
}) {
  if (!container) {
    throw new Error(
      "Container video lezioni non disponibile."
    );
  }

  const state = {
  videos: [],

  videoProgressMap:
  new Map(),

  selectedArgomentoId:
    String(
      initialArgomentoId || ""
    ),

  selectedTopicId:
    String(
      initialTopicId || ""
    ),

  selectedVideoId: "",
  searchText: "",
  loading: true,
 error: null,
savingProgress: false
};

  function getAvailableArgomenti() {
    const availableIds =
      new Set(
        state.videos.map(
          (video) =>
            String(
              video.argomentoId
            )
        )
      );

    return [...argomenti]
      .filter(
        (argomento) =>
          availableIds.has(
            String(argomento.id)
          )
      )
      .sort(sortByOrder);
  }

  function getAvailableTopics() {
    if (
      !state.selectedArgomentoId
    ) {
      return [];
    }

    const availableTopicIds =
      new Set(
        state.videos
          .filter(
            (video) =>
              String(
                video.argomentoId
              ) ===
              String(
                state.selectedArgomentoId
              )
          )
          .map(
            (video) =>
              String(video.topicId)
          )
      );

    return [...topics]
      .filter(
        (topic) =>
          String(
            topic.argomentoId
          ) ===
            String(
              state.selectedArgomentoId
            ) &&
          availableTopicIds.has(
            String(topic.id)
          )
      )
      .sort(sortByOrder);
  }

  function getVisibleVideos() {
    let visibleVideos =
      [...state.videos];

    if (
      state.selectedArgomentoId
    ) {
      visibleVideos =
        visibleVideos.filter(
          (video) =>
            String(
              video.argomentoId
            ) ===
            String(
              state.selectedArgomentoId
            )
        );
    }

    if (state.selectedTopicId) {
      visibleVideos =
        visibleVideos.filter(
          (video) =>
            String(video.topicId) ===
            String(
              state.selectedTopicId
            )
        );
    }

    const searchText =
      state.searchText
        .trim()
        .toLowerCase();

    if (searchText) {
      visibleVideos =
        visibleVideos.filter(
          (video) => {
            const topic =
              getTopicById(
                video.topicId
              );

            const argomento =
              getArgomentoById(
                video.argomentoId
              );

            const searchableText = [
              video.title,
              video.description,
              topic?.title,
              argomento?.title
            ]
              .join(" ")
              .toLowerCase();

            return searchableText
              .includes(searchText);
          }
        );
    }

    return visibleVideos.sort(
      (first, second) => {
        if (
          first.argomentoId !==
          second.argomentoId
        ) {
          return String(
            first.argomentoId
          ).localeCompare(
            String(
              second.argomentoId
            )
          );
        }

        if (
          first.topicId !==
          second.topicId
        ) {
          return String(
            first.topicId
          ).localeCompare(
            String(
              second.topicId
            )
          );
        }

        return sortByOrder(
          first,
          second
        );
      }
    );
  }

  function getSelectedVideo() {
    const visibleVideos =
      getVisibleVideos();

    if (
      state.selectedVideoId
    ) {
      const selectedVideo =
        visibleVideos.find(
          (video) =>
            String(video.id) ===
            String(
              state.selectedVideoId
            )
        );

      if (selectedVideo) {
        return selectedVideo;
      }
    }

    return visibleVideos[0] || null;
  }

  function getVideoProgress(
  videoId
) {
  return (
    state.videoProgressMap.get(
      String(videoId)
    ) || null
  );
}

function isVideoCompleted(
  videoId
) {
  return (
    getVideoProgress(
      videoId
    )?.completed === true
  );
}

function getCompletedVideoCount() {
  return state.videos.filter(
    (video) =>
      isVideoCompleted(
        video.id
      )
  ).length;
}

  function renderLoading() {
    container.innerHTML = `
      <main class="page">
        <section class="card loading-card">
          <div class="loading-spinner"></div>

          <p>
            Caricamento delle video lezioni...
          </p>
        </section>
      </main>
    `;
  }

  function renderError() {
    container.innerHTML = `
      <main class="page">
        <section class="card">
          <button
            id="videoLessonsErrorBack"
            class="back-button"
            type="button"
          >
            ← Dashboard
          </button>

          <p class="eyebrow">
            VIDEO LEZIONI
          </p>

          <h1>
            Impossibile caricare i video
          </h1>

          <p class="subtitle">
            Si è verificato un errore durante
            il caricamento delle video lezioni.
          </p>

          <button
            id="videoLessonsRetry"
            class="btn btn-primary"
            type="button"
          >
            Riprova
          </button>
        </section>
      </main>
    `;

    document
      .querySelector(
        "#videoLessonsErrorBack"
      )
      ?.addEventListener(
        "click",
        onBack
      );

    document
      .querySelector(
        "#videoLessonsRetry"
      )
      ?.addEventListener(
        "click",
        loadVideos
      );
  }

  function renderEmpty() {
    container.innerHTML = `
      <main class="page">
        <section
          class="
            card
            wide-card
            video-lessons-empty
          "
        >
          <button
            id="videoLessonsEmptyBack"
            class="back-button"
            type="button"
          >
            ← Dashboard
          </button>

          <div class="video-lessons-empty-icon">
            🎬
          </div>

          <p class="eyebrow">
            VIDEO LEZIONI
          </p>

          <h1>
            Nessun video disponibile
          </h1>

          <p class="subtitle">
            Le video spiegazioni pubblicate
            appariranno in questa sezione.
          </p>
        </section>
      </main>
    `;

    document
      .querySelector(
        "#videoLessonsEmptyBack"
      )
      ?.addEventListener(
        "click",
        onBack
      );
  }

  function renderArgomentoCards() {
    const availableArgomenti =
      getAvailableArgomenti();

    return availableArgomenti
      .map((argomento) => {
        const videoCount =
          state.videos.filter(
            (video) =>
              String(
                video.argomentoId
              ) ===
              String(argomento.id)
          ).length;

        const active =
          String(
            state.selectedArgomentoId
          ) ===
          String(argomento.id);

        return `
          <button
            class="
              video-argomento-card
              ${
                active
                  ? "is-active"
                  : ""
              }
            "
            data-video-argomento-id="${escapeHtml(
              argomento.id
            )}"
            style="
              --video-accent:
              ${escapeHtml(
                argomento.color ||
                "#2563eb"
              )};
            "
            type="button"
          >
            <span
              class="
                video-argomento-icon
              "
            >
              ${escapeHtml(
                argomento.icon ||
                "📘"
              )}
            </span>

            <span
              class="
                video-argomento-content
              "
            >
              <strong>
                ${escapeHtml(
                  argomento.title
                )}
              </strong>

              <small>
                ${videoCount}
                ${
                  videoCount === 1
                    ? "video"
                    : "video"
                }
              </small>
            </span>
          </button>
        `;
      })
      .join("");
  }

  function renderTopicButtons() {
    const availableTopics =
      getAvailableTopics();

    if (
      !state.selectedArgomentoId
    ) {
      return `
        <p class="video-topic-placeholder">
          Seleziona un argomento per vedere
          i topic disponibili.
        </p>
      `;
    }

    if (
      availableTopics.length === 0
    ) {
      return `
        <p class="video-topic-placeholder">
          Nessun topic video disponibile.
        </p>
      `;
    }

    return availableTopics
      .map((topic) => {
        const videoCount =
          state.videos.filter(
            (video) =>
              String(
                video.argomentoId
              ) ===
                String(
                  state.selectedArgomentoId
                ) &&
              String(
                video.topicId
              ) ===
                String(topic.id)
          ).length;

        const active =
          String(
            state.selectedTopicId
          ) ===
          String(topic.id);

        return `
          <button
            class="
              video-topic-filter
              ${
                active
                  ? "is-active"
                  : ""
              }
            "
            data-video-topic-id="${escapeHtml(
              topic.id
            )}"
            type="button"
          >
            <span>
              ${escapeHtml(
                topic.icon || "📖"
              )}
            </span>

            <strong>
              ${escapeHtml(
                topic.title
              )}
            </strong>

            <small>
              ${videoCount}
            </small>
          </button>
        `;
      })
      .join("");
  }

  function renderVideoList() {
    const videos =
      getVisibleVideos();

    if (videos.length === 0) {
      return `
        <div class="video-lessons-no-results">
          <span>🔍</span>

          <strong>
            Nessun video trovato
          </strong>

          <p>
            Prova a modificare la ricerca
            o i filtri selezionati.
          </p>
        </div>
      `;
    }

    const selectedVideo =
      getSelectedVideo();

    return videos
      .map((video, index) => {
        const topic =
          getTopicById(
            video.topicId
          );

          const completed =
  isVideoCompleted(
    video.id
  );

        const selected =
          String(video.id) ===
          String(
            selectedVideo?.id
          );

        return `
          <button
           class="
  video-lesson-list-item
  ${
    selected
      ? "is-active"
      : ""
  }
  ${
    completed
      ? "is-completed"
      : ""
  }
"
            data-video-id="${escapeHtml(
              video.id
            )}"
            type="button"
          >
            <div
              class="
                video-lesson-thumbnail
              "
            >
              <img
                src="${escapeHtml(
                  video.thumbnailUrl
                )}"
                alt="${escapeHtml(
                  video.title
                )}"
                loading="lazy"
              />

              ${
  completed
    ? `
      <span
        class="
          video-completed-badge
        "
      >
        ✅ Video completato
      </span>
    `
    : ""
}

              <span
                class="
                  video-lesson-play-icon
                "
              >
                ▶
              </span>
            </div>

            <div
              class="
                video-lesson-list-content
              "
            >
              <small>
                Video ${index + 1}
              </small>

              <strong>
                ${escapeHtml(
                  video.title
                )}
              </strong>

              <span>
                ${escapeHtml(
                  topic?.title ||
                  "Topic"
                )}

                ${
                  video.durationMinutes > 0
                    ? ` · ${video.durationMinutes} min`
                    : ""
                }
              </span>
            </div>
          </button>
        `;
      })
      .join("");
  }

  function renderPlayer() {
    const selectedVideo =
      getSelectedVideo();

    if (!selectedVideo) {
      return `
        <div class="video-player-empty">
          <span>🎬</span>

          <h2>
            Seleziona un video
          </h2>

          <p>
            Scegli una video lezione
            dall'elenco.
          </p>
        </div>
      `;
    }

    const completed =
  isVideoCompleted(
    selectedVideo.id
  );

    const embedUrl =
      selectedVideo.embedUrl ||
      createYouTubeEmbedUrl(
        selectedVideo.youtubeVideoId
      );

    const topic =
      getTopicById(
        selectedVideo.topicId
      );

    const argomento =
      getArgomentoById(
        selectedVideo.argomentoId
      );

    const visibleVideos =
      getVisibleVideos();

    const currentIndex =
      visibleVideos.findIndex(
        (video) =>
          String(video.id) ===
          String(selectedVideo.id)
      );

    const previousVideo =
      currentIndex > 0
        ? visibleVideos[
            currentIndex - 1
          ]
        : null;

    const nextVideo =
      currentIndex >= 0 &&
      currentIndex <
        visibleVideos.length - 1
        ? visibleVideos[
            currentIndex + 1
          ]
        : null;

    return `
      <article class="video-player-card">
        <div class="video-player-frame">
          <iframe
            src="${escapeHtml(
              embedUrl
            )}"
            title="${escapeHtml(
              selectedVideo.title
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
            referrerpolicy="
              strict-origin-when-cross-origin
            "
            allowfullscreen
          ></iframe>
        </div>

        <div class="video-player-body">
          <div class="video-player-meta">
            <span>
              ${escapeHtml(
                argomento?.icon ||
                "📘"
              )}
              ${escapeHtml(
                argomento?.title ||
                "Argomento"
              )}
            </span>

            <span>
              ${escapeHtml(
                topic?.icon ||
                "📖"
              )}
              ${escapeHtml(
                topic?.title ||
                "Topic"
              )}
            </span>

            ${
              selectedVideo
                .durationMinutes > 0
                ? `
                  <span>
                    ⏱
                    ${
                      selectedVideo
                        .durationMinutes
                    }
                    min
                  </span>
                `
                : ""
            }
          </div>

          <h2>
            ${escapeHtml(
              selectedVideo.title
            )}
          </h2>

          ${
            selectedVideo.description
              ? `
                <p>
                  ${escapeHtml(
                    selectedVideo
                      .description
                  )}
                </p>
              `
              : ""
          }

          <div
  class="
    video-player-progress-panel
    ${
      completed
        ? "is-completed"
        : ""
    }
  "
>
  <div>
    <span>
      ${
        completed
          ? "✅"
          : "🎯"
      }
    </span>

    <div>
      <strong>
        ${
          completed
            ? "Video completato"
            : "Hai terminato il video?"
        }
      </strong>

      <p>
        ${
          completed
            ? "Questo video è stato aggiunto ai tuoi progressi."
            : "Segnalo come completato per aggiornare il tuo percorso."
        }
      </p>
    </div>
  </div>

  <button
    id="markVideoCompletedButton"
    class="
      btn
      ${
        completed
          ? "btn-secondary"
          : "btn-primary"
      }
    "
    type="button"
    ${
      completed
        ? "disabled"
        : ""
    }
  >
    ${
      completed
        ? "✓ Completato"
        : "Segna come completato"
    }
  </button>
</div>

          <div class="video-player-actions">
            <button
              id="previousVideoButton"
              class="btn btn-secondary"
              type="button"
              ${
                previousVideo
                  ? ""
                  : "disabled"
              }
            >
              ← Video precedente
            </button>

            <a
              class="btn btn-secondary"
              href="${escapeHtml(
                selectedVideo
                  .youtubeUrl ||
                `https://www.youtube.com/watch?v=${selectedVideo.youtubeVideoId}`
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apri su YouTube
            </a>

            <button
              id="nextVideoButton"
              class="btn btn-primary"
              type="button"
              ${
                nextVideo
                  ? ""
                  : "disabled"
              }
            >
              Video successivo →
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderPage() {
    if (state.loading) {
      renderLoading();
      return;
    }

    if (state.error) {
      renderError();
      return;
    }

    if (state.videos.length === 0) {
      renderEmpty();
      return;
    }

    const selectedArgomento =
      getArgomentoById(
        state.selectedArgomentoId
      );

    const selectedTopic =
      getTopicById(
        state.selectedTopicId
      );

    container.innerHTML = `
      <main
        class="
          page
          video-lessons-page
        "
      >
        <section
          class="
            card
            wide-card
            video-lessons-shell
          "
        >
          <header
            class="
              video-lessons-header
            "
          >
            <div>
              <button
                id="backFromVideoLessons"
                class="back-button"
                type="button"
              >
                ← Dashboard
              </button>

              <p class="eyebrow">
                VIDEO LEZIONI
              </p>

              <h1>
                Impara con le spiegazioni video
              </h1>

              <p class="subtitle">
                Guarda le video lezioni organizzate
                per argomento e topic.
              </p>
              <div class="video-overall-progress">
  <span>
    Video completati
  </span>

  <strong>
    ${getCompletedVideoCount()}
    /
    ${state.videos.length}
  </strong>

  <div class="video-overall-progress-track">
    <div
      class="video-overall-progress-fill"
      style="
        width:
        ${
          state.videos.length > 0
            ? Math.round(
                (
                  getCompletedVideoCount() /
                  state.videos.length
                ) * 100
              )
            : 0
        }%;
      "
    ></div>
  </div>
</div>
            </div>

            <div
              class="
                video-lessons-header-icon
              "
            >
              🎬
            </div>
          </header>

          <section
            class="
              video-lessons-controls
            "
          >
            <label
              class="
                video-lessons-search
              "
            >
              <span>🔍</span>

              <input
                id="videoLessonsSearch"
                type="search"
                value="${escapeHtml(
                  state.searchText
                )}"
                placeholder="
                  Cerca un video...
                "
              />
            </label>

            <button
              id="resetVideoFilters"
              class="btn btn-secondary"
              type="button"
            >
              Azzera filtri
            </button>
          </section>

          <section
            class="
              video-argomento-section
            "
          >
            <div class="video-section-heading">
              <div>
                <p class="eyebrow">
                  PASSO 1
                </p>

                <h2>
                  Scegli un argomento
                </h2>
              </div>

              ${
                selectedArgomento
                  ? `
                    <span>
                      ${escapeHtml(
                        selectedArgomento
                          .icon || ""
                      )}
                      ${escapeHtml(
                        selectedArgomento
                          .title
                      )}
                    </span>
                  `
                  : ""
              }
            </div>

            <div
              class="
                video-argomento-grid
              "
            >
              ${renderArgomentoCards()}
            </div>
          </section>

          <section
            class="
              video-topic-section
            "
          >
            <div class="video-section-heading">
              <div>
                <p class="eyebrow">
                  PASSO 2
                </p>

                <h2>
                  Scegli un topic
                </h2>
              </div>

              ${
                selectedTopic
                  ? `
                    <span>
                      ${escapeHtml(
                        selectedTopic
                          .icon || ""
                      )}
                      ${escapeHtml(
                        selectedTopic
                          .title
                      )}
                    </span>
                  `
                  : ""
              }
            </div>

            <div class="video-topic-filters">
              ${
                state.selectedArgomentoId
                  ? `
                    <button
                      class="
                        video-topic-filter
                        ${
                          !state.selectedTopicId
                            ? "is-active"
                            : ""
                        }
                      "
                      data-video-topic-id=""
                      type="button"
                    >
                      <span>🎞️</span>

                      <strong>
                        Tutti i topic
                      </strong>

                      <small>
                        ${
                          state.videos.filter(
                            (video) =>
                              String(
                                video
                                  .argomentoId
                              ) ===
                              String(
                                state
                                  .selectedArgomentoId
                              )
                          ).length
                        }
                      </small>
                    </button>
                  `
                  : ""
              }

              ${renderTopicButtons()}
            </div>
          </section>

          <section
            class="
              video-learning-layout
            "
          >
            <aside
              class="
                video-lessons-sidebar
              "
            >
              <div
                class="
                  video-lessons-sidebar-header
                "
              >
                <div>
                  <p class="eyebrow">
                    PLAYLIST
                  </p>

                  <h2>
                    Video disponibili
                  </h2>
                </div>

                <strong>
                  ${getVisibleVideos().length}
                </strong>
              </div>

              <div
                class="
                  video-lessons-list
                "
              >
                ${renderVideoList()}
              </div>
            </aside>

            <section
              class="
                video-lessons-player
              "
            >
              ${renderPlayer()}
            </section>
          </section>
        </section>
      </main>
       `;

    bindEvents();
  }

  function bindEvents() {
    document
      .querySelector("#backFromVideoLessons")
      ?.addEventListener("click", onBack);

    document
      .querySelector("#videoLessonsSearch")
      ?.addEventListener("input", (event) => {
        state.searchText = event.target.value;
        state.selectedVideoId = "";

        renderPage();
      });

    document
      .querySelector("#resetVideoFilters")
      ?.addEventListener("click", () => {
        state.selectedArgomentoId = "";
        state.selectedTopicId = "";
        state.selectedVideoId = "";
        state.searchText = "";

        renderPage();
      });

    document
      .querySelectorAll(
        "[data-video-argomento-id]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const argomentoId =
              button.dataset
                .videoArgomentoId || "";

            if (
              state.selectedArgomentoId ===
              argomentoId
            ) {
              state.selectedArgomentoId = "";
              state.selectedTopicId = "";
            } else {
              state.selectedArgomentoId =
                argomentoId;

              state.selectedTopicId = "";
            }

            state.selectedVideoId = "";

            renderPage();
          }
        );
      });

    document
      .querySelectorAll(
        "[data-video-topic-id]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            state.selectedTopicId =
              button.dataset.videoTopicId ||
              "";

            state.selectedVideoId = "";

            renderPage();
          }
        );
      });

    document
      .querySelectorAll("[data-video-id]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            state.selectedVideoId =
              button.dataset.videoId || "";

            renderPage();

            document
              .querySelector(
                ".video-lessons-player"
              )
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });
          }
        );
      });

    const visibleVideos =
      getVisibleVideos();

    const selectedVideo =
      getSelectedVideo();

    const currentIndex =
      visibleVideos.findIndex(
        (video) =>
          String(video.id) ===
          String(selectedVideo?.id)
      );

    document
      .querySelector(
        "#previousVideoButton"
      )
      ?.addEventListener(
        "click",
        () => {
          if (currentIndex <= 0) {
            return;
          }

          state.selectedVideoId =
            visibleVideos[
              currentIndex - 1
            ].id;

          renderPage();
        }
      );

    document
      .querySelector("#nextVideoButton")
      ?.addEventListener(
        "click",
        () => {
          if (
            currentIndex < 0 ||
            currentIndex >=
              visibleVideos.length - 1
          ) {
            return;
          }

          state.selectedVideoId =
            visibleVideos[
              currentIndex + 1
            ].id;

          renderPage();
        }
      );

    document
      .querySelector(
        "#markVideoCompletedButton"
      )
      ?.addEventListener(
        "click",
        async (event) => {
          const currentVideo =
            getSelectedVideo();

          if (
            !currentVideo ||
            state.savingProgress ||
            isVideoCompleted(
              currentVideo.id
            )
          ) {
            return;
          }

          const button =
            event.currentTarget;

          state.savingProgress = true;
          button.disabled = true;
          button.textContent =
            "Salvataggio...";

          try {
            const progress =
              await markVideoCompleted({
                user,
                video: currentVideo
              });

            state.videoProgressMap.set(
              String(currentVideo.id),
              progress
            );

            renderPage();
          } catch (error) {
            console.error(
              "Video completion saving error:",
              error
            );

            button.disabled = false;
            button.textContent = "Riprova";
          } finally {
            state.savingProgress = false;
          }
        }
      );
  }
  async function loadVideos() {
    state.loading = true;
    state.error = null;

    renderPage();

    try {
      const [
        publishedVideos,
        savedProgress
      ] = await Promise.all([
        loadPublishedTheoryVideos(),
        loadVideoProgress(user)
      ]);

      state.videos =
        Array.isArray(publishedVideos)
          ? publishedVideos
          : [];

      state.videoProgressMap =
        new Map(
          (
            Array.isArray(savedProgress)
              ? savedProgress
              : []
          ).map(
            (progress) => [
              String(
                progress.videoId
              ),
              progress
            ]
          )
        );

      const requestedVideo =
        state.videos.find(
          (video) =>
            (
              !state.selectedArgomentoId ||
              String(
                video.argomentoId
              ) ===
                String(
                  state.selectedArgomentoId
                )
            ) &&
            (
              !state.selectedTopicId ||
              String(
                video.topicId
              ) ===
                String(
                  state.selectedTopicId
                )
            )
        );

      const firstVideo =
        requestedVideo ||
        state.videos[0];

      if (firstVideo) {
        if (
          !state.selectedArgomentoId
        ) {
          state.selectedArgomentoId =
            String(
              firstVideo.argomentoId ||
              ""
            );
        }

        if (
          !state.selectedTopicId
        ) {
          state.selectedTopicId =
            String(
              firstVideo.topicId ||
              ""
            );
        }

        state.selectedVideoId =
          String(
            firstVideo.id || ""
          );
      } else {
        state.selectedVideoId = "";
      }
    } catch (error) {
      console.error(
        "Video lessons loading error:",
        error
      );

      state.error = error;
      state.videos = [];
      state.videoProgressMap =
        new Map();
      state.selectedVideoId = "";
    } finally {
      state.loading = false;
      renderPage();
    }
  }

  await loadVideos();
}