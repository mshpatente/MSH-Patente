import {
  FOUNDER
} from "../config/founder.js";

const FOUNDER_IMAGE_STORAGE_KEY =
  "msh-founder-photo";

function getFounderPhoto() {
  return (
    localStorage.getItem(
      FOUNDER_IMAGE_STORAGE_KEY
    ) ||
    FOUNDER.photo ||
    ""
  );
}

function createSocialLink(
  name,
  label,
  icon
) {
  const url =
    FOUNDER.social?.[name] || "#";

  const isAvailable =
    url !== "#" &&
    url.trim() !== "";

  if (!isAvailable) {
    return `
      <span
        class="
          founder-social-link
          founder-social-disabled
        "
        title="Link da aggiungere"
      >
        <span aria-hidden="true">
          ${icon}
        </span>

        ${label}
      </span>
    `;
  }

  return `
    <a
      class="founder-social-link"
      href="${url}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${label} di ${FOUNDER.name}"
    >
      <span aria-hidden="true">
        ${icon}
      </span>

      ${label}
    </a>
  `;
}

function getFounderInitials() {
  return FOUNDER.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function optimizeFounderPhoto(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.addEventListener(
        "error",
        () => {
          reject(
            new Error(
              "Impossibile leggere la foto."
            )
          );
        }
      );

      reader.addEventListener(
        "load",
        () => {
          const image =
            new Image();

          image.addEventListener(
            "error",
            () => {
              reject(
                new Error(
                  "Formato immagine non valido."
                )
              );
            }
          );

          image.addEventListener(
            "load",
            () => {
              const outputSize = 500;

              const sourceSize =
                Math.min(
                  image.naturalWidth,
                  image.naturalHeight
                );

              const sourceX =
                (
                  image.naturalWidth -
                  sourceSize
                ) / 2;

              const sourceY =
                (
                  image.naturalHeight -
                  sourceSize
                ) / 2;

              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                outputSize;

              canvas.height =
                outputSize;

              const context =
                canvas.getContext("2d");

              if (!context) {
                reject(
                  new Error(
                    "Canvas non disponibile."
                  )
                );

                return;
              }

              context.drawImage(
                image,
                sourceX,
                sourceY,
                sourceSize,
                sourceSize,
                0,
                0,
                outputSize,
                outputSize
              );

              const optimizedImage =
                canvas.toDataURL(
                  "image/jpeg",
                  0.82
                );

              resolve(
                optimizedImage
              );
            }
          );

          image.src =
            String(reader.result || "");
        }
      );

      reader.readAsDataURL(file);
    }
  );
}

export function renderFounderFooter(
  canEditPhoto = false
) {
  const founderPhoto =
    getFounderPhoto();
const founderInitials =
  getFounderInitials();

const hasFounderPhoto =
  founderPhoto.trim() !== "";


  return `
    <footer class="founder-footer">
      <div class="founder-profile">
        <div class="founder-photo-wrapper">
          <div class="founder-photo-frame">
  <div
    id="founderPhotoFallback"
    class="
      founder-photo
      founder-photo-fallback
      ${hasFounderPhoto ? "is-hidden" : ""}
    "
    aria-hidden="${hasFounderPhoto}"
  >
    ${founderInitials}
  </div>

  <img
    id="founderPhoto"
    class="
      founder-photo
      ${hasFounderPhoto ? "" : "is-hidden"}
    "
    src="${founderPhoto}"
    alt="${FOUNDER.name}"
    width="110"
    height="110"
  />
</div>

        ${
  canEditPhoto
    ? `
        <div class="founder-photo-actions">
  <label
    class="founder-photo-upload"
    for="founderPhotoInput"
  >
    Cambia foto
  </label>

  <button
    id="removeFounderPhotoButton"
    class="founder-photo-remove"
    type="button"
  >
    Rimuovi
  </button>
</div>

<input
  id="founderPhotoInput"
  class="founder-photo-input"
  type="file"
  accept="
    image/png,
    image/jpeg,
    image/webp
  "
/>
      `
    : ""
}
        </div>

        <div class="founder-details">
          <p class="founder-label">
            ${FOUNDER.title}
          </p>

          <h2 class="founder-name">
            ${FOUNDER.name}
          </h2>

          <p class="founder-organization">
            ${FOUNDER.organization}
          </p>

          <address class="founder-address">
            ${FOUNDER.address}
          </address>
        </div>
      </div>

      <nav
        class="founder-social-list"
        aria-label="Social media del founder"
      >
        ${createSocialLink(
          "facebook",
          "Facebook",
          "f"
        )}

        ${createSocialLink(
          "instagram",
          "Instagram",
          "◎"
        )}

        ${createSocialLink(
          "youtube",
          "YouTube",
          "▶"
        )}

        ${createSocialLink(
          "linkedin",
          "LinkedIn",
          "in"
        )}

        ${createSocialLink(
          "whatsapp",
          "WhatsApp",
          "✆"
        )}
      </nav>

      <p class="founder-copyright">
        © ${new Date().getFullYear()}
        ${FOUNDER.organization}
      </p>
    </footer>
  `;
}

export function initializeFounderFooter() {
  const photoInput =
    document.querySelector(
      "#founderPhotoInput"
    );
const fallbackElement =
  document.querySelector(
    "#founderPhotoFallback"
  );

  const removeButton =
  document.querySelector(
    "#removeFounderPhotoButton"
  );

  const photoElement =
    document.querySelector(
      "#founderPhoto"
    );

  if (
  !photoInput ||
  !photoElement ||
  !fallbackElement
) {
  return;
}

photoElement.addEventListener(
  "error",
  () => {
    photoElement.classList.add(
      "is-hidden"
    );

    fallbackElement.classList.remove(
      "is-hidden"
    );

    fallbackElement.setAttribute(
      "aria-hidden",
      "false"
    );
  }
);

removeButton?.addEventListener(
  "click",
  () => {
    const shouldRemove =
      window.confirm(
        "Vuoi rimuovere la foto del founder?"
      );

    if (!shouldRemove) {
      return;
    }

    localStorage.removeItem(
      FOUNDER_IMAGE_STORAGE_KEY
    );

    photoElement.removeAttribute(
      "src"
    );

    photoElement.classList.add(
      "is-hidden"
    );

    fallbackElement.classList.remove(
      "is-hidden"
    );

    fallbackElement.setAttribute(
      "aria-hidden",
      "false"
    );

    photoInput.value = "";
  }
);

  photoInput.addEventListener(
  "change",
  async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith("image/")
      ) {
        alert(
          "Seleziona un file immagine valido."
        );

        return;
      }

      const maxFileSize =
        2 * 1024 * 1024;

      if (
        file.size > maxFileSize
      ) {
        alert(
          "La foto deve essere inferiore a 2 MB."
        );

        event.target.value = "";

        return;
      }

      try {
  const imageData =
    await optimizeFounderPhoto(
      file
    );

  localStorage.setItem(
    FOUNDER_IMAGE_STORAGE_KEY,
    imageData
  );

  photoElement.src =
    imageData;

  photoElement.classList.remove(
    "is-hidden"
  );

  fallbackElement.classList.add(
    "is-hidden"
  );

  fallbackElement.setAttribute(
    "aria-hidden",
    "true"
  );

  event.target.value = "";
} catch (error) {
  console.error(
    "Founder photo optimization error:",
    error
  );

  alert(
    "Non è stato possibile elaborare la foto."
  );

  event.target.value = "";
}
    }
  );
}