const RECENT_MINISTERIAL_QUESTIONS_KEY =
  "mshPatenteRecentMinisterialQuestions";

function getRecentMinisterialQuestionIds() {
  try {
    const savedValue =
      localStorage.getItem(
        RECENT_MINISTERIAL_QUESTIONS_KEY
      );

    if (!savedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(savedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (questionId) =>
        typeof questionId === "string" &&
        questionId.trim() !== ""
    );
  } catch (error) {
    console.error(
      "Impossibile leggere le domande recenti:",
      error
    );

    return [];
  }
}

export function selectBalancedMinisterialQuestions(
  questions,
  questionCount
) {
  if (
    !Array.isArray(questions) ||
    questions.length === 0
  ) {
    return [];
  }

  const safeQuestionCount =
    Math.max(
      0,
      Math.min(
        Number(questionCount) || 0,
        questions.length
      )
    );

  if (safeQuestionCount === 0) {
    return [];
  }

  const recentQuestionIds =
    new Set(
      getRecentMinisterialQuestionIds()
    );

  const freshQuestions =
    questions.filter(
      (question) =>
        !recentQuestionIds.has(question.id)
    );

  const recentQuestions =
    questions.filter(
      (question) =>
        recentQuestionIds.has(question.id)
    );

  const selectedFresh =
    selectBalancedQuestions(
      freshQuestions,
      safeQuestionCount
    );

  const remainingCount =
    safeQuestionCount -
    selectedFresh.length;

  if (remainingCount <= 0) {
    shuffle(selectedFresh);

    return selectedFresh;
  }

  const alreadySelectedIds =
    new Set(
      selectedFresh.map(
        (question) => question.id
      )
    );

  const fallbackQuestions =
    recentQuestions.filter(
      (question) =>
        !alreadySelectedIds.has(question.id)
    );

  const selectedFallback =
    selectBalancedQuestions(
      fallbackQuestions,
      remainingCount
    );

  const selectedQuestions = [
    ...selectedFresh,
    ...selectedFallback
  ];

  shuffle(selectedQuestions);

  return selectedQuestions.slice(
    0,
    safeQuestionCount
  );
}

function selectBalancedQuestions(
  questions,
  questionCount
) {
  if (
    !Array.isArray(questions) ||
    questions.length === 0 ||
    questionCount <= 0
  ) {
    return [];
  }

  const groups = new Map();

  for (const question of questions) {
    const topic =
      question.topicId ??
      question.argomentoId ??
      question.category ??
      "general";

    if (!groups.has(topic)) {
      groups.set(topic, []);
    }

    groups.get(topic).push(question);
  }

  for (const group of groups.values()) {
    shuffle(group);
  }

  const selected = [];

  while (
    selected.length < questionCount &&
    [...groups.values()].some(
      (group) => group.length > 0
    )
  ) {
    for (const group of groups.values()) {
      if (
        selected.length >= questionCount
      ) {
        break;
      }

      if (group.length > 0) {
        selected.push(group.pop());
      }
    }
  }

  return selected;
}

function shuffle(array) {
  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];
  }

  return array;
}