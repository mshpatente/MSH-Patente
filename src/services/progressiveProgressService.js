import {
  collection,
  getDocs
} from "firebase/firestore";

import { db } from "../firebase.js";

export async function loadProgressiveProgress(
  user
) {
  const snapshot =
    await getDocs(
      collection(
        db,
        "users",
        user.uid,
        "progressiveProgress"
      )
    );

  const result = {};

  snapshot.forEach((doc) => {
    result[doc.id] = doc.data();
  });

  return result;
}