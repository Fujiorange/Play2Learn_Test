// backend/routes/mongoStudentRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ==================== AUTH ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid token" });
  }
}

router.use(authenticateToken);

// ==================== MODELS ====================
const User = mongoose.model("User");

if (!mongoose.models.MathProfile) {
  const mathProfileSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    current_profile: { type: Number, default: 1, min: 1, max: 10 },
    placement_completed: { type: Boolean, default: false },

    total_points: { type: Number, default: 0 },

    // promotion/demotion tracking
    consecutive_fails: { type: Number, default: 0 },

    // daily attempts
    quizzes_today: { type: Number, default: 0 },
    last_reset_date: { type: Date, default: Date.now },

    // streak (your rule)
    streak: { type: Number, default: 0 },
    last_quiz_date: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  mongoose.model("MathProfile", mathProfileSchema);
}

if (!mongoose.models.Quiz) {
  const quizSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz_type: { type: String, enum: ["placement", "regular"], required: true },
    profile_level: { type: Number, required: true },

    questions: [
      {
        question_text: String,
        operation: String, // addition/subtraction/multiplication/division
        correct_answer: Number,
        student_answer: Number,
        is_correct: Boolean,
      },
    ],

    score: { type: Number, default: 0 },
    total_questions: { type: Number, default: 15 },
    percentage: { type: Number, default: 0 },
    points_earned: { type: Number, default: 0 },
    completed_at: { type: Date, default: Date.now },
  });

  mongoose.model("Quiz", quizSchema);
}

if (!mongoose.models.MathSkill) {
  const mathSkillSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill_name: { type: String, required: true }, // Addition/Subtraction/Multiplication/Division
    current_level: { type: Number, default: 0, min: 0, max: 5 },
    xp: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  });

  mathSkillSchema.index({ student_id: 1, skill_name: 1 }, { unique: true });
  mongoose.model("MathSkill", mathSkillSchema);
}

const MathProfile = mongoose.model("MathProfile");
const Quiz = mongoose.model("Quiz");
const MathSkill = mongoose.model("MathSkill");

// ==================== TIME HELPERS ====================
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
 * Your streak rule:
 * - First day you do a quiz => streak stays 0
 * - Next consecutive day => streak becomes 1, then 2, ...
 * - Miss a full day => reset to 0
 */
function updateStreakOnCompletion(mathProfile) {
  const nowSgt = getSingaporeTime();
  const todayMid = getSgtMidnightTime(nowSgt);

  const storedStreak = Number.isFinite(mathProfile.streak) ? mathProfile.streak : 0;
  const lastMid = mathProfile.last_quiz_date ? getSgtMidnightTime(mathProfile.last_quiz_date) : null;

  let nextStreak = storedStreak;

  if (!lastMid) {
    nextStreak = 0;
  } else if (todayMid === lastMid) {
    nextStreak = storedStreak;
  } else {
    const diffDays = Math.round((todayMid - lastMid) / MS_PER_DAY);
    nextStreak = diffDays === 1 ? storedStreak + 1 : 0;
  }

  mathProfile.streak = nextStreak;
  mathProfile.last_quiz_date = nowSgt;
  return nextStreak;
}

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

