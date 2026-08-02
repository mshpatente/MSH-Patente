import "./style.css";
import "./founder-footer.css";
import "./internal-pages-restoration.css";
import "./internal-pages-restoration-final.css";
import "./visual-polish.css";
import "./quiz-v2.css";
import "./result-v2.css";
import "./theory-v2.css";
import "./dictionary-page.css";
import "./profile-premium.css";
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
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase.js";

import {
  loadTheoryProgress,
  markTheoryLessonCompleted,
  saveLastOpenedTheoryLesson
} from "./services/theoryProgressService.js";

import {
  loadPublishedTheoryLessons
} from "./services/theoryLessonService.js";

import {
  initializePwa
} from "./services/pwaService.js";

import {
  initializeNotifications,
  resetNotifications
} from "./services/notificationManagerService.js";

import {
  ensureUserDocument,
  loadAllTopicProgress,
  loadWrongAnswerDocuments
} from "./services/userDataService.js";

import {
  loadProgressiveProgress
} from "./services/progressiveProgressService.js";

import {
  synchronizeWrongAnswers
} from "./services/wrongAnswerService.js";

import {
  calculateTheorySummary,
  buildCourseProgress,
  buildErrorStatistics,
  hydrateWrongAnswers
} from "./services/dashboardService.js";

import {
  officialArgomenti as argomenti
} from "./data/officialArgomenti.js";
import {
  officialTopics as topics
} from "./data/officialTopics.js";
import { questions } from "./data/questions.js";
import {
  loadPublishedQuestions
} from "./services/questionService.js";

import {
  addExperience,
  loadProgress,
  calculateLevelProgress
} from "./utils/progressSystem.js";

import {
  selectAdaptiveQuestions
} from "./utils/selectAdaptiveQuestions.js";

import {
  formatQuizDuration
} from "./utils/quizUtils.js";


import {
  magicTricks
} from "./data/magicTricks.js";

import { showDashboard } from "./pages/dashboard.js";
import { showArgomenti } from "./pages/argomenti.js";
import { showTopics } from "./pages/topics.js";
import { showQuiz } from "./pages/quiz.js";
import { showTheory } from "./pages/theory.js";
import {
  showTheoryTopics
} from "./pages/theoryTopics.js";
import {
  showTheoryLessons
} from "./pages/theoryLessons.js";
import {
  showTheoryReader
} from "./pages/theoryReader.js";

import {
  showProgressiveQuizSetup
} from "./pages/progressiveQuizSetup.js";

import {
  showMagicTricks
} from "./pages/magicTricks.js";

import {
  loadPublishedTheoryVideos
} from "./services/videoService.js";

const app =
  document.querySelector("#app");

let availableQuestions = [];

initializePwa();

const TOPIC_PASS_PERCENTAGE = 80;

