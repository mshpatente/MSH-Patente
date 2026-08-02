import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

const REQUIRED_CORRECT_STREAK = 2;

export async function synchronizeWrongAnswers(
  user,
  answers = [],
  availableQuestions = []
) {
  if (
    !user?.uid ||
    !Array.isArray(answers)
  ) {
    return;
  }

  for (const answer of answers) {
    const question =
      availableQuestions.find(
        (item) =>
          item.id ===
          answer.questionId
      );

    if (!question) {
      continue;
    }

    const topic =
      topics.find(
        (item) =>
          item.id ===
          question.topicId
      );

    const argomento =
      argomenti.find(
        (item) =>
          item.id ===
          question.argomentoId
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
      await getDoc(
        reference
      );

    const previousData =
      snapshot.exists()
        ? snapshot.data()
        : {};

    if (!answer.isCorrect) {
      await setDoc(
        reference,
        {
          questionId:
            question.id,

          topicId:
            question.topicId,

          topicTitle:
            topic?.title || "",

          argomentoId:
            question.argomentoId,

          argomentoTitle:
            argomento?.title || "",

          wrongCount:
            increment(1),

          correctStreak:
            0,

          active:
            true,

          mastered:
            false,

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
        (
          Number(
            previousData.correctStreak
          ) || 0
        ) + 1;

      const mastered =
        nextCorrectStreak >=
        REQUIRED_CORRECT_STREAK;

      await setDoc(
        reference,
        {
          correctStreak:
            nextCorrectStreak,

          active:
            !mastered,

          mastered,

          masteredAt:
            mastered
              ? serverTimestamp()
              : previousData
                  .masteredAt ||
                null,

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