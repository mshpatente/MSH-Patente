function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNumber(
  value,
  fallback = 0
) {
  const parsedValue =
    Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

export function createLessonSectionId() {
  const randomPart =
    globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `section-${randomPart}`;
}

export function createEmptyLessonSection(
  order = 1
) {
  return {
    id:
      createLessonSectionId(),

    order:
      Math.max(
        1,
        cleanNumber(order, 1)
      ),

    title: "",

    imageUrl: "",

    imageAlt: "",

    imageCaption: "",

    description: "",

    audioText: "",

    audioUrl: "",

    youtubeUrl: ""
  };
}

export function normalizeLessonSection(
  sectionData = {},
  fallbackOrder = 1
) {
  return {
    id:
      cleanText(sectionData.id) ||
      createLessonSectionId(),

    order:
      Math.max(
        1,
        cleanNumber(
          sectionData.order,
          fallbackOrder
        )
      ),

    title:
      cleanText(
        sectionData.title
      ),

    imageUrl:
      cleanText(
        sectionData.imageUrl ||
        sectionData.image
      ),

    imageAlt:
      cleanText(
        sectionData.imageAlt
      ),

    imageCaption:
      cleanText(
        sectionData.imageCaption ||
        sectionData.caption
      ),

    description:
      cleanText(
        sectionData.description ||
        sectionData.text
      ),

    audioText:
      cleanText(
        sectionData.audioText ||
        sectionData.description ||
        sectionData.text
      ),

    audioUrl:
      cleanText(
        sectionData.audioUrl
      ),

    youtubeUrl:
      cleanText(
        sectionData.youtubeUrl ||
        sectionData.videoUrl
      )
  };
}

export function isLessonSectionEmpty(
  sectionData = {}
) {
  const section =
    normalizeLessonSection(
      sectionData
    );

  return !(
    section.title ||
    section.imageUrl ||
    section.imageCaption ||
    section.description ||
    section.audioText ||
    section.audioUrl ||
    section.youtubeUrl
  );
}

export function normalizeLessonSections(
  sections = []
) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .map(
      (section, index) =>
        normalizeLessonSection(
          section,
          index + 1
        )
    )
    .filter(
      (section) =>
        !isLessonSectionEmpty(
          section
        )
    )
    .sort(
      (first, second) =>
        Number(first.order || 0) -
        Number(second.order || 0)
    )
    .map(
      (section, index) => ({
        ...section,
        order: index + 1
      })
    );
}

export function buildLegacyLessonSection(
  lessonData = {}
) {
  const imageUrl =
    cleanText(
      lessonData.imageUrl
    );

  const imageAlt =
    cleanText(
      lessonData.imageAlt
    );

  const imageCaption =
    cleanText(
      lessonData.imageCaption
    );

  const description =
    cleanText(
      lessonData.theoryText ||
      lessonData.summary ||
      lessonData.subtitle
    );

  const audioText =
    cleanText(
      lessonData.audioText ||
      lessonData.theoryText ||
      lessonData.summary
    );

  const youtubeUrl =
    cleanText(
      lessonData.youtubeUrl ||
      lessonData.videoUrl
    );

  if (
    !imageUrl &&
    !imageCaption &&
    !description &&
    !audioText &&
    !youtubeUrl
  ) {
    return null;
  }

  return normalizeLessonSection(
    {
      id: "legacy-section-1",
      order: 1,

      title:
        cleanText(
          lessonData.sectionTitle
        ) ||
        cleanText(
          lessonData.title
        ),

      imageUrl,
      imageAlt,
      imageCaption,
      description,
      audioText,
      audioUrl:
        cleanText(
          lessonData.audioUrl
        ),
      youtubeUrl
    },
    1
  );
}

export function getLessonSections(
  lessonData = {}
) {
  const storedSections =
    normalizeLessonSections(
      lessonData.sections
    );

  if (storedSections.length > 0) {
    return storedSections;
  }

  const legacySection =
    buildLegacyLessonSection(
      lessonData
    );

  return legacySection
    ? [legacySection]
    : [];
}

export function moveLessonSection(
  sections,
  sectionId,
  direction
) {
  const normalizedSections =
    normalizeLessonSections(
      sections
    );

  const currentIndex =
    normalizedSections.findIndex(
      (section) =>
        String(section.id) ===
        String(sectionId)
    );

  if (currentIndex < 0) {
    return normalizedSections;
  }

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >=
      normalizedSections.length
  ) {
    return normalizedSections;
  }

  const reorderedSections =
    [...normalizedSections];

  const temporarySection =
    reorderedSections[currentIndex];

  reorderedSections[currentIndex] =
    reorderedSections[targetIndex];

  reorderedSections[targetIndex] =
    temporarySection;

  return reorderedSections.map(
    (section, index) => ({
      ...section,
      order: index + 1
    })
  );
}

export function removeLessonSection(
  sections,
  sectionId
) {
  return normalizeLessonSections(
    sections
  )
    .filter(
      (section) =>
        String(section.id) !==
        String(sectionId)
    )
    .map(
      (section, index) => ({
        ...section,
        order: index + 1
      })
    );
}