const XP_REWARDS = {
  topicQuiz: 10,
  perfectTopicBonus: 5,
  subtopicQuiz: 8,
  progressiveQuiz: 12,
perfectProgressiveBonus: 6,
perfectSubtopicBonus: 4,
  wrongAnswersReview: 8,
  adaptiveQuiz: 15,
  perfectAdaptiveBonus: 10
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
async function loadQuizQuestions() {
  try {
    const firestoreQuestions =
      await loadPublishedQuestions();

    if (
      Array.isArray(firestoreQuestions) &&
      firestoreQuestions.length > 0
    ) {
      availableQuestions =
  firestoreQuestions;

return availableQuestions;
    }

    console.warn(
      "Nessuna domanda pubblicata in Firestore. Uso il fallback locale."
    );

    availableQuestions = questions;

    return availableQuestions;
  } catch (error) {
    console.error(
      "Firestore quiz questions loading error:",
      error
    );

    availableQuestions = questions;

    return availableQuestions;
  }
}


function normalizeQuizIdentifier(value) {
  return String(
    value || ""
  ).trim();
}


function getSubtopicQuestions({
  questionList =
    availableQuestions,

  argomentoId,
  topicId,
  subtopicId,
  lessonId
} = {}) {
  const safeArgomentoId =
    normalizeQuizIdentifier(
      argomentoId
    );

  const safeTopicId =
    normalizeQuizIdentifier(
      topicId
    );

  const safeSubtopicId =
    normalizeQuizIdentifier(
      subtopicId
    );

  const safeLessonId =
    normalizeQuizIdentifier(
      lessonId
    );

  if (
    !Array.isArray(questionList) ||
    questionList.length === 0
  ) {
    return [];
  }

  if (
    !safeTopicId ||
    (
      !safeSubtopicId &&
      !safeLessonId
    )
  ) {
    return [];
  }

  return questionList.filter(
    (question) => {
      const questionArgomentoId =
        normalizeQuizIdentifier(
          question.argomentoId
        );

      const questionTopicId =
        normalizeQuizIdentifier(
          question.topicId
        );

      const questionSubtopicId =
        normalizeQuizIdentifier(
          question.subtopicId
        );

      const questionLessonId =
        normalizeQuizIdentifier(
          question.lessonId
        );

      const matchesArgomento =
        !safeArgomentoId ||
        questionArgomentoId ===
          safeArgomentoId;

      const matchesTopic =
        questionTopicId ===
          safeTopicId;

      const matchesSubtopic =
        safeSubtopicId &&
        questionSubtopicId ===
          safeSubtopicId;

      const matchesLesson =
        safeLessonId &&
        questionLessonId ===
          safeLessonId;

      return (
        matchesArgomento &&
        matchesTopic &&
        (
          matchesSubtopic ||
          matchesLesson
        )
      );
    }
  );
}
function getProgressiveQuestions({
  questionList =
    availableQuestions,

  completedLessonIds = [],

  argomentoId,
  topicId
} = {}) {
  const safeArgomentoId =
    normalizeQuizIdentifier(
      argomentoId
    );

  const safeTopicId =
    normalizeQuizIdentifier(
      topicId
    );

  const safeCompletedLessonIds =
    new Set(
      Array.from(
        completedLessonIds || []
      )
        .map(
          normalizeQuizIdentifier
        )
        .filter(Boolean)
    );

  if (
    !Array.isArray(questionList) ||
    questionList.length === 0
  ) {
    return [];
  }

  if (
    !safeArgomentoId ||
    !safeTopicId ||
    safeCompletedLessonIds.size === 0
  ) {
    return [];
  }

  return questionList.filter(
    (question) => {
      const questionArgomentoId =
        normalizeQuizIdentifier(
          question.argomentoId
        );

      const questionTopicId =
        normalizeQuizIdentifier(
          question.topicId
        );

      const questionLessonId =
        normalizeQuizIdentifier(
          question.lessonId
        );

      return (
        questionArgomentoId ===
          safeArgomentoId &&
        questionTopicId ===
          safeTopicId &&
        safeCompletedLessonIds.has(
          questionLessonId
        )
      );
    }
  );
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

premiumAccess: {
  enabled: false,
  unlimited: false,
  startsAt: null,
  expiresAt: null,
  grantedAt: null,
  grantedBy: "",
  revokedAt: null,
  revokedBy: ""
},

authorizedDevice: {
  deviceIdHash: "",
  status: "unbound",
  boundAt: null,
  lastSeenAt: null,
  resetAt: null,
  resetBy: ""
},

xp: 0,
completedQuizzes: 0,
totalQuestions: 0,
correctAnswers: 0,
wrongAnswers: 0,

createdAt:
  serverTimestamp(),

updatedAt:
  serverTimestamp()
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
  progressiveProgress,
  wrongAnswerRecords,
  theoryProgress,
  publishedTheoryLessons
] = await Promise.all([
  getDoc(userReference),
  loadAllTopicProgress(user),
  loadProgressiveProgress(user),
  loadWrongAnswerDocuments(user),
  loadTheoryProgress(user),
  loadPublishedTheoryLessons()
]);

await loadQuizQuestions();
    const stats =
      userSnapshot.data() || {};

    const courseProgress =
      buildCourseProgress(
        progress,
        stats
      );

    const errorStatistics =
      buildErrorStatistics(
        wrongAnswerRecords
      );

    const theorySummary =
  calculateTheorySummary(
    publishedTheoryLessons,
    theoryProgress
      .completedLessonIds,
    stats
  );

   showDashboard(
  app,
  user,
  stats,
  courseProgress,
  errorStatistics,
  theorySummary,
  {
    onOpenProfile: () => {
      openProfilePage(user);
    },

    onOpenDictionary: () => {
      openDictionaryPage(user);
    },

    onOpenAdminTheory: () => {
      openAdminTheoryPage(user);
    },

    onOpenAdminVideos: () => {
      openAdminVideosPage(user);
    },

    onOpenAdminPremiumUsers: () => {
  openAdminPremiumUsersPage(
    user
  );
},

    onLogout: async () => {
      await signOut(auth);
    },

    onOpenMagicTricks: () => {
      openMagicTricksPage(user);
    },

    onOpenTheory: () => {
      openTheoryPage(user);
    },

    onOpenVideoLessons: () => {
      openVideoLessonsPage(user);
    },

    onStartArgomenti: () => {
      openArgomentiPage(user);
    },

    onStartAdaptiveQuiz: () => {
      startAdaptiveQuiz(user);
    },

    onOpenErrors: () => {
      openWrongAnswersPage(user);
    },

    onOpenExamHistory: () => {
      openExamHistoryPage(user);
    },

    onContinueStudy: (lastTopic) => {
      startTopicQuiz(
        user,
        lastTopic.argomento,
        lastTopic
      );
    },

    onReloadDashboard: () => {
      loadDashboard(user);
    }
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

function openMagicTricksPage(user) {
  showMagicTricks(
    app,
    user,
    {
      onBack: () => {
        loadDashboard(user);
      },

      onOpenLesson: (trick) => {
        openMagicRelatedLesson(
          user,
          trick
        );
      },

      onStartQuiz: (trick) => {
        startMagicRelatedQuiz(
          user,
          trick
        );
      }
    }
  );
}

async function openMagicRelatedLesson(
  user,
  trick
) {
  const publishedTheoryLessons =
    await loadPublishedTheoryLessons();

  const lesson =
    publishedTheoryLessons.find(
      (item) =>
        item.id === trick.lessonId &&
        item.published === true
    );

  if (!lesson) {
    console.error(
      "Magic lesson non trovata:",
      trick.lessonId
    );

    return;
  }

  const topic =
    topics.find(
      (item) =>
        item.id ===
        lesson.topicId
    );

  const argomento =
    argomenti.find(
      (item) =>
        item.id ===
        lesson.argomentoId
    );

  if (
    !topic ||
    !argomento
  ) {
    console.error(
      "Magic lesson navigation incompleta:",
      trick
    );

    return;
  }

  const topicLessons =
    publishedTheoryLessons
      .filter(
        (item) =>
          item.published === true &&
          item.topicId === topic.id &&
          item.argomentoId ===
            argomento.id
      )
      .sort(
        (first, second) =>
          first.order -
          second.order
      );

  openTheoryReaderPage(
    user,
    argomento,
    topic,
    lesson,
    topicLessons
  );
}

function startMagicRelatedQuiz(
  user,
  trick
) {
  const topic =
    topics.find(
      (item) =>
        item.id === trick.topicId
    );

  const argomento =
    argomenti.find(
      (item) =>
        item.id ===
        trick.argomentoId
    );

  if (
    !topic ||
    !argomento
  ) {
    console.error(
      "Magic quiz navigation incompleta:",
      trick
    );

    return;
  }

  startTopicQuiz(
    user,
    argomento,
    topic
  );
}

async function openDashboardTheoryLesson(
  user,
  lastLesson
) {
  if (
    !lastLesson ||
    !lastLesson.argomento ||
    !lastLesson.topic
  ) {
    openTheoryPage(user);

    return;
  }

  const publishedTheoryLessons =
    await loadPublishedTheoryLessons();

  const topicLessons =
    publishedTheoryLessons
      .filter(
        (lesson) =>
          lesson.published === true &&
          lesson.argomentoId ===
            lastLesson.argomento.id &&
          lesson.topicId ===
            lastLesson.topic.id
      )
      .sort(
        (first, second) =>
          first.order -
          second.order
      );

  const selectedLesson =
    topicLessons.find(
      (lesson) =>
        lesson.id ===
        lastLesson.id
    );

  if (!selectedLesson) {
    openTheoryPage(user);

    return;
  }

  openTheoryReaderPage(
    user,
    lastLesson.argomento,
    lastLesson.topic,
    selectedLesson,
    topicLessons
  );
}

async function openTheoryPage(user) {
  showLoading(
    "Caricamento della teoria..."
  );

  try {
    const [
      theoryProgress,
      publishedTheoryLessons
    ] = await Promise.all([
      loadTheoryProgress(user),
      loadPublishedTheoryLessons()
    ]);

    const completedLessonIds =
      new Set(
        theoryProgress
          .completedLessonIds
      );

    showTheory(
      app,
      publishedTheoryLessons,
      completedLessonIds,
      {
        onBack: () => {
          loadDashboard(user);
        },

        onSelectArgomento: (
          argomento
        ) => {
          openTheoryTopicsPage(
            user,
            argomento
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Theory page loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare la teoria.",
      () => openTheoryPage(user)
    );
  }
}

async function openTheoryTopicsPage(
  user,
  argomento
) {
  showLoading(
    "Caricamento dei topic..."
  );

  try {
    const [
      theoryProgress,
      publishedTheoryLessons,
      publishedTheoryVideos
    ] = await Promise.all([
      loadTheoryProgress(user),
      loadPublishedTheoryLessons(),
      loadPublishedTheoryVideos()
    ]);

    const completedLessonIds =
      new Set(
        theoryProgress
          .completedLessonIds
      );

    showTheoryTopics(
      app,
      argomento,
      publishedTheoryLessons,
      publishedTheoryVideos,
      completedLessonIds,
      {
        onBack: () => {
          openTheoryPage(user);
        },

        onSelectTopic: (
          topic
        ) => {
          openTheoryLessonsPage(
            user,
            argomento,
            topic
          );
        },

        onOpenTopicVideos: (
          topic
        ) => {
          openVideoLessonsPage(
            user,
            {
              argomentoId:
                argomento.id,

              topicId:
                topic.id
            }
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Theory topics loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare i topic.",
      () =>
        openTheoryTopicsPage(
          user,
          argomento
        )
    );
  }
}

async function openTheoryLessonsPage(
  user,
  argomento,
  topic
) {
  showLoading(
    "Caricamento delle lezioni..."
  );

  try {
    const [
      theoryProgress,
      publishedTheoryLessons
    ] = await Promise.all([
      loadTheoryProgress(user),
      loadPublishedTheoryLessons()
    ]);

    const completedLessonIds =
      new Set(
        theoryProgress
          .completedLessonIds
      );

    showTheoryLessons(
      app,
      argomento,
      topic,
      publishedTheoryLessons,
      completedLessonIds,
      {
        storageScope: user.uid,
        onBack: () => {
          openTheoryTopicsPage(
            user,
            argomento
          );
        },

        onSelectLesson: (
          lesson,
          topicLessons
        ) => {
          openTheoryReaderPage(
            user,
            argomento,
            topic,
            lesson,
            topicLessons
          );
        }
      }
    );
  } catch (error) {
    console.error(
      "Theory lessons loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare le lezioni.",
      () =>
        openTheoryLessonsPage(
          user,
          argomento,
          topic
        )
    );
  }
}

async function openTheoryReaderPage(
  user,
  argomento,
  topic,
  selectedLesson,
  topicLessons
) {
  const orderedLessons =
    [...topicLessons].sort(
      (first, second) =>
        first.order - second.order
    );

  const currentIndex =
    orderedLessons.findIndex(
      (lesson) =>
        lesson.id ===
        selectedLesson.id
    );

  if (currentIndex < 0) {
    console.error(
      "Theory reader lesson non trovata:",
      selectedLesson.id
    );

    openTheoryLessonsPage(
      user,
      argomento,
      topic
    );

    return;
  }

  const previousLesson =
    currentIndex > 0
      ? orderedLessons[
          currentIndex - 1
        ]
      : null;

  const nextLesson =
    currentIndex <
      orderedLessons.length - 1
      ? orderedLessons[
          currentIndex + 1
        ]
      : null;

  try {
    const theoryProgress =
      await loadTheoryProgress(user);

    const completedLessonIds =
      new Set(
        theoryProgress
          .completedLessonIds
      );

    const completed =
      completedLessonIds.has(
        selectedLesson.id
      );

    await saveLastOpenedTheoryLesson(
      user,
      selectedLesson
    );

    showTheoryReader(
      app,
      {
        argomento,
        topic,
        lesson: selectedLesson,

        lessonNumber:
          currentIndex + 1,

        totalLessons:
          orderedLessons.length,

        previousLesson,
        nextLesson,
        completed,
        storageScope: user.uid,

        actions: {
          onBack: () => {
            openTheoryLessonsPage(
              user,
              argomento,
              topic
            );
          },

          onStartQuiz: (
  lesson
) => {
  startSubtopicQuiz(
    user,
    {
      argomento,
      topic,

      subtopicId:
        String(
          lesson.subtopicId ||
          lesson.slug ||
          lesson.id ||
          ""
        ).trim(),

      subtopicTitle:
        String(
          lesson.subtopicTitle ||
          lesson.title ||
          "Sottoargomento"
        ).trim(),

      lessonId:
        String(
          lesson.id || ""
        ).trim(),

      onBack: () => {
        openTheoryReaderPage(
          user,
          argomento,
          topic,
          lesson,
          orderedLessons
        );
      }
    }
  );
},

onStartProgressiveQuiz: () => {
  startProgressiveQuiz(
    user,
    {
      argomento,
      topic,

      onBack: () => {
        openTheoryReaderPage(
          user,
          argomento,
          topic,
          selectedLesson,
          orderedLessons
        );
      }
    }
  );
},
          onComplete: async (
            lesson
          ) => {
          await markTheoryLessonCompleted({
  user,
  lesson
});

            await openTheoryReaderPage(
              user,
              argomento,
              topic,
              lesson,
              orderedLessons
            );
          },

          onPrevious: async (
            lesson
          ) => {
            await openTheoryReaderPage(
              user,
              argomento,
              topic,
              lesson,
              orderedLessons
            );
          },

          onNext: async (
            lesson
          ) => {
            await openTheoryReaderPage(
              user,
              argomento,
              topic,
              lesson,
              orderedLessons
            );
          }
        }
      }
    );
  } catch (error) {
    console.error(
      "Theory reader loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile aprire la lezione.",
      () =>
        openTheoryReaderPage(
          user,
          argomento,
          topic,
          selectedLesson,
          orderedLessons
        )
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
    const [
      wrongAnswersModule,
      records
    ] = await Promise.all([
      import(
        "./pages/wrongAnswers.js"
      ),
      loadWrongAnswerDocuments(user)
    ]);

    const {
      showWrongAnswers
    } = wrongAnswersModule;

    const wrongAnswers =
  hydrateWrongAnswers(
    records,
    availableQuestions
  );

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
    const {
      showExamHistory
    } = await import(
      "./pages/examHistory.js"
    );

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

async function openAdminTheoryPage(
  user
) {
  showLoading(
    "Verifica autorizzazioni amministratore..."
  );

  try {
    const [
      adminTheoryModule,
      userReference
    ] = await Promise.all([
      import(
        "./pages/adminTheory.js"
      ),
      ensureUserDocument(user)
    ]);

    const userSnapshot =
      await getDoc(userReference);

    const userData =
      userSnapshot.data() || {};

    if (
      userData.role !== "admin"
    ) {
      showErrorPage(
        "Questa area è riservata agli amministratori.",
        () => loadDashboard(user)
      );

      return;
    }

    const {
      showAdminTheory
    } = adminTheoryModule;

    await showAdminTheory({
      container: app,
      user,

      onBack: () => {
        loadDashboard(user);
      },

      onOpenAdminQuestions: () => {
        openAdminQuestionsPage(user);
      },

      onOpenAdminVideos: () => {
        openAdminVideosPage(user);
      }
    });
  } catch (error) {
    console.error(
      "Admin theory opening error:",
      error
    );

    showErrorPage(
      "Non è stato possibile aprire il pannello amministratore.",
      () => loadDashboard(user)
    );
  }
}

async function openAdminPremiumUsersPage(
  user
) {
  showLoading(
    "Caricamento gestione accessi Premium..."
  );

  try {
    const [
      premiumUsersModule,
      userReference
    ] = await Promise.all([
      import(
        "./pages/adminPremiumUsers.js"
      ),

      ensureUserDocument(
        user
      )
    ]);

    const userSnapshot =
      await getDoc(
        userReference
      );

    const userData =
      userSnapshot.data() ||
      {};

    if (
      userData.role !== "admin"
    ) {
      showErrorPage(
        "Questa area è riservata agli amministratori.",
        () => {
          loadDashboard(
            user
          );
        }
      );

      return;
    }

    const {
      showAdminPremiumUsers
    } = premiumUsersModule;

    await showAdminPremiumUsers({
      container: app,

      user,

      onBack: () => {
        loadDashboard(
          user
        );
      }
    });
  } catch (error) {
    console.error(
      "Admin Premium users opening error:",
      error
    );

    showErrorPage(
      error.message ||
      "Non è stato possibile aprire la gestione Premium.",
      () => {
        loadDashboard(
          user
        );
      }
    );
  }
}

async function openAdminVideosPage(
  user
) {
  showLoading(
    "Verifica autorizzazioni amministratore..."
  );

  try {
    const [
      adminVideosModule,
      userReference
    ] = await Promise.all([
      import(
        "./pages/adminVideos.js"
      ),
      ensureUserDocument(user)
    ]);

    const userSnapshot =
      await getDoc(userReference);

    const userData =
      userSnapshot.data() || {};

    if (
      userData.role !== "admin"
    ) {
      showErrorPage(
        "Questa area è riservata agli amministratori.",
        () => loadDashboard(user)
      );

      return;
    }

    const {
      showAdminVideos
    } = adminVideosModule;

    await showAdminVideos({
      container: app,

      onBack: () => {
        loadDashboard(user);
      }
    });
  } catch (error) {
    console.error(
      "Admin videos opening error:",
      error
    );

    showErrorPage(
      "Non è stato possibile aprire la gestione dei video.",
      () => loadDashboard(user)
    );
  }
}

async function openVideoLessonsPage(
  user,
  initialSelection = {}
) {
  showLoading(
    "Caricamento delle video lezioni..."
  );

  try {
    const {
      showVideoLessons
    } = await import(
      "./pages/videoLessons.js"
    );

    await showVideoLessons({
      container: app,
      user,

      initialArgomentoId:
        String(
          initialSelection
            ?.argomentoId || ""
        ),

      initialTopicId:
        String(
          initialSelection
            ?.topicId || ""
        ),

      onBack: () => {
        if (
          initialSelection
            ?.argomentoId
        ) {
          const argomento =
            argomenti.find(
              (item) =>
                String(item.id) ===
                String(
                  initialSelection
                    .argomentoId
                )
            );

          if (argomento) {
            openTheoryTopicsPage(
              user,
              argomento
            );

            return;
          }
        }

        loadDashboard(user);
      }
    });
  } catch (error) {
    console.error(
      "Video lessons opening error:",
      error
    );

    showErrorPage(
      "Non è stato possibile aprire le video lezioni.",
      () =>
        openVideoLessonsPage(
          user,
          initialSelection
        )
    );
  }
}

async function openAdminQuestionsPage(
  user
) {
  showLoading(
    "Verifica autorizzazioni amministratore..."
  );

  try {
    const [
      adminQuestionsModule,
      userReference
    ] = await Promise.all([
      import(
        "./pages/adminQuestions.js"
      ),
      ensureUserDocument(user)
    ]);

    const userSnapshot =
      await getDoc(userReference);

    const userData =
      userSnapshot.data() || {};

    if (
      userData.role !== "admin"
    ) {
      showErrorPage(
        "Questa area è riservata agli amministratori.",
        () => loadDashboard(user)
      );

      return;
    }

    const {
      showAdminQuestions
    } = adminQuestionsModule;

    await showAdminQuestions(
      app,
      user,
      {
        onBack: () => {
          openAdminTheoryPage(user);
        }
      }
    );
  } catch (error) {
    console.error(
      "Admin questions opening error:",
      error
    );

    showErrorPage(
      "Non è stato possibile aprire la gestione delle domande.",
      () => openAdminTheoryPage(user)
    );
  }
}


async function openDictionaryPage(user) {
  showLoading(
    "Caricamento del dizionario..."
  );

  try {
    const {
      showDictionaryPage
    } = await import(
      "./pages/dictionary.js"
    );

    showDictionaryPage({
      container: app,
      onBack: () => {
        loadDashboard(user);
      }
    });
  } catch (error) {
    console.error(
      "Dictionary page error:",
      error
    );

    showErrorPage(
      "Non è stato possibile aprire il dizionario.",
      () => loadDashboard(user)
    );
  }
}

async function openProfilePage(user) {
  showLoading(
    "Caricamento del profilo..."
  );

  try {
    const [
      profileModule,
      userReference
    ] = await Promise.all([
      import(
        "./pages/profile.js"
      ),
      ensureUserDocument(user)
    ]);

    const {
      showProfile
    } = profileModule;

    const userSnapshot =
      await getDoc(userReference);

    const stats =
      userSnapshot.data() || {};

    showProfile({
      container: app,
      user,
      stats,

      onBack: () => {
        loadDashboard(user);
      },

      onLogout: async () => {
        await signOut(auth);
      }
    });
  } catch (error) {
    console.error(
      "Profile loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile caricare il profilo.",
      () => openProfilePage(user)
    );
  }
}


function startTopicQuiz(user, argomento, topic) {
  const topicQuestions =
  availableQuestions.filter(
    (question) => question.topicId === topic.id
  );

  showQuiz(app, {
    questions: topicQuestions,
    title: topic.title,
    accentColor: argomento.color || "#2563eb",
    storageKey: `msh-quiz-${user.uid}-topic-${topic.id}`,
    showSetup: true,
    allowShuffle: true,
    countOptions: [5, 10, 20, 30],
    onBack: () => openTopicsPage(user, argomento),
    onFinish: (result) =>
      saveTopicQuizResult(user, argomento, topic, result)
  });
}

async function startSubtopicQuiz(
  user,
  {
    argomento,
    topic,
    subtopicId,
    subtopicTitle,
    lessonId,
    onBack
  }
) {
  showLoading(
    "Preparazione del quiz del sottoargomento."
  );

  try {
    const questionList =
      await loadQuizQuestions();

       
      const subtopicQuestions =
  getSubtopicQuestions({
    questionList,

    argomentoId:
      argomento?.id,

    topicId:
      topic?.id,

    subtopicId,

    lessonId
  });

console.log(
  "Available smart questions:",
  questionList.map(
    (question) => ({
      id:
        question.id,

      argomentoId:
        question.argomentoId,

      topicId:
        question.topicId,

      subtopicId:
        question.subtopicId,

      lessonId:
        question.lessonId
    })
  )
);

console.log(
  "Matched subtopic questions:",
  subtopicQuestions
);

if (
  subtopicQuestions.length === 0
) {
  showErrorPage(
    "Non ci sono ancora domande disponibili per questo sottoargomento.",
    typeof onBack === "function"
      ? onBack
      : () =>
          openTopicsPage(
            user,
            argomento
          )
  );

  return;
}
    console.log(
  "Available smart questions:",
  questionList.map(
    (question) => ({
      id: question.id,
      argomentoId:
        question.argomentoId,
      topicId:
        question.topicId,
      subtopicId:
        question.subtopicId,
      lessonId:
        question.lessonId
    })
  )
);

console.log(
  "Matched subtopic questions:",
  subtopicQuestions
);

    const safeSubtopicTitle =
      String(
        subtopicTitle ||
        subtopicId ||
        "Sottoargomento"
      ).trim();

    const safeStorageId =
      String(
        subtopicId ||
        lessonId ||
        "subtopic"
      )
        .trim()
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        );

    const countOptions =
      [5, 10, 20, 30].filter(
        (count) =>
          count <=
          subtopicQuestions.length
      );

    if (
      countOptions.length === 0
    ) {
      countOptions.push(
        subtopicQuestions.length
      );
    }

    showQuiz(app, {
      questions:
        subtopicQuestions,

      title:
        `Quiz: ${safeSubtopicTitle}`,

      accentColor:
        topic?.color ||
        argomento?.color ||
        "#2563eb",

      storageKey:
        `msh-quiz-${user.uid}` +
        `-subtopic-${safeStorageId}`,

      showSetup:
        true,

      allowShuffle:
        true,

      countOptions,

      onBack:
        typeof onBack === "function"
          ? onBack
          : () =>
              openTopicsPage(
                user,
                argomento
              ),

      onFinish: (result) => {
  saveSubtopicQuizResult(
    user,
    {
      argomento,
      topic,

      subtopicId:
        subtopicId || "",

      subtopicTitle:
        safeSubtopicTitle,

      lessonId:
        lessonId || "",

      onBack
    },
    result
  );
      }
    });
  } catch (error) {
    console.error(
      "Subtopic quiz loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile avviare il quiz del sottoargomento.",
      typeof onBack === "function"
        ? onBack
        : () =>
            openTopicsPage(
              user,
              argomento
            )
    );
  }
}

async function startProgressiveQuiz(
  user,
  {
    argomento,
    topic,
    onBack
  }
) {
  showLoading(
    "Preparazione del quiz progressivo..."
  );

  try {
    const [
      questionList,
      theoryProgress,
      publishedTheoryLessons
    ] = await Promise.all([
      loadQuizQuestions(),
      loadTheoryProgress(user),
      loadPublishedTheoryLessons()
    ]);

    const completedLessonIds =
      Array.isArray(
        theoryProgress
          ?.completedLessonIds
      )
        ? theoryProgress
            .completedLessonIds
        : [];

    const topicLessons =
      (
        Array.isArray(
          publishedTheoryLessons
        )
          ? publishedTheoryLessons
          : []
      )
        .filter(
          (lesson) =>
            lesson.published === true &&
            lesson.argomentoId ===
              argomento?.id &&
            lesson.topicId ===
              topic?.id
        )
        .sort(
          (firstLesson, secondLesson) =>
            Number(
              firstLesson.order || 0
            ) -
            Number(
              secondLesson.order || 0
            )
        );

    const returnToReader =
      typeof onBack ===
      "function"
        ? onBack
        : () =>
            openTheoryLessonsPage(
              user,
              argomento,
              topic
            );

    const openSelectionScreen =
      () => {
        showProgressiveQuizSetup(
          app,
          {
            argomento,
            topic,

            lessons:
              topicLessons,

            completedLessonIds,

            questions:
              questionList,

            onBack:
              returnToReader,

            onStart: ({
              selectedLessonIds,
              selectedLessons
            }) => {
              launchSelectedProgressiveQuiz({
                selectedLessonIds,
                selectedLessons
              });
            }
          }
        );
      };

    const launchSelectedProgressiveQuiz =
      ({
        selectedLessonIds,
        selectedLessons
      }) => {
        const safeSelectedLessonIds =
          Array.from(
            selectedLessonIds || []
          )
            .map(
              normalizeQuizIdentifier
            )
            .filter(Boolean);

        const progressiveQuestions =
          getProgressiveQuestions({
            questionList,

            completedLessonIds:
              safeSelectedLessonIds,

            argomentoId:
              argomento?.id,

            topicId:
              topic?.id
          });

        if (
          progressiveQuestions.length ===
          0
        ) {
          showErrorPage(
            "Le lezioni selezionate non hanno ancora domande disponibili.",
            openSelectionScreen
          );

          return;
        }

        const countOptions =
          [5, 10, 20, 30].filter(
            (count) =>
              count <=
              progressiveQuestions.length
          );

        if (
          countOptions.length === 0
        ) {
          countOptions.push(
            progressiveQuestions.length
          );
        }

        const storageSelectionId =
          safeSelectedLessonIds
            .slice()
            .sort()
            .join("--")
            .replace(
              /[^a-zA-Z0-9-_]/g,
              "-"
            );

        const selectedLessonTitles =
          (
            Array.isArray(
              selectedLessons
            )
              ? selectedLessons
              : []
          )
            .map(
              (lesson) =>
                String(
                  lesson.title || ""
                ).trim()
            )
            .filter(Boolean);

        showQuiz(
          app,
          {
            user,

            questions:
              progressiveQuestions,

            title:
              `Quiz progressivo: ${
                topic?.title ||
                "Topic"
              }`,

            accentColor:
              topic?.color ||
              argomento?.color ||
              "#2563eb",

            storageKey:
              `msh-quiz-${user.uid}` +
              `-progressive-${topic.id}` +
              `-${storageSelectionId}`,

            showSetup:
              true,

            allowShuffle:
              true,

            countOptions,

            onBack:
              openSelectionScreen,

                 onFinish: (result) => {
          saveProgressiveQuizResult(
            user,
            {
              argomento,
              topic,

              selectedLessonIds:
                safeSelectedLessonIds,

              selectedLessons,

              onBack:
                openSelectionScreen,

              onRetry: () => {
                launchSelectedProgressiveQuiz({
                  selectedLessonIds:
                    safeSelectedLessonIds,

                  selectedLessons
                });
              }
            },
            result
          );
        }
      }
    );
  };

    if (
      completedLessonIds.length === 0
    ) {
      showErrorPage(
        "Completa almeno una lezione prima di avviare il quiz progressivo.",
        returnToReader
      );

      return;
    }

    openSelectionScreen();
  } catch (error) {
    console.error(
      "Progressive quiz loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile avviare il quiz progressivo.",
      typeof onBack === "function"
        ? onBack
        : () =>
            openTheoryLessonsPage(
              user,
              argomento,
              topic
            )
    );
  }
}

function startArgomentoQuiz(user, argomento) {
  const argomentoQuestions =
  availableQuestions.filter(
    (question) => question.argomentoId === argomento.id
  );

  showQuiz(app, {
    questions: argomentoQuestions,
    title: `Quiz completo: ${argomento.title}`,
    accentColor: argomento.color || "#2563eb",
    storageKey: `msh-quiz-${user.uid}-argomento-${argomento.id}`,
    showSetup: true,
    allowShuffle: true,
    countOptions: [5, 10, 20, 30],
    onBack: () => openTopicsPage(user, argomento),
    onFinish: (result) =>
      saveArgomentoQuizResult(user, argomento, result)
  });
}


function startWrongAnswersQuiz(user, wrongAnswers) {
  showQuiz(app, {
    questions: wrongAnswers,
    title: "Ripasso dei miei errori",
    accentColor: "#f59e0b",
    storageKey: `msh-quiz-${user.uid}-wrong-answers`,
    showSetup: true,
    allowShuffle: true,
    countOptions: [5, 10, 20, 30],
    onBack: () => openWrongAnswersPage(user),
    onFinish: (result) =>
      saveWrongAnswersQuizResult(user, result)
  });
}
async function startAdaptiveQuiz(user) {
  showLoading(
    "Preparazione dell'allenamento intelligente..."
  );

  try {
    /*
     * Firestore-এর সর্বশেষ published questions এবং
     * user-এর error history load করা হয়।
     */
    const [
      questionList,
      errorRecords
    ] = await Promise.all([
      loadQuizQuestions(),
      loadWrongAnswerDocuments(user)
    ]);

    if (
      !Array.isArray(questionList) ||
      questionList.length === 0
    ) {
      showErrorPage(
        "Non ci sono domande disponibili per l'allenamento adattivo.",
        () => loadDashboard(user)
      );

      return;
    }

    /*
     * Setup screen-এর সর্বোচ্চ option 30।
     *
     * তাই প্রথমে সর্বোচ্চ 30টি smart question-এর
     * একটি adaptive pool তৈরি করা হয়।
     */
    const adaptiveQuestions =
      selectAdaptiveQuestions(
        questionList,
        errorRecords,
        30
      );

    if (
      adaptiveQuestions.length === 0
    ) {
      showErrorPage(
        "Non è stato possibile preparare le domande adattive.",
        () => loadDashboard(user)
      );

      return;
    }

    const countOptions =
      [5, 10, 20, 30].filter(
        (count) =>
          count <=
          adaptiveQuestions.length
      );

    /*
     * মোট question 5টির কম হলে অন্তত available count
     * setup option হিসেবে দেখানো হবে।
     */
    if (
      countOptions.length === 0
    ) {
      countOptions.push(
        adaptiveQuestions.length
      );
    }

    showQuiz(app, {
      questions:
        adaptiveQuestions,

      title:
        "Allenamento Intelligente",

      accentColor:
        "#7c3aed",

      storageKey:
        `msh-quiz-${user.uid}-adaptive`,

      showSetup:
        true,

      allowShuffle:
        true,

      countOptions,

      onBack: () => {
        loadDashboard(user);
      },

      onFinish: (result) => {
        saveAdaptiveQuizResult(
          user,
          result
        );
      }
    });
  } catch (error) {
    console.error(
      "Adaptive quiz loading error:",
      error
    );

    showErrorPage(
      "Non è stato possibile avviare l'allenamento adattivo.",
      () => loadDashboard(user)
    );
  }
}


function getResultPerformanceMessage(
  percentage
) {
  if (percentage === 100) {
    return "Prestazione perfetta. Continua così!";
  }

  if (percentage >= 90) {
    return "Ottimo risultato: preparazione molto solida.";
  }

  if (percentage >= 80) {
    return "Buon risultato. Sei sulla strada giusta.";
  }

  if (percentage >= 60) {
    return "Buona base, ma serve ancora un po' di ripasso.";
  }

  return "Rivedi gli errori e riprova con calma.";
}

function calculateResultXp({
  mode,
  result,
  completed
}) {
  let baseXp = 0;
  let perfectBonus = 0;
  let completionBonus = 0;

  if (mode === "topic") {
    baseXp =
      XP_REWARDS.topicQuiz;

    if (completed) {
      completionBonus = 5;
    }

    if (
      result.wrongAnswers === 0
    ) {
      perfectBonus =
        XP_REWARDS
          .perfectTopicBonus;
    }
  }

  if (mode === "subtopic") {
    baseXp =
      XP_REWARDS.subtopicQuiz;

    if (completed) {
      completionBonus = 3;
    }

    if (mode === "progressive") {
  baseXp =
    XP_REWARDS.progressiveQuiz;

  if (completed) {
    completionBonus = 5;
  }

  if (
    result.wrongAnswers === 0 &&
    Number(
      result.unansweredAnswers || 0
    ) === 0
  ) {
    perfectBonus =
      XP_REWARDS
        .perfectProgressiveBonus;
  }
}

    if (
      result.wrongAnswers === 0 &&
      Number(
        result.unansweredAnswers ||
        0
      ) === 0
    ) {
      perfectBonus =
        XP_REWARDS
          .perfectSubtopicBonus;
    }
  }

  if (mode === "progressive") {
  baseXp =
    XP_REWARDS.progressiveQuiz;

  if (completed) {
    completionBonus = 5;
  }

  if (
    result.wrongAnswers === 0 &&
    Number(
      result.unansweredAnswers || 0
    ) === 0
  ) {
    perfectBonus =
      XP_REWARDS
        .perfectProgressiveBonus;
  }
}

  if (mode === "argomento") {
    baseXp = 20;

    if (
      result.wrongAnswers === 0
    ) {
      perfectBonus = 10;
    }
  }

  if (
    mode === "wrong-answers"
  ) {
    baseXp =
      XP_REWARDS
        .wrongAnswersReview;
  }

  if (mode === "adaptive") {
    baseXp =
      XP_REWARDS.adaptiveQuiz;

    if (
      result.wrongAnswers === 0
    ) {
      perfectBonus =
        XP_REWARDS
          .perfectAdaptiveBonus;
    }
  }

  return {
    baseXp,
    perfectBonus,
    completionBonus,

    total:
      baseXp +
      perfectBonus +
      completionBonus
  };
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

  const xpBreakdown =
    calculateResultXp({
      mode: "topic",
      result,
      completed
    });

  const currentProgress =
    await loadProgress(user)
      .catch(() => ({
        xp: 0
      }));

  const projectedProgress =
    calculateLevelProgress(
      currentProgress.xp +
      xpBreakdown.total
    );

  showResultPage({
    title: topic.title,
    percentage,
    result,
    completed,
    passMessage:
      `Topic completato! Hai raggiunto almeno ${TOPIC_PASS_PERCENTAGE}%.`,
    failMessage:
      `Per completare il topic devi raggiungere almeno ${TOPIC_PASS_PERCENTAGE}%.`,
    xpBreakdown,
    levelProgress:
      projectedProgress,
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

    const durationSeconds =
      Number(result.durationSeconds) || 0;

    const oldBestTime =
      Number(oldData.bestTimeSeconds) || 0;

    const nextBestTime =
      percentage >= 80 &&
      durationSeconds > 0 &&
      (
        oldBestTime <= 0 ||
        durationSeconds < oldBestTime
      )
        ? durationSeconds
        : oldBestTime;

    await setDoc(
      progressReference,
      {
        topicId: topic.id,
        argomentoId:
          argomento.id,
        topicTitle: topic.title,
        attempts: increment(1),
        bestScore,
        bestTimeSeconds:
          nextBestTime,
        completed:
          oldData.completed === true ||
          completed,
        lastScore: percentage,
        lastCorrectAnswers:
          result.correctAnswers,
        lastWrongAnswers:
          result.wrongAnswers,
        lastUnansweredAnswers:
          Number(
            result.unansweredAnswers
          ) || 0,
        lastTotalQuestions:
          result.totalQuestions,
        lastDurationSeconds:
          durationSeconds,
        lastAverageSecondsPerQuestion:
          Number(
            result.averageSecondsPerQuestion
          ) || 0,
        perfectAttempts:
          result.wrongAnswers === 0
            ? increment(1)
            : increment(0),
        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    await synchronizeWrongAnswers(
  user,
  result.answers,
  availableQuestions
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

    await addExperience(
      user,
      xpBreakdown.total
    );

    updateResultSavingMessage(
      `Risultato salvato. Hai guadagnato ${xpBreakdown.total} XP.`,
      "success"
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

async function saveSubtopicQuizResult(
  user,
  {
    argomento,
    topic,
    subtopicId,
    subtopicTitle,
    lessonId,
    onBack
  },
  result
) {
  const percentage =
    calculatePercentage(result);

  const completed =
    percentage >=
    TOPIC_PASS_PERCENTAGE;

  const xpBreakdown =
    calculateResultXp({
      mode: "subtopic",
      result,
      completed
    });

  const currentProgress =
    await loadProgress(user)
      .catch(() => ({
        xp: 0
      }));

  const projectedProgress =
    calculateLevelProgress(
      currentProgress.xp +
      xpBreakdown.total
    );

  const safeSubtopicTitle =
    String(
      subtopicTitle ||
      subtopicId ||
      topic?.title ||
      "Sottoargomento"
    ).trim();

  const returnToLesson = () => {
    if (
      typeof onBack ===
      "function"
    ) {
      onBack();
      return;
    }

    openTopicsPage(
      user,
      argomento
    );
  };

  showResultPage({
    title:
      `Quiz: ${safeSubtopicTitle}`,

    percentage,
    result,
    completed,

    passMessage:
      `Quiz della lezione completato! Hai raggiunto almeno ${TOPIC_PASS_PERCENTAGE}%.`,

    failMessage:
      `Per completare il quiz della lezione devi raggiungere almeno ${TOPIC_PASS_PERCENTAGE}%.`,

    xpBreakdown,

    levelProgress:
      projectedProgress,

    onPrimaryAction:
      returnToLesson,

    primaryLabel:
      "Torna alla lezione",

    onSecondaryAction: () => {
      startSubtopicQuiz(
        user,
        {
          argomento,
          topic,
          subtopicId,
          subtopicTitle:
            safeSubtopicTitle,
          lessonId,
          onBack
        }
      );
    },

    secondaryLabel:
      "Ripeti quiz"
  });

  try {
    const safeProgressId =
      String(
        lessonId ||
        subtopicId ||
        "subtopic"
      )
        .trim()
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        );

    const progressReference =
      doc(
        db,
        "users",
        user.uid,
        "subtopicProgress",
        safeProgressId
      );

    const oldSnapshot =
      await getDoc(
        progressReference
      );

    const oldData =
      oldSnapshot.exists()
        ? oldSnapshot.data()
        : {};

    const previousBestScore =
      Number(
        oldData.bestScore || 0
      );

    const bestScore =
      Math.max(
        previousBestScore,
        percentage
      );

    const durationSeconds =
      Number(
        result.durationSeconds || 0
      );

    const previousBestTime =
      Number(
        oldData.bestTimeSeconds || 0
      );

    const bestTimeSeconds =
      completed &&
      durationSeconds > 0 &&
      (
        previousBestTime <= 0 ||
        durationSeconds <
          previousBestTime
      )
        ? durationSeconds
        : previousBestTime;

    await setDoc(
      progressReference,
      {
        subtopicId:
          String(
            subtopicId || ""
          ).trim(),

        subtopicTitle:
          safeSubtopicTitle,

        lessonId:
          String(
            lessonId || ""
          ).trim(),

        topicId:
          String(
            topic?.id || ""
          ).trim(),

        topicTitle:
          String(
            topic?.title || ""
          ).trim(),

        argomentoId:
          String(
            argomento?.id || ""
          ).trim(),

        argomentoTitle:
          String(
            argomento?.title || ""
          ).trim(),

        attempts:
          increment(1),

        bestScore,

        bestTimeSeconds,

        completed:
          oldData.completed === true ||
          completed,

        lastScore:
          percentage,

        lastCorrectAnswers:
          Number(
            result.correctAnswers || 0
          ),

        lastWrongAnswers:
          Number(
            result.wrongAnswers || 0
          ),

        lastUnansweredAnswers:
          Number(
            result.unansweredAnswers || 0
          ),

        lastTotalQuestions:
          Number(
            result.totalQuestions || 0
          ),

        lastDurationSeconds:
          durationSeconds,

        lastAverageSecondsPerQuestion:
          Number(
            result
              .averageSecondsPerQuestion ||
              0
          ),

        perfectAttempts:
          result.wrongAnswers === 0 &&
          Number(
            result.unansweredAnswers || 0
          ) === 0
            ? increment(1)
            : increment(0),

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    await synchronizeWrongAnswers(
      user,
      result.answers,
      availableQuestions
    );

    await saveGeneralStats(
      user,
      result,
      {
        lastQuizMode:
          "subtopic",

        lastArgomentoId:
          argomento?.id || "",

        lastArgomentoName:
          argomento?.title || "",

        lastTopicId:
          topic?.id || "",

        lastTopicName:
          topic?.title || "",

        lastSubtopicId:
          subtopicId || "",

        lastSubtopicTitle:
          safeSubtopicTitle,

        lastLessonId:
          lessonId || "",

        lastQuizPercentage:
          percentage
      }
    );

    await addExperience(
      user,
      xpBreakdown.total
    );

    updateResultSavingMessage(
      `Risultato salvato. Hai guadagnato ${xpBreakdown.total} XP.`,
      "success"
    );
  } catch (error) {
    console.error(
      "Subtopic quiz saving error:",
      error
    );

    updateResultSavingMessage(
      "Il risultato è visibile, ma non è stato possibile salvarlo.",
      "error"
    );
  }

  enableResultButtons();
}

async function saveProgressiveQuizResult(
  user,
  {
    argomento,
    topic,
    selectedLessonIds = [],
    selectedLessons = [],
    onBack,
    onRetry
  },
  result
) {
  const percentage =
    calculatePercentage(result);

  const completed =
    percentage >=
    TOPIC_PASS_PERCENTAGE;

  const xpBreakdown =
    calculateResultXp({
      mode: "progressive",
      result,
      completed
    });

  const currentProgress =
    await loadProgress(user)
      .catch(() => ({
        xp: 0
      }));

  const projectedProgress =
    calculateLevelProgress(
      currentProgress.xp +
      xpBreakdown.total
    );

  const safeSelectedLessonIds =
    Array.from(
      selectedLessonIds || []
    )
      .map(
        normalizeQuizIdentifier
      )
      .filter(Boolean);

  const safeSelectedLessons =
    Array.isArray(
      selectedLessons
    )
      ? selectedLessons
      : [];

      const selectedLessonTitles =
  safeSelectedLessons
    .map((lesson) =>
      String(
        lesson?.title || ""
      ).trim()
    )
    .filter(Boolean);

  const safeTopicId =
    normalizeQuizIdentifier(
      topic?.id
    );

  const safeTopicTitle =
    String(
      topic?.title ||
      "Topic"
    ).trim();

  const returnToSelection = () => {
    if (
      typeof onBack ===
      "function"
    ) {
      onBack();
      return;
    }

    openTheoryLessonsPage(
      user,
      argomento,
      topic
    );
  };

  const retryQuiz = () => {
    if (
      typeof onRetry ===
      "function"
    ) {
      onRetry();
      return;
    }

    returnToSelection();
  };

  showResultPage({
    title:
      `Quiz progressivo: ${safeTopicTitle}`,

    percentage,
    result,
    completed,

    passMessage:
      `Quiz progressivo completato! Hai raggiunto almeno ${TOPIC_PASS_PERCENTAGE}%.`,

    failMessage:
      `Per completare il quiz progressivo devi raggiungere almeno ${TOPIC_PASS_PERCENTAGE}%.`,

    xpBreakdown,

    levelProgress:
      projectedProgress,

    onPrimaryAction:
      returnToSelection,

    primaryLabel:
      "Torna alla selezione",

    onSecondaryAction:
      retryQuiz,

    secondaryLabel:
      "Ripeti quiz"
  });

  try {
    if (!safeTopicId) {
      throw new Error(
        "Progressive quiz topic ID mancante."
      );
    }

    if (
      safeSelectedLessonIds.length === 0
    ) {
      throw new Error(
        "Progressive quiz lesson IDs mancanti."
      );
    }

    const progressReference =
      doc(
        db,
        "users",
        user.uid,
        "progressiveProgress",
        safeTopicId
      );

    const oldSnapshot =
      await getDoc(
        progressReference
      );

    const oldData =
      oldSnapshot.exists()
        ? oldSnapshot.data()
        : {};

    const previousBestScore =
      Number(
        oldData.bestScore || 0
      );

    const bestScore =
      Math.max(
        previousBestScore,
        percentage
      );

    const durationSeconds =
      Number(
        result.durationSeconds || 0
      );

    const previousBestTime =
      Number(
        oldData.bestTimeSeconds || 0
      );

    const bestTimeSeconds =
      completed &&
      durationSeconds > 0 &&
      (
        previousBestTime <= 0 ||
        durationSeconds <
          previousBestTime
      )
        ? durationSeconds
        : previousBestTime;

    const previousCompletedLessonIds =
      Array.isArray(
        oldData.completedLessonIds
      )
        ? oldData.completedLessonIds
            .map(
              normalizeQuizIdentifier
            )
            .filter(Boolean)
        : [];

    const completedLessonIds =
      Array.from(
        new Set([
          ...previousCompletedLessonIds,
          ...(
            completed
              ? safeSelectedLessonIds
              : []
          )
        ])
      );

    await setDoc(
      progressReference,
      {
        topicId:
          safeTopicId,

        topicTitle:
          safeTopicTitle,

        argomentoId:
          normalizeQuizIdentifier(
            argomento?.id
          ),

        argomentoTitle:
          String(
            argomento?.title || ""
          ).trim(),

        attempts:
          increment(1),

        bestScore,

        bestTimeSeconds,

        completed:
          oldData.completed === true ||
          completed,

        completedLessonIds,

        completedLessonCount:
          completedLessonIds.length,

        selectedLessonIds:
          safeSelectedLessonIds,

        selectedLessonTitles,

        selectedLessonCount:
          safeSelectedLessonIds.length,

        lastScore:
          percentage,

        lastCorrectAnswers:
          Number(
            result.correctAnswers || 0
          ),

        lastWrongAnswers:
          Number(
            result.wrongAnswers || 0
          ),

        lastUnansweredAnswers:
          Number(
            result.unansweredAnswers || 0
          ),

        lastTotalQuestions:
          Number(
            result.totalQuestions || 0
          ),

        lastDurationSeconds:
          durationSeconds,

        lastAverageSecondsPerQuestion:
  Number(
    result
      .averageSecondsPerQuestion ||
    0
  ),

totalQuestions:
  Number(
    result.totalQuestions || 0
  ),

correctAnswers:
  Number(
    result.correctAnswers || 0
  ),

wrongAnswers:
  Number(
    result.wrongAnswers || 0
  ),

percentage,

xpEarned:
  xpBreakdown.total,

perfectAttempts:
  result.wrongAnswers === 0 &&
  Number(
    result.unansweredAnswers || 0
  ) === 0
    ? increment(1)
    : increment(0),

lastCompleted:
  completed,

createdAt:
  oldSnapshot.exists()
    ? (
        oldData.createdAt ||
        serverTimestamp()
      )
    : serverTimestamp(),

updatedAt:
  serverTimestamp()
      },
      {
        merge: true
      }
    );

    await synchronizeWrongAnswers(
      user,
      result.answers,
      availableQuestions
    );

    await saveGeneralStats(
      user,
      result,
      {
        lastQuizMode:
          "progressive",

        lastArgomentoId:
          argomento?.id || "",

        lastArgomentoName:
          argomento?.title || "",

        lastTopicId:
          topic?.id || "",

        lastTopicName:
          safeTopicTitle,

        lastProgressiveLessonIds:
          safeSelectedLessonIds,

        lastProgressiveLessonCount:
          safeSelectedLessonIds.length,

        lastQuizPercentage:
          percentage
      }
    );

    await addExperience(
      user,
      xpBreakdown.total
    );

    updateResultSavingMessage(
      `Risultato salvato. Hai guadagnato ${xpBreakdown.total} XP.`,
      "success"
    );
  } catch (error) {
    console.error(
      "Progressive quiz saving error:",
      error
    );

    updateResultSavingMessage(
      "Il risultato è visibile, ma non è stato possibile salvarlo.",
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

  const xpBreakdown =
    calculateResultXp({
      mode: "argomento",
      result,
      completed: true
    });

  const currentProgress =
    await loadProgress(user)
      .catch(() => ({
        xp: 0
      }));

  const projectedProgress =
    calculateLevelProgress(
      currentProgress.xp +
      xpBreakdown.total
    );

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
    xpBreakdown,
    levelProgress:
      projectedProgress,
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

    const durationSeconds =
      Number(result.durationSeconds) || 0;

    const oldBestTime =
      Number(oldData.bestTimeSeconds) || 0;

    const nextBestTime =
      durationSeconds > 0 &&
      (
        oldBestTime <= 0 ||
        durationSeconds < oldBestTime
      )
        ? durationSeconds
        : oldBestTime;

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
        bestTimeSeconds:
          nextBestTime,
        lastScore: percentage,
        lastCorrectAnswers:
          result.correctAnswers,
        lastWrongAnswers:
          result.wrongAnswers,
        lastUnansweredAnswers:
          Number(
            result.unansweredAnswers
          ) || 0,
        lastTotalQuestions:
          result.totalQuestions,
        lastDurationSeconds:
          durationSeconds,
        lastAverageSecondsPerQuestion:
          Number(
            result.averageSecondsPerQuestion
          ) || 0,
        perfectAttempts:
          result.wrongAnswers === 0
            ? increment(1)
            : increment(0),
        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    await synchronizeWrongAnswers(
  user,
  result.answers,
  availableQuestions
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

    await addExperience(
      user,
      xpBreakdown.total
    );

    updateResultSavingMessage(
      `Risultato salvato. Hai guadagnato ${xpBreakdown.total} XP.`,
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

  const completed =
    result.wrongAnswers === 0;

  const xpBreakdown =
    calculateResultXp({
      mode: "wrong-answers",
      result,
      completed
    });

  const currentProgress =
    await loadProgress(user)
      .catch(() => ({
        xp: 0
      }));

  const projectedProgress =
    calculateLevelProgress(
      currentProgress.xp +
      xpBreakdown.total
    );

  showResultPage({
    title: "Ripasso dei miei errori",
    percentage,
    result,
    completed,
    passMessage:
      "Ottimo lavoro! Hai risposto correttamente a tutte le domande.",
    failMessage:
      "Continua ad allenarti sulle domande ancora difficili.",
    xpBreakdown,
    levelProgress:
      projectedProgress,
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
  result.answers,
  availableQuestions
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
      xpBreakdown.total
    );

    updateResultSavingMessage(
      `Progressi aggiornati. Hai guadagnato ${xpBreakdown.total} XP.`,
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
    enableResultButtons();
}

async function saveAdaptiveQuizResult(
  user,
  result
) {
  const percentage =
    calculatePercentage(result);

  const completed =
    percentage >=
    TOPIC_PASS_PERCENTAGE;

  const xpBreakdown =
    calculateResultXp({
      mode: "adaptive",
      result,
      completed
    });

  const currentProgress =
    await loadProgress(user)
      .catch(() => ({
        xp: 0
      }));

  const projectedProgress =
    calculateLevelProgress(
      currentProgress.xp +
      xpBreakdown.total
    );

  showResultPage({
    title:
      "Allenamento Intelligente",

    percentage,

    result,

    completed,

    passMessage:
      `Ottimo lavoro! Hai raggiunto almeno ${TOPIC_PASS_PERCENTAGE}% nell'allenamento adattivo.`,

    failMessage:
      "L'allenamento ha individuato alcune aree da migliorare. Continua ad esercitarti.",

    xpBreakdown,

    levelProgress:
      projectedProgress,

    onPrimaryAction: () => {
      loadDashboard(user);
    },

    primaryLabel:
      "Torna alla dashboard",

    onSecondaryAction: () => {
      startAdaptiveQuiz(user);
    },

    secondaryLabel:
      "Nuovo allenamento"
  });

  try {
    /*
     * Adaptive Quiz-এর correct এবং wrong answer
     * উভয়ই error history update করবে।
     */
   await synchronizeWrongAnswers(
  user,
  result.answers,
  availableQuestions
);

    /*
     * Dashboard-এর সাধারণ statistics update হবে।
     */
    await saveGeneralStats(
      user,
      result,
      {
        lastQuizMode:
          "adaptive",

        lastQuizName:
          "Allenamento Intelligente",

        lastQuizPercentage:
          percentage,

        lastAdaptiveQuizPercentage:
          percentage,

        lastAdaptiveQuizAt:
          serverTimestamp()
      }
    );

    await addExperience(
      user,
      xpBreakdown.total
    );

    updateResultSavingMessage(
      `Allenamento salvato. Hai guadagnato ${xpBreakdown.total} XP.`,
      "success"
    );
  } catch (error) {
    console.error(
      "Adaptive quiz saving error:",
      error
    );

    updateResultSavingMessage(
      "L'allenamento è terminato, ma alcuni progressi non sono stati salvati.",
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
  additionalData = {}
) {
  const percentage =
    calculatePercentage(result);

  await setDoc(
    doc(db, "users", user.uid),
    {
      completedQuizzes:
        increment(1),

      totalQuestions:
        increment(
          Number(result.totalQuestions) || 0
        ),

      correctAnswers:
        increment(
          Number(result.correctAnswers) || 0
        ),

      wrongAnswers:
        increment(
          Number(result.wrongAnswers) || 0
        ),

      totalQuizSeconds:
        increment(
          Number(result.durationSeconds) || 0
        ),

      lastQuizDurationSeconds:
        Number(result.durationSeconds) || 0,

      lastAverageSecondsPerQuestion:
        Number(
          result.averageSecondsPerQuestion
        ) || 0,

      lastUnansweredAnswers:
        Number(
          result.unansweredAnswers
        ) || 0,

      lastFlaggedQuestions:
        Array.isArray(
          result.flaggedQuestionIds
        )
          ? result.flaggedQuestionIds.length
          : 0,

      lastQuizPercentage:
        percentage,

      perfectQuizzes:
        result.wrongAnswers === 0
          ? increment(1)
          : increment(0),

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
  xpBreakdown = {
    baseXp: 0,
    perfectBonus: 0,
    completionBonus: 0,
    total: 0
  },
  levelProgress = {
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: 250,
    progressPercentage: 0
  },
  onPrimaryAction,
  primaryLabel,
  onSecondaryAction,
  secondaryLabel
}) {
  const durationSeconds =
    Number(result.durationSeconds) || 0;

  const averageSeconds =
    Number(
      result.averageSecondsPerQuestion
    ) || 0;

  const unansweredAnswers =
    Number(
      result.unansweredAnswers
    ) || 0;

  const flaggedCount =
    Array.isArray(
      result.flaggedQuestionIds
    )
      ? result.flaggedQuestionIds.length
      : 0;

  const resultColor =
    percentage >= 80
      ? "#16a34a"
      : percentage >= 60
        ? "#f59e0b"
        : "#dc2626";

  app.innerHTML = `
    <main class="page result-v2-page">
      <section
        class="card result-v2-card"
        style="
          --result-value:
          ${percentage};

          --result-color:
          ${resultColor};
        "
      >
        <section class="result-v2-hero">
          <div class="result-v2-circle">
            <div class="result-v2-circle-inner">
              <strong>
                ${percentage}%
              </strong>

              <span>
                PRECISIONE
              </span>
            </div>
          </div>

          <div class="result-v2-copy">
            <p class="eyebrow">
              ${title}
            </p>

            <div
              class="
                result-v2-status
                ${
                  completed
                    ? "result-v2-status-success"
                    : "result-v2-status-warning"
                }
              "
            >
              ${
                completed
                  ? "🏆 Obiettivo raggiunto"
                  : "📚 Continua ad allenarti"
              }
            </div>

            <h1>Quiz completato!</h1>

            <p>
              ${
                completed
                  ? passMessage
                  : failMessage
              }
              ${getResultPerformanceMessage(
                percentage
              )}
            </p>
          </div>
        </section>

        <section class="result-v2-grid">
          <article class="result-v2-stat">
            <span>📝</span>
            <strong>
              ${result.totalQuestions}
            </strong>
            <small>Domande</small>
          </article>

          <article class="result-v2-stat">
            <span>✅</span>
            <strong>
              ${result.correctAnswers}
            </strong>
            <small>Corrette</small>
          </article>

          <article class="result-v2-stat">
            <span>❌</span>
            <strong>
              ${result.wrongAnswers}
            </strong>
            <small>Sbagliate totali</small>
          </article>

          <article class="result-v2-stat">
            <span>⚪</span>
            <strong>
              ${unansweredAnswers}
            </strong>
            <small>Senza risposta</small>
          </article>
        </section>

        <section class="result-v2-details">
          <article class="result-v2-panel">
            <h2>Analisi prestazione</h2>

            <div class="result-v2-performance-list">
              <div class="result-v2-performance-row">
                <span>Tempo totale</span>
                <strong>
                  ${formatQuizDuration(
                    durationSeconds
                  )}
                </strong>
              </div>

              <div class="result-v2-performance-row">
                <span>Media per domanda</span>
                <strong>
                  ${averageSeconds} sec
                </strong>
              </div>

              <div class="result-v2-performance-row">
                <span>Domande segnalate</span>
                <strong>
                  ${flaggedCount}
                </strong>
              </div>

              <div class="result-v2-performance-row">
                <span>Precisione</span>
                <strong>
                  ${percentage}%
                </strong>
              </div>
            </div>
          </article>

          <article class="result-v2-panel">
            <h2>Esperienza guadagnata</h2>

            <div class="result-v2-xp-box">
              <div class="result-v2-xp-total">
                <span>XP TOTALI</span>
                <strong>
                  +${xpBreakdown.total}
                </strong>
              </div>

              <div class="result-v2-performance-list">
                <div class="result-v2-performance-row">
                  <span>Quiz</span>
                  <strong>
                    +${xpBreakdown.baseXp}
                  </strong>
                </div>

                ${
                  xpBreakdown.completionBonus > 0
                    ? `
                      <div class="result-v2-performance-row">
                        <span>Completamento</span>
                        <strong>
                          +${xpBreakdown.completionBonus}
                        </strong>
                      </div>
                    `
                    : ""
                }

                ${
                  xpBreakdown.perfectBonus > 0
                    ? `
                      <div class="result-v2-performance-row">
                        <span>Bonus perfetto</span>
                        <strong>
                          +${xpBreakdown.perfectBonus}
                        </strong>
                      </div>
                    `
                    : ""
                }
              </div>

              <div class="result-v2-xp-track">
                <div
                  class="result-v2-xp-fill"
                  style="
                    width:
                    ${levelProgress.progressPercentage}%;
                  "
                ></div>
              </div>

              <div class="result-v2-xp-caption">
                <span>
                  Livello
                  ${levelProgress.level}
                </span>

                <span>
                  ${levelProgress.currentLevelXp}
                  /
                  ${levelProgress.nextLevelXp}
                  XP
                </span>
              </div>
            </div>
          </article>
        </section>

        <p
          id="savingMessage"
          class="
            message
            success
            result-v2-message
          "
        >
          Salvataggio del risultato...
        </p>

        <div class="result-v2-actions">
          <button
            id="secondaryResultButton"
            class="btn btn-secondary"
            type="button"
            disabled
          >
            ${secondaryLabel}
          </button>

          <button
            id="primaryResultButton"
            class="btn btn-primary"
            type="button"
            disabled
          >
            ${primaryLabel}
          </button>
        </div>

        <p class="result-v2-note">
          I progressi, gli errori e gli XP vengono
          sincronizzati con il tuo account.
        </p>
      </section>
    </main>
  `;

  document
    .querySelector(
      "#secondaryResultButton"
    )
    ?.addEventListener(
      "click",
      onSecondaryAction
    );

  document
    .querySelector(
      "#primaryResultButton"
    )
    ?.addEventListener(
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    /*
     * Dashboard rendering notification permission-এর
     * জন্য অপেক্ষা করবে না।
     */
    await loadDashboard(user);

    /*
     * Notification setup background-এ চলবে।
     * ব্যর্থ হলেও application ব্যবহার করা যাবে।
     */
    initializeNotifications(user).catch(
      (error) => {
        console.error(
          "Notification initialization error:",
          error
        );
      }
    );

    return;
  }

resetNotifications();

showHome();
});