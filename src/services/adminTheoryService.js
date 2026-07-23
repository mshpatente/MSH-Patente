import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from "firebase/storage";

import {
  db,
  storage
} from "../firebase.js";

const THEORY_COLLECTION =
  "theoryLessons";

const USER_COLLECTION =
  "users";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

function normalizeFileName(fileName) {
  return String(fileName || "image")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9._-]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );
}

function createLessonId() {
  const randomPart =
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `lesson-${randomPart}`;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanNumber(value, fallback = 0) {
  const parsedValue =
    Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

function buildLessonContent(data) {
  const content = [];

  const theoryText =
    cleanText(data.theoryText);

  const correctBehavior =
    cleanText(data.correctBehavior);

  const remember =
    cleanText(data.remember);

  const commonMistake =
    cleanText(data.commonMistake);

  if (theoryText) {
    content.push({
      type: "paragraph",
      text: theoryText
    });
  }

  if (remember) {
    content.push({
      type: "important",
      title: "Da ricordare",
      text: remember
    });
  }

  if (correctBehavior) {
    content.push({
      type: "important",
      title: "Comportamento corretto",
      text: correctBehavior
    });
  }

  if (commonMistake) {
    content.push({
      type: "warning",
      title: "Errore comune",
      text: commonMistake
    });
  }

  return content;
}

function buildLessonPayload(data) {
  const status =
    ["draft", "published", "archived"]
      .includes(data.status)
      ? data.status
      : "draft";

  return {
    title:
      cleanText(data.title),

    slug:
      cleanText(data.slug),

    argomentoId:
      cleanText(data.argomentoId),

    topicId:
      cleanText(data.topicId),

    order:
  cleanNumber(data.order, 1),

estimatedMinutes:
  Math.max(
    1,
    cleanNumber(
      data.estimatedMinutes,
      3
    )
  ),

status,

published:
  status === "published",

    summary:
  cleanText(data.summary),

subtitle:
  cleanText(data.summary),

content:
  buildLessonContent(data),

theoryText:
  cleanText(data.theoryText),

    correctBehavior:
      cleanText(data.correctBehavior),

    remember:
      cleanText(data.remember),

    commonMistake:
      cleanText(data.commonMistake),

    magicTrick:
      cleanText(data.magicTrick),

    imageUrl:
      cleanText(data.imageUrl),

    imageStoragePath:
      cleanText(
        data.imageStoragePath
      )
  };
}

export async function getCurrentUserRole(
  user
) {
  if (!user?.uid) {
    return null;
  }

  const userSnapshot =
    await getDoc(
      doc(
        db,
        USER_COLLECTION,
        user.uid
      )
    );

  if (!userSnapshot.exists()) {
    return null;
  }

  return (
    userSnapshot.data()?.role ||
    null
  );
}

export async function assertAdminUser(
  user
) {
  if (!user?.uid) {
    throw new Error(
      "Utente non autenticato."
    );
  }

  const role =
    await getCurrentUserRole(user);

  if (role !== "admin") {
    throw new Error(
      "Non hai i permessi di amministratore."
    );
  }

  return true;
}

export async function loadAdminTheoryLessons(
  user
) {
  await assertAdminUser(user);

  const lessonQuery =
    query(
      collection(
        db,
        THEORY_COLLECTION
      ),
      orderBy("order", "asc")
    );

  const snapshot =
    await getDocs(lessonQuery);

  return snapshot.docs.map(
    (lessonDocument) => ({
      id: lessonDocument.id,
      ...lessonDocument.data()
    })
  );
}

export async function getAdminTheoryLesson(
  user,
  lessonId
) {
  await assertAdminUser(user);

  const snapshot =
    await getDoc(
      doc(
        db,
        THEORY_COLLECTION,
        lessonId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function uploadTheoryImage(
  user,
  file,
  lessonId
) {
  await assertAdminUser(user);

  if (!file) {
    throw new Error(
      "Seleziona prima un'immagine."
    );
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type
    )
  ) {
    throw new Error(
      "Formato non valido. Usa JPG, PNG o WEBP."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "L'immagine non può superare 5 MB."
    );
  }

  const safeLessonId =
    cleanText(lessonId) ||
    createLessonId();

  const safeFileName =
    normalizeFileName(file.name);

  const storagePath =
    [
      "theory-images",
      safeLessonId,
      `${Date.now()}-${safeFileName}`
    ].join("/");

  const imageReference =
    ref(
      storage,
      storagePath
    );

  await uploadBytes(
    imageReference,
    file,
    {
      contentType: file.type,
      customMetadata: {
        uploadedBy: user.uid,
        lessonId: safeLessonId
      }
    }
  );

  const imageUrl =
    await getDownloadURL(
      imageReference
    );

  return {
    imageUrl,
    imageStoragePath:
      storagePath
  };
}

export async function removeTheoryImage(
  user,
  imageStoragePath
) {
  await assertAdminUser(user);

  const cleanPath =
    cleanText(imageStoragePath);

  if (!cleanPath) {
    return;
  }

  try {
    await deleteObject(
      ref(
        storage,
        cleanPath
      )
    );
  } catch (error) {
    if (
      error.code !==
      "storage/object-not-found"
    ) {
      throw error;
    }
  }
}

export async function createTheoryLesson(
  user,
  lessonData
) {
  await assertAdminUser(user);

  const lessonId =
    cleanText(lessonData.id) ||
    createLessonId();

  const payload =
    buildLessonPayload(
      lessonData
    );

  if (!payload.title) {
    throw new Error(
      "Il titolo della lezione è obbligatorio."
    );
  }

  if (!payload.argomentoId) {
    throw new Error(
      "Seleziona un argomento."
    );
  }

  if (!payload.topicId) {
    throw new Error(
      "Seleziona un topic."
    );
  }

  await setDoc(
    doc(
      db,
      THEORY_COLLECTION,
      lessonId
    ),
    {
      ...payload,

      id: lessonId,

      createdBy:
        user.uid,

      updatedBy:
        user.uid,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()
    }
  );

  return lessonId;
}

export async function updateTheoryLesson(
  user,
  lessonId,
  lessonData
) {
  await assertAdminUser(user);

  const cleanLessonId =
    cleanText(lessonId);

  if (!cleanLessonId) {
    throw new Error(
      "ID lezione non valido."
    );
  }

  const lessonReference =
    doc(
      db,
      THEORY_COLLECTION,
      cleanLessonId
    );

  const oldSnapshot =
    await getDoc(
      lessonReference
    );

  if (!oldSnapshot.exists()) {
    throw new Error(
      "La lezione non esiste."
    );
  }

  const payload =
    buildLessonPayload(
      lessonData
    );

  if (!payload.title) {
    throw new Error(
      "Il titolo della lezione è obbligatorio."
    );
  }

  if (!payload.argomentoId) {
    throw new Error(
      "Seleziona un argomento."
    );
  }

  if (!payload.topicId) {
    throw new Error(
      "Seleziona un topic."
    );
  }

  await updateDoc(
    lessonReference,
    {
      ...payload,

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );

  return cleanLessonId;
}

export async function archiveTheoryLesson(
  user,
  lessonId
) {
  await assertAdminUser(user);

  await updateDoc(
    doc(
      db,
      THEORY_COLLECTION,
      lessonId
    ),
    {
      status: "archived",
      published: false,

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );
}

export async function restoreTheoryLesson(
  user,
  lessonId
) {
  await assertAdminUser(user);

  await updateDoc(
    doc(
      db,
      THEORY_COLLECTION,
      lessonId
    ),
    {
      status: "draft",
      published: false,

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );
}

export async function permanentlyDeleteTheoryLesson(
  user,
  lessonId
) {
  await assertAdminUser(user);

  const cleanLessonId =
    cleanText(lessonId);

  if (!cleanLessonId) {
    throw new Error(
      "ID lezione non valido."
    );
  }

  const lessonReference =
    doc(
      db,
      THEORY_COLLECTION,
      cleanLessonId
    );

  const lessonSnapshot =
    await getDoc(
      lessonReference
    );

  if (!lessonSnapshot.exists()) {
    return;
  }

  const imageStoragePath =
    cleanText(
      lessonSnapshot.data()
        ?.imageStoragePath
    );

  if (imageStoragePath) {
    await removeTheoryImage(
      user,
      imageStoragePath
    );
  }

  await deleteDoc(
    lessonReference
  );
}