// ==================== PROFILE CONFIG ====================
function getProfileConfig(profile) {
  const configs = {
    1: { range: [1, 10] },
    2: { range: [1, 20] },
    3: { range: [1, 30] },
    4: { range: [1, 40] },
    5: { range: [1, 50] },
    6: { range: [1, 60] },
    7: { range: [1, 70] },
    8: { range: [1, 80] },
    9: { range: [1, 90] },
    10: { range: [1, 100] },
  };

  return configs[profile] || configs[1];
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deterministic operation counts:
 * - Profile 1-5: 15Q => 7/8 add, 8/7 sub (randomly pick which gets 8)
 * - Profile 6-10: 15Q => base 3 each (12), distribute remaining 3 as +1 to 3 random ops => 3-4 each
 */
function buildOperationSequence(profile) {
  if (profile <= 5) {
    const addCount = Math.random() < 0.5 ? 7 : 8;
    const subCount = 15 - addCount;
    const ops = [
      ...Array(addCount).fill("addition"),
      ...Array(subCount).fill("subtraction"),
    ];
    return shuffleInPlace(ops);
  }

  const ops = ["addition", "subtraction", "multiplication", "division"];
  const counts = { addition: 3, subtraction: 3, multiplication: 3, division: 3 };

  // distribute remaining 3 to 3 ops => those become 4
  const pick = shuffleInPlace([...ops]).slice(0, 3);
  pick.forEach((k) => (counts[k] += 1));

  const seq = [];
  ops.forEach((k) => {
    for (let i = 0; i < counts[k]; i++) seq.push(k);
  });

  return shuffleInPlace(seq); // length 15
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(range, operation) {
  const [min, max] = range;

  let num1, num2, answer, questionText;

  switch (operation) {
    case "addition":
      num1 = randInt(min, max);
      num2 = randInt(min, max);
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
      break;

    case "subtraction":
      num1 = randInt(min, max);
      num2 = randInt(min, num1);
      answer = num1 - num2;
      questionText = `${num1} - ${num2} = ?`;
      break;

    case "multiplication":
      // still "within range" (1..12 is within profile 6+ ranges)
      num1 = randInt(1, 12);
      num2 = randInt(1, 12);
      answer = num1 * num2;
      questionText = `${num1} × ${num2} = ?`;
      break;

    case "division":
      num2 = randInt(1, 12);
      answer = randInt(1, 12);
      num1 = num2 * answer;
      questionText = `${num1} ÷ ${num2} = ?`;
      break;

    default:
      num1 = randInt(min, max);
      num2 = randInt(min, max);
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
  }

  return {
    question_text: questionText,
    operation,
    correct_answer: answer,
    student_answer: null,
    is_correct: false,
  };
}

// ==================== SKILLS ====================
async function ensureSkillsExist(studentId, currentProfile = 1) {
  const existing = await MathSkill.find({ student_id: studentId });

  if (existing.length === 0) {
    await MathSkill.insertMany([
      { student_id: studentId, skill_name: "Addition", current_level: 0, xp: 0, unlocked: true },
      { student_id: studentId, skill_name: "Subtraction", current_level: 0, xp: 0, unlocked: true },
      { student_id: studentId, skill_name: "Multiplication", current_level: 0, xp: 0, unlocked: currentProfile >= 6 },
      { student_id: studentId, skill_name: "Division", current_level: 0, xp: 0, unlocked: currentProfile >= 6 },
    ]);
    return;
  }

  // enforce unlock status dynamically
  const shouldUnlockAdvanced = currentProfile >= 6;
  for (const skill of existing) {
    if (skill.skill_name === "Addition" || skill.skill_name === "Subtraction") {
      if (skill.unlocked !== true) {
        skill.unlocked = true;
        await skill.save();
      }
      continue;
    }

    if (skill.skill_name === "Multiplication" || skill.skill_name === "Division") {
      if (skill.unlocked !== shouldUnlockAdvanced) {
        skill.unlocked = shouldUnlockAdvanced;
        await skill.save();
      }
    }
  }
}

function calculateSkillPercentage(level, xp) {
  const levelThresholds = [0, 50, 100, 150, 200, 250];
  if (level >= 5) return 100;

  const currentThreshold = levelThresholds[level];
  const nextThreshold = levelThresholds[level + 1];
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return Math.max(0, Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)));
}

// Minimal XP update (keeps your system dynamic)
async function updateSkillsFromQuiz(studentId, questions, percentage, currentProfile) {
  await ensureSkillsExist(studentId, currentProfile);

  let xpGain = 0;
  if (percentage >= 90) xpGain = 20;
  else if (percentage >= 70) xpGain = 15;
  else if (percentage >= 50) xpGain = 10;
  else xpGain = 5;

  const opToSkill = {
    addition: "Addition",
    subtraction: "Subtraction",
    multiplication: "Multiplication",
    division: "Division",
  };

  const stats = {};
  for (const q of questions) {
    const op = q.operation;
    if (!stats[op]) stats[op] = { correct: 0 };
    if (q.is_correct) stats[op].correct += 1;
  }

  for (const [op, s] of Object.entries(stats)) {
    const skillName = opToSkill[op];
    if (!skillName) continue;

    const skill = await MathSkill.findOne({ student_id: studentId, skill_name: skillName });
    if (!skill) continue;

    const xpToAdd = s.correct * xpGain;
    skill.xp = (Number.isFinite(skill.xp) ? skill.xp : 0) + xpToAdd;

    // level-up thresholds: 0-50-100-150-200-250
    const thresholds = [0, 50, 100, 150, 200, 250];
    while (skill.current_level < 5 && skill.xp >= thresholds[skill.current_level + 1]) {
      skill.current_level += 1;
    }

    skill.updatedAt = new Date();
    await skill.save();
  }

  // re-enforce unlocks after profile changes
  await ensureSkillsExist(studentId, currentProfile);
}

