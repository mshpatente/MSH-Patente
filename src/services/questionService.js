import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebase.js";

export async function loadPublishedQuestions() {
  const snapshot =
    await getDocs(
      query(
        collection(
          db,
          "questions"
        ),
        where(
          "status",
          "==",
          "published"
        )
      )
    );

  return snapshot.docs.map(
    (questionDocument) => {
      const data =
        questionDocument.data() || {};

      return {
        id:
          questionDocument.id,

        ...data,

        argomentoId:
          String(
            data.argomentoId || ""
          ).trim(),

        topicId:
          String(
            data.topicId || ""
          ).trim(),

        subtopicId:
          String(
            data.subtopicId || ""
          ).trim(),

        subtopicTitle:
          String(
            data.subtopicTitle || ""
          ).trim(),

        lessonId:
          String(
            data.lessonId || ""
          ).trim()
      };
    }
  );
}