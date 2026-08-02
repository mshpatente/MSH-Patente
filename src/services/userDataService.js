import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

export async function ensureUserDocument(
  user
) {
  if (!user?.uid) {
    throw new Error(
      "A valid authenticated user is required."
    );
  }

  const userReference =
    doc(
      db,
      "users",
      user.uid
    );

  const userSnapshot =
    await getDoc(
      userReference
    );

  if (!userSnapshot.exists()) {
    await setDoc(
      userReference,
      {
        uid:
          user.uid,

        name:
          user.displayName ||
          user.email
            ?.split("@")[0] ||
          "Studente",

        email:
          user.email || "",

        role:
          "student",

        xp:
          0,

        completedQuizzes:
          0,

        totalQuestions:
          0,

        correctAnswers:
          0,

        wrongAnswers:
          0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );
  }

  return userReference;
}

export async function loadAllTopicProgress(
  user
) {
  if (!user?.uid) {
    return {};
  }

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

  snapshot.forEach(
    (item) => {
      progress[item.id] =
        item.data();
    }
  );

  return progress;
}

export async function loadWrongAnswerDocuments(
  user
) {
  if (!user?.uid) {
    return [];
  }

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

  snapshot.forEach(
    (item) => {
      records.push({
        id:
          item.id,

        ...item.data()
      });
    }
  );

  return records;
}