// ==================== DASHBOARD ====================
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        placement_completed: false,
        total_points: 0,
      });
    }

    await ensureSkillsExist(studentId, mathProfile.current_profile);

    const regularQuizzes = await Quiz.find({ student_id: studentId, quiz_type: "regular" }).sort({
      completed_at: -1,
    });

    const totalPoints = regularQuizzes.reduce((sum, q) => sum + (q.points_earned || 0), 0);
    const completedQuizzes = regularQuizzes.length;

    if (mathProfile.total_points !== totalPoints) {
      mathProfile.total_points = totalPoints;
      await mathProfile.save();
    }

    res.json({
      success: true,
      dashboard: {
        currentProfile: mathProfile.current_profile,
        placementCompleted: mathProfile.placement_completed,
        totalPoints,
        completedQuizzes,
        recentQuizzes: regularQuizzes.slice(0, 5).map((q) => ({
          id: q._id,
          score: q.score,
          percentage: q.percentage,
          points: q.points_earned,
          date: q.completed_at,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard" });
  }
});

// ==================== MATH PROFILE ====================
router.get("/math-profile", async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        placement_completed: false,
      });
    }

    const dailyLimit = 2;
    const remaining = Math.max(0, dailyLimit - (mathProfile.quizzes_today || 0));

    res.json({
      success: true,
      mathProfile: {
        current_profile: mathProfile.current_profile,
        total_points: mathProfile.total_points,
        placement_completed: mathProfile.placement_completed,
        quizzes_today: mathProfile.quizzes_today,
        quizzes_remaining: remaining,
      },
    });
  } catch (error) {
    console.error("❌ Math profile error:", error);
    res.status(500).json({ success: false, error: "Failed to load math profile" });
  }
});

// ==================== MATH SKILLS ====================
router.get("/math-skills", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const currentProfile = mathProfile ? mathProfile.current_profile : 1;

    await ensureSkillsExist(studentId, currentProfile);

    const skills = await MathSkill.find({ student_id: studentId });

    const order = ["Addition", "Subtraction", "Multiplication", "Division"];
    skills.sort((a, b) => order.indexOf(a.skill_name) - order.indexOf(b.skill_name));

    res.json({
      success: true,
      skills: skills.map((s) => ({
        skill_name: s.skill_name,
        current_level: s.current_level,
        xp: s.xp,
        max_level: 5,
        unlocked: s.unlocked,
        percentage: calculateSkillPercentage(s.current_level, s.xp),
      })),
      currentProfile,
    });
  } catch (error) {
    console.error("❌ Math skills error:", error);
    res.status(500).json({ success: false, error: "Failed to load math skills" });
  }
});

// ==================== PLACEMENT QUIZ - GENERATE ====================
router.post("/placement-quiz/generate", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const existingProfile = await MathProfile.findOne({ student_id: studentId });
    if (existingProfile && existingProfile.placement_completed) {
      return res.json({ success: false, error: "Placement quiz already completed", requiresPlacement: false });
    }

    const questions = [];
    const ops = shuffleInPlace([...Array(8).fill("addition"), ...Array(7).fill("subtraction")]);

    for (const op of ops) {
      questions.push(generateQuestion([1, 20], op));
    }

    const quiz = await Quiz.create({
      student_id: studentId,
      quiz_type: "placement",
      profile_level: 1,
      questions,
      score: 0,
      total_questions: 15,
      percentage: 0,
      points_earned: 0,
    });

    res.json({
      success: true,
      quiz: {
        quiz_id: quiz._id,
        questions: questions.map((q) => ({ question_text: q.question_text, operation: q.operation })),
      },
    });
  } catch (error) {
    console.error("❌ Generate placement quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to generate placement quiz" });
  }
});

