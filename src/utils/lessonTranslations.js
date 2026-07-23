export const SUPPORTED_LESSON_LANGUAGES = [
  {
    code: "it",
    label: "Italiano",
    flag: "🇮🇹"
  },
  {
    code: "bn",
    label: "বাংলা",
    flag: "🇧🇩"
  },
  {
    code: "en",
    label: "English",
    flag: "🇬🇧"
  }
];

export const DEFAULT_LESSON_LANGUAGE =
  "it";

const LANGUAGE_STORAGE_KEY =
  "mshPreferredLanguage";

const TRANSLATABLE_FIELDS = [
  "title",
  "subtitle",
  "summary",
  "theoryText",
  "correctBehavior",
  "remember",
  "commonMistake",
  "magicTrick",
  "imageAlt"
];

function cleanLanguageCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function cleanTranslationText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export function isSupportedLessonLanguage(
  languageCode
) {
  const cleanCode =
    cleanLanguageCode(
      languageCode
    );

  return SUPPORTED_LESSON_LANGUAGES
    .some(
      (language) =>
        language.code ===
        cleanCode
    );
}

export function getPreferredLessonLanguage() {
  try {
    const savedLanguage =
      cleanLanguageCode(
        localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        )
      );

    return isSupportedLessonLanguage(
      savedLanguage
    )
      ? savedLanguage
      : DEFAULT_LESSON_LANGUAGE;
  } catch (error) {
    console.warn(
      "Preferred language unavailable:",
      error
    );

    return DEFAULT_LESSON_LANGUAGE;
  }
}

export function savePreferredLessonLanguage(
  languageCode
) {
  const cleanCode =
    cleanLanguageCode(
      languageCode
    );

  const safeLanguage =
    isSupportedLessonLanguage(
      cleanCode
    )
      ? cleanCode
      : DEFAULT_LESSON_LANGUAGE;

  try {
    localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      safeLanguage
    );
  } catch (error) {
    console.warn(
      "Preferred language could not be saved:",
      error
    );
  }

  return safeLanguage;
}

export function getLanguageInformation(
  languageCode
) {
  const cleanCode =
    cleanLanguageCode(
      languageCode
    );

  return (
    SUPPORTED_LESSON_LANGUAGES
      .find(
        (language) =>
          language.code ===
          cleanCode
      ) ||
    SUPPORTED_LESSON_LANGUAGES[0]
  );
}

export function normalizeLessonTranslations(
  translations
) {
  const source =
    translations &&
    typeof translations === "object"
      ? translations
      : {};

  const normalizedTranslations = {};

  SUPPORTED_LESSON_LANGUAGES
    .filter(
      (language) =>
        language.code !==
        DEFAULT_LESSON_LANGUAGE
    )
    .forEach((language) => {
      const languageTranslation =
        source[language.code] &&
        typeof source[
          language.code
        ] === "object"
          ? source[language.code]
          : {};

      const normalizedLanguage = {};

      TRANSLATABLE_FIELDS
        .forEach((fieldName) => {
          normalizedLanguage[fieldName] =
            cleanTranslationText(
              languageTranslation[
                fieldName
              ]
            );
        });

      normalizedTranslations[
        language.code
      ] = normalizedLanguage;
    });

  return normalizedTranslations;
}

export function getTranslatedLesson(
  lesson,
  languageCode
) {
  if (
    !lesson ||
    typeof lesson !== "object"
  ) {
    return lesson;
  }

  const cleanCode =
    isSupportedLessonLanguage(
      languageCode
    )
      ? cleanLanguageCode(
          languageCode
        )
      : DEFAULT_LESSON_LANGUAGE;

  if (
    cleanCode ===
    DEFAULT_LESSON_LANGUAGE
  ) {
    return {
      ...lesson,
      activeLanguage:
        DEFAULT_LESSON_LANGUAGE,
      translationAvailable: true
    };
  }

  const translation =
    lesson.translations?.[
      cleanCode
    ];

  if (
    !translation ||
    typeof translation !== "object"
  ) {
    return {
      ...lesson,
      activeLanguage:
        DEFAULT_LESSON_LANGUAGE,
      requestedLanguage:
        cleanCode,
      translationAvailable: false
    };
  }

  const translatedLesson = {
    ...lesson
  };

  let translatedFieldCount = 0;

  TRANSLATABLE_FIELDS
    .forEach((fieldName) => {
      const translatedValue =
        cleanTranslationText(
          translation[fieldName]
        );

      if (translatedValue) {
        translatedLesson[fieldName] =
          translatedValue;

        translatedFieldCount += 1;
      }
    });

  return {
    ...translatedLesson,

    activeLanguage:
      translatedFieldCount > 0
        ? cleanCode
        : DEFAULT_LESSON_LANGUAGE,

    requestedLanguage:
      cleanCode,

    translationAvailable:
      translatedFieldCount > 0
  };
}

export function createEmptyLessonTranslations() {
  return normalizeLessonTranslations(
    {}
  );
}