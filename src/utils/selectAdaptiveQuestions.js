/**
 * Fisher-Yates shuffle.
 *
 * মূল array পরিবর্তন না করে নতুন shuffled array ফেরত দেয়।
 */
function shuffleItems(items) {
  const shuffled = [...items];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() * (index + 1)
      );

    [
      shuffled[index],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
}


/**
 * একটি নিরাপদ positive number তৈরি করে।
 */
function toSafeNumber(
  value,
  fallback = 0
) {
  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(parsedValue)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    parsedValue
  );
}


/**
 * Question ID বের করে।
 *
 * Firestore document ID সাধারণত `id` field-এ থাকে।
 */
function getQuestionId(question) {
  return String(
    question?.id ||
    question?.questionId ||
    ""
  ).trim();
}


/**
 * একই ID-এর duplicate question সরিয়ে দেয়।
 */
function removeDuplicateQuestions(
  questions
) {
  const uniqueQuestions = [];
  const usedQuestionIds =
    new Set();

  for (const question of questions) {
    const questionId =
      getQuestionId(question);

    if (
      !questionId ||
      usedQuestionIds.has(
        questionId
      )
    ) {
      continue;
    }

    usedQuestionIds.add(
      questionId
    );

    uniqueQuestions.push(
      question
    );
  }

  return uniqueQuestions;
}


/**
 * শুধুমাত্র বর্তমানে active থাকা ভুলগুলো নেয়।
 *
 * mastered question Adaptive Quiz-এ দুর্বলতা হিসেবে
 * গণনা করা হবে না।
 */
function getActiveErrorRecords(
  errorRecords
) {
  if (
    !Array.isArray(errorRecords)
  ) {
    return [];
  }

  return errorRecords.filter(
    (record) =>
      record &&
      typeof record === "object" &&
      record.active === true &&
      record.mastered !== true
  );
}


/**
 * প্রতিটি topic-এর মোট error score তৈরি করে।
 *
 * বেশি wrongCount থাকা topic বেশি priority পাবে।
 */
function buildTopicErrorScores(
  activeErrorRecords
) {
  const topicErrorScores =
    new Map();

  for (
    const record of
    activeErrorRecords
  ) {
    const topicId =
      String(
        record.topicId || ""
      ).trim();

    if (!topicId) {
      continue;
    }

    const wrongCount =
      Math.max(
        1,
        toSafeNumber(
          record.wrongCount,
          1
        )
      );

    const currentScore =
      topicErrorScores.get(
        topicId
      ) || 0;

    topicErrorScores.set(
      topicId,
      currentScore + wrongCount
    );
  }

  return topicErrorScores;
}


/**
 * প্রতিটি নির্দিষ্ট question-এর error score তৈরি করে।
 *
 * একই question বারবার ভুল হলে এটি অতিরিক্ত priority পাবে।
 */
function buildQuestionErrorScores(
  activeErrorRecords
) {
  const questionErrorScores =
    new Map();

  for (
    const record of
    activeErrorRecords
  ) {
    const questionId =
      String(
        record.questionId ||
        record.id ||
        ""
      ).trim();

    if (!questionId) {
      continue;
    }

    const wrongCount =
      Math.max(
        1,
        toSafeNumber(
          record.wrongCount,
          1
        )
      );

    questionErrorScores.set(
      questionId,
      wrongCount
    );
  }

  return questionErrorScores;
}


/**
 * একটি question-এর adaptive weight নির্ধারণ করে।
 *
 * Weight structure:
 *
 * 1      = সব question-এর base chance
 * topic  = দুর্বল topic-এর bonus
 * own    = question নিজে আগে ভুল হওয়ার bonus
 */
function calculateQuestionWeight(
  question,
  topicErrorScores,
  questionErrorScores
) {
  const questionId =
    getQuestionId(question);

  const topicId =
    String(
      question?.topicId || ""
    ).trim();

  const topicErrorScore =
    topicErrorScores.get(
      topicId
    ) || 0;

  const questionErrorScore =
    questionErrorScores.get(
      questionId
    ) || 0;

  const topicBonus =
    Math.min(
      topicErrorScore * 1.5,
      18
    );

  const questionBonus =
    Math.min(
      questionErrorScore * 3,
      15
    );

  return Math.max(
    1,
    1 +
      topicBonus +
      questionBonus
  );
}


/**
 * Weighted random selection।
 *
 * একই question একবারের বেশি select হয় না।
 */
function weightedSelectWithoutReplacement(
  questions,
  amount,
  topicErrorScores,
  questionErrorScores
) {
  const available =
    [...questions];

  const selected = [];

  while (
    available.length > 0 &&
    selected.length < amount
  ) {
    const weightedQuestions =
      available.map(
        (question) => ({
          question,

          weight:
            calculateQuestionWeight(
              question,
              topicErrorScores,
              questionErrorScores
            )
        })
      );

    const totalWeight =
      weightedQuestions.reduce(
        (
          total,
          weightedQuestion
        ) =>
          total +
          weightedQuestion.weight,
        0
      );

    if (totalWeight <= 0) {
      break;
    }

    let randomWeight =
      Math.random() *
      totalWeight;

    let selectedIndex = 0;

    for (
      let index = 0;
      index <
      weightedQuestions.length;
      index += 1
    ) {
      randomWeight -=
        weightedQuestions[
          index
        ].weight;

      if (randomWeight <= 0) {
        selectedIndex =
          index;

        break;
      }
    }

    const [
      selectedQuestion
    ] = available.splice(
      selectedIndex,
      1
    );

    selected.push(
      selectedQuestion
    );
  }

  return selected;
}


