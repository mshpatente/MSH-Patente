import { getItalianBanglaEntry } from "../data/italianBanglaDictionary.js";

const POPUP_ID = "italianBanglaDictionaryPopup";
const INTERACTIVE_SELECTOR = [
  "button", "a", "input", "textarea", "select", "option", "audio", "video", "[contenteditable='true']"
].join(",");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function removeDictionaryPopup() {
  document.querySelector(`#${POPUP_ID}`)?.remove();
}

function getTextPositionFromPoint(clientX, clientY, container) {
  let nativePosition = null;

  if (typeof document.caretPositionFromPoint === "function") {
    const position = document.caretPositionFromPoint(
      clientX,
      clientY
    );

    if (position) {
      nativePosition = {
        node: position.offsetNode,
        offset: position.offset
      };
    }
  }

  if (
    !nativePosition &&
    typeof document.caretRangeFromPoint === "function"
  ) {
    const range = document.caretRangeFromPoint(
      clientX,
      clientY
    );

    if (range) {
      nativePosition = {
        node: range.startContainer,
        offset: range.startOffset
      };
    }
  }

  if (
    nativePosition?.node &&
    container?.contains(nativePosition.node)
  ) {
    return nativePosition;
  }

  /*
   * iPhone/iPad Safari fallback:
   * tapped coordinate-এর নিচে থাকা প্রতিটি text word পরীক্ষা করে।
   */
  const tappedElement = document.elementFromPoint(
    clientX,
    clientY
  );

  if (
    !tappedElement ||
    !container?.contains(tappedElement)
  ) {
    return null;
  }

  const walker = document.createTreeWalker(
    tappedElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return String(node.textContent || "").trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const wordPattern =
    /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)*/gu;

  let textNode = walker.nextNode();

  while (textNode) {
    const text = String(textNode.textContent || "");
    let match;

    wordPattern.lastIndex = 0;

    while ((match = wordPattern.exec(text)) !== null) {
      const range = document.createRange();

      try {
        range.setStart(textNode, match.index);
        range.setEnd(
          textNode,
          match.index + match[0].length
        );

        const rectangles = Array.from(
          range.getClientRects()
        );

        const tappedWord = rectangles.some((rect) => {
          const extraSpace = 8;

          return (
            clientX >= rect.left - extraSpace &&
            clientX <= rect.right + extraSpace &&
            clientY >= rect.top - extraSpace &&
            clientY <= rect.bottom + extraSpace
          );
        });

        if (tappedWord) {
          return {
            node: textNode,
            offset:
              match.index +
              Math.floor(match[0].length / 2)
          };
        }
      } catch (error) {
        console.warn(
          "Dictionary Safari fallback error:",
          error
        );
      }
    }

    textNode = walker.nextNode();
  }

  return null;
}

function getWordAtPosition(node, offset) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = String(node.textContent || "");
  const safeOffset = Math.max(0, Math.min(Number(offset) || 0, text.length));
  const pattern = /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)*/gu;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (safeOffset >= start && safeOffset <= end) {
      return { word: match[0], node, start, end };
    }
  }

  return null;
}

function getWordRectangle(result) {
  try {
    const range = document.createRange();
    range.setStart(result.node, result.start);
    range.setEnd(result.node, result.end);
    return range.getBoundingClientRect();
  } catch (error) {
    console.warn("Dictionary word position error:", error);
    return null;
  }
}

