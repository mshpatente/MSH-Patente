import "./style.css";
import { showExamHistory } from "./pages/examHistory.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "./firebase.js";

import { argomenti } from "./data/argomenti.js";
import { topics } from "./data/topics.js";
import { questions } from "./data/questions.js";

import { showDashboard } from "./pages/dashboard.js";
import { showArgomenti } from "./pages/argomenti.js";
import { showTopics } from "./pages/topics.js";
import { showQuiz } from "./pages/quiz.js";
import {
  showWrongAnswers
} from "./pages/wrongAnswers.js";

import {
  addExperience
} from "./utils/progressSystem.js";

const app = document.querySelector("#app");

const TOPIC_PASS_PERCENTAGE = 80;
const REQUIRED_CORRECT_STREAK = 2;

const XP_REWARDS = {
  topicQuiz: 20,
  perfectTopicBonus: 30,
  wrongAnswersReview: 15
};

function showMessage(message, type = "error") {
  const messageElement =
    document.querySelector("#message");

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;
  messageElement.className =
    `message ${type}`;
}

function showLoading(
  message = "Caricamento..."
) {
  app.innerHTML = `
    <main class="page">
      <section class="card loading-card">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </section>
    </main>
  `;
}

function showHome() {
  app.innerHTML = `
    <main class="page">
      <section class="card home-card">
        <div class="home-logo">🚗</div>

        <p class="eyebrow">PATENTE B</p>

        <h1>MSH Patente</h1>

        <p class="subtitle">
          Impara, esercitati e preparati per l'esame.
        </p>

        <div class="button-group">
          <button
            id="loginPageButton"
            class="btn btn-primary"
          >
            Accedi
          </button>

          <button
            id="registerPageButton"
            class="btn btn-secondary"
          >
            Registrati
          </button>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#loginPageButton")
    .addEventListener("click", showLogin);

  document
    .querySelector("#registerPageButton")
    .addEventListener("click", showRegister);
    
}

function showRegister() {
  app.innerHTML = `
    <main class="page">
      <section class="card auth-card">
        <button
          id="registerBackButton"
          class="back-button"
        >
          ← Home
        </button>

        <p class="eyebrow">NUOVO STUDENTE</p>
        <h1>Crea un account</h1>

        <p class="subtitle">
          Registrati per salvare i tuoi progressi.
        </p>

        <form
          id="registerForm"
          class="auth-form"
        >
          <label for="studentName">
            Nome e cognome
          </label>

          <input
            id="studentName"
            type="text"
            placeholder="Mario Rossi"
            required
          />

          <label for="registerEmail">
            Email
          </label>

          <input
            id="registerEmail"
            type="email"
            placeholder="nome@email.com"
            required
          />

          <label for="registerPassword">
            Password
          </label>

          <input
            id="registerPassword"
            type="password"
            minlength="6"
            placeholder="Minimo 6 caratteri"
            required
          />

          <label for="confirmPassword">
            Conferma password
          </label>

          <input
            id="confirmPassword"
            type="password"
            minlength="6"
            placeholder="Ripeti la password"
            required
          />

          <button
            type="submit"
            class="btn btn-primary full-width"
          >
            Registrati
          </button>
        </form>

    
        <p id="message" class="message"></p>

        <p class="switch-text">
          Hai già un account?

          <button
            id="goToLoginButton"
            class="text-button"
          >
            Accedi
          </button>
        </p>
      </section>
    </main>
  `;

  document
    .querySelector("#registerBackButton")
    .addEventListener("click", showHome);

  document
    .querySelector("#goToLoginButton")
    .addEventListener("click", showLogin);

  document
    .querySelector("#registerForm")
    .addEventListener(
      "submit",
      registerStudent
    );
}

async function registerStudent(event) {
  event.preventDefault();

  const name =
    document
      .querySelector("#studentName")
      .value
      .trim();

  const email =
    document
      .querySelector("#registerEmail")
      .value
      .trim();

  const password =
    document
      .querySelector("#registerPassword")
      .value;

  const confirmPassword =
    document
      .querySelector("#confirmPassword")
      .value;

  if (password !== confirmPassword) {
    showMessage(
      "Le password non coincidono."
    );

    return;
  }

  const submitButton =
    event.currentTarget.querySelector(
      "button[type='submit']"
    );

  submitButton.disabled = true;
  submitButton.textContent =
    "Registrazione...";

  try {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name,
        email: user.email,
        role: "student",
        xp: 0,
        completedQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    if (
      error.code ===
      "auth/email-already-in-use"
    ) {
      showMessage(
        "Questa email è già registrata."
      );
    } else if (
      error.code === "auth/invalid-email"
    ) {
      showMessage(
        "Inserisci un indirizzo email valido."
      );
    } else if (
      error.code === "auth/weak-password"
    ) {
      showMessage(
        "La password deve contenere almeno 6 caratteri."
      );
    } else {
      showMessage(
        "Si è verificato un errore durante la registrazione."
      );
    }

    submitButton.disabled = false;
    submitButton.textContent =
      "Registrati";
  }
}

function showLogin() {
  app.innerHTML = `
    <main class="page">
      <section class="card auth-card">
        <button
          id="loginBackButton"
          class="back-button"
          type="button"
        >
          ← Home
        </button>

        <p class="eyebrow">AREA STUDENTE</p>
        <h1>Accedi</h1>

        <p class="subtitle">
          Continua la tua preparazione.
        </p>

        <form
          id="loginForm"
          class="auth-form"
        >
          <label for="loginEmail">
            Email
          </label>

          <input
            id="loginEmail"
            type="email"
            placeholder="nome@email.com"
            required
          />

          <label for="loginPassword">
            Password
          </label>

          <input
            id="loginPassword"
            type="password"
            placeholder="La tua password"
            required
          />

          <button
            type="submit"
            class="btn btn-primary full-width"
          >
            Accedi
          </button>
        </form>

        <button
          id="forgotPasswordButton"
          class="text-button forgot-password-button"
          type="button"
        >
          Password dimenticata?
        </button>

        <p id="message" class="message"></p>

        <p class="switch-text">
          Non hai un account?

          <button
            id="goToRegisterButton"
            class="text-button"
            type="button"
          >
            Registrati
          </button>
        </p>
      </section>
    </main>
  `;

  document
    .querySelector("#loginBackButton")
    .addEventListener(
      "click",
      showHome
    );

  document
    .querySelector("#goToRegisterButton")
    .addEventListener(
      "click",
      showRegister
    );

  document
    .querySelector("#loginForm")
    .addEventListener(
      "submit",
      loginStudent
    );

  document
    .querySelector("#forgotPasswordButton")
    .addEventListener(
      "click",
      resetStudentPassword
    );
}

async function loginStudent(event) {
  event.preventDefault();

  const email =
    document
      .querySelector("#loginEmail")
      .value
      .trim();

  const password =
    document
      .querySelector("#loginPassword")
      .value;

  const submitButton =
    event.currentTarget.querySelector(
      "button[type='submit']"
    );

  submitButton.disabled = true;
  submitButton.textContent = "Accesso...";

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    showMessage(
      "Email o password non corretti."
    );

    submitButton.disabled = false;
    submitButton.textContent = "Accedi";
  }
}

async function resetStudentPassword() {
  const emailInput =
    document.querySelector("#loginEmail");

  const email =
    emailInput.value.trim();

  if (!email) {
    showMessage(
      "Inserisci prima il tuo indirizzo email."
    );

    emailInput.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(
      auth,
      email
    );

    showMessage(
      "Email di reimpostazione inviata. Controlla anche la cartella spam.",
      "success"
    );
  } catch (error) {
    console.error(
      "Password reset error:",
      error
    );

    if (error.code === "auth/invalid-email") {
      showMessage(
        "Inserisci un indirizzo email valido."
      );
    } else if (
      error.code === "auth/too-many-requests"
    ) {
      showMessage(
        "Hai effettuato troppe richieste. Riprova più tardi."
      );
    } else {
      showMessage(
        "Non è stato possibile inviare l'email di reimpostazione."
      );
    }
  }
}

async function ensureUserDocument(user) {
  const userReference =
    doc(db, "users", user.uid);

  const userSnapshot =
    await getDoc(userReference);

  if (!userSnapshot.exists()) {
    await setDoc(userReference, {
      uid: user.uid,
      name:
        user.displayName ||
        user.email?.split("@")[0] ||
        "Studente",
      email: user.email,
      role: "student",
      xp: 0,
      completedQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  return userReference;
}

async function loadAllTopicProgress(user) {
  const progress = {};

  const snapshot =
    await getDocs(
      collection(
        db,
        "users",
        user.uid,
        "topicProgress"
      )
    );

  snapshot.forEach((item) => {
    progress[item.id] = item.data();
  });

  return progress;
}

async function loadWrongAnswerDocuments(user) {
  const records = [];

  const snapshot =
    await getDocs(
      collection(
        db,
        "users",
        user.uid,
        "wrongAnswers"
      )
    );

  snapshot.forEach((item) => {
    records.push({
      id: item.id,
      ...item.data()
    });
  });

  return records;
}

function buildErrorStatistics(records) {
  return {
    activeCount:
      records.filter(
        (item) => item.active === true
      ).length,

    masteredCount:
      records.filter(
        (item) => item.mastered === true
      ).length
  };
}

function hydrateWrongAnswers(records) {
  return records
    .filter(
      (record) => record.active === true
    )
    .map((record) => {
      const question =
        questions.find(
          (item) =>
            item.id === record.questionId
        );

      const topic =
        topics.find(
          (item) =>
            item.id === record.topicId
        );

      const argomento =
        argomenti.find(
          (item) =>
            item.id === record.argomentoId
        );

      if (!question) {
        return null;
      }

      return {
        ...record,
        ...question,
        topicTitle:
          topic?.title ||
          record.topicTitle ||
          "Topic",
        argomentoTitle:
          argomento?.title ||
          record.argomentoTitle ||
          "Argomento"
      };
    })
    .filter(Boolean)
    .sort(
      (first, second) =>
        Number(second.wrongCount || 0) -
        Number(first.wrongCount || 0)
    );
}

function buildCourseProgress(
  progress,
  stats
) {
  const completedTopics =
    topics.filter(
      (topic) =>
        progress[topic.id]?.completed === true
    ).length;

  const totalTopics = topics.length;

  const coursePercentage =
    totalTopics > 0
      ? Math.round(
          (completedTopics / totalTopics) * 100
        )
      : 0;

  let lastTopic = null;

  if (stats.lastTopicId) {
    const topic =
      topics.find(
        (item) =>
          item.id === stats.lastTopicId
      );

    const argomento =
      argomenti.find(
        (item) =>
          item.id ===
          stats.lastArgomentoId
      );

    if (topic && argomento) {
      lastTopic = {
        ...topic,
        argomento,
        argomentoTitle:
          argomento.title,
        bestScore:
          Number(
            progress[topic.id]?.bestScore
          ) || 0
      };
    }
  }

  return {
    completedTopics,
    totalTopics,
    coursePercentage,
    lastTopic
  };
}

async function loadDashboard(user) {
  showLoading(
    "Caricamento della dashboard..."
  );

  try {
    const userReference =
      await ensureUserDocument(user);

    const [
      userSnapshot,
      progress,
      wrongAnswerRecords
    ] = await Promise.all([
      getDoc(userReference),
      loadAllTopicProgress(user),
      loadWrongAnswerDocuments(user)
    ]);

    const stats =
      userSnapshot.data();

    const courseProgress =
      buildCourseProgress(
        progress,
        stats
      );

    const errorStatistics =
      buildErrorStatistics(
        wrongAnswerRecords
      );

    showDashboard(
      app,
      user,
      stats,
      courseProgress,
      errorStatistics,
      {
        onLogout: async () => {
          await signOut(auth);
        },

        onStartArgomenti: () => {
          openArgomentiPage(user);
        },

        onOpenErrors: () => {
          openWrongAnswersPage(user);
        },
onOpenExamHistory: () => {
  openExamHistoryPage(user);
},
        onContinueStudy: (
          lastTopic
        ) => {
          startTopicQuiz(
            user,
            lastTopic.argomento,
            lastTopic
          );
        },
        onReloadDashboard: () => {
  loadDashboard(user);
},
      }
    );
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare la dashboard.",
      () => loadDashboard(user)
    );
  }
}

async function openArgomentiPage(user) {
  showLoading(
    "Caricamento degli argomenti..."
  );

  try {
    const progress =
      await loadAllTopicProgress(user);

    showArgomenti(
      app,
      progress,
      {
        onBack: () => {
          loadDashboard(user);
        },

        onSelectArgomento: (
          argomento
        ) => {
          openTopicsPage(
            user,
            argomento
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Argomenti loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare gli argomenti.",
      () => openArgomentiPage(user)
    );
  }
}

async function loadTopicProgress(
  user,
  argomentoId
) {
  const allProgress =
    await loadAllTopicProgress(user);

  const progress = {};

  Object.entries(allProgress)
    .forEach(([topicId, data]) => {
      if (
        data.argomentoId ===
        argomentoId
      ) {
        progress[topicId] = data;
      }
    });

  return progress;
}

async function openTopicsPage(
  user,
  argomento
) {
  showLoading(
    "Caricamento dei topic..."
  );

  try {
    const progress =
      await loadTopicProgress(
        user,
        argomento.id
      );

    showTopics(
      app,
      argomento,
      progress,
      {
        onBack: () => {
          openArgomentiPage(user);
        },

        onSelectTopic: (
          topic
        ) => {
          startTopicQuiz(
            user,
            argomento,
            topic
          );
        },

        onStartArgomentoQuiz: () => {
          startArgomentoQuiz(
            user,
            argomento
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Topic loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare i topic.",
      () =>
        openTopicsPage(
          user,
          argomento
        )
    );
  }
}

async function openWrongAnswersPage(user) {
  showLoading(
    "Caricamento degli errori..."
  );

  try {
    const records =
      await loadWrongAnswerDocuments(user);

    const wrongAnswers =
      hydrateWrongAnswers(records);

    const statistics =
      buildErrorStatistics(records);

    showWrongAnswers(
      app,
      wrongAnswers,
      statistics,
      {
        onBack: () => {
          loadDashboard(user);
        },

        onGoToArgomenti: () => {
          openArgomentiPage(user);
        },

        onStartReview: () => {
          startWrongAnswersQuiz(
            user,
            wrongAnswers
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Wrong answers loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare gli errori.",
      () => openWrongAnswersPage(user)
    );
  }
}

async function openExamHistoryPage(user) {
  showLoading(
    "Caricamento della cronologia esami..."
  );

  try {
    await showExamHistory({
      container: app,
      user,
      onBack: () => {
        loadDashboard(user);
      }
    });
  } catch (error) {
    console.error(
      "Exam history loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare la cronologia degli esami.",
      () => openExamHistoryPage(user)
    );
  }
}

function shuffleQuestions(items) {
  const shuffled = [...items];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() * (index + 1)
      );

    [
      shuffled[index],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
}

function startTopicQuiz(
  user,
  argomento,
  topic
) {
  const topicQuestions =
    questions.filter(
      (question) =>
        question.topicId === topic.id
    );

  showQuiz(app, {
    questions:
      shuffleQuestions(topicQuestions),

    title: topic.title,

    onBack: () => {
      openTopicsPage(
        user,
        argomento
      );
    },

    onFinish: (result) => {
      saveTopicQuizResult(
        user,
        argomento,
        topic,
        result
      );
    }
  });
}

function startArgomentoQuiz(
  user,
  argomento
) {
  const argomentoQuestions =
    questions.filter(
      (question) =>
        question.argomentoId ===
        argomento.id
    );

  showQuiz(app, {
    questions:
      shuffleQuestions(
        argomentoQuestions
      ),

    title:
      `Quiz completo: ${argomento.title}`,

    onBack: () => {
      openTopicsPage(
        user,
        argomento
      );
    },

    onFinish: (result) => {
      saveArgomentoQuizResult(
        user,
        argomento,
        result
      );
    }
  });
}

function startWrongAnswersQuiz(
  user,
  wrongAnswers
) {
  showQuiz(app, {
    questions:
      shuffleQuestions(wrongAnswers),

    title: "Ripasso dei miei errori",

    onBack: () => {
      openWrongAnswersPage(user);
    },

    onFinish: (result) => {
      saveWrongAnswersQuizResult(
        user,
        result
      );
    }
  });
}

async function synchronizeWrongAnswers(
  user,
  answers
) {
  for (const answer of answers) {
    const question =
      questions.find(
        (item) =>
          item.id === answer.questionId
      );

    if (!question) {
      continue;
    }

    const topic =
      topics.find(
        (item) =>
          item.id === question.topicId
      );

    const argomento =
      argomenti.find(
        (item) =>
          item.id === question.argomentoId
      );

    const reference =
      doc(
        db,
        "users",
        user.uid,
        "wrongAnswers",
        question.id
      );

    const snapshot =
      await getDoc(reference);

    const previousData =
      snapshot.exists()
        ? snapshot.data()
        : {};

    if (!answer.isCorrect) {
      await setDoc(
        reference,
        {
          questionId: question.id,
          topicId: question.topicId,
          topicTitle:
            topic?.title || "",
          argomentoId:
            question.argomentoId,
          argomentoTitle:
            argomento?.title || "",
          wrongCount: increment(1),
          correctStreak: 0,
          active: true,
          mastered: false,
          lastWrongAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

      continue;
    }

    if (
      snapshot.exists() &&
      previousData.active === true
    ) {
      const nextCorrectStreak =
        (Number(
          previousData.correctStreak
        ) || 0) + 1;

      const mastered =
        nextCorrectStreak >=
        REQUIRED_CORRECT_STREAK;

      await setDoc(
        reference,
        {
          correctStreak:
            nextCorrectStreak,
          active: !mastered,
          mastered,
          masteredAt:
            mastered
              ? serverTimestamp()
              : previousData.masteredAt || null,
          lastCorrectAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );
    }
  }
}

async function saveTopicQuizResult(
  user,
  argomento,
  topic,
  result
) {
  const percentage =
    calculatePercentage(result);

  const completed =
    percentage >=
    TOPIC_PASS_PERCENTAGE;

  showResultPage({
    title: topic.title,
    percentage,
    result,
    completed,
    passMessage:
      `Topic completato! Hai raggiunto almeno ${TOPIC_PASS_PERCENTAGE}%.`,
    failMessage:
      `Per completare il topic devi raggiungere almeno ${TOPIC_PASS_PERCENTAGE}%.`,
    onPrimaryAction: () => {
      openTopicsPage(
        user,
        argomento
      );
    },
    primaryLabel:
      "Torna ai topic",
    onSecondaryAction: () => {
      startTopicQuiz(
        user,
        argomento,
        topic
      );
    },
    secondaryLabel:
      "Ripeti quiz"
  });

  try {
    const progressReference =
      doc(
        db,
        "users",
        user.uid,
        "topicProgress",
        topic.id
      );

    const oldSnapshot =
      await getDoc(progressReference);

    const oldData =
      oldSnapshot.exists()
        ? oldSnapshot.data()
        : {};

    const bestScore =
      Math.max(
        Number(oldData.bestScore) || 0,
        percentage
      );

    await setDoc(
      progressReference,
      {
        topicId: topic.id,
        argomentoId:
          argomento.id,
        topicTitle: topic.title,
        attempts: increment(1),
        bestScore,
        completed:
          oldData.completed === true ||
          completed,
        lastScore: percentage,
        lastCorrectAnswers:
          result.correctAnswers,
        lastWrongAnswers:
          result.wrongAnswers,
        lastTotalQuestions:
          result.totalQuestions,
        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    await synchronizeWrongAnswers(
      user,
      result.answers
    );

    await saveGeneralStats(
      user,
      result,
      {
        lastQuizMode: "topic",
        lastTopicId: topic.id,
        lastTopicName: topic.title,
        lastArgomentoId:
          argomento.id,
        lastArgomentoName:
          argomento.title,
        lastQuizPercentage:
          percentage
      }
    );
    let earnedXp =
  XP_REWARDS.topicQuiz;

if (result.wrongAnswers === 0) {
  earnedXp +=
    XP_REWARDS.perfectTopicBonus;
}

await addExperience(
  user,
  earnedXp
);


  
  } catch (error) {
    console.error(
      "Topic saving error:",
      error
    );

    updateResultSavingMessage(
      "Il quiz è terminato, ma alcuni dati non sono stati salvati.",
      "error"
    );
  }

  enableResultButtons();
}

async function saveArgomentoQuizResult(
  user,
  argomento,
  result
) {
  const percentage =
    calculatePercentage(result);

  showResultPage({
    title:
      `Quiz completo: ${argomento.title}`,
    percentage,
    result,
    completed: true,
    passMessage:
      "Quiz completo terminato.",
    failMessage:
      "Quiz completo terminato.",
    onPrimaryAction: () => {
      openTopicsPage(
        user,
        argomento
      );
    },
    primaryLabel:
      "Torna ai topic",
    onSecondaryAction: () => {
      startArgomentoQuiz(
        user,
        argomento
      );
    },
    secondaryLabel:
      "Ripeti quiz completo"
  });

  try {
    const reference =
      doc(
        db,
        "users",
        user.uid,
        "argomentoProgress",
        argomento.id
      );

    const oldSnapshot =
      await getDoc(reference);

    const oldData =
      oldSnapshot.exists()
        ? oldSnapshot.data()
        : {};

    await setDoc(
      reference,
      {
        argomentoId:
          argomento.id,
        argomentoTitle:
          argomento.title,
        attempts: increment(1),
        bestScore:
          Math.max(
            Number(oldData.bestScore) || 0,
            percentage
          ),
        lastScore: percentage,
        lastCorrectAnswers:
          result.correctAnswers,
        lastWrongAnswers:
          result.wrongAnswers,
        lastTotalQuestions:
          result.totalQuestions,
        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    await synchronizeWrongAnswers(
      user,
      result.answers
    );

    await saveGeneralStats(
      user,
      result,
      {
        lastQuizMode:
          "argomento",
        lastArgomentoId:
          argomento.id,
        lastArgomentoName:
          argomento.title,
        lastQuizPercentage:
          percentage
      }
    );

    updateResultSavingMessage(
      "Risultato e lista errori salvati.",
      "success"
    );
  } catch (error) {
    console.error(
      "Argomento saving error:",
      error
    );

    updateResultSavingMessage(
      "Il quiz è terminato, ma alcuni dati non sono stati salvati.",
      "error"
    );
  }

  enableResultButtons();
}

async function saveWrongAnswersQuizResult(
  user,
  result
) {
  const percentage =
    calculatePercentage(result);

  showResultPage({
    title: "Ripasso dei miei errori",
    percentage,
    result,
    completed:
      result.wrongAnswers === 0,
    passMessage:
      "Ottimo lavoro! Hai risposto correttamente a tutte le domande.",
    failMessage:
      "Continua ad allenarti sulle domande ancora difficili.",
    onPrimaryAction: () => {
      openWrongAnswersPage(user);
    },
    primaryLabel:
      "Aggiorna i miei errori",
    onSecondaryAction: () => {
      openArgomentiPage(user);
    },
    secondaryLabel:
      "Vai agli argomenti"
  });

  try {
    await synchronizeWrongAnswers(
      user,
      result.answers
    );

    await saveGeneralStats(
      user,
      result,
      {
        lastQuizMode:
          "wrong-answers",
        lastQuizPercentage:
          percentage
      }
    );
await addExperience(
  user,
  XP_REWARDS.wrongAnswersReview
);
updateResultSavingMessage(
  `Progressi aggiornati. Hai guadagnato ${XP_REWARDS.wrongAnswersReview} XP.`,
  "success"
);
  } catch (error) {
    console.error(
      "Error review saving error:",
      error
    );

    updateResultSavingMessage(
      "Il ripasso è terminato, ma i progressi non sono stati salvati.",
      "error"
    );
  }

  enableResultButtons();
}

function calculatePercentage(result) {
  if (
    !result ||
    result.totalQuestions <= 0
  ) {
    return 0;
  }

  return Math.round(
    (
      result.correctAnswers /
      result.totalQuestions
    ) * 100
  );
}

async function saveGeneralStats(
  user,
  result,
  additionalData
) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      completedQuizzes:
        increment(1),
      totalQuestions:
        increment(
          result.totalQuestions
        ),
      correctAnswers:
        increment(
          result.correctAnswers
        ),
      wrongAnswers:
        increment(
          result.wrongAnswers
        ),
      lastQuizAt:
        serverTimestamp(),
      updatedAt:
        serverTimestamp(),
      ...additionalData
    },
    {
      merge: true
    }
  );
}

function showResultPage({
  title,
  percentage,
  result,
  completed,
  passMessage,
  failMessage,
  onPrimaryAction,
  primaryLabel,
  onSecondaryAction,
  secondaryLabel
}) {
  app.innerHTML = `
    <main class="page">
      <section class="card result-card">
        <p class="eyebrow">
          ${title}
        </p>

        <h1>Quiz completato!</h1>

        <div class="result-circle">
          <strong>${percentage}%</strong>
          <span>Risultato</span>
        </div>

        <div class="result-stats">
          <div>
            <span>Domande</span>
            <strong>
              ${result.totalQuestions}
            </strong>
          </div>

          <div>
            <span>Corrette</span>
            <strong>
              ${result.correctAnswers}
            </strong>
          </div>

          <div>
            <span>Sbagliate</span>
            <strong>
              ${result.wrongAnswers}
            </strong>
          </div>
        </div>

        <div
          class="completion-message ${
            completed
              ? "completion-success"
              : "completion-warning"
          }"
        >
          ${
            completed
              ? passMessage
              : failMessage
          }
        </div>

        <p
          id="savingMessage"
          class="message success"
        >
          Salvataggio del risultato...
        </p>

        <div class="result-actions">
          <button
            id="secondaryResultButton"
            class="btn btn-secondary"
            disabled
          >
            ${secondaryLabel}
          </button>

          <button
            id="primaryResultButton"
            class="btn btn-primary"
            disabled
          >
            ${primaryLabel}
          </button>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#secondaryResultButton"
    )
    .addEventListener(
      "click",
      onSecondaryAction
    );

  document
    .querySelector(
      "#primaryResultButton"
    )
    .addEventListener(
      "click",
      onPrimaryAction
    );
}

function updateResultSavingMessage(
  message,
  type
) {
  const savingMessage =
    document.querySelector(
      "#savingMessage"
    );

  if (!savingMessage) {
    return;
  }

  savingMessage.textContent = message;
  savingMessage.className =
    `message ${type}`;
}

function enableResultButtons() {
  const primaryButton =
    document.querySelector(
      "#primaryResultButton"
    );

  const secondaryButton =
    document.querySelector(
      "#secondaryResultButton"
    );

  if (primaryButton) {
    primaryButton.disabled = false;
  }

  if (secondaryButton) {
    secondaryButton.disabled = false;
  }
}

function showErrorPage(
  message,
  retryAction
) {
  app.innerHTML = `
    <main class="page">
      <section class="card">
        <h1>Errore</h1>

        <p class="subtitle">
          ${message}
        </p>

        <button
          id="retryButton"
          class="btn btn-primary"
        >
          Riprova
        </button>
      </section>
    </main>
  `;

  document
    .querySelector("#retryButton")
    .addEventListener(
      "click",
      retryAction
    );
}

onAuthStateChanged(
  auth,
  (user) => {
    if (user) {
      loadDashboard(user);
    } else {
      showHome();
    }
  }
);