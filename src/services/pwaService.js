import {
  registerSW
} from "virtual:pwa-register";

let pwaUpdateAction = null;
let pwaToastTimerId = null;

function removePwaToast() {
  document
    .querySelector(
      "#pwaStatusToast"
    )
    ?.remove();

  if (pwaToastTimerId) {
    window.clearTimeout(
      pwaToastTimerId
    );

    pwaToastTimerId = null;
  }
}

function showPwaToast({
  message,
  type = "info",
  actionLabel = "",
  onAction = null,
  persistent = false
}) {
  removePwaToast();

  const toast =
    document.createElement("aside");

  toast.id = "pwaStatusToast";

  toast.className =
    `pwa-status-toast pwa-status-${type}`;

  toast.setAttribute(
    "role",
    type === "error"
      ? "alert"
      : "status"
  );

  toast.innerHTML = `
    <div class="pwa-status-content">
      <span class="pwa-status-icon">
        ${
          type === "success"
            ? "✅"
            : type === "warning"
              ? "⚠️"
              : type === "error"
                ? "❌"
                : "ℹ️"
        }
      </span>

      <p>${message}</p>
    </div>

    <div class="pwa-status-actions">
      ${
        actionLabel
          ? `
              <button
                id="pwaStatusAction"
                class="pwa-status-action"
                type="button"
              >
                ${actionLabel}
              </button>
            `
          : ""
      }

      <button
        id="pwaStatusClose"
        class="pwa-status-close"
        type="button"
        aria-label="Chiudi"
      >
        ×
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  document
    .querySelector(
      "#pwaStatusClose"
    )
    ?.addEventListener(
      "click",
      removePwaToast
    );

  document
    .querySelector(
      "#pwaStatusAction"
    )
    ?.addEventListener(
      "click",
      async () => {
        const action = onAction;

        removePwaToast();

        if (
          typeof action ===
          "function"
        ) {
          await action();
        }
      }
    );

  if (!persistent) {
    pwaToastTimerId =
      window.setTimeout(
        removePwaToast,
        5000
      );
  }
}

function installPwaStyles() {
  if (
    document.querySelector(
      "#pwaStatusStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "pwaStatusStyles";

  style.textContent = `
    .pwa-status-toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      width: min(430px, calc(100% - 36px));
      padding: 14px 16px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 16px;
      background: #ffffff;
      color: #0f172a;
      box-shadow:
        0 20px 45px
        rgba(15, 23, 42, 0.18);
      animation:
        pwa-toast-enter
        180ms ease-out;
    }

    .pwa-status-content {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .pwa-status-content p {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.4;
    }

    .pwa-status-icon {
      flex: 0 0 auto;
    }

    .pwa-status-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }

    .pwa-status-action,
    .pwa-status-close {
      border: 0;
      border-radius: 10px;
      cursor: pointer;
      font: inherit;
    }

    .pwa-status-action {
      padding: 8px 12px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
    }

    .pwa-status-close {
      width: 32px;
      height: 32px;
      background: #f1f5f9;
      color: #475569;
      font-size: 1.25rem;
      line-height: 1;
    }

    .pwa-status-success {
      border-left:
        5px solid #16a34a;
    }

    .pwa-status-warning {
      border-left:
        5px solid #f59e0b;
    }

    .pwa-status-error {
      border-left:
        5px solid #dc2626;
    }

    .pwa-status-info {
      border-left:
        5px solid #2563eb;
    }

    @keyframes pwa-toast-enter {
      from {
        opacity: 0;
        transform:
          translateY(12px);
      }

      to {
        opacity: 1;
        transform:
          translateY(0);
      }
    }

    @media (max-width: 560px) {
      .pwa-status-toast {
        right: 12px;
        bottom: 12px;
        width: calc(100% - 24px);
        align-items: flex-start;
      }

      .pwa-status-actions {
        align-self: center;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}

function handleOfflineStatus() {
  showPwaToast({
    message:
      "Sei offline. I dati disponibili restano accessibili sul dispositivo.",
    type: "warning",
    persistent: true
  });
}

function handleOnlineStatus() {
  showPwaToast({
    message:
      "Connessione ripristinata.",
    type: "success"
  });

  window.dispatchEvent(
    new CustomEvent(
      "msh:connection-restored"
    )
  );
}

export function initializePwa() {
  installPwaStyles();

  pwaUpdateAction =
    registerSW({
      immediate: true,

      onNeedRefresh() {
        showPwaToast({
          message:
            "È disponibile una nuova versione dell'app.",
          type: "info",
          actionLabel:
            "Aggiorna",
          persistent: true,

          onAction: async () => {
            await pwaUpdateAction?.(
              true
            );
          }
        });
      },

      onOfflineReady() {
        showPwaToast({
          message:
            "L'app è pronta per essere utilizzata offline.",
          type: "success"
        });
      },

      onRegisteredSW(
        serviceWorkerUrl,
        registration
      ) {
        console.info(
          "PWA registrata:",
          serviceWorkerUrl
        );

        if (!registration) {
          return;
        }

        const updateIntervalMs =
          60 * 60 * 1000;

        window.setInterval(
          async () => {
            if (
              registration.installing ||
              !navigator.onLine
            ) {
              return;
            }

            try {
              const response =
                await fetch(
                  serviceWorkerUrl,
                  {
                    cache:
                      "no-store",

                    headers: {
                      cache:
                        "no-store",

                      "cache-control":
                        "no-cache"
                    }
                  }
                );

              if (
                response.status === 200
              ) {
                await registration.update();
              }
            } catch (error) {
              console.warn(
                "PWA update check error:",
                error
              );
            }
          },
          updateIntervalMs
        );
      },

      onRegisterError(error) {
        console.error(
          "PWA registration error:",
          error
        );
      }
    });

  window.addEventListener(
    "offline",
    handleOfflineStatus
  );

  window.addEventListener(
    "online",
    handleOnlineStatus
  );

  if (!navigator.onLine) {
    handleOfflineStatus();
  }
}