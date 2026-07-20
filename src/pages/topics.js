import { topics } from "../data/topics.js";
import { questions } from "../data/questions.js";

export function showTopics(
  app,
  argomento,
  progress,
  actions
) {
  const argomentoTopics = topics
    .filter(
      (topic) =>
        topic.argomentoId === argomento.id
    )
    .sort((a, b) => a.order - b.order);

  const completedTopics =
    argomentoTopics.filter((topic) => {
      return (
        progress[topic.id]?.completed === true
      );
    }).length;

  const allTopicsCompleted =
    argomentoTopics.length > 0 &&
    completedTopics === argomentoTopics.length;

  const argomentoQuestions =
    questions.filter(
      (question) =>
        question.argomentoId === argomento.id
    );

  app.innerHTML = `
    <main class="page">
      <section class="card wide-card">
        <div class="page-header">
          <button id="backArgomentiButton" class="back-button">
            ← Argomenti
          </button>

          <p class="eyebrow">
            ${argomento.title}
          </p>

          <h1>Topic disponibili</h1>

          <p class="subtitle">
            Completa i singoli topic. Dopo averli completati tutti,
            potrai accedere al quiz completo dell'argomento.
          </p>

          <div class="argomento-progress-summary">
            <strong>
              ${completedTopics} / ${argomentoTopics.length}
            </strong>

            <span>
              topic completati
            </span>
          </div>
        </div>

        <div class="topics-grid">
          ${argomentoTopics
            .map((topic) => {
              const topicQuestions =
                questions.filter(
                  (question) =>
                    question.topicId === topic.id
                );

              const topicProgress =
                progress[topic.id] || {};

              const completed =
                topicProgress.completed === true;

              const bestScore =
                Number(topicProgress.bestScore) || 0;

              return `
                <article
                  class="topic-card ${
                    completed
                      ? "completed-topic-card"
                      : ""
                  }"
                  style="--topic-color: ${argomento.color}"
                >
                  <div class="topic-icon">
                    ${topic.icon}
                  </div>

                  <h2>${topic.title}</h2>

                  <p class="topic-description">
                    ${topic.description}
                  </p>

                  <p class="topic-count">
                    ${topicQuestions.length}
                    ${
                      topicQuestions.length === 1
                        ? "domanda"
                        : "domande"
                    }
                  </p>

                  <div class="topic-status">
                    ${
                      completed
                        ? `
                          <span class="status-badge status-completed">
                            ✓ Completato
                          </span>

                          <span class="best-score">
                            Miglior risultato:
                            ${bestScore}%
                          </span>
                        `
                        : `
                          <span class="status-badge status-pending">
                            Da completare
                          </span>

                          ${
                            bestScore > 0
                              ? `
                                <span class="best-score">
                                  Miglior risultato:
                                  ${bestScore}%
                                </span>
                              `
                              : ""
                          }
                        `
                    }
                  </div>

                  <button
                    class="btn topic-button start-topic-button"
                    data-topic-id="${topic.id}"
                  >
                    ${
                      completed
                        ? "Ripeti quiz"
                        : "Inizia quiz"
                    }
                  </button>
                </article>
              `;
            })
            .join("")}
        </div>

        <section class="argomento-quiz-section">
          <div class="argomento-quiz-content">
            <div class="argomento-quiz-icon">
              ${allTopicsCompleted ? "🏆" : "🔒"}
            </div>

            <div>
              <p class="eyebrow">
                QUIZ COMPLETO
              </p>

              <h2>
                ${argomento.title}
              </h2>

              <p>
                ${
                  allTopicsCompleted
                    ? `
                      Hai completato tutti i topic.
                      Ora puoi esercitarti con domande miste
                      dell'intero argomento.
                    `
                    : `
                      Completa tutti i topic per sbloccare
                      il quiz completo dell'argomento.
                    `
                }
              </p>
            </div>

            <button
              id="startArgomentoQuizButton"
              class="btn btn-primary"
              ${allTopicsCompleted ? "" : "disabled"}
            >
              ${
                allTopicsCompleted
                  ? `Inizia quiz completo (${argomentoQuestions.length})`
                  : "Quiz bloccato"
              }
            </button>
          </div>
        </section>
      </section>
    </main>
  `;

  document
    .querySelector("#backArgomentiButton")
    .addEventListener("click", actions.onBack);

  document
    .querySelectorAll(".start-topic-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const topicId = button.dataset.topicId;

        const selectedTopic =
          argomentoTopics.find(
            (topic) => topic.id === topicId
          );

        if (selectedTopic) {
          actions.onSelectTopic(selectedTopic);
        }
      });
    });

  if (allTopicsCompleted) {
    document
      .querySelector(
        "#startArgomentoQuizButton"
      )
      .addEventListener(
        "click",
        actions.onStartArgomentoQuiz
      );
  }
}