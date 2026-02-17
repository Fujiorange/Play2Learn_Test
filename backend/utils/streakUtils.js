// backend/utils/streakUtils.js - SIMPLIFIED MIDNIGHT RESET VERSION
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
 * SIMPLIFIED: Updates streak when a quiz is completed
 * Logic:
 * - If no quiz yesterday: streak = 1 (start fresh)
 * - If quiz was yesterday: streak = previous + 1 (continue streak)
 * - If quiz was today already: no change (only 1 quiz per day counts)
 * 
 * @param {Object} mathProfile - The student's math profile
 * @returns {Number} - The updated streak value
 */
function updateStreakOnCompletion(mathProfile) {
  const nowSgt = getSingaporeTime();
  const todayMid = getSgtMidnightTime(nowSgt);
  const storedStreak = Number.isFinite(mathProfile.streak) ? mathProfile.streak : 0;
  const lastMid = mathProfile.last_quiz_date ? getSgtMidnightTime(mathProfile.last_quiz_date) : null;

  let nextStreak;

  if (!lastMid) {
    // First quiz ever
    nextStreak = 1;
  } else {
    const diffDays = Math.round((todayMid - lastMid) / MS_PER_DAY);
    
    if (diffDays === 0) {
      // Same day - no change (already completed quiz today)
      nextStreak = storedStreak;
    } else if (diffDays === 1) {
      // Consecutive day - increment streak
      nextStreak = storedStreak + 1;
    } else {
      // Missed 1+ days - reset to 1 (because they just completed a quiz)
      nextStreak = 1;
    }
  }

  mathProfile.streak = nextStreak;
  mathProfile.last_quiz_date = nowSgt;
  return nextStreak;
}

/**
 * SIMPLIFIED: Computes effective streak for display
 * Logic:
 * - If last quiz was today or yesterday: show stored streak
 * - If last quiz was 2+ days ago: show 0 AND mark for reset
 * 
 * This checks if the streak should be 0 due to missing days, without
 * requiring a quiz completion to trigger the check.
 * 
 * @param {Object} mathProfile - The student's math profile
 * @returns {Object} - { effective: number, shouldPersistReset: boolean }
 */
function computeEffectiveStreak(mathProfile) {
  if (!mathProfile) return { effective: 0, shouldPersistReset: false };

  const nowSgt = getSingaporeTime();
  const todayMid = getSgtMidnightTime(nowSgt);
  const storedStreak = Number.isFinite(mathProfile.streak) ? mathProfile.streak : 0;
  const lastMid = mathProfile.last_quiz_date ? getSgtMidnightTime(mathProfile.last_quiz_date) : null;

  // No quiz ever completed
  if (!lastMid) {
    return { effective: 0, shouldPersistReset: storedStreak !== 0 };
  }

  const diffDays = Math.round((todayMid - lastMid) / MS_PER_DAY);
  
  // Last quiz was today or yesterday - streak is active
  if (diffDays <= 1) {
    return { effective: storedStreak, shouldPersistReset: false };
  }

  // Last quiz was 2+ days ago - streak is broken (reset at midnight)
  return { effective: 0, shouldPersistReset: storedStreak !== 0 };
}

/**
 * HELPER: Persists the streak reset to the database
 * Call this after computeEffectiveStreak indicates shouldPersistReset = true
 * 
 * @param {Object} mathProfile - The student's math profile
 */
async function persistStreakReset(mathProfile) {
  if (mathProfile.streak !== 0) {
    mathProfile.streak = 0;
    await mathProfile.save();
    console.log(`🔄 Streak reset to 0 for student ${mathProfile.student_id} (missed days)`);
  }
}

module.exports = {
  getSingaporeTime,
  getMidnightSGT,
  getSgtMidnightTime,
  updateStreakOnCompletion,
  computeEffectiveStreak,
  persistStreakReset,
  MS_PER_DAY
};