import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
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

const QUESTIONS_COLLECTION =
  "questions";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

function normalizeBoolean(value) {
  if (
    value === true ||
    value === "true" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0
  ) {
    return false;
  }

  return null;
}

function normalizeText(value) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeNumber(
  value,
  fallback = 0
) {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : fallback;
}

function normalizeQuestionDocument(
  snapshot
) {
  const data =
    snapshot.data() || {};

  const status =
    normalizeText(
      data.status || "draft"
    ) || "draft";

  return {
    id: snapshot.id,

    argomentoId:
      normalizeText(
        data.argomentoId
      ),

    topicId:
      normalizeText(
        data.topicId
      ),

      subtopicId:
  normalizeText(
    data.subtopicId
  ),

subtopicTitle:
  normalizeText(
    data.subtopicTitle
  ),

lessonId:
  normalizeText(
    data.lessonId
  ),

    question:
      normalizeText(
        data.question
      ),

    answer:
      normalizeBoolean(
        data.answer
      ),

    explanation:
      normalizeText(
        data.explanation
      ),

    image:
      normalizeText(
        data.image ||
        data.imageUrl
      ),

    imageUrl:
      normalizeText(
        data.imageUrl ||
        data.image
      ),

    imageStoragePath:
      normalizeText(
        data.imageStoragePath
      ),

    order:
      normalizeNumber(
        data.order,
        0
      ),

    status,

    published:
      status === "published" ||
      data.published === true,

    createdAt:
      data.createdAt || null,

    updatedAt:
      data.updatedAt || null
  };
}

function sortQuestions(
  firstQuestion,
  secondQuestion
) {
  const firstOrder =
    normalizeNumber(
      firstQuestion.order,
      0
    );

  const secondOrder =
    normalizeNumber(
      secondQuestion.order,
      0
    );

  if (
    firstOrder !== secondOrder
  ) {
    return (
      firstOrder -
      secondOrder
    );
  }

  return String(
    firstQuestion.question || ""
  ).localeCompare(
    String(
      secondQuestion.question || ""
    ),
    "it"
  );
}

async function verifyAdmin(user) {
  if (!user?.uid) {
    throw new Error(
      "Utente non autenticato."
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
    throw new Error(
      "Profilo utente non trovato."
    );
  }

  const userData =
    userSnapshot.data() || {};

  if (
    userData.role !== "admin"
  ) {
    throw new Error(
      "Questa operazione è riservata agli amministratori."
    );
  }

  return userData;
}

function validateQuestionData(
  questionData
) {
  const errors = [];

  if (
    !normalizeText(
      questionData.id
    )
  ) {
    errors.push(
      "ID domanda mancante."
    );
  }

  if (
    !normalizeText(
      questionData.argomentoId
    )
  ) {
    errors.push(
      "Seleziona un argomento."
    );
  }

  if (
    !normalizeText(
      questionData.topicId
    )
  ) {
    errors.push(
      "Seleziona un topic."
    );
  }

  if (
    !normalizeText(
      questionData.question
    )
  ) {
    errors.push(
      "Scrivi il testo della domanda."
    );
  }

  if (
    normalizeBoolean(
      questionData.answer
    ) === null
  ) {
    errors.push(
      "Seleziona la risposta corretta."
    );
  }

  const order =
    normalizeNumber(
      questionData.order,
      0
    );

  if (
    !Number.isInteger(order) ||
    order < 1
  ) {
    errors.push(
      "Inserisci un ordine valido."
    );
  }

  const allowedStatuses = [
    "draft",
    "published",
    "archived"
  ];

  if (
    !allowedStatuses.includes(
      normalizeText(
        questionData.status
      )
    )
  ) {
    errors.push(
      "Stato della domanda non valido."
    );
  }

  if (errors.length > 0) {
    throw new Error(
      errors.join(" ")
    );
  }
}

function buildQuestionPayload(
  questionData
) {
  const status =
    normalizeText(
      questionData.status ||
      "draft"
    ) || "draft";

  const imageUrl =
    normalizeText(
      questionData.imageUrl ||
      questionData.image
    );

  return {
    argomentoId:
      normalizeText(
        questionData.argomentoId
      ),

    topicId:
      normalizeText(
        questionData.topicId
      ),

      subtopicId:
  normalizeText(
    questionData.subtopicId
  ),

subtopicTitle:
  normalizeText(
    questionData.subtopicTitle
  ),

lessonId:
  normalizeText(
    questionData.lessonId
  ),

    question:
      normalizeText(
        questionData.question
      ),

    answer:
      normalizeBoolean(
        questionData.answer
      ),

    explanation:
      normalizeText(
        questionData.explanation
      ),

    image:
      imageUrl,

    imageUrl,

    imageStoragePath:
      normalizeText(
        questionData
          .imageStoragePath
      ),

    order:
      normalizeNumber(
        questionData.order,
        1
      ),

    status,

    published:
      status === "published"
  };
}

/**
 * Admin-এর জন্য draft, published ও archived—
 * সব প্রশ্ন load করে।
 */
export async function loadAdminQuestions(
  user
) {
  await verifyAdmin(user);

  try {
    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            QUESTIONS_COLLECTION
          )
        )
      );

    return snapshot.docs
      .map(
        normalizeQuestionDocument
      )
      .sort(sortQuestions);
  } catch (error) {
    console.error(
      "Admin questions loading error:",
      error
    );

    throw new Error(
      error.message ||
      "Non è stato possibile caricare le domande."
    );
  }
}