function positionPopup(popup, rect) {
  const padding = 12;
  const gap = 10;
  const popupRect = popup.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - popupRect.width / 2;
  left = Math.max(padding, Math.min(left, window.innerWidth - popupRect.width - padding));
  let top = rect.bottom + gap;
  if (top + popupRect.height + padding > window.innerHeight) {
    top = rect.top - popupRect.height - gap;
  }
  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(Math.max(padding, top))}px`;
}

function showDictionaryPopup(entry, rect) {
  removeDictionaryPopup();

  const word = entry.word || "";
  const bangla = entry.bn || "";
  const explanation = entry.explanation || "";
  const exampleItalian = entry.exampleItalian || "";
  const exampleBangla = entry.exampleBangla || "";

  const popup = document.createElement("aside");

  popup.id = POPUP_ID;
  popup.className = "tap-dictionary-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "false");
  popup.setAttribute(
    "aria-label",
    `Traduzione di ${word}`
  );

  popup.innerHTML = `
    <button
      id="closeTapDictionaryButton"
      class="tap-dictionary-close"
      type="button"
      aria-label="Chiudi traduzione"
    >
      ✕
    </button>

    <section class="tap-dictionary-section">
      <p class="tap-dictionary-label">
        🇮🇹 ITALIANO
      </p>

      <h3 class="tap-dictionary-word">
        ${escapeHtml(word)}
      </h3>
    </section>

    <section class="tap-dictionary-section">
      <p class="tap-dictionary-label">
        🇧🇩 বাংলা অর্থ
      </p>

      <p
        class="tap-dictionary-meaning"
        lang="bn"
      >
        ${escapeHtml(bangla)}
      </p>
    </section>

    ${
      explanation
        ? `
          <section
            class="tap-dictionary-explanation"
            lang="bn"
          >
            <p class="tap-dictionary-label">
              📖 সহজ ব্যাখ্যা
            </p>

            <p>
              ${escapeHtml(explanation)}
            </p>
          </section>
        `
        : ""
    }

    ${
      exampleItalian || exampleBangla
        ? `
          <section class="tap-dictionary-example">
            <p class="tap-dictionary-label">
              📝 উদাহরণ
            </p>

            ${
              exampleItalian
                ? `
                  <p
                    class="tap-dictionary-example-italian"
                    lang="it"
                  >
                    ${escapeHtml(exampleItalian)}
                  </p>
                `
                : ""
            }

            ${
              exampleBangla
                ? `
                  <p
                    class="tap-dictionary-example-bangla"
                    lang="bn"
                  >
                    ${escapeHtml(exampleBangla)}
                  </p>
                `
                : ""
            }
          </section>
        `
        : ""
    }
  `;

  document.body.appendChild(popup);
  positionPopup(popup, rect);

  popup
    .querySelector("#closeTapDictionaryButton")
    ?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        removeDictionaryPopup();
      }
    );
}

function handleDictionaryTap(
  event,
  container,
  clientX = event.clientX,
  clientY = event.clientY
) {
  const target =
    event.target instanceof Element
      ? event.target
      : event.target?.parentElement;

  if (target?.closest(INTERACTIVE_SELECTOR)) {
    return;
  }

  if (
    !Number.isFinite(clientX) ||
    !Number.isFinite(clientY)
  ) {
    removeDictionaryPopup();
    return;
  }

  const position = getTextPositionFromPoint(
    clientX,
    clientY,
    container
  );

  if (
    !position ||
    !position.node ||
    !container.contains(position.node)
  ) {
    removeDictionaryPopup();
    return;
  }

  const result = getWordAtPosition(
    position.node,
    position.offset
  );

  const entry = result
    ? getItalianBanglaEntry(result.word)
    : null;

  if (!result || !entry) {
    removeDictionaryPopup();
    return;
  }

  const rect = getWordRectangle(result);

  if (rect) {
    showDictionaryPopup(entry, rect);
  }
}

export function enableTapDictionary(container) {
  if (!container) {
    return () => {};
  }

  let lastTouchTime = 0;

  const onContainerClick = (event) => {
    /*
     * touchend-এর পরে Safari একটি synthetic click পাঠাতে পারে।
     * একই tap দুইবার process হওয়া বন্ধ করা হচ্ছে।
     */
    if (Date.now() - lastTouchTime < 700) {
      return;
    }

    handleDictionaryTap(event, container);
  };

  const onContainerTouchEnd = (event) => {
    const touch = event.changedTouches?.[0];

    if (!touch) {
      return;
    }

    lastTouchTime = Date.now();

    handleDictionaryTap(
      event,
      container,
      touch.clientX,
      touch.clientY
    );
  };

  const onDocumentClick = (event) => {
    const popup = document.querySelector(
      `#${POPUP_ID}`
    );

    const target =
      event.target instanceof Node
        ? event.target
        : null;

    if (
      popup &&
      target &&
      !popup.contains(target) &&
      !container.contains(target)
    ) {
      removeDictionaryPopup();
    }
  };

  const onEscape = (event) => {
    if (event.key === "Escape") {
      removeDictionaryPopup();
    }
  };

  const onViewportChange = () => {
    removeDictionaryPopup();
  };

  container.addEventListener(
    "click",
    onContainerClick
  );

  container.addEventListener(
    "touchend",
    onContainerTouchEnd,
    {
      passive: true
    }
  );

  document.addEventListener(
    "click",
    onDocumentClick
  );

  document.addEventListener(
    "keydown",
    onEscape
  );

  window.addEventListener(
    "resize",
    onViewportChange
  );

  window.addEventListener(
    "scroll",
    onViewportChange,
    true
  );

  return () => {
    removeDictionaryPopup();

    container.removeEventListener(
      "click",
      onContainerClick
    );

    container.removeEventListener(
      "touchend",
      onContainerTouchEnd
    );

    document.removeEventListener(
      "click",
      onDocumentClick
    );

    document.removeEventListener(
      "keydown",
      onEscape
    );

    window.removeEventListener(
      "resize",
      onViewportChange
    );

    window.removeEventListener(
      "scroll",
      onViewportChange,
      true
    );
  };
}

export function closeTapDictionary() {
  removeDictionaryPopup();
}
