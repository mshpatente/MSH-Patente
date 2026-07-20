export function showQuiz(app, options) {
  const {
    questions,
    title,
    onFinish,
    onBack
  } = options;

  let currentIndex = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let answered = false;

  const answers = [];

  if (!questions || questions.length === 0) {
    app.innerHTML = `
      <main class="page">
        <section class="card">
          <h1>Nessuna domanda disponibile</h1>

          <p class="subtitle">
            Non ci sono ancora domande per questo argomento.
          </p>

          <button id="emptyQuizBackButton" class="btn btn-primary">
            Torna agli argomenti
          </button>
        </section>
      </main>
    `;

    document
      .querySelector("#emptyQuizBackButton")
      .addEventListener("click", onBack);

    return;
  }

  function renderQuestion() {
    const currentQuestion = questions[currentIndex];

    const progress =
      ((currentIndex + 1) / questions.length) * 100;

    app.innerHTML = `
      <main class="page">
        <section class="card quiz-card">
          <div class="quiz-navigation">
            <button id="quitQuizButton" class="back-button">
              ← Argomenti
            </button>
          </div>

          <div class="quiz-topbar">
            <div>
              <p class="eyebrow">${title}</p>
              <h1>Domanda ${currentIndex + 1}</h1>
            </div>

            <div class="quiz-counter">
              ${currentIndex + 1} / ${questions.length}
            </div>
          </div>

          <div class="progress-track">
            <div
              class="progress-fill"
              style="width: ${progress}%"
            ></div>
          </div>

          <div class="quiz-score">
            <span>✅ Corrette: ${correctAnswers}</span>
            <span>❌ Sbagliate: ${wrongAnswers}</span>
          </div>

          <div class="question-box">
            <p>${currentQuestion.question}</p>
          </div>

          <div class="answer-grid">
            <button
              id="trueButton"
              class="answer-button true-button"
            >
              VERO
            </button>

            <button
              id="falseButton"
              class="answer-button false-button"
            >
              FALSO
            </button>
          </div>

          <div id="feedbackContainer"></div>
        </section>
      </main>
    `;

    document
      .querySelector("#quitQuizButton")
      .addEventListener("click", onBack);

    document
      .querySelector("#trueButton")
      .addEventListener("click", () => checkAnswer(true));

    document
      .querySelector("#falseButton")
      .addEventListener("click", () => checkAnswer(false));
  }

  function checkAnswer(selectedAnswer) {
    if (answered) {
      return;
    }

    answered = true;

    const currentQuestion = questions[currentIndex];

    const isCorrect =
      selectedAnswer === currentQuestion.answer;

    if (isCorrect) {
      correctAnswers += 1;
    } else {
      wrongAnswers += 1;
    }

    answers.push({
      questionId: currentQuestion.id,
      selectedAnswer,
      correctAnswer: currentQuestion.answer,
      isCorrect
    });

    const trueButton =
      document.querySelector("#trueButton");

    const falseButton =
      document.querySelector("#falseButton");

    trueButton.disabled = true;
    falseButton.disabled = true;

    if (currentQuestion.answer === true) {
      trueButton.classList.add("correct-answer");
    } else {
      falseButton.classList.add("correct-answer");
    }

    if (!isCorrect) {
      if (selectedAnswer === true) {
        trueButton.classList.add("wrong-answer");
      } else {
        falseButton.classList.add("wrong-answer");
      }
    }

    const isLastQuestion =
      currentIndex === questions.length - 1;

    const feedbackContainer =
      document.querySelector("#feedbackContainer");

    feedbackContainer.innerHTML = `
      <div
        class="feedback-box ${
          isCorrect
            ? "feedback-correct"
            : "feedback-wrong"
        }"
      >
        <h2>
          ${
            isCorrect
              ? "✅ Risposta corretta"
              : "❌ Risposta sbagliata"
          }
        </h2>

        <p>${currentQuestion.explanation}</p>

        <button
          id="nextQuestionButton"
          class="btn btn-primary full-width"
        >
          ${
            isLastQuestion
              ? "Vedi il risultato"
              : "Prossima domanda"
          }
        </button>
      </div>
    `;

    document
      .querySelector("#nextQuestionButton")
      .addEventListener("click", goToNextQuestion);
  }

  function goToNextQuestion() {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      answered = false;
      renderQuestion();
      return;
    }

    onFinish({
      totalQuestions: questions.length,
      correctAnswers,
      wrongAnswers,
      answers
    });
  }

  renderQuestion();
}