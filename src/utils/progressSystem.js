import {
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";

export async function addExperience(
  user,
  amount
) {
  const reference = doc(
    db,
    "users",
    user.uid
  );

  await setDoc(
    reference,
    {
      xp: increment(amount),
      updatedAt: serverTimestamp()
    },
    {
      merge: true
    }
  );
}

export async function loadProgress(
  user
) {
  const snapshot = await getDoc(
    doc(db, "users", user.uid)
  );

  const data = snapshot.data() || {};

  const xp =
    Number(data.xp) || 0;

  const level =
    Math.floor(xp / 250) + 1;

  const currentLevelXp =
    xp % 250;

  const nextLevelXp = 250;

  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp
  };
}