import {
  grantPremiumAccess,
  loadPremiumUsers,
  resetPremiumDevice,
  revokePremiumAccess
} from "../services/premiumAccessService.js";

import {
  loadAllSubtopicAccess,
  saveMultipleSubtopicAccess,
  saveSubtopicAccess
} from "../services/subtopicAccessService.js";

import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

import {
  officialSubtopics as subtopics
} from "../data/officialSubtopics.js";

function escapeHtml(
  value = ""
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  let date = null;

  if (
    typeof value.toDate ===
    "function"
  ) {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl
    .DateTimeFormat(
      "it-IT",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    )
    .format(date);
}

function getPremiumLabel(
  user
) {
  if (
    user.role === "admin"
  ) {
    return "Amministratore";
  }

  if (
    user.premiumAccess
      .enabled !== true
  ) {
    return "Non Premium";
  }

  if (
    user.premiumAccess
      .unlimited === true
  ) {
    return "Premium illimitato";
  }

  if (
    user.premiumAllowed ===
    true
  ) {
    return "Premium attivo";
  }

  if (
    user.premiumReason ===
    "premium_expired"
  ) {
    return "Premium scaduto";
  }

  return "Premium non valido";
}

function getPremiumClass(
  user
) {
  if (
    user.role === "admin"
  ) {
    return "admin-premium-badge-admin";
  }

  if (
    user.premiumAllowed ===
    true
  ) {
    return "admin-premium-badge-active";
  }

  if (
    user.premiumReason ===
    "premium_expired"
  ) {
    return "admin-premium-badge-expired";
  }

  return "admin-premium-badge-inactive";
}

function getDeviceLabel(
  user
) {
  const device =
    user.authorizedDevice;

  if (
    device.status === "active" &&
    device.deviceIdHash
  ) {
    return "Dispositivo collegato";
  }

  if (
    device.status === "reset"
  ) {
    return "In attesa del nuovo dispositivo";
  }

  return "Nessun dispositivo";
}

export async function showAdminPremiumUsers({
  container =
    document.querySelector(
      "#app"
    ),

  user,
  onBack
}) {
  if (!container) {
    throw new Error(
      "Contenitore amministratore non trovato."
    );
  }

  const state = {
    users: [],
    searchText: "",
    filter: "all",
    loading: true,
    busyUserId: "",
    message: "",
    messageType: "",

    activeTab: "users",
    subtopicAccessMap: new Map(),
    subtopicSearchText: "",
    selectedArgomentoId: "",
    selectedTopicId: "",
    selectedSubtopicIds:
      new Set(),
    busySubtopicId: "",
    subtopicsLoading: false
  };

  function setMessage(
    message,
    type = "success"
  ) {
    state.message =
      String(message || "");

    state.messageType =
      type;

    const messageElement =
      container.querySelector(
        "#adminPremiumMessage"
      );

    if (messageElement) {
      messageElement.textContent =
        state.message;

      messageElement.className =
        `admin-premium-message ${
          type === "error"
            ? "admin-premium-message-error"
            : "admin-premium-message-success"
        }`;
    }
  }

  function getFilteredUsers() {
    const searchText =
      state.searchText
        .toLowerCase()
        .trim();

    return state.users.filter(
      (premiumUser) => {
        const searchableText =
          [
            premiumUser.name,
            premiumUser.email,
            premiumUser.uid
          ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          !searchText ||
          searchableText.includes(
            searchText
          );

        let matchesFilter =
          true;

        if (
          state.filter ===
          "premium"
        ) {
          matchesFilter =
            premiumUser
              .premiumAllowed ===
            true;
        }

        if (
          state.filter ===
          "non-premium"
        ) {
          matchesFilter =
            premiumUser.role !==
              "admin" &&
            premiumUser
              .premiumAllowed !==
              true;
        }

        if (
          state.filter ===
          "expired"
        ) {
          matchesFilter =
            premiumUser
              .premiumReason ===
            "premium_expired";
        }

        if (
          state.filter ===
          "device"
        ) {
          matchesFilter =
            premiumUser
              .authorizedDevice
              .status ===
              "active" &&
            Boolean(
              premiumUser
                .authorizedDevice
                .deviceIdHash
            );
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }

  function renderUserCard(
    premiumUser
  ) {
    const isAdmin =
      premiumUser.role ===
      "admin";

    const busy =
      state.busyUserId ===
      premiumUser.uid;

    return `
      <article
        class="
          admin-premium-user-card
          ${
            premiumUser
              .premiumAllowed
              ? "admin-premium-user-active"
              : ""
          }
        "
      >
        <header
          class="
            admin-premium-user-header
          "
        >
          <div
            class="
              admin-premium-user-avatar
            "
          >
            ${escapeHtml(
              premiumUser.name
                .charAt(0)
                .toUpperCase() ||
              "U"
            )}
          </div>

          <div
            class="
              admin-premium-user-identity
            "
          >
            <strong>
              ${escapeHtml(
                premiumUser.name
              )}
            </strong>

            <span>
              ${escapeHtml(
                premiumUser.email ||
                "Email non disponibile"
              )}
            </span>

            <small>
              UID:
              ${escapeHtml(
                premiumUser.uid
              )}
            </small>
          </div>

          <span
            class="
              admin-premium-badge
              ${getPremiumClass(
                premiumUser
              )}
            "
          >
            ${escapeHtml(
              getPremiumLabel(
                premiumUser
              )
            )}
          </span>
        </header>

        <div
          class="
            admin-premium-user-details
          "
        >
          <div>
            <span>
              Scadenza
            </span>

            <strong>
              ${
                premiumUser
                  .premiumAccess
                  .unlimited
                  ? "Senza scadenza"
                  : escapeHtml(
                      formatDate(
                        premiumUser
                          .premiumAccess
                          .expiresAt
                      )
                    )
              }
            </strong>
          </div>

          <div>
            <span>
              Dispositivo
            </span>

            <strong>
              ${escapeHtml(
                getDeviceLabel(
                  premiumUser
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Ultima attività dispositivo
            </span>

            <strong>
              ${escapeHtml(
                formatDate(
                  premiumUser
                    .authorizedDevice
                    .lastSeenAt
                )
              )}
            </strong>
          </div>
        </div>

        ${
          isAdmin
            ? `
                <div
                  class="
                    admin-premium-admin-note
                  "
                >
                  Gli amministratori hanno
                  accesso completo e non
                  richiedono un abbonamento.
                </div>
              `
            : `
                <div
                  class="
                    admin-premium-user-controls
                  "
                >
                  <label>
                    <span>
                      Durata
                    </span>

                    <select
                      data-premium-duration="${escapeHtml(
                        premiumUser.uid
                      )}"
                      ${busy
                        ? "disabled"
                        : ""}
                    >
                      <option value="7">
                        7 giorni
                      </option>

                      <option value="15">
                        15 giorni
                      </option>

                      <option
                        value="30"
                        selected
                      >
                        30 giorni
                      </option>

                      <option value="60">
                        60 giorni
                      </option>

                      <option value="90">
                        90 giorni
                      </option>

                      <option value="180">
                        180 giorni
                      </option>

                      <option value="365">
                        365 giorni
                      </option>
                    </select>
                  </label>

                  <button
                    class="
                      btn
                      btn-primary
                    "
                    data-premium-action="grant"
                    data-user-id="${escapeHtml(
                      premiumUser.uid
                    )}"
                    type="button"
                    ${busy
                      ? "disabled"
                      : ""}
                  >
                    ✅ Attiva Premium
                  </button>

                  <button
                    class="
                      btn
                      btn-secondary
                    "
                    data-premium-action="unlimited"
                    data-user-id="${escapeHtml(
                      premiumUser.uid
                    )}"
                    type="button"
                    ${busy
                      ? "disabled"
                      : ""}
                  >
                    ♾️ Illimitato
                  </button>

                  <button
                    class="
                      btn
                      btn-secondary
                    "
                    data-premium-action="reset-device"
                    data-user-id="${escapeHtml(
                      premiumUser.uid
                    )}"
                    type="button"
                    ${busy
                      ? "disabled"
                      : ""}
                  >
                    📱 Reimposta dispositivo
                  </button>

                  <button
                    class="
                      btn
                      admin-premium-danger-button
                    "
                    data-premium-action="revoke"
                    data-user-id="${escapeHtml(
                      premiumUser.uid
                    )}"
                    type="button"
                    ${busy
                      ? "disabled"
                      : ""}
                  >
                    🚫 Revoca Premium
                  </button>
                </div>
              `
        }
      </article>
    `;
  }

  function renderUserList() {
    const listElement =
      container.querySelector(
        "#adminPremiumUserList"
      );

    const countElement =
      container.querySelector(
        "#adminPremiumResultCount"
      );

    if (
      !listElement ||
      !countElement
    ) {
      return;
    }

    const filteredUsers =
      getFilteredUsers();

    countElement.textContent =
      `${filteredUsers.length} utenti`;

    listElement.innerHTML =
      filteredUsers.length > 0
        ? filteredUsers
            .map(
              renderUserCard
            )
            .join("")
        : `
            <div
              class="
                admin-premium-empty
              "
            >
              <span>🔍</span>

              <h3>
                Nessun utente trovato
              </h3>

              <p>
                Modifica la ricerca
                o il filtro selezionato.
              </p>
            </div>
          `;

    bindActionButtons();
  }

  async function refreshUsers() {
    state.users =
      await loadPremiumUsers(
        user
      );

    state.busyUserId = "";

    renderStats();
    renderUserList();
  }

  function renderStats() {
    const totalUsers =
      state.users.filter(
        (item) =>
          item.role !== "admin"
      ).length;

    const premiumUsers =
      state.users.filter(
        (item) =>
          item.role !== "admin" &&
          item.premiumAllowed
      ).length;

    const expiredUsers =
      state.users.filter(
        (item) =>
          item.premiumReason ===
          "premium_expired"
      ).length;

    const connectedDevices =
      state.users.filter(
        (item) =>
          item.authorizedDevice
            .status === "active" &&
          item.authorizedDevice
            .deviceIdHash
      ).length;

    const stats = {
      adminPremiumTotalUsers:
        totalUsers,

      adminPremiumActiveUsers:
        premiumUsers,

      adminPremiumExpiredUsers:
        expiredUsers,

      adminPremiumConnectedDevices:
        connectedDevices
    };

    Object.entries(
      stats
    ).forEach(
      ([elementId, value]) => {
        const element =
          container.querySelector(
            `#${elementId}`
          );

        if (element) {
          element.textContent =
            String(value);
        }
      }
    );
  }

  function bindActionButtons() {
    container
      .querySelectorAll(
        "[data-premium-action]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          async () => {
            const targetUserId =
              button.dataset.userId;

            const action =
              button.dataset
                .premiumAction;

            if (
              !targetUserId ||
              !action
            ) {
              return;
            }

            const targetUser =
              state.users.find(
                (item) =>
                  item.uid ===
                  targetUserId
              );

            if (!targetUser) {
              return;
            }

            if (
              action === "revoke"
            ) {
              const confirmed =
                window.confirm(
                  `Revocare l'accesso Premium a ${targetUser.name}?`
                );

              if (!confirmed) {
                return;
              }
            }

            if (
              action ===
              "reset-device"
            ) {
              const confirmed =
                window.confirm(
                  `Scollegare il dispositivo di ${targetUser.name}? Il prossimo dispositivo usato verrà collegato automaticamente.`
                );

              if (!confirmed) {
                return;
              }
            }

            state.busyUserId =
              targetUserId;

            renderUserList();

            try {
              if (
                action === "grant"
              ) {
                const durationSelect =
                  container
                    .querySelector(
                      `[data-premium-duration="${CSS.escape(
                        targetUserId
                      )}"]`
                    );

                await grantPremiumAccess({
                  targetUserId,
                  adminUid:
                    user.uid,
                  durationDays:
                    Number(
                      durationSelect
                        ?.value ||
                      30
                    ),
                  unlimited:
                    false
                });

                setMessage(
                  `Accesso Premium attivato per ${targetUser.name}.`
                );
              }

              if (
                action ===
                "unlimited"
              ) {
                await grantPremiumAccess({
                  targetUserId,
                  adminUid:
                    user.uid,
                  unlimited:
                    true
                });

                setMessage(
                  `Accesso Premium illimitato attivato per ${targetUser.name}.`
                );
              }

              if (
                action ===
                "revoke"
              ) {
                await revokePremiumAccess({
                  targetUserId,
                  adminUid:
                    user.uid
                });

                setMessage(
                  `Accesso Premium revocato a ${targetUser.name}.`
                );
              }

              if (
                action ===
                "reset-device"
              ) {
                await resetPremiumDevice({
                  targetUserId,
                  adminUid:
                    user.uid
                });

                setMessage(
                  `Dispositivo reimpostato per ${targetUser.name}.`
                );
              }

              await refreshUsers();
            } catch (error) {
              console.error(
                "Premium admin action error:",
                error
              );

              state.busyUserId =
                "";

              renderUserList();

              setMessage(
                error.message ||
                "Operazione non riuscita.",
                "error"
              );
            }
          }
        );
      });
  }


  function getArgomentoTitle(
    argomentoId
  ) {
    return (
      argomenti.find(
        (item) =>
          String(item.id) ===
          String(argomentoId)
      )?.title ||
      "Argomento"
    );
  }

  function getTopicTitle(
    topicId
  ) {
    return (
      topics.find(
        (item) =>
          String(item.id) ===
          String(topicId)
      )?.title ||
      "Topic"
    );
  }

  function getSubtopicAccessLevel(
    subtopicId
  ) {
    return (
      state.subtopicAccessMap.get(
        String(subtopicId)
      ) === "premium"
        ? "premium"
        : "free"
    );
  }

  function getFilteredSubtopics() {
    const searchText =
      state.subtopicSearchText
        .toLowerCase()
        .trim();

    return subtopics
      .filter(
        (subtopic) =>
          !state.selectedArgomentoId ||
          String(
            subtopic.argomentoId
          ) ===
            String(
              state.selectedArgomentoId
            )
      )
      .filter(
        (subtopic) =>
          !state.selectedTopicId ||
          String(
            subtopic.topicId
          ) ===
            String(
              state.selectedTopicId
            )
      )
      .filter(
        (subtopic) => {
          if (!searchText) {
            return true;
          }

          const searchableText =
            [
              subtopic.title,
              subtopic.description,
              getArgomentoTitle(
                subtopic.argomentoId
              ),
              getTopicTitle(
                subtopic.topicId
              )
            ]
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            searchText
          );
        }
      )
      .sort(
        (first, second) => {
          const firstArgomento =
            argomenti.find(
              (item) =>
                item.id ===
                first.argomentoId
            );

          const secondArgomento =
            argomenti.find(
              (item) =>
                item.id ===
                second.argomentoId
            );

          const argomentoDifference =
            Number(
              firstArgomento?.order ||
              0
            ) -
            Number(
              secondArgomento?.order ||
              0
            );

          if (
            argomentoDifference !== 0
          ) {
            return argomentoDifference;
          }

          const topicDifference =
            Number(
              first.topicOrder ||
              0
            ) -
            Number(
              second.topicOrder ||
              0
            );

          if (
            topicDifference !== 0
          ) {
            return topicDifference;
          }

          return (
            Number(first.order || 0) -
            Number(second.order || 0)
          );
        }
      );
  }

  function renderSubtopicFilters() {
    const argomentoSelect =
      container.querySelector(
        "#adminSubtopicArgomentoFilter"
      );

    const topicSelect =
      container.querySelector(
        "#adminSubtopicTopicFilter"
      );

    if (
      !argomentoSelect ||
      !topicSelect
    ) {
      return;
    }

    argomentoSelect.innerHTML = `
      <option value="">
        Tutti gli argomenti
      </option>

      ${[...argomenti]
        .sort(
          (first, second) =>
            Number(first.order || 0) -
            Number(second.order || 0)
        )
        .map(
          (argomento) => `
            <option
              value="${escapeHtml(
                argomento.id
              )}"
              ${
                String(
                  state.selectedArgomentoId
                ) ===
                String(argomento.id)
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                argomento.title
              )}
            </option>
          `
        )
        .join("")}
    `;

    const filteredTopics =
      topics
        .filter(
          (topic) =>
            !state.selectedArgomentoId ||
            String(
              topic.argomentoId
            ) ===
              String(
                state.selectedArgomentoId
              )
        )
        .sort(
          (first, second) =>
            Number(first.order || 0) -
            Number(second.order || 0)
        );

    topicSelect.innerHTML = `
      <option value="">
        Tutti i topic
      </option>

      ${filteredTopics
        .map(
          (topic) => `
            <option
              value="${escapeHtml(
                topic.id
              )}"
              ${
                String(
                  state.selectedTopicId
                ) ===
                String(topic.id)
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                topic.title
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function renderSubtopicList() {
    const listElement =
      container.querySelector(
        "#adminPremiumSubtopicList"
      );

    const countElement =
      container.querySelector(
        "#adminPremiumSubtopicCount"
      );

    const selectedCountElement =
      container.querySelector(
        "#adminPremiumSelectedSubtopicCount"
      );

    if (
      !listElement ||
      !countElement ||
      !selectedCountElement
    ) {
      return;
    }

    const filteredSubtopics =
      getFilteredSubtopics();

    countElement.textContent =
      `${filteredSubtopics.length} subtopic`;

    selectedCountElement.textContent =
      `${state.selectedSubtopicIds.size} selezionati`;

    if (state.subtopicsLoading) {
      listElement.innerHTML = `
        <div class="loading-card">
          <div class="loading-spinner"></div>
          <p>
            Caricamento accessi Subtopic...
          </p>
        </div>
      `;

      return;
    }

    listElement.innerHTML =
      filteredSubtopics.length > 0
        ? filteredSubtopics
            .map(
              (subtopic) => {
                const accessLevel =
                  getSubtopicAccessLevel(
                    subtopic.id
                  );

                const selected =
                  state.selectedSubtopicIds
                    .has(subtopic.id);

                const busy =
                  state.busySubtopicId ===
                  subtopic.id;

                return `
                  <article
                    class="
                      admin-subtopic-access-card
                      ${
                        accessLevel ===
                        "premium"
                          ? "admin-subtopic-premium"
                          : "admin-subtopic-free"
                      }
                    "
                  >
                    <label
                      class="
                        admin-subtopic-select
                      "
                    >
                      <input
                        type="checkbox"
                        data-subtopic-select="${escapeHtml(
                          subtopic.id
                        )}"
                        ${
                          selected
                            ? "checked"
                            : ""
                        }
                        ${
                          busy
                            ? "disabled"
                            : ""
                        }
                      />

                      <span>
                        Seleziona
                      </span>
                    </label>

                    <div
                      class="
                        admin-subtopic-access-content
                      "
                    >
                      <small>
                        ${escapeHtml(
                          getArgomentoTitle(
                            subtopic.argomentoId
                          )
                        )}
                        ·
                        ${escapeHtml(
                          getTopicTitle(
                            subtopic.topicId
                          )
                        )}
                      </small>

                      <strong>
                        ${escapeHtml(
                          subtopic.title
                        )}
                      </strong>

                      <p>
                        ${escapeHtml(
                          subtopic.description ||
                          ""
                        )}
                      </p>
                    </div>

                    <div
                      class="
                        admin-subtopic-access-actions
                      "
                    >
                      <span
                        class="
                          admin-subtopic-access-badge
                          ${
                            accessLevel ===
                            "premium"
                              ? "admin-subtopic-access-badge-premium"
                              : "admin-subtopic-access-badge-free"
                          }
                        "
                      >
                        ${
                          accessLevel ===
                          "premium"
                            ? "🔒 Premium"
                            : "✅ Gratis"
                        }
                      </span>

                      <button
                        class="
                          btn
                          ${
                            accessLevel ===
                            "premium"
                              ? "btn-secondary"
                              : "btn-primary"
                          }
                        "
                        data-subtopic-toggle="${escapeHtml(
                          subtopic.id
                        )}"
                        data-next-access="${
                          accessLevel ===
                          "premium"
                            ? "free"
                            : "premium"
                        }"
                        type="button"
                        ${
                          busy
                            ? "disabled"
                            : ""
                        }
                      >
                        ${
                          accessLevel ===
                          "premium"
                            ? "Imposta Gratis"
                            : "Imposta Premium"
                        }
                      </button>
                    </div>
                  </article>
                `;
              }
            )
            .join("")
        : `
            <div
              class="
                admin-premium-empty
              "
            >
              <span>🔍</span>

              <h3>
                Nessun Subtopic trovato
              </h3>

              <p>
                Modifica la ricerca
                o i filtri selezionati.
              </p>
            </div>
          `;

    bindSubtopicEvents();
  }

  function bindSubtopicEvents() {
    container
      .querySelectorAll(
        "[data-subtopic-select]"
      )
      .forEach((checkbox) => {
        checkbox.addEventListener(
          "change",
          () => {
            const subtopicId =
              checkbox.dataset
                .subtopicSelect;

            if (!subtopicId) {
              return;
            }

            if (checkbox.checked) {
              state.selectedSubtopicIds
                .add(subtopicId);
            } else {
              state.selectedSubtopicIds
                .delete(subtopicId);
            }

            const selectedCountElement =
              container.querySelector(
                "#adminPremiumSelectedSubtopicCount"
              );

            if (
              selectedCountElement
            ) {
              selectedCountElement
                .textContent =
                `${state.selectedSubtopicIds.size} selezionati`;
            }
          }
        );
      });

    container
      .querySelectorAll(
        "[data-subtopic-toggle]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          async () => {
            const subtopicId =
              button.dataset
                .subtopicToggle;

            const accessLevel =
              button.dataset
                .nextAccess;

            if (
              !subtopicId ||
              !accessLevel
            ) {
              return;
            }

            state.busySubtopicId =
              subtopicId;

            renderSubtopicList();

            try {
              await saveSubtopicAccess({
                subtopicId,
                accessLevel,
                adminUid:
                  user.uid
              });

              state.subtopicAccessMap
                .set(
                  subtopicId,
                  accessLevel
                );

              setMessage(
                accessLevel ===
                "premium"
                  ? "Subtopic impostato come Premium."
                  : "Subtopic impostato come Gratis."
              );
            } catch (error) {
              console.error(
                "Subtopic access update error:",
                error
              );

              setMessage(
                error.message ||
                "Aggiornamento Subtopic non riuscito.",
                "error"
              );
            } finally {
              state.busySubtopicId =
                "";

              renderSubtopicList();
            }
          }
        );
      });
  }

  async function refreshSubtopicAccess() {
    state.subtopicsLoading =
      true;

    renderSubtopicList();

    try {
      state.subtopicAccessMap =
        await loadAllSubtopicAccess();
    } finally {
      state.subtopicsLoading =
        false;

      renderSubtopicFilters();
      renderSubtopicList();
    }
  }

  function bindPageEvents() {
    container
      .querySelector(
        "#adminPremiumBackButton"
      )
      ?.addEventListener(
        "click",
        () => {
          onBack?.();
        }
      );

    container
      .querySelector(
        "#adminPremiumRefreshButton"
      )
      ?.addEventListener(
        "click",
        async () => {
          try {
            if (
              state.activeTab ===
              "subtopics"
            ) {
              await refreshSubtopicAccess();

              setMessage(
                "Elenco Subtopic aggiornato."
              );
            } else {
              await refreshUsers();

              setMessage(
                "Elenco utenti aggiornato."
              );
            }
          } catch (error) {
            setMessage(
              error.message ||
              "Aggiornamento non riuscito.",
              "error"
            );
          }
        }
      );

    container
      .querySelector(
        "#adminPremiumSearch"
      )
      ?.addEventListener(
        "input",
        (event) => {
          state.searchText =
            event.target.value;

          renderUserList();
        }
      );

    container
      .querySelector(
        "#adminPremiumFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.filter =
            event.target.value;

          renderUserList();
        }
      );


    container
      .querySelectorAll(
        ".admin-premium-tab"
      )
      .forEach((tab) => {
        tab.addEventListener(
          "click",
          async () => {
            state.activeTab =
              tab.dataset.tab ===
              "subtopics"
                ? "subtopics"
                : "users";

            container
              .querySelectorAll(
                ".admin-premium-tab"
              )
              .forEach((button) => {
                const active =
                  button.dataset.tab ===
                  state.activeTab;

                button.classList.toggle(
                  "active",
                  active
                );

                button.setAttribute(
                  "aria-selected",
                  String(active)
                );
              });

            const usersPanel =
              container.querySelector(
                "#adminPremiumUsersPanel"
              );

            const subtopicsPanel =
              container.querySelector(
                "#adminPremiumSubtopicsPanel"
              );

            if (usersPanel) {
              usersPanel.hidden =
                state.activeTab !==
                "users";
            }

            if (subtopicsPanel) {
              subtopicsPanel.hidden =
                state.activeTab !==
                "subtopics";
            }

            if (
              state.activeTab ===
                "subtopics" &&
              state.subtopicAccessMap
                .size === 0
            ) {
              await refreshSubtopicAccess();
            }
          }
        );
      });

    container
      .querySelector(
        "#adminSubtopicSearch"
      )
      ?.addEventListener(
        "input",
        (event) => {
          state.subtopicSearchText =
            event.target.value;

          renderSubtopicList();
        }
      );

    container
      .querySelector(
        "#adminSubtopicArgomentoFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.selectedArgomentoId =
            event.target.value;

          state.selectedTopicId =
            "";

          renderSubtopicFilters();
          renderSubtopicList();
        }
      );

    container
      .querySelector(
        "#adminSubtopicTopicFilter"
      )
      ?.addEventListener(
        "change",
        (event) => {
          state.selectedTopicId =
            event.target.value;

          renderSubtopicList();
        }
      );

    container
      .querySelector(
        "#adminSelectVisibleSubtopicsButton"
      )
      ?.addEventListener(
        "click",
        () => {
          getFilteredSubtopics()
            .forEach(
              (subtopic) => {
                state.selectedSubtopicIds
                  .add(subtopic.id);
              }
            );

          renderSubtopicList();
        }
      );

    container
      .querySelector(
        "#adminClearSubtopicSelectionButton"
      )
      ?.addEventListener(
        "click",
        () => {
          state.selectedSubtopicIds
            .clear();

          renderSubtopicList();
        }
      );

    container
      .querySelectorAll(
        "[data-bulk-subtopic-access]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          async () => {
            const accessLevel =
              button.dataset
                .bulkSubtopicAccess;

            const selectedIds =
              Array.from(
                state.selectedSubtopicIds
              );

            if (
              selectedIds.length ===
              0
            ) {
              setMessage(
                "Seleziona almeno un Subtopic.",
                "error"
              );

              return;
            }

            try {
              button.disabled =
                true;

              await saveMultipleSubtopicAccess({
                subtopicIds:
                  selectedIds,

                accessLevel,

                adminUid:
                  user.uid
              });

              selectedIds.forEach(
                (subtopicId) => {
                  state.subtopicAccessMap
                    .set(
                      subtopicId,
                      accessLevel
                    );
                }
              );

              state.selectedSubtopicIds
                .clear();

              setMessage(
                accessLevel ===
                "premium"
                  ? `${selectedIds.length} Subtopic impostati come Premium.`
                  : `${selectedIds.length} Subtopic impostati come Gratis.`
              );

              renderSubtopicList();
            } catch (error) {
              console.error(
                "Bulk Subtopic access error:",
                error
              );

              setMessage(
                error.message ||
                "Aggiornamento multiplo non riuscito.",
                "error"
              );
            } finally {
              button.disabled =
                false;
            }
          }
        );
      });
  }

  container.innerHTML = `
    <main
      class="
        page
        admin-premium-page
      "
    >
      <section
        class="
          card
          wide-card
        "
      >
        <header
          class="
            admin-premium-page-header
          "
        >
          <div>
            <button
              id="adminPremiumBackButton"
              class="back-button"
              type="button"
            >
              ← Dashboard
            </button>

            <p class="eyebrow">
              AMMINISTRAZIONE
            </p>

            <h1>
              Gestione accessi Premium
            </h1>

            <p class="subtitle">
              Attiva, limita e revoca
              gli accessi Premium e
              gestisci i dispositivi
              autorizzati.
            </p>
          </div>

          <button
            id="adminPremiumRefreshButton"
            class="btn btn-secondary"
            type="button"
          >
            ↻ Aggiorna
          </button>
        </header>

        <div
          class="
            admin-premium-stats
          "
        >
          <article>
            <span>
              UTENTI
            </span>

            <strong
              id="adminPremiumTotalUsers"
            >
              0
            </strong>
          </article>

          <article>
            <span>
              PREMIUM ATTIVI
            </span>

            <strong
              id="adminPremiumActiveUsers"
            >
              0
            </strong>
          </article>

          <article>
            <span>
              SCADUTI
            </span>

            <strong
              id="adminPremiumExpiredUsers"
            >
              0
            </strong>
          </article>

          <article>
            <span>
              DISPOSITIVI
            </span>

            <strong
              id="adminPremiumConnectedDevices"
            >
              0
            </strong>
          </article>
        </div>

        <div
          class="
            admin-premium-tabs
          "
          role="tablist"
          aria-label="Gestione Premium"
        >
          <button
            class="
              admin-premium-tab
              active
            "
            data-tab="users"
            type="button"
            role="tab"
            aria-selected="true"
          >
            👥 Utenti Premium
          </button>

          <button
            class="
              admin-premium-tab
            "
            data-tab="subtopics"
            type="button"
            role="tab"
            aria-selected="false"
          >
            🔒 Subtopic Free/Premium
          </button>
        </div>

        <p
          id="adminPremiumMessage"
          class="admin-premium-message"
        ></p>

        <section
          id="adminPremiumUsersPanel"
        >
          <div
            class="
              admin-premium-toolbar
            "
          >
            <input
              id="adminPremiumSearch"
              type="search"
              placeholder="
                Cerca per nome, email o UID...
              "
            />

            <select
              id="adminPremiumFilter"
            >
              <option value="all">
                Tutti gli utenti
              </option>

              <option value="premium">
                Premium attivi
              </option>

              <option value="non-premium">
                Non Premium
              </option>

              <option value="expired">
                Premium scaduti
              </option>

              <option value="device">
                Dispositivo collegato
              </option>
            </select>
          </div>

          <div
            id="adminPremiumResultCount"
            class="
              admin-premium-result-count
            "
          >
            0 utenti
          </div>

          <div
            id="adminPremiumUserList"
            class="
              admin-premium-user-list
            "
          >
            <div
              class="
                loading-card
              "
            >
              <div
                class="
                  loading-spinner
                "
              ></div>

              <p>
                Caricamento utenti...
              </p>
            </div>
          </div>
        </section>

        <section
          id="adminPremiumSubtopicsPanel"
          hidden
        >
          <div
            class="
              admin-subtopic-toolbar
            "
          >
            <input
              id="adminSubtopicSearch"
              type="search"
              placeholder="
                Cerca Subtopic...
              "
            />

            <select
              id="adminSubtopicArgomentoFilter"
            >
              <option value="">
                Tutti gli argomenti
              </option>
            </select>

            <select
              id="adminSubtopicTopicFilter"
            >
              <option value="">
                Tutti i topic
              </option>
            </select>
          </div>

          <div
            class="
              admin-subtopic-bulk-bar
            "
          >
            <div>
              <strong
                id="adminPremiumSubtopicCount"
              >
                0 subtopic
              </strong>

              <span
                id="adminPremiumSelectedSubtopicCount"
              >
                0 selezionati
              </span>
            </div>

            <div
              class="
                admin-subtopic-bulk-actions
              "
            >
              <button
                id="adminSelectVisibleSubtopicsButton"
                class="btn btn-secondary"
                type="button"
              >
                Seleziona visibili
              </button>

              <button
                id="adminClearSubtopicSelectionButton"
                class="btn btn-secondary"
                type="button"
              >
                Deseleziona
              </button>

              <button
                class="btn btn-secondary"
                data-bulk-subtopic-access="free"
                type="button"
              >
                ✅ Imposta Gratis
              </button>

              <button
                class="btn btn-primary"
                data-bulk-subtopic-access="premium"
                type="button"
              >
                🔒 Imposta Premium
              </button>
            </div>
          </div>

          <div
            id="adminPremiumSubtopicList"
            class="
              admin-subtopic-access-list
            "
          >
            <div
              class="
                admin-premium-empty
              "
            >
              <span>🔒</span>

              <h3>
                Gestione Subtopic Premium
              </h3>

              <p>
                Apri questa scheda per
                caricare gli accessi.
              </p>
            </div>
          </div>
        </section>
        </div>
      </section>
    </main>
  `;

  bindPageEvents();
  renderSubtopicFilters();

  try {
    await refreshUsers();
  } catch (error) {
    console.error(
      "Premium users page error:",
      error
    );

    container
      .querySelector(
        "#adminPremiumUserList"
      )
      .innerHTML = `
        <div
          class="
            admin-premium-empty
          "
        >
          <span>🔒</span>

          <h3>
            Accesso non disponibile
          </h3>

          <p>
            ${escapeHtml(
              error.message ||
              "Non è stato possibile caricare gli utenti."
            )}
          </p>
        </div>
      `;
  }
}