import {
  magicTricks
} from "../data/magicTricks.js";

import {
  argomenti
} from "../data/argomenti.js";

import {
  topics
} from "../data/topics.js";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function getFavoriteStorageKey(user) {
  return `msh-magic-tricks-favorites-${user.uid}`;
}

function loadFavoriteIds(user) {
  try {
    const savedFavorites =
      localStorage.getItem(
        getFavoriteStorageKey(user)
      );

    if (!savedFavorites) {
      return new Set();
    }

    const parsedFavorites =
      JSON.parse(savedFavorites);

    return new Set(
      Array.isArray(parsedFavorites)
        ? parsedFavorites
        : []
    );
  } catch (error) {
    console.error(
      "Magic favorites loading error:",
      error
    );

    return new Set();
  }
}

function saveFavoriteIds(
  user,
  favoriteIds
) {
  localStorage.setItem(
    getFavoriteStorageKey(user),
    JSON.stringify(
      [...favoriteIds]
    )
  );
}

export function showMagicTricks(
  app,
  user,
  actions
) {
  const favoriteIds =
    loadFavoriteIds(user);

  const state = {
    searchText: "",
    selectedArgomentoId: "all",
    favoritesOnly: false
  };

  const publishedTricks =
    [...magicTricks]
      .filter(
        (trick) =>
          trick.published === true
      )
      .sort(
        (first, second) =>
          first.order - second.order
      );

  function getFilteredTricks() {
    const normalizedSearch =
      normalizeText(
        state.searchText
      );

    return publishedTricks.filter(
      (trick) => {
        const matchesArgomento =
          state.selectedArgomentoId ===
            "all" ||
          trick.argomentoId ===
            state.selectedArgomentoId;

        const matchesFavorite =
          !state.favoritesOnly ||
          favoriteIds.has(
            trick.id
          );

        const searchableText =
          normalizeText(
            [
              trick.title,
              trick.shortText,
              trick.explanation,
              trick.mnemonic,
              ...(trick.keywords || [])
            ].join(" ")
          );

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch
          );

        return (
          matchesArgomento &&
          matchesFavorite &&
          matchesSearch
        );
      }
    );
  }

  function renderTrickCard(trick) {
    const argomento =
      argomenti.find(
        (item) =>
          item.id ===
          trick.argomentoId
      );

    const topic =
      topics.find(
        (item) =>
          item.id ===
          trick.topicId
      );

    const favorite =
      favoriteIds.has(
        trick.id
      );

    return `
      <article class="magic-library-card">
        <div class="magic-library-card-top">
          <div class="magic-library-icon">
            ${trick.icon || "✨"}
          </div>

          <button
            class="
              magic-favorite-button
              ${
                favorite
                  ? "magic-favorite-active"
                  : ""
              }
            "
            data-trick-id="${trick.id}"
            type="button"
            aria-label="${
              favorite
                ? "Rimuovi dai preferiti"
                : "Aggiungi ai preferiti"
            }"
            title="${
              favorite
                ? "Rimuovi dai preferiti"
                : "Aggiungi ai preferiti"
            }"
          >
            ${favorite ? "★" : "☆"}
          </button>
        </div>

        <div class="magic-library-category">
          <span>
            ${argomento?.icon || "📚"}
            ${
              argomento?.title ||
              "Argomento"
            }
          </span>

          ${
            topic
              ? `
                <span>
                  ${topic.icon}
                  ${topic.title}
                </span>
              `
              : ""
          }
        </div>

        <h2>
          ${trick.title}
        </h2>

        <p class="magic-library-short-text">
          ${trick.shortText}
        </p>

        <div class="magic-library-explanation">
          <p>
            ${trick.explanation}
          </p>
        </div>

        <div class="magic-library-mnemonic">
          <span>✨</span>

          <div>
            <small>
              RICORDA COSÌ
            </small>

            <strong>
              ${trick.mnemonic}
            </strong>
          </div>
        </div>

        <div class="magic-library-actions">
          ${
            trick.lessonId
              ? `
                <button
                  class="
                    btn
                    btn-secondary
                    open-magic-lesson-button
                  "
                  data-trick-id="${trick.id}"
                  type="button"
                >
                  📖 Apri la lezione
                </button>
              `
              : ""
          }

          ${
            topic
              ? `
                <button
                  class="
                    btn
                    btn-primary
                    start-magic-quiz-button
                  "
                  data-trick-id="${trick.id}"
                  type="button"
                >
                  📝 Prova il quiz
                </button>
              `
              : ""
          }
        </div>
      </article>
    `;
  }

  function renderResults() {
    const resultsContainer =
      document.querySelector(
        "#magicTricksResults"
      );

    const countElement =
      document.querySelector(
        "#magicTricksCount"
      );

    const filteredTricks =
      getFilteredTricks();

    countElement.textContent =
      `${filteredTricks.length} ${
        filteredTricks.length === 1
          ? "trucco trovato"
          : "trucchi trovati"
      }`;

    if (
      filteredTricks.length === 0
    ) {
      resultsContainer.innerHTML = `
        <div class="magic-empty-state">
          <div>🔍</div>

          <h2>
            Nessun trucco trovato
          </h2>

          <p>
            Prova a cambiare la ricerca
            o il filtro selezionato.
          </p>

          <button
            id="resetMagicFiltersButton"
            class="btn btn-secondary"
            type="button"
          >
            Rimuovi filtri
          </button>
        </div>
      `;

      document
        .querySelector(
          "#resetMagicFiltersButton"
        )
        .addEventListener(
          "click",
          () => {
            state.searchText = "";
            state.selectedArgomentoId =
              "all";
            state.favoritesOnly = false;

            document
              .querySelector(
                "#magicSearchInput"
              )
              .value = "";

            document
              .querySelector(
                "#magicArgomentoFilter"
              )
              .value = "all";

            document
              .querySelector(
                "#magicFavoritesOnlyButton"
              )
              .classList
              .remove(
                "magic-filter-active"
              );

            renderResults();
          }
        );

      return;
    }

    resultsContainer.innerHTML =
      filteredTricks
        .map(renderTrickCard)
        .join("");

    document
      .querySelectorAll(
        ".magic-favorite-button"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const trickId =
              button.dataset.trickId
                ?.trim();

            if (!trickId) {
              return;
            }

            if (
              favoriteIds.has(
                trickId
              )
            ) {
              favoriteIds.delete(
                trickId
              );
            } else {
              favoriteIds.add(
                trickId
              );
            }

            saveFavoriteIds(
              user,
              favoriteIds
            );

            renderResults();
          }
        );
      });

    document
      .querySelectorAll(
        ".open-magic-lesson-button"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const selectedTrick =
              publishedTricks.find(
                (trick) =>
                  trick.id ===
                  button.dataset.trickId
              );

            if (selectedTrick) {
              actions.onOpenLesson(
                selectedTrick
              );
            }
          }
        );
      });

    document
      .querySelectorAll(
        ".start-magic-quiz-button"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const selectedTrick =
              publishedTricks.find(
                (trick) =>
                  trick.id ===
                  button.dataset.trickId
              );

            if (selectedTrick) {
              actions.onStartQuiz(
                selectedTrick
              );
            }
          }
        );
      });
  }

  app.innerHTML = `
    <main class="page">
      <section
        class="
          card
          wide-card
          magic-library-page
        "
      >
        <header class="magic-library-header">
          <button
            id="backFromMagicButton"
            class="back-button"
            type="button"
          >
            ← Dashboard
          </button>

          <div class="magic-library-hero">
            <div class="magic-library-hero-icon">
              ✨
            </div>

            <div>
              <p class="eyebrow">
                MEMORIZZA PIÙ VELOCEMENTE
              </p>

              <h1>
                Trucco Magico
              </h1>

              <p class="subtitle">
                Piccoli trucchi per ricordare
                le regole più importanti
                della patente.
              </p>
            </div>
          </div>
        </header>

        <section class="magic-library-toolbar">
          <label class="magic-search-field">
            <span>🔍</span>

            <input
              id="magicSearchInput"
              type="search"
              placeholder="
                Cerca un segnale,
                una regola o una parola...
              "
              autocomplete="off"
            />
          </label>

          <select
            id="magicArgomentoFilter"
            class="magic-argomento-filter"
          >
            <option value="all">
              Tutti gli argomenti
            </option>

            ${[...argomenti]
              .sort(
                (first, second) =>
                  first.order -
                  second.order
              )
              .map(
                (argomento) => `
                  <option
                    value="${argomento.id}"
                  >
                    ${argomento.icon}
                    ${argomento.title}
                  </option>
                `
              )
              .join("")}
          </select>

          <button
            id="magicFavoritesOnlyButton"
            class="
              btn
              btn-secondary
              magic-favorites-filter
            "
            type="button"
          >
            ⭐ Preferiti
          </button>
        </section>

        <div class="magic-library-results-header">
          <strong id="magicTricksCount">
            0 trucchi trovati
          </strong>

          <span>
            I preferiti vengono salvati
            su questo dispositivo.
          </span>
        </div>

        <section
          id="magicTricksResults"
          class="magic-library-grid"
        ></section>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#backFromMagicButton"
    )
    .addEventListener(
      "click",
      actions.onBack
    );

  document
    .querySelector(
      "#magicSearchInput"
    )
    .addEventListener(
      "input",
      (event) => {
        state.searchText =
          event.target.value;

        renderResults();
      }
    );

  document
    .querySelector(
      "#magicArgomentoFilter"
    )
    .addEventListener(
      "change",
      (event) => {
        state.selectedArgomentoId =
          event.target.value;

        renderResults();
      }
    );

  const favoritesButton =
    document.querySelector(
      "#magicFavoritesOnlyButton"
    );

  favoritesButton.addEventListener(
    "click",
    () => {
      state.favoritesOnly =
        !state.favoritesOnly;

      favoritesButton.classList.toggle(
        "magic-filter-active",
        state.favoritesOnly
      );

      renderResults();
    }
  );

  renderResults();
}