/**
 * একটি নির্দিষ্ট প্রশ্ন load করে।
 */
export async function getAdminQuestion(
  user,
  questionId
) {
  await verifyAdmin(user);

  const normalizedQuestionId =
    normalizeText(questionId);

  if (!normalizedQuestionId) {
    throw new Error(
      "ID domanda non valido."
    );
  }

  try {
    const questionReference =
      doc(
        db,
        QUESTIONS_COLLECTION,
        normalizedQuestionId
      );

    const questionSnapshot =
      await getDoc(
        questionReference
      );

    if (
      !questionSnapshot.exists()
    ) {
      return null;
    }

    return normalizeQuestionDocument(
      questionSnapshot
    );
  } catch (error) {
    console.error(
      "Admin question loading error:",
      error
    );

    throw new Error(
      error.message ||
      "Non è stato possibile caricare la domanda."
    );
  }
}

/**
 * নতুন প্রশ্ন তৈরি করে।
 */
export async function createQuestion(
  user,
  questionData
) {
  await verifyAdmin(user);

  const normalizedData = {
    ...questionData,
    id:
      normalizeText(
        questionData?.id
      )
  };

  validateQuestionData(
    normalizedData
  );

  const questionReference =
    doc(
      db,
      QUESTIONS_COLLECTION,
      normalizedData.id
    );

  const existingSnapshot =
    await getDoc(
      questionReference
    );

  if (
    existingSnapshot.exists()
  ) {
    throw new Error(
      "Esiste già una domanda con questo ID."
    );
  }

  const payload =
    buildQuestionPayload(
      normalizedData
    );

  await setDoc(
  questionReference,
  {
    ...payload,

    createdBy:
      user.uid,

    createdAt:
      serverTimestamp(),

    updatedBy:
      user.uid,

    updatedAt:
      serverTimestamp()
  }
);

  return normalizedData.id;
}

/**
 * প্রশ্ন update করে।
 */
export async function updateQuestion(
  user,
  questionId,
  questionData
) {
  await verifyAdmin(user);

  const normalizedQuestionId =
    normalizeText(questionId);

  const normalizedData = {
    ...questionData,
    id: normalizedQuestionId
  };

  validateQuestionData(
    normalizedData
  );

  const questionReference =
    doc(
      db,
      QUESTIONS_COLLECTION,
      normalizedQuestionId
    );

  const existingSnapshot =
    await getDoc(
      questionReference
    );

  if (
    !existingSnapshot.exists()
  ) {
    throw new Error(
      "Domanda non trovata."
    );
  }

  const payload =
    buildQuestionPayload(
      normalizedData
    );

  await updateDoc(
    questionReference,
    {
      ...payload,

      updatedBy:
        user.uid,

      updatedAt:
        serverTimestamp()
    }
  );

  return normalizedQuestionId;
}