/**
 * বিভিন্ন topic থেকে অন্তত একটি করে question নেওয়ার চেষ্টা করে।
 *
 * এর ফলে Adaptive Quiz শুধুমাত্র একটি দুর্বল topic-এ
 * আটকে থাকবে না।
 */
function selectDiversityQuestions(
  questions,
  amount
) {
  if (amount <= 0) {
    return [];
  }

  const questionsByTopic =
    new Map();

  for (const question of questions) {
    const topicId =
      String(
        question?.topicId ||
        "unknown-topic"
      ).trim();

    if (
      !questionsByTopic.has(
        topicId
      )
    ) {
      questionsByTopic.set(
        topicId,
        []
      );
    }

    questionsByTopic
      .get(topicId)
      .push(question);
  }

  const shuffledTopicGroups =
    shuffleItems(
      [...questionsByTopic.values()]
    ).map(
      (topicQuestions) =>
        shuffleItems(
          topicQuestions
        )
    );

  const selected = [];

  let groupIndex = 0;

  while (
    selected.length < amount &&
    shuffledTopicGroups.length > 0
  ) {
    const currentGroup =
      shuffledTopicGroups[
        groupIndex
      ];

    if (
      currentGroup &&
      currentGroup.length > 0
    ) {
      selected.push(
        currentGroup.shift()
      );
    }

    if (
      !currentGroup ||
      currentGroup.length === 0
    ) {
      shuffledTopicGroups.splice(
        groupIndex,
        1
      );

      if (
        shuffledTopicGroups.length === 0
      ) {
        break;
      }

      groupIndex =
        groupIndex %
        shuffledTopicGroups.length;

      continue;
    }

    groupIndex =
      (
        groupIndex + 1
      ) %
      shuffledTopicGroups.length;
  }

  return selected;
}


/**
 * Adaptive Quiz-এর জন্য question নির্বাচন করে।
 *
 * Selection strategy:
 *
 * 70%:
 * দুর্বল topic এবং আগে ভুল হওয়া question-কে priority
 *
 * 30%:
 * অন্য topic থেকে diversity
 *
 * Error history না থাকলে:
 * সাধারণ shuffled selection
 */
export function selectAdaptiveQuestions(
  allQuestions,
  errorRecords,
  requestedCount = 20
) {
  if (
    !Array.isArray(allQuestions) ||
    allQuestions.length === 0
  ) {
    return [];
  }

  const uniqueQuestions =
    removeDuplicateQuestions(
      allQuestions
    );

  if (
    uniqueQuestions.length === 0
  ) {
    return [];
  }

  const safeRequestedCount =
    Math.max(
      1,
      Math.floor(
        toSafeNumber(
          requestedCount,
          20
        )
      )
    );

  const finalQuestionCount =
    Math.min(
      safeRequestedCount,
      uniqueQuestions.length
    );

  const activeErrorRecords =
    getActiveErrorRecords(
      errorRecords
    );

  /*
   * User-এর active error history না থাকলে
   * সাধারণ balanced random quiz দেওয়া হবে।
   */
  if (
    activeErrorRecords.length === 0
  ) {
    return shuffleItems(
      uniqueQuestions
    ).slice(
      0,
      finalQuestionCount
    );
  }

  const topicErrorScores =
    buildTopicErrorScores(
      activeErrorRecords
    );

  const questionErrorScores =
    buildQuestionErrorScores(
      activeErrorRecords
    );

  /*
   * 70% adaptive priority।
   */
  const adaptiveCount =
    Math.min(
      finalQuestionCount,
      Math.max(
        1,
        Math.round(
          finalQuestionCount * 0.7
        )
      )
    );

  const adaptiveQuestions =
    weightedSelectWithoutReplacement(
      uniqueQuestions,
      adaptiveCount,
      topicErrorScores,
      questionErrorScores
    );

  const adaptiveQuestionIds =
    new Set(
      adaptiveQuestions.map(
        (question) =>
          getQuestionId(question)
      )
    );

  const remainingQuestions =
    uniqueQuestions.filter(
      (question) =>
        !adaptiveQuestionIds.has(
          getQuestionId(question)
        )
    );

  /*
   * অবশিষ্ট 30% বিভিন্ন topic থেকে নেওয়া হয়।
   */
  const diversityCount =
    finalQuestionCount -
    adaptiveQuestions.length;

  const diversityQuestions =
    selectDiversityQuestions(
      remainingQuestions,
      diversityCount
    );

  const combinedQuestions = [
    ...adaptiveQuestions,
    ...diversityQuestions
  ];

  /*
   * কোনো অস্বাভাবিক অবস্থায় প্রয়োজনীয় question পূরণ না হলে
   * remaining pool থেকে fallback question যোগ করা হবে।
   */
  if (
    combinedQuestions.length <
    finalQuestionCount
  ) {
    const selectedIds =
      new Set(
        combinedQuestions.map(
          (question) =>
            getQuestionId(question)
        )
      );

    const fallbackQuestions =
      shuffleItems(
        uniqueQuestions.filter(
          (question) =>
            !selectedIds.has(
              getQuestionId(
                question
              )
            )
        )
      );

    const missingCount =
      finalQuestionCount -
      combinedQuestions.length;

    combinedQuestions.push(
      ...fallbackQuestions.slice(
        0,
        missingCount
      )
    );
  }

  /*
   * শেষবার shuffle করা হয়, যাতে দুর্বল topic-এর প্রশ্নগুলো
   * quiz-এর শুরুতে একসাথে না আসে।
   */
  return shuffleItems(
    combinedQuestions
  ).slice(
    0,
    finalQuestionCount
  );
}