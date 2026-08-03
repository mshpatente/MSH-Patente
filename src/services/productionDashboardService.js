import {
  collection,
  getCountFromServer,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebase.js";

async function count(collectionName, ...filters) {
  const snapshot =
    await getCountFromServer(
      query(
        collection(
          db,
          collectionName
        ),
        ...filters
      )
    );

  return snapshot.data().count;
}

export async function loadProductionDashboard() {

  const [
    pendingReview,
    approvedQuestions,
    rejectedQuestions,

    concepts,

    lessonDrafts,

    lessonVersions,

    publishedLessons
  ] = await Promise.all([

    count(
      "questionReviewQueue",
      where(
        "status",
        "==",
        "pending_review"
      )
    ),

    count(
      "officialQuestions"
    ),

    count(
      "questionReviewQueue",
      where(
        "status",
        "==",
        "rejected"
      )
    ),

    count(
      "knowledgeConcepts"
    ),

    count(
      "knowledgeLessonDrafts"
    ),

    count(
      "knowledgeLessonVersions"
    ),

    count(
      "theoryLessons",
      where(
        "status",
        "==",
        "published"
      )
    )

  ]);

  return {

    pendingReview,

    approvedQuestions,

    rejectedQuestions,

    concepts,

    lessonDrafts,

    lessonVersions,

    publishedLessons

  };

}