/**
 * প্রশ্ন archive করে।
 */
export async function archiveQuestion(
  user,
  questionId
) {
  await verifyAdmin(user);

  const normalizedQuestionId =
    normalizeText(questionId);

  if (!normalizedQuestionId) {
    throw new Error(
      "ID domanda non valido."
    );
  }

  await updateDoc(
    doc(
      db,
      QUESTIONS_COLLECTION,
      normalizedQuestionId
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

/**
 * Archived প্রশ্ন draft হিসেবে restore করে।
 */
export async function restoreQuestion(
  user,
  questionId
) {
  await verifyAdmin(user);

  const normalizedQuestionId =
    normalizeText(questionId);

  if (!normalizedQuestionId) {
    throw new Error(
      "ID domanda non valido."
    );
  }

  await updateDoc(
    doc(
      db,
      QUESTIONS_COLLECTION,
      normalizedQuestionId
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

/**
 * প্রশ্ন ও তার Storage image স্থায়ীভাবে delete করে।
 */
export async function permanentlyDeleteQuestion(
  user,
  questionId
) {
  await verifyAdmin(user);

  const normalizedQuestionId =
    normalizeText(questionId);

  if (!normalizedQuestionId) {
    throw new Error(
      "ID domanda non valido."
    );
  }

  const questionReference =
    doc(
      db,
      QUESTIONS_COLLECTION,
      normalizedQuestionId
    );

  const questionSnapshot =
    await getDoc(
      questionReference
    );

  if (
    !questionSnapshot.exists()
  ) {
    throw new Error(
      "Domanda non trovata."
    );
  }

  const question =
    normalizeQuestionDocument(
      questionSnapshot
    );

  await deleteDoc(
    questionReference
  );

  if (
    question.imageStoragePath
  ) {
    try {
      await removeQuestionImage(
        user,
        question.imageStoragePath
      );
    } catch (error) {
      console.warn(
        "Question image cleanup error:",
        error
      );
    }
  }
}

/**
 * প্রশ্নের image Firebase Storage-এ upload করে।
 */
export async function uploadQuestionImage(
  user,
  file,
  questionId
) {
  await verifyAdmin(user);

  if (!(file instanceof File)) {
    throw new Error(
      "Seleziona un'immagine valida."
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

  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {
    throw new Error(
      "L'immagine non può superare 5 MB."
    );
  }

  const normalizedQuestionId =
    normalizeText(questionId);

  if (!normalizedQuestionId) {
    throw new Error(
      "ID domanda non valido."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";

  const safeExtension =
    extension.replace(
      /[^a-z0-9]/g,
      ""
    ) || "jpg";

  const imageStoragePath =
    `question-images/` +
    `${normalizedQuestionId}/` +
    `${Date.now()}.${safeExtension}`;

  const imageReference =
    ref(
      storage,
      imageStoragePath
    );

  await uploadBytes(
    imageReference,
    file,
    {
      contentType:
        file.type
    }
  );

  const imageUrl =
    await getDownloadURL(
      imageReference
    );

  return {
    imageUrl,
    imageStoragePath
  };
}

/**
 * Firebase Storage image delete করে।
 */
export async function removeQuestionImage(
  user,
  imageStoragePath
) {
  await verifyAdmin(user);

  const normalizedPath =
    normalizeText(
      imageStoragePath
    );

  if (!normalizedPath) {
    return;
  }

  try {
    await deleteObject(
      ref(
        storage,
        normalizedPath
      )
    );
  } catch (error) {
    if (
      error?.code ===
      "storage/object-not-found"
    ) {
      return;
    }

    throw error;
  }
}