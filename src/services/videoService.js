import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

import { db } from "../firebase.js";

const VIDEO_COLLECTION = "theoryVideos";

function toSafeString(value) {
  return String(value ?? "").trim();
}

function toSafePositiveInteger(
  value,
  fallback = 1
) {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

/**
 * YouTube URL থেকে video ID বের করে।
 *
 * Supported:
 * https://www.youtube.com/watch?v=VIDEO_ID
 * https://youtu.be/VIDEO_ID
 * https://www.youtube.com/shorts/VIDEO_ID
 * https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(
  value
) {
  const input =
    toSafeString(value);

  if (!input) {
    return "";
  }

  /*
   * সরাসরি video ID দেওয়া হলেও গ্রহণ করবে।
   */
  if (
    /^[a-zA-Z0-9_-]{11}$/.test(
      input
    )
  ) {
    return input;
  }

  try {
    const url = new URL(input);

    const hostname =
      url.hostname
        .replace(/^www\./, "")
        .toLowerCase();

    if (hostname === "youtu.be") {
      return toSafeString(
        url.pathname.split("/")[1]
      );
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      const watchVideoId =
        url.searchParams.get("v");

      if (watchVideoId) {
        return toSafeString(
          watchVideoId
        );
      }

      const pathParts =
        url.pathname
          .split("/")
          .filter(Boolean);

      if (
        pathParts[0] === "embed" ||
        pathParts[0] === "shorts" ||
        pathParts[0] === "live"
      ) {
        return toSafeString(
          pathParts[1]
        );
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function createYouTubeEmbedUrl(
  videoId
) {
  const safeVideoId =
    extractYouTubeVideoId(videoId);

  if (!safeVideoId) {
    return "";
  }

  return (
    "https://www.youtube-nocookie.com/embed/" +
    safeVideoId
  );
}

export function createYouTubeThumbnailUrl(
  videoId
) {
  const safeVideoId =
    extractYouTubeVideoId(videoId);

  if (!safeVideoId) {
    return "";
  }

  return (
    "https://i.ytimg.com/vi/" +
    safeVideoId +
    "/hqdefault.jpg"
  );
}

export function normalizeTheoryVideo(
  data,
  documentId = ""
) {
  const youtubeVideoId =
    extractYouTubeVideoId(
      data?.youtubeVideoId ||
      data?.youtubeUrl
    );

  const status =
    ["draft", "published", "archived"]
      .includes(data?.status)
      ? data.status
      : "draft";

  return {
    id:
      toSafeString(
        data?.id ||
        documentId
      ),

    argomentoId:
      toSafeString(
        data?.argomentoId
      ),

    topicId:
      toSafeString(
        data?.topicId
      ),

    title:
      toSafeString(
        data?.title
      ),

    description:
      toSafeString(
        data?.description
      ),

    youtubeUrl:
      toSafeString(
        data?.youtubeUrl
      ),

    youtubeVideoId,

    embedUrl:
      createYouTubeEmbedUrl(
        youtubeVideoId
      ),

    thumbnailUrl:
      toSafeString(
        data?.thumbnailUrl
      ) ||
      createYouTubeThumbnailUrl(
        youtubeVideoId
      ),

    order:
      toSafePositiveInteger(
        data?.order,
        1
      ),

    durationMinutes:
      Math.max(
        0,
        Number(
          data?.durationMinutes
        ) || 0
      ),

    status,

    published:
      status === "published"
  };
}

function validateVideoPayload(
  video
) {
  if (!video.argomentoId) {
    throw new Error(
      "Seleziona un argomento."
    );
  }

  if (!video.topicId) {
    throw new Error(
      "Seleziona un topic."
    );
  }

  if (!video.title) {
    throw new Error(
      "Inserisci il titolo del video."
    );
  }

  if (!video.youtubeVideoId) {
    throw new Error(
      "Inserisci un link YouTube valido."
    );
  }
}

/**
 * Students-এর জন্য published videos load করে।
 */
export async function loadPublishedTheoryVideos() {
  const videosQuery =
    query(
      collection(
        db,
        VIDEO_COLLECTION
      ),
      where(
        "status",
        "==",
        "published"
      )
    );

  const snapshot =
    await getDocs(
      videosQuery
    );

  return snapshot.docs
    .map((videoDocument) =>
      normalizeTheoryVideo(
        videoDocument.data(),
        videoDocument.id
      )
    )
    .filter(
      (video) =>
        video.id &&
        video.argomentoId &&
        video.topicId &&
        video.youtubeVideoId
    )
    .sort(
      (first, second) => {
        if (
          first.argomentoId !==
          second.argomentoId
        ) {
          return first.argomentoId
            .localeCompare(
              second.argomentoId
            );
        }

        if (
          first.topicId !==
          second.topicId
        ) {
          return first.topicId
            .localeCompare(
              second.topicId
            );
        }

        return (
          first.order -
          second.order
        );
      }
    );
}

/**
 * নির্দিষ্ট topic-এর published videos।
 */
export async function loadTopicTheoryVideos({
  argomentoId,
  topicId
}) {
  const safeArgomentoId =
    toSafeString(argomentoId);

  const safeTopicId =
    toSafeString(topicId);

  if (
    !safeArgomentoId ||
    !safeTopicId
  ) {
    return [];
  }

  /*
   * Composite index এড়াতে শুধু status দিয়ে query করা হচ্ছে।
   * Topic filtering client-side।
   */
  const videos =
    await loadPublishedTheoryVideos();

  return videos.filter(
    (video) =>
      video.argomentoId ===
        safeArgomentoId &&
      video.topicId ===
        safeTopicId
  );
}

/**
 * Admin-এর জন্য draft, published ও archived সব videos।
 */
export async function loadAdminTheoryVideos() {
  const snapshot =
    await getDocs(
      collection(
        db,
        VIDEO_COLLECTION
      )
    );

  return snapshot.docs
    .map((videoDocument) =>
      normalizeTheoryVideo(
        videoDocument.data(),
        videoDocument.id
      )
    )
    .sort(
      (first, second) => {
        if (
          first.argomentoId !==
          second.argomentoId
        ) {
          return first.argomentoId
            .localeCompare(
              second.argomentoId
            );
        }

        if (
          first.topicId !==
          second.topicId
        ) {
          return first.topicId
            .localeCompare(
              second.topicId
            );
        }

        return (
          first.order -
          second.order
        );
      }
    );
}

export async function getAdminTheoryVideo(
  videoId
) {
  const safeVideoId =
    toSafeString(videoId);

  if (!safeVideoId) {
    return null;
  }

  const snapshot =
    await getDoc(
      doc(
        db,
        VIDEO_COLLECTION,
        safeVideoId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeTheoryVideo(
    snapshot.data(),
    snapshot.id
  );
}

export async function createTheoryVideo(
  videoData
) {
  const normalizedVideo =
    normalizeTheoryVideo(
      videoData
    );

  validateVideoPayload(
    normalizedVideo
  );

  const payload = {
    argomentoId:
      normalizedVideo.argomentoId,

    topicId:
      normalizedVideo.topicId,

    title:
      normalizedVideo.title,

    description:
      normalizedVideo.description,

    youtubeUrl:
      normalizedVideo.youtubeUrl,

    youtubeVideoId:
      normalizedVideo.youtubeVideoId,

    thumbnailUrl:
      normalizedVideo.thumbnailUrl,

    order:
      normalizedVideo.order,

    durationMinutes:
      normalizedVideo.durationMinutes,

    status:
      normalizedVideo.status,

    published:
      normalizedVideo.status ===
      "published",

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()
  };

  const reference =
    await addDoc(
      collection(
        db,
        VIDEO_COLLECTION
      ),
      payload
    );

  return reference.id;
}

export async function updateTheoryVideo(
  videoId,
  videoData
) {
  const safeVideoId =
    toSafeString(videoId);

  if (!safeVideoId) {
    throw new Error(
      "Video ID non valido."
    );
  }

  const normalizedVideo =
    normalizeTheoryVideo(
      videoData,
      safeVideoId
    );

  validateVideoPayload(
    normalizedVideo
  );

  await updateDoc(
    doc(
      db,
      VIDEO_COLLECTION,
      safeVideoId
    ),
    {
      argomentoId:
        normalizedVideo.argomentoId,

      topicId:
        normalizedVideo.topicId,

      title:
        normalizedVideo.title,

      description:
        normalizedVideo.description,

      youtubeUrl:
        normalizedVideo.youtubeUrl,

      youtubeVideoId:
        normalizedVideo.youtubeVideoId,

      thumbnailUrl:
        normalizedVideo.thumbnailUrl,

      order:
        normalizedVideo.order,

      durationMinutes:
        normalizedVideo.durationMinutes,

      status:
        normalizedVideo.status,

      published:
        normalizedVideo.status ===
        "published",

      updatedAt:
        serverTimestamp()
    }
  );
}

export async function archiveTheoryVideo(
  videoId
) {
  const safeVideoId =
    toSafeString(videoId);

  if (!safeVideoId) {
    return;
  }

  await updateDoc(
    doc(
      db,
      VIDEO_COLLECTION,
      safeVideoId
    ),
    {
      status: "archived",
      published: false,
      updatedAt:
        serverTimestamp()
    }
  );
}

export async function restoreTheoryVideo(
  videoId
) {
  const safeVideoId =
    toSafeString(videoId);

  if (!safeVideoId) {
    return;
  }

  await updateDoc(
    doc(
      db,
      VIDEO_COLLECTION,
      safeVideoId
    ),
    {
      status: "draft",
      published: false,
      updatedAt:
        serverTimestamp()
    }
  );
}

export async function permanentlyDeleteTheoryVideo(
  videoId
) {
  const safeVideoId =
    toSafeString(videoId);

  if (!safeVideoId) {
    return;
  }

  await deleteDoc(
    doc(
      db,
      VIDEO_COLLECTION,
      safeVideoId
    )
  );
}