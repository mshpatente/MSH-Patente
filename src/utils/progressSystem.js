import {
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";

export const XP_PER_LEVEL = 250;

export const XP_REWARDS = Object.freeze({
  QUIZ_CORRECT_ANSWER: 5,
  QUIZ_COMPLETED: 20,
  PERFECT_QUIZ: 40,
  MINISTERIAL_EXAM_COMPLETED: 35,
  MINISTERIAL_EXAM_PASSED: 75,
  DAILY_GOAL_COMPLETED: 50,
  THEORY_LESSON_COMPLETED: 20
});

const DEFAULT_PROGRESS = Object.freeze({
  xp: 0,
  level: 1,
  currentLevelXp: 0,
  nextLevelXp: XP_PER_LEVEL,
  remainingXp: XP_PER_LEVEL,
  progressPercentage: 0
});

function toSafeNonNegativeNumber(
  value,
  fallback = 0
) {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return fallback;
  }

  return parsedValue;
}

function toSafeInteger(
  value,
  fallback = 0
) {
  return Math.floor(
    toSafeNonNegativeNumber(
      value,
      fallback
    )
  );
}

function assertValidUser(user) {
  const userId =
    String(user?.uid || "").trim();

  if (!userId) {
    throw new Error(
      "A valid authenticated user is required."
    );
  }

  return userId;
}

function createProgressFromXp(totalXp) {
  const xp =
    toSafeInteger(totalXp, 0);

  const level =
    Math.floor(
      xp / XP_PER_LEVEL
    ) + 1;

  const currentLevelXp =
    xp % XP_PER_LEVEL;

  const nextLevelXp =
    XP_PER_LEVEL;

  const remainingXp =
    currentLevelXp === 0
      ? XP_PER_LEVEL
      : XP_PER_LEVEL -
        currentLevelXp;

  const progressPercentage =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (
            currentLevelXp /
            XP_PER_LEVEL
          ) * 100
        )
      )
    );

  const currentLevelStartXp =
    (level - 1) *
    XP_PER_LEVEL;

  const nextLevelTotalXp =
    level *
    XP_PER_LEVEL;

  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp,
    remainingXp,
    progressPercentage,
    currentLevelStartXp,
    nextLevelTotalXp,
    isLevelStart:
      currentLevelXp === 0
  };
}

/**
 * Adds XP to a user profile.
 *
 * Existing callers remain compatible:
 *
 * await addExperience(user, 20);
 *
 * Returns a structured result instead of undefined.
 */
export async function addExperience(
  user,
  amount,
  metadata = {}
) {
  const userId =
    assertValidUser(user);

  const safeAmount =
    toSafeInteger(amount, 0);

  if (safeAmount <= 0) {
    return {
      success: false,
      addedXp: 0,
      reason: "invalid-amount"
    };
  }

  const reference =
    doc(
      db,
      "users",
      userId
    );

  const safeSource =
    String(
      metadata?.source || ""
    ).trim();

  const updatePayload = {
    xp: increment(safeAmount),
    updatedAt: serverTimestamp()
  };

  if (safeSource) {
    updatePayload.lastXpSource =
      safeSource;
  }

  try {
    await setDoc(
      reference,
      updatePayload,
      {
        merge: true
      }
    );

    return {
      success: true,
      addedXp: safeAmount,
      reason: null
    };
  } catch (error) {
    console.error(
      "Failed to add experience:",
      error
    );

    return {
      success: false,
      addedXp: 0,
      reason:
        "firestore-write-failed",
      error
    };
  }
}

/**
 * Loads the user's complete XP progress.
 *
 * It preserves all fields expected by the current UI:
 * xp
 * level
 * currentLevelXp
 * nextLevelXp
 * remainingXp
 * progressPercentage
 */
export async function loadProgress(
  user
) {
  let userId;

  try {
    userId =
      assertValidUser(user);
  } catch (error) {
    console.error(
      "Cannot load progress:",
      error
    );

    return {
      ...DEFAULT_PROGRESS,
      error
    };
  }

  try {
    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          userId
        )
      );

    if (!snapshot.exists()) {
      return {
        ...DEFAULT_PROGRESS,
        exists: false
      };
    }

    const data =
      snapshot.data() || {};

    return {
      ...createProgressFromXp(
        data.xp
      ),
      exists: true
    };
  } catch (error) {
    console.error(
      "Failed to load progress:",
      error
    );

    return {
      ...DEFAULT_PROGRESS,
      exists: false,
      error
    };
  }
}

/**
 * Pure level calculation.
 *
 * Can safely be used by UI code without Firestore.
 */
export function calculateLevelProgress(
  totalXp
) {
  return createProgressFromXp(
    totalXp
  );
}

/**
 * Returns the XP required to reach a target level.
 */
export function calculateXpForLevel(
  targetLevel
) {
  const level =
    Math.max(
      1,
      toSafeInteger(
        targetLevel,
        1
      )
    );

  return (
    level - 1
  ) * XP_PER_LEVEL;
}

/**
 * Calculates the result of adding XP without writing
 * anything to Firestore.
 */
export function previewExperienceGain(
  currentXp,
  gainedXp
) {
  const safeCurrentXp =
    toSafeInteger(
      currentXp,
      0
    );

  const safeGainedXp =
    toSafeInteger(
      gainedXp,
      0
    );

  const before =
    createProgressFromXp(
      safeCurrentXp
    );

  const after =
    createProgressFromXp(
      safeCurrentXp +
        safeGainedXp
    );

  return {
    gainedXp:
      safeGainedXp,

    previousXp:
      before.xp,

    newXp:
      after.xp,

    previousLevel:
      before.level,

    newLevel:
      after.level,

    levelsGained:
      Math.max(
        0,
        after.level -
          before.level
      ),

    leveledUp:
      after.level >
      before.level,

    progress:
      after
  };
}

/**
 * Produces a user-friendly progress label.
 */
export function formatLevelProgress(
  progress
) {
  const calculatedProgress =
    createProgressFromXp(
      progress?.xp
    );

  return [
    `Livello ${calculatedProgress.level}`,
    `${calculatedProgress.currentLevelXp}/${XP_PER_LEVEL} XP`
  ].join(" · ");
}