// ==================== PLACEMENT QUIZ - SUBMIT ====================
router.post("/placement-quiz/submit", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { quiz_id, answers } = req.body;

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "placement") {
      return res.status(404).json({ success: false, error: "Placement quiz not found" });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      q.student_answer = studentAnswer;
      q.is_correct = studentAnswer === q.correct_answer;
      if (q.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / 15) * 100);
    quiz.completed_at = new Date();
    await quiz.save();

    // same mapping you used earlier
    let assignedProfile = 1;
    if (score >= 13) assignedProfile = 6;
    else if (score >= 11) assignedProfile = 5;
    else if (score >= 9) assignedProfile = 4;
    else if (score >= 7) assignedProfile = 3;
    else if (score >= 5) assignedProfile = 2;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      mathProfile = new MathProfile({
        student_id: studentId,
        current_profile: assignedProfile,
        placement_completed: true,
        total_points: 0,
      });
    } else {
      mathProfile.current_profile = assignedProfile;
      mathProfile.placement_completed = true;
    }

    updateStreakOnCompletion(mathProfile);
    await mathProfile.save();

    await ensureSkillsExist(studentId, assignedProfile);

    res.json({
      success: true,
      result: {
        score,
        total: 15,
        percentage: quiz.percentage,
        assigned_profile: assignedProfile,
      },
    });
  } catch (error) {
    console.error("❌ Submit placement quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to submit placement quiz" });
  }
});

// ==================== REGULAR QUIZ - GENERATE ====================
router.post("/quiz/generate", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile || !mathProfile.placement_completed) {
      return res.status(400).json({
        success: false,
        requiresPlacement: true,
        error: "Please complete placement quiz first",
      });
    }

    await ensureSkillsExist(studentId, mathProfile.current_profile);

    // daily reset at midnight SGT
    const now = getSingaporeTime();
    const lastReset = mathProfile.last_reset_date ? new Date(mathProfile.last_reset_date) : new Date(0);
    const midnightToday = getMidnightSGT(now);
    const lastResetMidnight = getMidnightSGT(lastReset);

    if (midnightToday > lastResetMidnight) {
      mathProfile.quizzes_today = 0;
      mathProfile.last_reset_date = now;
      await mathProfile.save();
    }

    const dailyLimit = 2;
    if (mathProfile.quizzes_today >= dailyLimit) {
      return res.status(400).json({
        success: false,
        error: "Daily quiz limit reached. Come back tomorrow at 12:00 AM SGT!",
      });
    }

    const profile = mathProfile.current_profile;
    const cfg = getProfileConfig(profile);

    const opSeq = buildOperationSequence(profile);
    const questions = opSeq.map((op) => generateQuestion(cfg.range, op));

    const quiz = await Quiz.create({
      student_id: studentId,
      quiz_type: "regular",
      profile_level: profile,
      questions,
      score: 0,
      total_questions: 15,
      percentage: 0,
      points_earned: 0,
    });

    mathProfile.quizzes_today += 1;
    await mathProfile.save();

    res.json({
      success: true,
      quiz_id: quiz._id,
      profile,
      questions: questions.map((q) => ({ question_text: q.question_text, operation: q.operation })),
      total_questions: 15,
      attemptsToday: mathProfile.quizzes_today,
    });
  } catch (error) {
    console.error("❌ Generate quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to generate quiz" });
  }
});

