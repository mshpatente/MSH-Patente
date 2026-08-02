import {
  getItalianBanglaEntries,
  searchItalianBanglaDictionary
} from "../data/italianBanglaDictionary.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInitial(word = "") {
  return String(word)
    .charAt(0)
    .toLocaleUpperCase("it-IT");
}

export function showDictionaryPage({
  container,
  onBack
}) {
  const allEntries =
    getItalianBanglaEntries();

  const state = {
    search: "",
    initial: "all",
    selectedWord: ""
  };

  const initials = Array.from(
    new Set(
      allEntries
        .map((entry) =>
          getInitial(entry.word)
        )
        .filter(Boolean)
    )
  ).sort((a, b) =>
    a.localeCompare(b, "it")
  );

  function getVisibleEntries() {
    return searchItalianBanglaDictionary(
      state.search
    ).filter((entry) =>
      state.initial === "all" ||
      getInitial(entry.word) ===
        state.initial
    );
  }

  function renderDetail(entry) {
    const detail = container.querySelector(
      "#dictionaryDetail"
    );

    if (!detail) return;

    if (!entry) {
      detail.innerHTML = `
        <div class="dictionary-detail-empty">
          <span>📖</span>
          <h2>Seleziona una parola</h2>
          <p>
            Tocca una parola per leggere
            significato, spiegazione ed esempi.
          </p>
        </div>
      `;
      return;
    }

    state.selectedWord = entry.word;

    detail.innerHTML = `
      <article class="dictionary-detail-card">
        <p class="eyebrow">🇮🇹 ITALIANO</p>
        <h2>${escapeHtml(entry.word)}</h2>

        <section>
          <span>🇧🇩 বাংলা অর্থ</span>
          <strong lang="bn">
            ${escapeHtml(entry.bn || "—")}
          </strong>
        </section>

        ${entry.explanation ? `
          <section>
            <span>📘 সহজ ব্যাখ্যা</span>
            <p lang="bn">
              ${escapeHtml(entry.explanation)}
            </p>
          </section>
        ` : ""}

        ${entry.exampleItalian || entry.exampleBangla ? `
          <section>
            <span>📝 উদাহরণ</span>
            ${entry.exampleItalian ? `
              <p lang="it">
                ${escapeHtml(entry.exampleItalian)}
              </p>
            ` : ""}
            ${entry.exampleBangla ? `
              <p lang="bn">
                ${escapeHtml(entry.exampleBangla)}
              </p>
            ` : ""}
          </section>
        ` : ""}
      </article>
    `;
  }

  function bindEntryButtons() {
    container
      .querySelectorAll(
        "[data-dictionary-word]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const entry = allEntries.find(
              (item) =>
                item.word ===
                button.dataset.dictionaryWord
            );

            renderDetail(entry);

            container
              .querySelectorAll(
                "[data-dictionary-word]"
              )
              .forEach((item) =>
                item.classList.toggle(
                  "active",
                  item === button
                )
              );
          }
        );
      });
  }

  function renderList() {
    const entries = getVisibleEntries();
    const list = container.querySelector(
      "#dictionaryEntryList"
    );
    const count = container.querySelector(
      "#dictionaryResultCount"
    );

    if (!list || !count) return;

    count.textContent =
      `${entries.length} parole`;

    list.innerHTML = entries.length
      ? entries.map((entry) => `
          <button
            class="dictionary-entry-button ${
              state.selectedWord === entry.word
                ? "active"
                : ""
            }"
            data-dictionary-word="${escapeHtml(entry.word)}"
            type="button"
          >
            <span class="dictionary-entry-letter">
              ${escapeHtml(getInitial(entry.word))}
            </span>
            <span>
              <strong>${escapeHtml(entry.word)}</strong>
              <small lang="bn">${escapeHtml(entry.bn || "")}</small>
            </span>
            <span>›</span>
          </button>
        `).join("")
      : `
          <div class="dictionary-empty-state">
            <span>🔍</span>
            <h2>Nessuna parola trovata</h2>
            <p>Prova una ricerca diversa.</p>
          </div>
        `;

    bindEntryButtons();
  }

  container.innerHTML = `
    <main class="page dictionary-page">
      <section class="card wide-card dictionary-shell">
        <header class="dictionary-header">
          <div>
            <button
              id="dictionaryBackButton"
              class="back-button"
              type="button"
            >
              ← Dashboard
            </button>
            <p class="eyebrow">VOCABOLARIO PATENTE B</p>
            <h1>Dizionario stradale</h1>
            <p class="subtitle">
              Italiano → বাংলা: parole, significati,
              spiegazioni ed esempi per lo studio.
            </p>
          </div>
          <div class="dictionary-total-badge">
            <strong>${allEntries.length}</strong>
            <span>parole</span>
          </div>
        </header>

        <div class="dictionary-toolbar">
          <input
            id="dictionarySearchInput"
            type="search"
            placeholder="🔍 Cerca in italiano o বাংলা..."
            autocomplete="off"
          />
          <span id="dictionaryResultCount">
            ${allEntries.length} parole
          </span>
        </div>

        <div class="dictionary-alphabet" role="group">
          <button class="active" data-initial="all" type="button">Tutte</button>
          ${initials.map((initial) => `
            <button data-initial="${escapeHtml(initial)}" type="button">
              ${escapeHtml(initial)}
            </button>
          `).join("")}
        </div>

        <div class="dictionary-layout">
          <section id="dictionaryEntryList" class="dictionary-entry-list"></section>
          <aside id="dictionaryDetail" class="dictionary-detail"></aside>
        </div>

        <p class="dictionary-disclaimer">
          Materiale didattico semplificato; per le norme fa fede
          il Codice della Strada e il materiale ministeriale vigente.
        </p>
      </section>
    </main>
  `;

  container
    .querySelector("#dictionaryBackButton")
    ?.addEventListener("click", onBack);

  container
    .querySelector("#dictionarySearchInput")
    ?.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderList();
    });

  container
    .querySelectorAll("[data-initial]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        state.initial = button.dataset.initial;
        container
          .querySelectorAll("[data-initial]")
          .forEach((item) =>
            item.classList.toggle("active", item === button)
          );
        renderList();
      });
    });

  renderList();
  renderDetail(null);
}
