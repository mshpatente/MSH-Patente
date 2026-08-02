import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

import {
  archiveTheoryVideo,
  createTheoryVideo,
  createYouTubeThumbnailUrl,
  extractYouTubeVideoId,
  getAdminTheoryVideo,
  loadAdminTheoryVideos,
  permanentlyDeleteTheoryVideo,
  restoreTheoryVideo,
  updateTheoryVideo
} from "../services/videoService.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createEmptyVideo() {
  return {
    id: "",
    argomentoId: "",
    topicId: "",
    title: "",
    description: "",
    youtubeUrl: "",
    youtubeVideoId: "",
    thumbnailUrl: "",
    durationMinutes: 0,
    order: 1,
    status: "draft"
  };
}

function getStatusLabel(status) {
  const labels = {
    draft: "Bozza",
    published: "Pubblicato",
    archived: "Archiviato"
  };

  return labels[status] || "Bozza";
}

function getStatusClass(status) {
  const classes = {
    draft: "admin-status-draft",
    published: "admin-status-published",
    archived: "admin-status-archived"
  };

  return (
    classes[status] ||
    classes.draft
  );
}

export async function showAdminVideos({
  container,
  onBack
}) {
  if (!container) {
    throw new Error(
      "Container video admin non disponibile."
    );
  }

  const state = {
    videos: [],
    selectedVideo:
      createEmptyVideo(),
    loading: true,
    saving: false,
    searchText: "",
    statusFilter: "all",
    argomentoFilter: "all"
  };

  function findArgomento(
    argomentoId
  ) {
    return argomenti.find(
      (argomento) =>
        String(argomento.id) ===
        String(argomentoId)
    );
  }

  function findTopic(topicId) {
    return topics.find(
      (topic) =>
        String(topic.id) ===
        String(topicId)
    );
  }

  function getSelectedTopics() {
    if (
      !state.selectedVideo
        .argomentoId
    ) {
      return [];
    }

    return topics
      .filter(
        (topic) =>
          String(
            topic.argomentoId
          ) ===
          String(
            state.selectedVideo
              .argomentoId
          )
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
  }

  function getFilteredVideos() {
    const normalizedSearch =
      state.searchText
        .trim()
        .toLowerCase();

    return state.videos.filter(
      (video) => {
        const matchesStatus =
          state.statusFilter ===
            "all" ||
          video.status ===
            state.statusFilter;

        const matchesArgomento =
          state.argomentoFilter ===
            "all" ||
          video.argomentoId ===
            state.argomentoFilter;

        const searchableText = [
          video.title,
          video.description,
          video.argomentoId,
          video.topicId,
          video.youtubeVideoId
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch
          );

        return (
          matchesStatus &&
          matchesArgomento &&
          matchesSearch
        );
      }
    );
  }

  function setMessage(
    message,
    type = "success"
  ) {
    const messageElement =
      document.querySelector(
        "#adminVideoMessage"
      );

    if (!messageElement) {
      return;
    }

    messageElement.textContent =
      message;

    messageElement.className =
      `message ${type}`;
  }

  function clearMessage() {
    setMessage("", "");
  }

  function renderTopicOptions() {
    const selectElement =
      document.querySelector(
        "#adminVideoTopic"
      );

    if (!selectElement) {
      return;
    }

    const availableTopics =
      getSelectedTopics();

    selectElement.innerHTML = `
      <option value="">
        Seleziona topic
      </option>

      ${availableTopics
        .map(
          (topic) => `
            <option
              value="${escapeHtml(
                topic.id
              )}"
              ${
                topic.id ===
                state.selectedVideo
                  .topicId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                topic.icon || ""
              )}
              ${escapeHtml(
                topic.title
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function updateYouTubePreview() {
    const urlInput =
      document.querySelector(
        "#adminVideoYoutubeUrl"
      );

    const previewContainer =
      document.querySelector(
        "#adminVideoPreview"
      );

    if (
      !urlInput ||
      !previewContainer
    ) {
      return;
    }

    const videoId =
      extractYouTubeVideoId(
        urlInput.value
      );

    if (!videoId) {
      previewContainer.innerHTML = `
        <div class="admin-empty-image">
          <span>🎬</span>

          <strong>
            Anteprima non disponibile
          </strong>

          <small>
            Inserisci un link YouTube valido.
          </small>
        </div>
      `;

      return;
    }

    const thumbnailUrl =
      createYouTubeThumbnailUrl(
        videoId
      );

    previewContainer.innerHTML = `
      <div class="admin-video-preview-content">
        <img
          src="${escapeHtml(
            thumbnailUrl
          )}"
          alt="Anteprima video YouTube"
        />

        <a
          class="btn btn-secondary"
          href="https://www.youtube.com/watch?v=${escapeHtml(
            videoId
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apri su YouTube
        </a>
      </div>
    `;
  }

  function readFormData(status) {
    const youtubeUrl =
      document
        .querySelector(
          "#adminVideoYoutubeUrl"
        )
        ?.value
        .trim() || "";

    return {
      argomentoId:
        document
          .querySelector(
            "#adminVideoArgomento"
          )
          ?.value
          .trim() || "",

      topicId:
        document
          .querySelector(
            "#adminVideoTopic"
          )
          ?.value
          .trim() || "",

      title:
        document
          .querySelector(
            "#adminVideoTitle"
          )
          ?.value
          .trim() || "",

      description:
        document
          .querySelector(
            "#adminVideoDescription"
          )
          ?.value
          .trim() || "",

      youtubeUrl,

      youtubeVideoId:
        extractYouTubeVideoId(
          youtubeUrl
        ),

      order:
        Number(
          document
            .querySelector(
              "#adminVideoOrder"
            )
            ?.value
        ) || 1,

      durationMinutes:
        Number(
          document
            .querySelector(
              "#adminVideoDuration"
            )
            ?.value
        ) || 0,

      status
    };
  }

  function validateForm(videoData) {
    if (!videoData.title) {
      throw new Error(
        "Inserisci il titolo del video."
      );
    }

    if (!videoData.argomentoId) {
      throw new Error(
        "Seleziona un argomento."
      );
    }

    if (!videoData.topicId) {
      throw new Error(
        "Seleziona un topic."
      );
    }

    if (
      !videoData.youtubeVideoId
    ) {
      throw new Error(
        "Inserisci un link YouTube valido."
      );
    }
  }

  async function saveVideo(status) {
    if (state.saving) {
      return;
    }

    clearMessage();

    try {
      const videoData =
        readFormData(status);

      validateForm(
        videoData
      );

      state.saving = true;

      const draftButton =
        document.querySelector(
          "#adminVideoSaveDraft"
        );

      const publishButton =
        document.querySelector(
          "#adminVideoPublish"
        );

      if (draftButton) {
        draftButton.disabled = true;
      }

      if (publishButton) {
        publishButton.disabled = true;
      }

      if (
        state.selectedVideo.id
      ) {
        await updateTheoryVideo(
          state.selectedVideo.id,
          videoData
        );

        setMessage(
          status === "published"
            ? "Video aggiornato e pubblicato."
            : "Video salvato come bozza."
        );
      } else {
        await createTheoryVideo(
          videoData
        );

        setMessage(
          status === "published"
            ? "Video creato e pubblicato."
            : "Video creato come bozza."
        );
      }

      state.videos =
        await loadAdminTheoryVideos();

      state.selectedVideo =
        createEmptyVideo();

      renderPage();
    } catch (error) {
      console.error(
        "Admin video saving error:",
        error
      );

      setMessage(
        error?.message ||
          "Impossibile salvare il video.",
        "error"
      );
    } finally {
      state.saving = false;
    }
  }

  async function openVideo(
    videoId
  ) {
    try {
      const video =
        await getAdminTheoryVideo(
          videoId
        );

      if (!video) {
        setMessage(
          "Video non trovato.",
          "error"
        );

        return;
      }

      state.selectedVideo =
        video;

      renderPage();
    } catch (error) {
      console.error(
        "Admin video loading error:",
        error
      );

      setMessage(
        "Impossibile caricare il video.",
        "error"
      );
    }
  }

  async function archiveVideo(
    videoId
  ) {
    const confirmed =
      window.confirm(
        "Vuoi archiviare questo video?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await archiveTheoryVideo(
        videoId
      );

      state.videos =
        await loadAdminTheoryVideos();

      if (
        state.selectedVideo.id ===
        videoId
      ) {
        state.selectedVideo =
          createEmptyVideo();
      }

      renderPage();
    } catch (error) {
      console.error(
        "Video archive error:",
        error
      );

      setMessage(
        "Impossibile archiviare il video.",
        "error"
      );
    }
  }

  async function restoreVideo(
    videoId
  ) {
    try {
      await restoreTheoryVideo(
        videoId
      );

      state.videos =
        await loadAdminTheoryVideos();

      renderPage();
    } catch (error) {
      console.error(
        "Video restore error:",
        error
      );

      setMessage(
        "Impossibile ripristinare il video.",
        "error"
      );
    }
  }

  async function deleteVideo(
    videoId
  ) {
    const confirmed =
      window.confirm(
        "Eliminare definitivamente questo video? L'operazione non può essere annullata."
      );

    if (!confirmed) {
      return;
    }

    try {
      await permanentlyDeleteTheoryVideo(
        videoId
      );

      state.videos =
        await loadAdminTheoryVideos();

      if (
        state.selectedVideo.id ===
        videoId
      ) {
        state.selectedVideo =
          createEmptyVideo();
      }

      renderPage();
    } catch (error) {
      console.error(
        "Video deletion error:",
        error
      );

      setMessage(
        "Impossibile eliminare il video.",
        "error"
      );
    }
  }

  function renderVideoList() {
    const filteredVideos =
      getFilteredVideos();

    if (
      filteredVideos.length === 0
    ) {
      return `
        <div class="admin-empty-list">
          <span>🎬</span>

          <h3>
            Nessun video trovato
          </h3>

          <p>
            Crea il primo video oppure
            modifica i filtri.
          </p>
        </div>
      `;
    }

    return filteredVideos
      .map((video) => {
        const argomento =
          findArgomento(
            video.argomentoId
          );

        const topic =
          findTopic(
            video.topicId
          );

        return `
          <article class="admin-lesson-item">
            <button
              class="admin-lesson-main"
              data-video-edit="${escapeHtml(
                video.id
              )}"
              type="button"
            >
              <img
                class="admin-video-list-thumbnail"
                src="${escapeHtml(
                  video.thumbnailUrl
                )}"
                alt="${escapeHtml(
                  video.title
                )}"
                loading="lazy"
              />

              <div>
                <div class="admin-lesson-item-title">
                  <strong>
                    ${escapeHtml(
                      video.title
                    )}
                  </strong>

                  <span
                    class="
                      admin-status-badge
                      ${getStatusClass(
                        video.status
                      )}
                    "
                  >
                    ${getStatusLabel(
                      video.status
                    )}
                  </span>
                </div>

                <p>
                  ${escapeHtml(
                    argomento?.title ||
                    video.argomentoId
                  )}
                </p>

                <small>
                  ${escapeHtml(
                    topic?.title ||
                    video.topicId
                  )}
                  · Ordine
                  ${Number(
                    video.order || 1
                  )}
                </small>
              </div>
            </button>

            <div class="admin-lesson-item-actions">
              ${
                video.status ===
                "archived"
                  ? `
                    <button
                      class="admin-icon-action"
                      data-video-action="restore"
                      data-video-id="${escapeHtml(
                        video.id
                      )}"
                      type="button"
                      title="Ripristina"
                    >
                      ↩️
                    </button>
                  `
                  : `
                    <button
                      class="admin-icon-action"
                      data-video-action="archive"
                      data-video-id="${escapeHtml(
                        video.id
                      )}"
                      type="button"
                      title="Archivia"
                    >
                      📦
                    </button>
                  `
              }

              <button
                class="
                  admin-icon-action
                  admin-delete-action
                "
                data-video-action="delete"
                data-video-id="${escapeHtml(
                  video.id
                )}"
                type="button"
                title="Elimina definitivamente"
              >
                🗑️
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderPage() {
    const video =
      state.selectedVideo;

    const previewVideoId =
      extractYouTubeVideoId(
        video.youtubeVideoId ||
        video.youtubeUrl
      );

    const previewThumbnail =
      createYouTubeThumbnailUrl(
        previewVideoId
      );

    container.innerHTML = `
      <main class="page admin-theory-page">
        <section
          class="
            card
            wide-card
            admin-theory-shell
          "
        >
          <header class="admin-theory-header">
            <div>
              <button
                id="backFromAdminVideos"
                class="back-button"
                type="button"
              >
                ← Dashboard
              </button>

              <p class="eyebrow">
                AMMINISTRAZIONE
              </p>

              <h1>
                Gestione video lezioni
              </h1>

              <p class="subtitle">
                Aggiungi spiegazioni YouTube
                per ogni argomento e topic.
              </p>
            </div>

            <div class="admin-header-actions">
              <button
                id="adminVideoRefresh"
                class="btn btn-secondary"
                type="button"
              >
                ↻ Aggiorna
              </button>

              <button
                id="adminVideoNew"
                class="btn btn-primary"
                type="button"
              >
                + Nuovo video
              </button>
            </div>
          </header>

          <p
            id="adminVideoMessage"
            class="message"
          ></p>

          <section class="admin-summary-grid">
            <article>
              <span>Tutti</span>
              <strong>
                ${state.videos.length}
              </strong>
            </article>

            <article>
              <span>Pubblicati</span>
              <strong>
                ${
                  state.videos.filter(
                    (item) =>
                      item.status ===
                      "published"
                  ).length
                }
              </strong>
            </article>

            <article>
              <span>Bozze</span>
              <strong>
                ${
                  state.videos.filter(
                    (item) =>
                      item.status ===
                      "draft"
                  ).length
                }
              </strong>
            </article>

            <article>
              <span>Archiviati</span>
              <strong>
                ${
                  state.videos.filter(
                    (item) =>
                      item.status ===
                      "archived"
                  ).length
                }
              </strong>
            </article>
          </section>

          <section class="admin-theory-layout">
            <aside class="admin-theory-sidebar">
              <div class="admin-filter-stack">
                <input
                  id="adminVideoSearch"
                  type="search"
                  placeholder="Cerca video..."
                  value="${escapeHtml(
                    state.searchText
                  )}"
                />

                <select id="adminVideoStatusFilter">
                  <option
                    value="all"
                    ${
                      state.statusFilter ===
                      "all"
                        ? "selected"
                        : ""
                    }
                  >
                    Tutti gli stati
                  </option>

                  <option
                    value="published"
                    ${
                      state.statusFilter ===
                      "published"
                        ? "selected"
                        : ""
                    }
                  >
                    Pubblicati
                  </option>

                  <option
                    value="draft"
                    ${
                      state.statusFilter ===
                      "draft"
                        ? "selected"
                        : ""
                    }
                  >
                    Bozze
                  </option>

                  <option
                    value="archived"
                    ${
                      state.statusFilter ===
                      "archived"
                        ? "selected"
                        : ""
                    }
                  >
                    Archiviati
                  </option>
                </select>

                <select id="adminVideoArgomentoFilter">
                  <option value="all">
                    Tutti gli argomenti
                  </option>

                  ${argomenti
                    .map(
                      (argomento) => `
                        <option
                          value="${escapeHtml(
                            argomento.id
                          )}"
                          ${
                            state.argomentoFilter ===
                            argomento.id
                              ? "selected"
                              : ""
                          }
                        >
                          ${escapeHtml(
                            argomento.icon || ""
                          )}
                          ${escapeHtml(
                            argomento.title
                          )}
                        </option>
                      `
                    )
                    .join("")}
                </select>
              </div>

              <div class="admin-lesson-list">
                ${renderVideoList()}
              </div>
            </aside>

            <section class="admin-theory-editor">
              <div class="admin-editor-header">
                <div>
                  <p class="eyebrow">
                    ${
                      video.id
                        ? "MODIFICA VIDEO"
                        : "NUOVO VIDEO"
                    }
                  </p>

                  <h2>
                    ${
                      video.id
                        ? escapeHtml(
                            video.title
                          )
                        : "Crea una video lezione"
                    }
                  </h2>
                </div>
              </div>

              <form
                id="adminVideoForm"
                class="admin-theory-form"
              >
                <section class="admin-form-section">
                  <div class="admin-form-section-title">
                    <span>1</span>

                    <div>
                      <h3>
                        Informazioni video
                      </h3>

                      <p>
                        Titolo, YouTube URL,
                        argomento e topic.
                      </p>
                    </div>
                  </div>

                  <div class="admin-form-grid">
                    <label
                      class="
                        admin-form-field
                        admin-form-field-full
                      "
                    >
                      <span>
                        Titolo *
                      </span>

                      <input
                        id="adminVideoTitle"
                        type="text"
                        value="${escapeHtml(
                          video.title
                        )}"
                        required
                      />
                    </label>

                    <label
                      class="
                        admin-form-field
                        admin-form-field-full
                      "
                    >
                      <span>
                        Link YouTube *
                      </span>

                      <input
                        id="adminVideoYoutubeUrl"
                        type="url"
                        value="${escapeHtml(
                          video.youtubeUrl
                        )}"
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                      />
                    </label>

                    <label class="admin-form-field">
                      <span>
                        Argomento *
                      </span>

                      <select
                        id="adminVideoArgomento"
                        required
                      >
                        <option value="">
                          Seleziona argomento
                        </option>

                        ${argomenti
                          .map(
                            (argomento) => `
                              <option
                                value="${escapeHtml(
                                  argomento.id
                                )}"
                                ${
                                  argomento.id ===
                                  video.argomentoId
                                    ? "selected"
                                    : ""
                                }
                              >
                                ${escapeHtml(
                                  argomento.icon ||
                                  ""
                                )}
                                ${escapeHtml(
                                  argomento.title
                                )}
                              </option>
                            `
                          )
                          .join("")}
                      </select>
                    </label>

                    <label class="admin-form-field">
                      <span>
                        Topic *
                      </span>

                      <select
                        id="adminVideoTopic"
                        required
                      ></select>
                    </label>

                    <label class="admin-form-field">
                      <span>
                        Ordine
                      </span>

                      <input
                        id="adminVideoOrder"
                        type="number"
                        min="1"
                        step="1"
                        value="${Number(
                          video.order || 1
                        )}"
                      />
                    </label>

                    <label class="admin-form-field">
                      <span>
                        Durata in minuti
                      </span>

                      <input
                        id="adminVideoDuration"
                        type="number"
                        min="0"
                        step="1"
                        value="${Number(
                          video.durationMinutes ||
                          0
                        )}"
                      />
                    </label>

                    <label
                      class="
                        admin-form-field
                        admin-form-field-full
                      "
                    >
                      <span>
                        Descrizione
                      </span>

                      <textarea
                        id="adminVideoDescription"
                        rows="5"
                      >${escapeHtml(
                        video.description
                      )}</textarea>
                    </label>
                  </div>
                </section>

                <section class="admin-form-section">
                  <div class="admin-form-section-title">
                    <span>2</span>

                    <div>
                      <h3>
                        Anteprima
                      </h3>

                      <p>
                        Controlla il video prima
                        della pubblicazione.
                      </p>
                    </div>
                  </div>

                  <div
                    id="adminVideoPreview"
                    class="admin-image-preview"
                  >
                    ${
                      previewThumbnail
                        ? `
                          <div class="admin-video-preview-content">
                            <img
                              src="${escapeHtml(
                                previewThumbnail
                              )}"
                              alt="${escapeHtml(
                                video.title ||
                                "Anteprima video"
                              )}"
                            />
                          </div>
                        `
                        : `
                          <div class="admin-empty-image">
                            <span>🎬</span>

                            <strong>
                              Nessuna anteprima
                            </strong>

                            <small>
                              Inserisci un link
                              YouTube valido.
                            </small>
                          </div>
                        `
                    }
                  </div>
                </section>

                <section class="admin-save-panel">
                  <div>
                    <strong>
                      ${
                        video.status ===
                        "published"
                          ? "Video pubblicato"
                          : video.status ===
                              "archived"
                            ? "Video archiviato"
                            : "Bozza non pubblicata"
                      }
                    </strong>

                    <p>
                      Controlla i dati prima
                      di salvare.
                    </p>
                  </div>

                  <div class="admin-save-actions">
                    <button
                      id="adminVideoSaveDraft"
                      class="btn btn-secondary"
                      type="button"
                    >
                      Salva come bozza
                    </button>

                    <button
                      id="adminVideoPublish"
                      class="btn btn-primary"
                      type="button"
                    >
                      Salva e pubblica
                    </button>
                  </div>
                </section>
              </form>
            </section>
          </section>
        </section>
      </main>
    `;

    renderTopicOptions();
    bindEvents();
  }

  function bindEvents() {
    document
      .querySelector(
        "#backFromAdminVideos"
      )
      ?.addEventListener(
        "click",
        onBack
      );

    document
      .querySelector(
        "#adminVideoNew"
      )
      ?.addEventListener(
        "click",
        () => {
          state.selectedVideo =
            createEmptyVideo();

          renderPage();
        }
      );

    document
      .querySelector(
        "#adminVideoRefresh"
      )
      ?.addEventListener(
        "click",
        async () => {
          state.videos =
            await loadAdminTheoryVideos();

          renderPage();
        }
      );

    document
      .querySelector(
        "#adminVideoArgomento"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.selectedVideo
            .argomentoId =
              event.target.value;

          state.selectedVideo
            .topicId = "";

          renderTopicOptions();
        }
      );

    document
      .querySelector(
        "#adminVideoYoutubeUrl"
      )
      ?.addEventListener(
        "input",
        updateYouTubePreview
      );

    document
      .querySelector(
        "#adminVideoSaveDraft"
      )
      ?.addEventListener(
        "click",
        () => saveVideo("draft")
      );

    document
      .querySelector(
        "#adminVideoPublish"
      )
      ?.addEventListener(
        "click",
        () =>
          saveVideo("published")
      );

    document
      .querySelector(
        "#adminVideoSearch"
      )
      ?.addEventListener(
        "input",
        (event) => {
          state.searchText =
            event.target.value;

          renderPage();
        }
      );

    document
      .querySelector(
        "#adminVideoStatusFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.statusFilter =
            event.target.value;

          renderPage();
        }
      );

    document
      .querySelector(
        "#adminVideoArgomentoFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.argomentoFilter =
            event.target.value;

          renderPage();
        }
      );

    document
      .querySelectorAll(
        "[data-video-edit]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            openVideo(
              button.dataset.videoEdit
            );
          }
        );
      });

    document
      .querySelectorAll(
        "[data-video-action]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          async () => {
            const videoId =
              button.dataset.videoId;

            const action =
              button.dataset
                .videoAction;

            if (
              !videoId ||
              !action
            ) {
              return;
            }

            if (action === "archive") {
              await archiveVideo(
                videoId
              );
            }

            if (action === "restore") {
              await restoreVideo(
                videoId
              );
            }

            if (action === "delete") {
              await deleteVideo(
                videoId
              );
            }
          }
        );
      });
  }

  try {
    state.videos =
      await loadAdminTheoryVideos();

    state.loading = false;

    renderPage();
  } catch (error) {
    console.error(
      "Admin videos loading error:",
      error
    );

    container.innerHTML = `
      <main class="page">
        <section class="card">
          <p class="eyebrow">
            AMMINISTRAZIONE
          </p>

          <h1>
            Errore caricamento video
          </h1>

          <p class="subtitle">
            Non è stato possibile caricare
            i video dal database.
          </p>

          <button
            id="adminVideoErrorBack"
            class="btn btn-primary"
            type="button"
          >
            Torna alla dashboard
          </button>
        </section>
      </main>
    `;

    document
      .querySelector(
        "#adminVideoErrorBack"
      )
      ?.addEventListener(
        "click",
        onBack
      );
  }
}