// ==================== REGULAR QUIZ - SUBMIT ====================
router.post("/quiz/submit", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { quiz_id, answers } = req.body;

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "regular") {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      q.student_answer = studentAnswer;
      q.is_correct = studentAnswer === q.correct_answer;
      if (q.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / 15) * 100);
    quiz.points_earned = score * 10;
    quiz.completed_at = new Date();
    await quiz.save();

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const oldProfile = mathProfile.current_profile;

    let newProfile = oldProfile;
    let profileChanged = false;
    let changeType = null;

    // ===== FYP SPEC =====
    // >=70 -> go up immediately
    // 50-69 -> stay
    // <50 six times -> go down
    if (quiz.percentage >= 70) {
      mathProfile.consecutive_fails = 0;

      if (mathProfile.current_profile < 10) {
        newProfile = mathProfile.current_profile + 1;
        mathProfile.current_profile = newProfile;
        profileChanged = true;
        changeType = "advance";
      }
    } else if (quiz.percentage < 50) {
      mathProfile.consecutive_fails += 1;

      if (mathProfile.consecutive_fails >= 6 && mathProfile.current_profile > 1) {
        newProfile = mathProfile.current_profile - 1;
        mathProfile.current_profile = newProfile;
        mathProfile.consecutive_fails = 0;
        profileChanged = true;
        changeType = "demote";
      }
    } else {
      // 50-69
      mathProfile.consecutive_fails = 0;
    }

    mathProfile.total_points += quiz.points_earned;
    updateStreakOnCompletion(mathProfile);
    await mathProfile.save();

    await updateSkillsFromQuiz(studentId, quiz.questions, quiz.percentage, mathProfile.current_profile);

    res.json({
      success: true,
      result: {
        score,
        total: 15,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        old_profile: oldProfile,
        new_profile: newProfile,
        profile_changed: profileChanged,
        change_type: changeType,
        consecutive_fails: mathProfile.consecutive_fails,
      },
    });
  } catch (error) {
    console.error("❌ Submit quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to submit quiz" });
  }
});

// ==================== MATH PROGRESS ====================
router.get("/math-progress", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const { effective: effectiveStreak, shouldPersistReset } = computeEffectiveStreak(mathProfile);

    if (mathProfile && shouldPersistReset) {
      mathProfile.streak = 0;
      await mathProfile.save();
    }

    const quizzes = await Quiz.find({ student_id: studentId, quiz_type: "regular" }).sort({
      completed_at: -1,
    });

    const totalQuizzes = quizzes.length;
    const averageScore =
      totalQuizzes > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
        : 0;

    const totalPoints = quizzes.reduce((sum, q) => sum + (q.points_earned || 0), 0);

    res.json({
      success: true,
      progressData: {
        currentProfile: mathProfile ? mathProfile.current_profile : 1,
        totalQuizzes,
        averageScore,
        totalPoints,
        streak: effectiveStreak,
        recentQuizzes: quizzes.slice(0, 10).map((q) => ({
          date: q.completed_at.toLocaleDateString(),
          time: q.completed_at.toLocaleTimeString(),
          profile: q.profile_level,
          score: q.score,
          total: q.total_questions,
          percentage: q.percentage,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Math progress error:", error);
    res.status(500).json({ success: false, error: "Failed to load progress data" });
  }
});

// ==================== QUIZ RESULTS / HISTORY ====================
router.get("/quiz-results", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const quizzes = await Quiz.find({ student_id: studentId, quiz_type: "regular" }).sort({ completed_at: -1 });

    res.json({
      success: true,
      results: quizzes.map((q) => ({
        id: q._id,
        profile: q.profile_level,
        date: q.completed_at.toLocaleDateString(),
        time: q.completed_at.toLocaleTimeString(),
        score: q.score,
        total: q.total_questions,
        percentage: q.percentage,
        points_earned: q.points_earned,
      })),
    });
  } catch (error) {
    console.error("❌ Quiz results error:", error);
    res.status(500).json({ success: false, error: "Failed to load quiz results" });
  }
});

router.get("/quiz-history", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const quizzes = await Quiz.find({ student_id: studentId, quiz_type: "regular" }).sort({ completed_at: -1 });

    res.json({
      success: true,
      history: quizzes.map((q) => ({
        id: q._id,
        profile: q.profile_level,
        date: q.completed_at.toLocaleDateString(),
        time: q.completed_at.toLocaleTimeString(),
        score: q.score,
        total: q.total_questions,
        percentage: q.percentage,
        points_earned: q.points_earned,
      })),
    });
  } catch (error) {
    console.error("❌ Quiz history error:", error);
    res.status(500).json({ success: false, error: "Failed to load quiz history" });
  }
});

// ==================== LEADERBOARD ====================
router.get("/leaderboard", async (req, res) => {
  try {
    const students = await MathProfile.find()
      .populate("student_id", "name email")
      .sort({ total_points: -1 })
      .limit(20);

    res.json({
      success: true,
      leaderboard: students.map((p, idx) => ({
        rank: idx + 1,
        name: p.student_id ? p.student_id.name : "Unknown",
        points: p.total_points,
        profile: p.current_profile,
      })),
    });
  } catch (error) {
    console.error("❌ Leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

module.exports = router;
