function formatAccountDate(value) {
  if (!value) {
    return "Non disponibile";
  }

  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non disponibile";
  }

  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}

export function showProfile({
  container,
  user,
  stats,
  onBack,
  onLogout
}) {
  const totalXp =
    Number(stats?.xp) || 0;

  const xpPerLevel = 250;

  const level =
    Math.floor(
      totalXp / xpPerLevel
    ) + 1;

  const currentLevelXp =
    totalXp % xpPerLevel;

  const remainingXp =
    currentLevelXp === 0
      ? xpPerLevel
      : xpPerLevel -
        currentLevelXp;

  const xpPercentage =
    Math.round(
      (
        currentLevelXp /
        xpPerLevel
      ) * 100
    );

  const completedQuizzes =
    Number(
      stats?.completedQuizzes
    ) || 0;

  const totalQuestions =
    Number(
      stats?.totalQuestions
    ) || 0;

  const correctAnswers =
    Number(
      stats?.correctAnswers
    ) || 0;

  const wrongAnswers =
    Number(
      stats?.wrongAnswers
    ) || 0;

  const accuracy =
    totalQuestions > 0
      ? Math.round(
          (
            correctAnswers /
            totalQuestions
          ) * 100
        )
      : 0;

  const studentName =
    stats?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Studente";

  const avatarInitials =
    studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");

  const accountDate =
    formatAccountDate(
      stats?.createdAt
    );

  container.innerHTML = `
    <main class="page compact-profile-page">
      <section
        class="
          card
          wide-card
          compact-profile-card
        "
      >
        <header class="compact-profile-topbar">
          <button
            id="profileBackButton"
            class="compact-profile-back"
            type="button"
          >
            ← Dashboard
          </button>

          <button
            id="profileLogoutButton"
            class="compact-profile-logout"
            type="button"
          >
            Logout
          </button>
        </header>

        <section class="compact-profile-identity">
          <div class="compact-profile-avatar">
            ${avatarInitials || "S"}
          </div>

          <div class="compact-profile-info">
            <p class="eyebrow">
              PROFILO STUDENTE
            </p>

            <h1>
              ${studentName}
            </h1>

            <p class="compact-profile-email">
              ${user?.email || ""}
            </p>

            <p class="compact-profile-member">
              Studente dal
              ${accountDate}
            </p>
          </div>
        </section>

        <section class="compact-profile-overview">
          <article class="compact-profile-level">
            <span class="compact-profile-section-label">
              IL TUO LIVELLO
            </span>

            <div class="compact-profile-level-number">
              ${level}
            </div>

            <strong>
              Livello ${level}
            </strong>

            <small>
              ${totalXp} XP totali
            </small>
          </article>

          <div class="compact-profile-mini-stats">
            <article>
              <span>📝</span>

              <strong>
                ${completedQuizzes}
              </strong>

              <small>
                Quiz completati
              </small>
            </article>

            <article>
              <span>📚</span>

              <strong>
                ${totalQuestions}
              </strong>

              <small>
                Domande svolte
              </small>
            </article>

            <article>
              <span>✅</span>

              <strong>
                ${correctAnswers}
              </strong>

              <small>
                Risposte corrette
              </small>
            </article>

            <article>
              <span>❌</span>

              <strong>
                ${wrongAnswers}
              </strong>

              <small>
                Risposte sbagliate
              </small>
            </article>
          </div>
        </section>

        <section class="compact-profile-accuracy">
          <div class="compact-profile-accuracy-header">
            <div>
              <span>
                PRECISIONE COMPLESSIVA
              </span>

              <strong>
                ${accuracy}%
              </strong>
            </div>

            <div>
              <span>
                PROSSIMO LIVELLO
              </span>

              <strong>
                ${remainingXp} XP
              </strong>
            </div>
          </div>

          <div class="compact-profile-xp-track">
            <div
              class="compact-profile-xp-fill"
              style="
                width:
                ${xpPercentage}%;
              "
            ></div>
          </div>

          <div class="compact-profile-xp-info">
            <span>
              ${currentLevelXp} /
              ${xpPerLevel} XP
            </span>

            <span>
              Livello ${level + 1}
            </span>
          </div>
        </section>

        <footer class="compact-profile-footer">
          <strong>
            MSH PATENTE v1.0
          </strong>

          <span>
            © 2026 MSH
          </span>
        </footer>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#profileBackButton"
    )
    ?.addEventListener(
      "click",
      onBack
    );

  document
    .querySelector(
      "#profileLogoutButton"
    )
    ?.addEventListener(
      "click",
      onLogout
    );
}