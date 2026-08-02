import {
  officialArgomenti as argomenti
} from "../data/officialArgomenti.js";

import {
  officialTopics as topics
} from "../data/officialTopics.js";

export function calculateTheorySummary(
  lessonList = [],
  completedLessonIds = [],
  stats = {}
) {
  const completedSet =
    new Set(
      completedLessonIds
    );

  const publishedLessons =
    lessonList.filter(
      (lesson) =>
        lesson.published === true
    );

  const completedLessons =
    publishedLessons.filter(
      (lesson) =>
        completedSet.has(
          lesson.id
        )
    );

  const percentage =
    publishedLessons.length > 0
      ? Math.round(
          (
            completedLessons.length /
            publishedLessons.length
          ) * 100
        )
      : 0;

  let lastLesson = null;

  if (stats.lastTheoryLessonId) {
    const lesson =
      publishedLessons.find(
        (item) =>
          item.id ===
          stats.lastTheoryLessonId
      );

    if (lesson) {
      const topic =
        topics.find(
          (item) =>
            item.id ===
            lesson.topicId
        );

      const argomento =
        argomenti.find(
          (item) =>
            item.id ===
            lesson.argomentoId
        );

      if (
        topic &&
        argomento
      ) {
        lastLesson = {
          ...lesson,
          topic,
          argomento,

          topicTitle:
            topic.title,

          argomentoTitle:
            argomento.title
        };
      }
    }
  }

  return {
    totalLessons:
      publishedLessons.length,

    completedLessons:
      completedLessons.length,

    percentage,
    lastLesson
  };
}

export function buildErrorStatistics(
  records = []
) {
  return {
    activeCount:
      records.filter(
        (item) =>
          item.active === true
      ).length,

    masteredCount:
      records.filter(
        (item) =>
          item.mastered === true
      ).length
  };
}

export function hydrateWrongAnswers(
  records = [],
  availableQuestions = []
) {
  return records
    .filter(
      (record) =>
        record.active === true
    )
    .map((record) => {
      const question =
        availableQuestions.find(
          (item) =>
            item.id ===
            record.questionId
        );

      const topic =
        topics.find(
          (item) =>
            item.id ===
            record.topicId
        );

      const argomento =
        argomenti.find(
          (item) =>
            item.id ===
            record.argomentoId
        );

      if (!question) {
        return null;
      }

      return {
        ...record,
        ...question,

        topicTitle:
          topic?.title ||
          record.topicTitle ||
          "Topic",

        argomentoTitle:
          argomento?.title ||
          record.argomentoTitle ||
          "Argomento"
      };
    })
    .filter(Boolean)
    .sort(
      (first, second) =>
        Number(
          second.wrongCount || 0
        ) -
        Number(
          first.wrongCount || 0
        )
    );
}

export function buildCourseProgress(
  progress = {},
  stats = {}
) {
  const completedTopics =
    topics.filter(
      (topic) =>
        progress[
          topic.id
        ]?.completed === true
    ).length;

  const totalTopics =
    topics.length;

  const coursePercentage =
    totalTopics > 0
      ? Math.round(
          (
            completedTopics /
            totalTopics
          ) * 100
        )
      : 0;

  let lastTopic = null;

  if (stats.lastTopicId) {
    const topic =
      topics.find(
        (item) =>
          item.id ===
          stats.lastTopicId
      );

    const argomento =
      argomenti.find(
        (item) =>
          item.id ===
          stats.lastArgomentoId
      );

    if (
      topic &&
      argomento
    ) {
      lastTopic = {
        ...topic,
        argomento,

        argomentoTitle:
          argomento.title,

        bestScore:
          Number(
            progress[
              topic.id
            ]?.bestScore
          ) || 0
      };
    }
  }

  return {
    completedTopics,
    totalTopics,
    coursePercentage,
    lastTopic
  };
}