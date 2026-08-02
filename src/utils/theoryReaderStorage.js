const STORAGE_PREFIX = "msh-theory-v2";

function safeScope(scope) {
  return String(scope || "guest")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function safeLessonId(lessonId) {
  return String(lessonId || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function key(scope, name) {
  return `${STORAGE_PREFIX}:${safeScope(scope)}:${name}`;
}

function readJson(storageKey, fallback) {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn("Theory storage read error:", error);
    return fallback;
  }
}

function writeJson(storageKey, value) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.warn("Theory storage write error:", error);
    return false;
  }
}

export function getReaderPreferences(scope) {
  const preferences = readJson(
    key(scope, "preferences"),
    {}
  );

  return {
    theme:
      ["light", "sepia", "dark"].includes(
        preferences.theme
      )
        ? preferences.theme
        : "light",

    fontSize:
      ["small", "medium", "large"].includes(
        preferences.fontSize
      )
        ? preferences.fontSize
        : "medium",

    speechRate:
      Math.min(
        1.5,
        Math.max(
          0.6,
          Number(preferences.speechRate) || 0.9
        )
      )
  };
}

export function saveReaderPreferences(
  scope,
  nextPreferences
) {
  const current =
    getReaderPreferences(scope);

  return writeJson(
    key(scope, "preferences"),
    {
      ...current,
      ...nextPreferences,
      updatedAt: new Date().toISOString()
    }
  );
}

export function getBookmarkedLessonIds(scope) {
  const ids = readJson(
    key(scope, "bookmarks"),
    []
  );

  return new Set(
    Array.isArray(ids)
      ? ids.map(String)
      : []
  );
}

export function isLessonBookmarked(
  scope,
  lessonId
) {
  return getBookmarkedLessonIds(scope)
    .has(String(lessonId));
}

export function toggleLessonBookmark(
  scope,
  lessonId
) {
  const ids =
    getBookmarkedLessonIds(scope);

  const id = String(lessonId);

  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }

  writeJson(
    key(scope, "bookmarks"),
    [...ids]
  );

  return ids.has(id);
}

export function getFavouriteLessonIds(scope) {
  const ids = readJson(
    key(scope, "favourites"),
    []
  );

  return new Set(
    Array.isArray(ids)
      ? ids.map(String)
      : []
  );
}

export function isLessonFavourite(
  scope,
  lessonId
) {
  return getFavouriteLessonIds(scope)
    .has(String(lessonId));
}

export function toggleLessonFavourite(
  scope,
  lessonId
) {
  const ids =
    getFavouriteLessonIds(scope);

  const id = String(lessonId);

  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }

  writeJson(
    key(scope, "favourites"),
    [...ids]
  );

  return ids.has(id);
}

export function getLessonNote(
  scope,
  lessonId
) {
  return String(
    localStorage.getItem(
      key(
        scope,
        `note:${safeLessonId(lessonId)}`
      )
    ) || ""
  );
}

export function saveLessonNote(
  scope,
  lessonId,
  note
) {
  try {
    localStorage.setItem(
      key(
        scope,
        `note:${safeLessonId(lessonId)}`
      ),
      String(note || "")
    );

    return true;
  } catch (error) {
    console.warn("Theory note save error:", error);
    return false;
  }
}

export function getLessonReadingPosition(
  scope,
  lessonId
) {
  const value = Number(
    localStorage.getItem(
      key(
        scope,
        `position:${safeLessonId(lessonId)}`
      )
    )
  );

  return Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
}

export function saveLessonReadingPosition(
  scope,
  lessonId,
  percentage
) {
  try {
    localStorage.setItem(
      key(
        scope,
        `position:${safeLessonId(lessonId)}`
      ),
      String(
        Math.round(
          Math.min(
            100,
            Math.max(
              0,
              Number(percentage) || 0
            )
          )
        )
      )
    );

    return true;
  } catch (error) {
    console.warn(
      "Theory reading-position save error:",
      error
    );

    return false;
  }
}

export function saveLastOpenedLesson(
  scope,
  lessonData
) {
  return writeJson(
    key(scope, "last-opened"),
    {
      ...lessonData,
      updatedAt: new Date().toISOString()
    }
  );
}

export function getLastOpenedLesson(scope) {
  return readJson(
    key(scope, "last-opened"),
    null
  );
}
