// backend/utils/streakUtils.js
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getSingaporeTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" }));
}

function getMidnightSGT(date = new Date()) {
  const sgtDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Singapore" }));
  sgtDate.setHours(0, 0, 0, 0);
  return sgtDate;
}

function getSgtMidnightTime(date) {
  return getMidnightSGT(date).getTime();
}

/**
 * Updates streak when a quiz is completed
 * @param {Object} mathProfile - The student's math profile
 * @returns {Number} - The updated streak value
 */
function updateStreakOnCompletion(mathProfile) {
  const nowSgt = getSingaporeTime();
  const todayMid = getSgtMidnightTime(nowSgt);
  const storedStreak = Number.isFinite(mathProfile.streak) ? mathProfile.streak : 0;
  const lastMid = mathProfile.last_quiz_date ? getSgtMidnightTime(mathProfile.last_quiz_date) : null;

  let nextStreak = storedStreak;

  if (!lastMid) {
    // ✅ FIX: First quiz ever should set streak to 1
    nextStreak = 1;
  } else if (todayMid === lastMid) {
    // Same day - no change to streak
    nextStreak = storedStreak;
  } else {
    const diffDays = Math.round((todayMid - lastMid) / MS_PER_DAY);
    if (diffDays === 1) {
      // ✅ Consecutive day - increment streak
      nextStreak = storedStreak + 1;
    } else {
      // ✅ FIX: Skipped days - reset to 1 (not 0) because they just completed a quiz
      nextStreak = 1;
    }
  }

  mathProfile.streak = nextStreak;
  mathProfile.last_quiz_date = nowSgt;
  return nextStreak;
}

/**
 * Computes effective streak (for display without saving)
 */
function computeEffectiveStreak(mathProfile) {
  if (!mathProfile) return { effective: 0, shouldPersistReset: false };

  const nowSgt = getSingaporeTime();
  const todayMid = getSgtMidnightTime(nowSgt);
  const storedStreak = Number.isFinite(mathProfile.streak) ? mathProfile.streak : 0;
  const lastMid = mathProfile.last_quiz_date ? getSgtMidnightTime(mathProfile.last_quiz_date) : null;

  if (!lastMid) return { effective: 0, shouldPersistReset: storedStreak !== 0 };

  const diffDays = Math.round((todayMid - lastMid) / MS_PER_DAY);
  if (diffDays <= 1) return { effective: storedStreak, shouldPersistReset: false };

  return { effective: 0, shouldPersistReset: storedStreak !== 0 };
}

module.exports = {
  getSingaporeTime,
  getMidnightSGT,
  getSgtMidnightTime,
  updateStreakOnCompletion,
  computeEffectiveStreak,
  MS_PER_DAY
};