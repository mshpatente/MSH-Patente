import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import {
  db
} from "../firebase.js";

function getValidUserId(user) {
  return String(
    user?.uid || ""
  ).trim();
}

function normalizeProgress(
  data,
  documentId = ""
) {
  return {
    id:
      String(
        data?.videoId ||
        documentId
      ).trim(),

    videoId:
      String(
        data?.videoId ||
        documentId
      ).trim(),

    argomentoId:
      String(
        data?.argomentoId ||
        ""
      ).trim(),

    topicId:
      String(
        data?.topicId ||
        ""
      ).trim(),

    videoTitle:
      String(
        data?.videoTitle ||
        ""
      ).trim(),

    completed:
      data?.completed === true,

    watchedPercentage:
      Math.min(
        100,
        Math.max(
          0,
          Number(
            data?.watchedPercentage
          ) || 0
        )
      ),

    lastPositionSeconds:
      Math.max(
        0,
        Number(
          data?.lastPositionSeconds
        ) || 0
      ),

    durationSeconds:
      Math.max(
        0,
        Number(
          data?.durationSeconds
        ) || 0
      )
  };
}

export async function loadVideoProgress(
  user
) {
  const userId =
    getValidUserId(user);

  if (!userId) {
    return [];
  }

  const snapshot =
    await getDocs(
      collection(
        db,
        "users",
        userId,
        "videoProgress"
      )
    );

  return snapshot.docs.map(
    (progressDocument) =>
      normalizeProgress(
        progressDocument.data(),
        progressDocument.id
      )
  );
}

export async function saveVideoProgress({
  user,
  video,
  completed = false,
  watchedPercentage = 0,
  lastPositionSeconds = 0,
  durationSeconds = 0
}) {
  const userId =
    getValidUserId(user);

  const videoId =
    String(
      video?.id || ""
    ).trim();

  if (!userId) {
    throw new Error(
      "Utente non autenticato."
    );
  }

  if (!videoId) {
    throw new Error(
      "Video non valido."
    );
  }

  const safeCompleted =
    completed === true;

  const safePercentage =
    safeCompleted
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Number(
              watchedPercentage
            ) || 0
          )
        );

  const progressReference =
    doc(
      db,
      "users",
      userId,
      "videoProgress",
      videoId
    );

  await setDoc(
    progressReference,
    {
      videoId,

      argomentoId:
        String(
          video.argomentoId ||
          ""
        ).trim(),

      topicId:
        String(
          video.topicId ||
          ""
        ).trim(),

      videoTitle:
        String(
          video.title ||
          ""
        ).trim(),

      completed:
        safeCompleted,

      watchedPercentage:
        safePercentage,

      lastPositionSeconds:
        Math.max(
          0,
          Number(
            lastPositionSeconds
          ) || 0
        ),

      durationSeconds:
        Math.max(
          0,
          Number(
            durationSeconds
          ) || 0
        ),

      lastWatchedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

      completedAt:
        safeCompleted
          ? serverTimestamp()
          : null
    },
    {
      merge: true
    }
  );

  return normalizeProgress(
    {
      videoId,
      argomentoId:
        video.argomentoId,
      topicId:
        video.topicId,
      videoTitle:
        video.title,
      completed:
        safeCompleted,
      watchedPercentage:
        safePercentage,
      lastPositionSeconds,
      durationSeconds
    },
    videoId
  );
}

export async function markVideoCompleted({
  user,
  video
}) {
  return saveVideoProgress({
    user,
    video,
    completed: true,
    watchedPercentage: 100
  });
}