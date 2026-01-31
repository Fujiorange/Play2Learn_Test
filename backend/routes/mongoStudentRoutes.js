// backend/routes/mongoStudentRoutes.js - COMPLETE FIXED VERSION
// ✅ All endpoints match frontend expectations
// ✅ Field names corrected for compatibility
// ✅ Daily limit set to 2 quizzes (matching frontend)

// ✅ Placement quizzes excluded from all statistics
// ✅ Quiz model points to quiz_attempts collection (CRITICAL FIX!)
// ✅ Profile 1 counter reset added (Line 725-728)

// backend/routes/mongoStudentRoutes.js - COMPREHENSIVE FIX v13
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
const User = require('../models/User');
const MathProfile = require('../models/MathProfile');
const StudentQuiz = require('../models/StudentQuiz');
const MathSkill = require('../models/MathSkill');
const SupportTicket = require('../models/SupportTicket');
const Testimonial = require('../models/Testimonial');
const Quiz = require('../models/Quiz');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

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
if (!mongoose.models.Quiz) {
  mongoose.model("Quiz", new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz_type: { type: String, enum: ["placement", "regular"], required: true },
    profile_level: { type: Number, required: true },
    questions: [
      {
        question_text: String,
        operation: String,
        correct_answer: Number,
        student_answer: Number,
        is_correct: Boolean,
      },
    ],
    answers: [Number], // Support old schema with "answers" array
    questions: [{ question_text: String, operation: String, correct_answer: Number, student_answer: Number, is_correct: Boolean }],
    score: { type: Number, default: 0 },
    total_questions: { type: Number, default: 15 },
    percentage: { type: Number, default: 0 },
    points_earned: { type: Number, default: 0 },
    completed_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }, // Support old schema
  }, {
    collection: 'quiz_attempts' // ⭐ CRITICAL FIX: Query the correct collection!
  });
  mongoose.model("Quiz", quizSchema);
  }));
}
if (!mongoose.models.MathSkill) {
  mongoose.model("MathSkill", new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill_name: { type: String, required: true },
    current_level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  });
  mathSkillSchema.index({ student_id: 1, skill_name: 1 }, { unique: true });
  mongoose.model("MathSkill", mathSkillSchema);
}

if (!mongoose.models.SupportTicket) {
  const supportTicketSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student_name: { type: String, required: true },
    student_email: { type: String, required: true },
    subject: { type: String, required: true },
    category: { type: String, default: 'general' },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
    admin_response: { type: String },
    school_id: { type: String },
  });
  mongoose.model("SupportTicket", supportTicketSchema);
}

if (!mongoose.models.Testimonial) {
  const testimonialSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    student_name: { type: String, required: true },
    student_email: { type: String },
    title: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true },
    approved: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  });
  mongoose.model("Testimonial", testimonialSchema);
  }));
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildOperationSequence(profile) {
  if (profile <= 5) {
    const addCount = Math.random() < 0.5 ? 7 : 8;
    const subCount = 15 - addCount;
    const ops = [
      ...Array(addCount).fill("addition"),
      ...Array(subCount).fill("subtraction"),
    ];
    return shuffleInPlace(ops);
// ==================== SCHEMA COMPATIBILITY HELPER ====================
/**
 * Check if a quiz is completed - handles BOTH old and new schemas
 * OLD: quiz.answers array (used before Jan 30, 2026)
 * NEW: quiz.questions array with student_answer (used after Jan 30, 2026)
 */
function isQuizCompleted(quiz) {
  // NEW format: quiz.questions with nested student_answer
  if (quiz.questions && quiz.questions.length > 0) {
    return quiz.questions.some(q => 
      q.student_answer !== null && q.student_answer !== undefined
    );
  }
  
  // OLD format: quiz.answers array (your Jan 17 quizzes)
  if (quiz.answers && quiz.answers.length > 0) {
    return true;
  }
  
  return false;
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
function generateQuestion(profile) {
  const ops = ["+", "-", "*", "/"];
  let maxNum, op;
  if (profile <= 2) { maxNum = 10; op = ops[Math.floor(Math.random() * 2)]; }
  else if (profile <= 4) { maxNum = 20; op = ops[Math.floor(Math.random() * 3)]; }
  else if (profile <= 6) { maxNum = 50; op = ops[Math.floor(Math.random() * 4)]; }
  else { maxNum = 100; op = ops[Math.floor(Math.random() * 4)]; }
  
  let n1 = Math.floor(Math.random() * maxNum) + 1;
  let n2 = Math.floor(Math.random() * maxNum) + 1;
  let ans;
  switch (op) {
    case "+": ans = n1 + n2; break;
    case "-": if (n1 < n2) [n1, n2] = [n2, n1]; ans = n1 - n2; break;
    case "*": n1 = Math.floor(Math.random() * 12) + 1; n2 = Math.floor(Math.random() * 12) + 1; ans = n1 * n2; break;
    case "/": n2 = Math.floor(Math.random() * 10) + 1; ans = Math.floor(Math.random() * 10) + 1; n1 = n2 * ans; break;
  }

  const ops = ["addition", "subtraction", "multiplication", "division"];
  const counts = { addition: 3, subtraction: 3, multiplication: 3, division: 3 };
  const pick = shuffleInPlace([...ops]).slice(0, 3);
  pick.forEach((k) => (counts[k] += 1));

  const seq = [];
  ops.forEach((k) => {
    for (let i = 0; i < counts[k]; i++) seq.push(k);
  });

  return shuffleInPlace(seq);
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
      num1 = randInt(1, 12);
      num2 = randInt(1, 12);
      answer = num1 * num2;
      questionText = `${num1} × ${num2} = ?`;
      break;

    case "division":
      num2 = randInt(1, 12);
      const quotient = randInt(1, 12);
      num1 = num2 * quotient;
      answer = quotient;
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

async function updateSkillsFromQuiz(studentId, questions, percentage, currentProfile) {
  try {
    const skillUpdates = {};

    questions.forEach((q) => {
      const skill = q.operation
        ? q.operation.charAt(0).toUpperCase() + q.operation.slice(1)
        : "Addition";
      
      if (!skillUpdates[skill]) {
        skillUpdates[skill] = { correct: 0, total: 0 };
      }
      skillUpdates[skill].total++;
      if (q.is_correct) skillUpdates[skill].correct++;
    });

    for (const [skillName, stats] of Object.entries(skillUpdates)) {
      const skillPercentage = (stats.correct / stats.total) * 100;
      const xpGain = Math.floor(skillPercentage / 10);

      let skill = await MathSkill.findOne({ student_id: studentId, skill_name: skillName });

      if (!skill) {
        skill = new MathSkill({
          student_id: studentId,
          skill_name: skillName,
          current_level: 0,
          xp: 0,
          unlocked: true,
        });
      }

      skill.xp += xpGain;
      const newLevel = Math.min(5, Math.floor(skill.xp / 100));
      skill.current_level = newLevel;
      skill.updatedAt = new Date();

      await skill.save();
    }
  } catch (error) {
    console.error("Error updating skills:", error);
  }
}

// ==================== DASHBOARD ENDPOINT ====================
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
        consecutive_fails: 0,
        quizzes_today: 0,
        last_reset_date: new Date(),
        streak: 0,
      });
    }

    const completedQuizzes = await StudentQuiz.countDocuments({ 
    // ✅ FIX: Get all regular quizzes, then filter out unsubmitted ones
    const allQuizzes = await Quiz.find({ 
      student_id: studentId,
      quiz_type: "regular" 
    });

    // Filter: Only count quizzes that have been submitted (have student answers)
    const completedQuizzes = allQuizzes.filter(isQuizCompleted).length;

    const user = await User.findById(studentId);
    const { effective: effectiveStreak } = computeEffectiveStreak(mathProfile);

    res.json({
      success: true,
      dashboard: {
        totalPoints: mathProfile.total_points || 0,
        completedQuizzes: completedQuizzes || 0,
        currentProfile: mathProfile.current_profile || 1,
        gradeLevel: user?.gradeLevel || 'Primary 1',
        streak: effectiveStreak || 0,
        placementCompleted: mathProfile.placement_completed || false,
      },
      data: {
        points: mathProfile.total_points || 0,
        quizzesTaken: completedQuizzes || 0,
        level: mathProfile.current_profile || 1,
        gradeLevel: user?.gradeLevel || 'Primary 1',
        streak: effectiveStreak || 0,
      }
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard" });
  }
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    if (!mp) mp = await MathProfile.create({ student_id: oid || sid, current_profile: 1, placement_completed: false, total_points: 0 });
    const quizCount = await Quiz.countDocuments({ $or: [{ student_id: oid }, { student_id: sid }], quiz_type: "regular" });
    const user = await User.findById(oid || sid);
    const { effective } = computeEffectiveStreak(mp);
    await syncPoints(sid, req.user.email, mp);
    res.json({ success: true, dashboard: { totalPoints: mp.total_points || 0, completedQuizzes: quizCount, currentProfile: mp.current_profile || 1, gradeLevel: user?.gradeLevel || 'Primary 1', streak: effective, placementCompleted: mp.placement_completed }, data: { points: mp.total_points || 0, quizzesTaken: quizCount, level: mp.current_profile || 1, streak: effective } });
  } catch (e) { console.error("Dashboard error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// ==================== MATH PROFILE ENDPOINT (FIXED!) ====================
router.get("/math-profile", async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        placement_completed: false,
        total_points: 0,
        consecutive_fails: 0,
        quizzes_today: 0,
        last_reset_date: new Date(),
        streak: 0,
      });
    }

    // Reset daily quizzes if needed
    const now = getSingaporeTime();
    const lastResetMid = getSgtMidnightTime(mathProfile.last_reset_date || now);
    const todayMid = getSgtMidnightTime(now);

    if (todayMid > lastResetMid) {
      mathProfile.quizzes_today = 0;
      mathProfile.last_reset_date = now;
      await mathProfile.save();
    }

    const { effective: effectiveStreak } = computeEffectiveStreak(mathProfile);
    const dailyLimit = 2; // Frontend expects 2 quizzes per day

    // ✅ FIXED: Return "mathProfile" to match frontend expectations
    res.json({
      success: true,
      mathProfile: {
        current_profile: mathProfile.current_profile,
        placement_completed: mathProfile.placement_completed,
        total_points: mathProfile.total_points,
        consecutive_fails: mathProfile.consecutive_fails,
        streak: effectiveStreak,
        quizzes_today: mathProfile.quizzes_today,
        quizzes_remaining: Math.max(0, dailyLimit - mathProfile.quizzes_today),
        attemptsToday: mathProfile.quizzes_today,
      }
    });
  } catch (error) {
    console.error("❌ Math profile error:", error);
    res.status(500).json({ success: false, error: "Failed to load math profile" });
  }
});

// ==================== MATH SKILLS ENDPOINT ====================
router.get("/math-skills", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const skills = await MathSkill.find({ student_id: studentId });

    const requiredSkills = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
    const existingSkillNames = skills.map(s => s.skill_name);

    for (const skillName of requiredSkills) {
      if (!existingSkillNames.includes(skillName)) {
        const newSkill = await MathSkill.create({
          student_id: studentId,
          skill_name: skillName,
          current_level: 0,
          xp: 0,
          unlocked: true,
        });
        skills.push(newSkill);
      }
    }

    res.json({
      success: true,
      currentProfile: mathProfile?.current_profile || 1,
      skills: skills.map(s => ({
        skill_name: s.skill_name,
        current_level: s.current_level,
        xp: s.xp,
        max_level: 5,
        unlocked: s.unlocked,
        percentage: Math.min(100, (s.xp % 100)),
      }))
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

    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        placement_completed: false,
        total_points: 0,
      });
    }

    if (mathProfile.placement_completed) {
      return res.status(400).json({
        success: false,
        error: "Placement quiz already completed",
      });
    }

    // Get an active placement quiz from P2L Admin created quizzes
    const placementQuiz = await Quiz.findOne({
      quiz_type: 'placement',
      is_active: true
    }).sort({ createdAt: -1 }); // Get most recent placement quiz

    if (!placementQuiz || !placementQuiz.questions || placementQuiz.questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No active placement quiz found. Please contact your administrator.",
      });
    }

    // Create a student quiz attempt record using the P2L Admin quiz
    const quiz = await StudentQuiz.create({
      student_id: studentId,
      quiz_type: "placement",
      quiz_id: placementQuiz._id,
      profile_level: 5,
      questions: placementQuiz.questions.map(q => ({
        question_text: q.text,
        operation: 'general', // P2L Admin quizzes don't have operation field
        correct_answer: q.answer,
        student_answer: null,
        is_correct: false,
      })),
      score: 0,
      total_questions: placementQuiz.questions.length,
    // Use profile 7 for placement quiz to include all 4 operations (+ - * /)
    // This properly assesses student's full math capabilities
    const profile = 7;
    const cfg = getProfileConfig(profile);
    const opSeq = buildOperationSequence(profile);
    const questions = opSeq.map((op) => generateQuestion(cfg.range, op));

    const quiz = await Quiz.create({
      student_id: studentId,
      quiz_type: "placement",
      profile_level: profile,
      questions,
      score: 0,
      total_questions: 15,
      percentage: 0,
      points_earned: 0,
    });

    res.json({
      success: true,
      quiz_id: quiz._id,
      questions: placementQuiz.questions.map((q) => ({ 
        question_text: q.text, 
        choices: q.choices,
        operation: 'general' 
      })),
      total_questions: placementQuiz.questions.length,
      questions: questions.map((q) => ({ question_text: q.question_text, operation: q.operation })),
      total_questions: 15,
    });
  } catch (error) {
    console.error("❌ Generate placement quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to generate placement quiz" });
  }
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    if (!mp) mp = await MathProfile.create({ student_id: oid || sid, current_profile: 1, placement_completed: false, total_points: 0 });
    if (mp.placement_completed) return res.status(400).json({ success: false, error: "Already completed", profile: mp.current_profile });
    const questions = Array.from({ length: 15 }, () => generateQuestion(5));
    const quiz = await Quiz.create({ student_id: oid || sid, quiz_type: "placement", profile_level: 5, questions, score: 0, total_questions: 15 });
    res.json({ success: true, quiz_id: quiz._id, questions: questions.map(q => ({ question_text: q.question_text, operation: q.operation })), total_questions: 15 });
  } catch (e) { console.error("Placement generate error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// ==================== PLACEMENT QUIZ - SUBMIT ====================
router.post("/placement-quiz/submit", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { quiz_id, answers } = req.body;

    const quiz = await StudentQuiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "placement") {
      return res.status(404).json({ success: false, error: "Placement quiz not found" });
    }

    const totalQuestions = quiz.questions.length;
    
    // Validate answers array length
    if (!Array.isArray(answers) || answers.length !== totalQuestions) {
      return res.status(400).json({ 
        success: false, 
        error: `Expected ${totalQuestions} answers, but received ${answers?.length || 0}` 
      });
    }

    let score = 0;
    
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      q.student_answer = studentAnswer;
      
      // Handle undefined/null answers explicitly
      if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
        q.is_correct = false;
      } else {
        // Compare answers as strings (case-insensitive and trimmed)
        const correctAnswer = String(q.correct_answer).trim().toLowerCase();
        const givenAnswer = String(studentAnswer).trim().toLowerCase();
        q.is_correct = givenAnswer === correctAnswer;
      }
      
      if (q.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / totalQuestions) * 100);
    quiz.points_earned = score * 10;
    quiz.completed_at = new Date();
    await quiz.save();

    const mathProfile = await MathProfile.findOne({ student_id: studentId });

    let startingProfile = 1;
    if (quiz.percentage >= 90) startingProfile = 7;
    else if (quiz.percentage >= 80) startingProfile = 6;
    else if (quiz.percentage >= 70) startingProfile = 5;
    else if (quiz.percentage >= 60) startingProfile = 4;
    else if (quiz.percentage >= 50) startingProfile = 3;
    else if (quiz.percentage >= 40) startingProfile = 2;
    else startingProfile = 1;

    mathProfile.current_profile = startingProfile;
    mathProfile.placement_completed = true;
    mathProfile.total_points += quiz.points_earned;
    await mathProfile.save();

    await updateSkillsFromQuiz(studentId, quiz.questions, quiz.percentage, startingProfile);

    res.json({
      success: true,
      result: {
        score,
        total: totalQuestions,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        starting_profile: startingProfile,
        assigned_profile: startingProfile,
        placement_completed: true,
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

    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        placement_completed: false,
        total_points: 0,
      });
    }

    if (!mathProfile.placement_completed) {
      return res.status(400).json({
        success: false,
        error: "Please complete placement quiz first",
        requiresPlacement: true,
      });
    }

    const now = getSingaporeTime();
    const lastResetMid = getSgtMidnightTime(mathProfile.last_reset_date || now);
    const todayMid = getSgtMidnightTime(now);

    if (todayMid > lastResetMid) {
      mathProfile.quizzes_today = 0;
      mathProfile.last_reset_date = now;
      await mathProfile.save();
    }

    const dailyLimit = 2; // Frontend expects 2 attempts per day
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

    const quiz = await StudentQuiz.create({
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

    const quiz = await StudentQuiz.findById(quiz_id);
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

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const oldProfile = mathProfile.current_profile;

    let newProfile = oldProfile;
    let profileChanged = false;
    let changeType = null;

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
      } else if (mathProfile.consecutive_fails >= 6 && mathProfile.current_profile === 1) {
        // ⭐ NEW FIX: At Profile 1 (lowest), reset counter but stay at Profile 1
        mathProfile.consecutive_fails = 0;
      }
    } else {
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
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    const oldP = mp.current_profile;
    let newP = oldP, changed = false, changeType = null;
    if (quiz.percentage >= 70) { mp.consecutive_fails = 0; if (mp.current_profile < 10) { newP = mp.current_profile + 1; mp.current_profile = newP; changed = true; changeType = "advance"; } }
    else if (quiz.percentage < 50) { mp.consecutive_fails += 1; if (mp.consecutive_fails >= 6 && mp.current_profile > 1) { newP = mp.current_profile - 1; mp.current_profile = newP; mp.consecutive_fails = 0; changed = true; changeType = "demote"; } }
    else { mp.consecutive_fails = 0; }
    mp.total_points += quiz.points_earned;
    const lastQ = mp.last_quiz_date;
    if (lastQ) {
      const ld = new Date(lastQ); ld.setHours(0,0,0,0);
      const td = new Date(); td.setHours(0,0,0,0);
      const diff = Math.floor((td - ld) / 86400000);
      if (diff === 1) mp.streak = (mp.streak || 0) + 1;
      else if (diff > 1) mp.streak = 1;
    } else mp.streak = 1;
    mp.last_quiz_date = new Date();
    await mp.save();
    await syncPoints(sid, req.user.email, mp);
    const db = mongoose.connection.db;
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (req.user.email) q.$or.push({ email: req.user.email });
    if (q.$or.length > 0) await db.collection('students').updateOne(q, { $inc: { total_quizzes: 1 } });
    const badges = await checkBadges(sid, req.user.email);
    console.log(`🎮 Quiz: ${req.user.email} scored ${score}/15 (${quiz.percentage}%), +${quiz.points_earned} pts`);
    res.json({ success: true, result: { score, total: 15, percentage: quiz.percentage, points_earned: quiz.points_earned, old_profile: oldP, new_profile: newP, profile_changed: changed, change_type: changeType, total_points: mp.total_points, new_badges: badges.map(b => ({ name: b.name, icon: b.icon })) } });
  } catch (e) { console.error("Quiz submit error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// Quiz Results
router.get("/quiz-results", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const { effective: effectiveStreak, shouldPersistReset } = computeEffectiveStreak(mathProfile);

    if (mathProfile && shouldPersistReset) {
      mathProfile.streak = 0;
      await mathProfile.save();
    }

    // ✅ FIX: Get all regular quizzes, then filter out unsubmitted ones
    const allQuizzes = await Quiz.find({ 
      student_id: studentId, 
      quiz_type: "regular" 
    }).sort({ completed_at: -1 });

    // Filter: Only include quizzes that have been submitted (have student answers)
    const quizzes = allQuizzes.filter(isQuizCompleted);

    const totalQuizzes = quizzes.length;
    const averageScore =
      totalQuizzes > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
        : 0;
    const totalPoints = mathProfile?.total_points || 0;


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
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    const quizzes = await Quiz.find({ $or: [{ student_id: oid }, { student_id: sid }], quiz_type: "regular" }).sort({ completed_at: -1 });
    res.json({ success: true, results: quizzes.map(q => ({ id: q._id, profile: q.profile_level, score: q.score, total: q.total_questions || 15, percentage: q.percentage, points: q.points_earned, date: q.completed_at })) });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    // ✅ FIX: Get all regular quizzes, then filter out unsubmitted ones
    const allQuizzes = await Quiz.find({ 
      student_id: studentId, 
      quiz_type: "regular" 
    }).sort({ completed_at: -1 });

    // Filter: Only include quizzes that have been submitted (have student answers)
    const quizzes = allQuizzes.filter(isQuizCompleted);

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
    const db = mongoose.connection.db;
    const students = await db.collection('students').find({}).sort({ points: -1 }).limit(10).toArray();
    res.json({ success: true, leaderboard: students.map((s, i) => ({ rank: i + 1, name: s.name || 'Unknown', points: s.points || 0, level: s.level || 1, class: s.class || '-' })) });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
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

    const quizzes = await StudentQuiz.find({ student_id: studentId, quiz_type: "regular" }).sort({
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
    
    // ✅ FIX: Get all regular quizzes, then filter out unsubmitted ones
    const allQuizzes = await Quiz.find({ 
      student_id: studentId, 
      quiz_type: "regular" 
    }).sort({ completed_at: -1 });

    // Filter: Only include quizzes that have been submitted (have student answers)
    const quizzes = allQuizzes.filter(isQuizCompleted);

    res.json({
      success: true,
      history: quizzes.map((q) => ({
        id: q._id,
        profile: q.profile_level,
        profile_level: q.profile_level,
        date: q.completed_at.toLocaleDateString(),
        time: q.completed_at.toLocaleTimeString(),
        score: q.score,
        maxScore: q.total_questions,
        totalQuestions: q.total_questions,
        percentage: q.percentage,
        points_earned: q.points_earned,
      })),
    });
  } catch (error) {
    console.error("❌ Quiz history error:", error);
    res.status(500).json({ success: false, error: "Failed to load quiz history" });
  }
    const db = mongoose.connection.db;
    const oid = toObjectId(req.user.userId);
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (req.user.email) q.$or.push({ email: req.user.email });
    const student = q.$or.length > 0 ? await db.collection('students').findOne(q) : null;
    const all = await db.collection('badges').find({ isActive: true }).toArray();
    if (!student) return res.json({ success: true, badges: all.map(b => ({ ...b, earned: false })), earnedBadges: [], totalPoints: 0 });
    const earned = (student.badges || []).map(id => id.toString());
    const badges = all.map(b => ({ ...b, earned: earned.includes(b._id.toString()) }));
    res.json({ success: true, badges, earnedBadges: badges.filter(b => b.earned), totalPoints: student.points || 0 });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// ==================== QUIZ RESULTS / HISTORY ====================
router.get("/quiz-results", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const quizzes = await StudentQuiz.find({ student_id: studentId, quiz_type: "regular" }).sort({ completed_at: -1 });

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
    const currentUserId = req.user.userId;
    
    // Get current user's class
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userClass = currentUser.class;

    // If user has no class, return empty leaderboard
    if (!userClass) {
      return res.json({
        success: true,
        leaderboard: [],
      });
    }

    // Find all students in the same class
    const studentsInClass = await User.find({
      class: userClass,
      role: { $in: ['student', 'Student'] }, // Case-insensitive role check
    });

    const studentIds = studentsInClass.map((s) => s._id);

    // Get math profiles for students in the same class
    const students = await MathProfile.find({
      student_id: { $in: studentIds },
    })
      .populate("student_id", "name email")
      .sort({ total_points: -1 })
      .limit(20);

    res.json({
      success: true,
      leaderboard: students.map((p, idx) => ({
        rank: idx + 1,
        name: p.student_id ? p.student_id.name : "Unknown",
        points: p.total_points,
        level: p.current_profile,
        profile: p.current_profile,
        achievements: 0,
        isCurrentUser: p.student_id && p.student_id._id.toString() === currentUserId,
      })),
    });
  } catch (error) {
    console.error("❌ Leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
    const oid = toObjectId(req.user.userId);
    const mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: req.user.userId });
    res.json({ success: true, points: mp?.total_points || 0, level: mp?.current_profile || 1 });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

router.get("/quiz-history", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const quizzes = await StudentQuiz.find({ student_id: studentId, quiz_type: "regular" }).sort({ completed_at: -1 });

    res.json({
      success: true,
      history: quizzes.map((q) => ({
        id: q._id,
        profile: q.profile_level,
        profile_level: q.profile_level,
        date: q.completed_at.toLocaleDateString(),
        time: q.completed_at.toLocaleTimeString(),
        score: q.score,
        maxScore: q.total_questions,
        totalQuestions: q.total_questions,
        percentage: q.percentage,
        points_earned: q.points_earned,
      })),
    });
  } catch (error) {
    console.error("❌ Quiz history error:", error);
    res.status(500).json({ success: false, error: "Failed to load quiz history" });
  }
    const { subject, category, message, description, student_name, student_email } = req.body;

    const finalSubject = subject || 'Support Request';
    const finalMessage = message || description || '';

    if (!finalMessage) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required" 
      });
    }

    // ✅ FIX: Map 'normal' to 'medium' for backward compatibility
    const priorityMap = {
      'normal': 'medium',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };

    // ✅ Get student's schoolId for admin filtering
    const student = await User.findById(studentId).select('schoolId');
    const schoolId = student?.schoolId || null;
    const finalPriority = priorityMap[req.body.priority] || 'medium';

    const ticket = await SupportTicket.create({
      student_id: studentId,
      student_name: student_name || req.user.name || 'Unknown',
      student_email: student_email || req.user.email || 'unknown@email.com',
      school_id: schoolId,
      subject: finalSubject,
      category: category || 'general',
      message: finalMessage,
      status: 'open',
      priority: finalPriority,
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticketId: ticket._id,
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        created_at: ticket.created_at,
      }
    });
  } catch (error) {
    console.error("❌ Create support ticket error:", error);
    res.status(500).json({ success: false, error: "Failed to create support ticket" });
  }
    const db = mongoose.connection.db;
    const oid = toObjectId(req.user.userId);
    const mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: req.user.userId });
    const pts = mp?.total_points || 0;
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (req.user.email) q.$or.push({ email: req.user.email });
    const student = q.$or.length > 0 ? await db.collection('students').findOne(q) : null;
    const purchases = student ? await db.collection('purchases').find({ student_id: student._id }).toArray() : [];
    const owned = purchases.map(p => p.item_id.toString());
    const items = await db.collection('shop_items').find({ isActive: true }).sort({ cost: 1 }).toArray();
    res.json({ success: true, items: items.map(i => ({ ...i, owned: owned.includes(i._id.toString()), canAfford: pts >= i.cost })), studentPoints: pts });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// ==================== LEADERBOARD ====================
router.get("/leaderboard", async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
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
        level: p.current_profile,
        profile: p.current_profile,
        achievements: 0,
        isCurrentUser: p.student_id && p.student_id._id.toString() === currentUserId,
      })),
    });
  } catch (error) {
    console.error("❌ Leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

// ==================== SUPPORT TICKETS ====================
router.post("/support-tickets", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { subject, category, message, description, student_name, student_email } = req.body;

    const finalSubject = subject || 'Support Request';
    const finalMessage = message || description || '';

    if (!finalMessage) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required" 
      });
    }

    const ticket = await SupportTicket.create({
      student_id: studentId,
      student_name: student_name || req.user.name || 'Unknown',
      student_email: student_email || req.user.email || 'unknown@email.com',
      subject: finalSubject,
      category: category || 'general',
      message: finalMessage,
      status: 'open',
      priority: req.body.priority || 'medium',
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticketId: ticket._id,
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        created_at: ticket.created_at,
      }
    });
  } catch (error) {
    console.error("❌ Create support ticket error:", error);
    res.status(500).json({ success: false, error: "Failed to create support ticket" });
  }
});

router.get("/support-tickets", async (req, res) => {
  try {
    const studentId = req.user.userId;

    const tickets = await SupportTicket.find({ student_id: studentId })
      .sort({ created_at: -1 });

    res.json({
      success: true,
      tickets: tickets.map(t => ({
        id: t._id,
        subject: t.subject,
        category: t.category,
        message: t.message,
        status: t.status,
        priority: t.priority,
        createdOn: t.created_at.toLocaleDateString(),
        lastUpdate: t.updated_at.toLocaleDateString(),
        created_at: t.created_at,
        updated_at: t.updated_at,
        admin_response: t.admin_response,
      }))
    });
  } catch (error) {
    console.error("❌ Get support tickets error:", error);
    res.status(500).json({ success: false, error: "Failed to load support tickets" });
  }
});

// ==================== TESTIMONIALS ====================
router.post("/testimonials", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { rating, message, testimonial, title, student_name, student_email, displayName } = req.body;

    const finalMessage = message || testimonial || '';
    
    // Validation
    if (!rating || !finalMessage) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating and message are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating must be between 1 and 5" 
      });
    }

    // Message length validation
    if (finalMessage.trim().length < 20) {
      return res.status(400).json({ 
        success: false, 
        error: "Message must be at least 20 characters long" 
      });
    }

    if (finalMessage.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        error: "Message must not exceed 2000 characters" 
      });
    }

    // Perform sentiment analysis
    const sentimentResult = sentiment.analyze(finalMessage);
    const sentimentScore = sentimentResult.score;
    let sentimentLabel = 'neutral';
    if (sentimentScore > 0) sentimentLabel = 'positive';
    else if (sentimentScore < 0) sentimentLabel = 'negative';

    const testimonialDoc = await Testimonial.create({
      student_id: studentId,
      student_name: displayName || student_name || req.user.name || 'Anonymous',
      student_email: student_email || req.user.email,
      title: title || '',
      rating,
      message: finalMessage,
      approved: false,
      user_role: 'Student',
      sentiment_score: sentimentScore,
      sentiment_label: sentimentLabel,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully (pending approval)",
      testimonial: {
        id: testimonialDoc._id,
        rating: testimonialDoc.rating,
        message: testimonialDoc.message,
        created_at: testimonialDoc.created_at,
      }
    });
  } catch (error) {
    console.error("❌ Create testimonial error:", error);
    res.status(500).json({ success: false, error: "Failed to submit testimonial" });
  }
});

router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ created_at: -1 })
      .limit(20);

    res.json({
      success: true,
      testimonials: testimonials.map(t => ({
        id: t._id,
        student_name: t.student_name,
        title: t.title,
        rating: t.rating,
        message: t.message,
        created_at: t.created_at,
      }))
    });
  } catch (error) {
    console.error("❌ Get testimonials error:", error);
    res.status(500).json({ success: false, error: "Failed to load testimonials" });
  }
});

module.exports = router;

// ==================== REWARD SHOP ENDPOINTS ====================

// Get available shop items
router.get("/shop", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const shopItems = await db.collection('shop_items')
      .find({ isActive: true })
      .sort({ category: 1, cost: 1 })
      .toArray();

    res.json({
      success: true,
      items: shopItems
    });
  } catch (error) {
    console.error("❌ Get shop items error:", error);
    res.status(500).json({ success: false, error: "Failed to load shop items" });
  }
});

// Purchase a shop item
router.post("/shop/:itemId/purchase", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { itemId } = req.params;
    const studentId = req.user.userId;
    const userEmail = req.user.email;

    // Get math profile (this is where points are stored!)
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      return res.status(404).json({ success: false, error: "Student profile not found" });
    }

    // Get shop item
    const item = await db.collection('shop_items').findOne({ 
      _id: new mongoose.Types.ObjectId(itemId) 
    });
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (!item.isActive) {
      return res.status(400).json({ success: false, error: "Item is no longer available" });
    }

    // Check if already purchased
    const existingPurchase = await db.collection('student_purchases').findOne({
      student_email: userEmail,
      item_id: itemId
    });
    if (existingPurchase) {
      return res.status(400).json({ success: false, error: "You already own this item" });
    }

    // Check if student has enough points
    const currentPoints = mathProfile.total_points || 0;
    if (currentPoints < item.cost) {
      return res.status(400).json({ 
        success: false, 
        error: `Not enough points. You need ${item.cost - currentPoints} more points.` 
      });
    }

    // Check stock
    if (item.stock === 0) {
      return res.status(400).json({ success: false, error: "Item is out of stock" });
    }

    // Deduct points from math profile
    mathProfile.total_points -= item.cost;
    mathProfile.updatedAt = new Date();
    await mathProfile.save();

    // Record purchase
    const purchase = {
      student_id: studentId,
      student_email: userEmail,
      item_id: itemId,
      item_name: item.name,
      item_icon: item.icon,
      cost: item.cost,
      category: item.category,
      purchased_at: new Date(),
      is_active: true
    };
    await db.collection('student_purchases').insertOne(purchase);

    // Update shop item stock and purchase count
    const updates = { 
      purchaseCount: (item.purchaseCount || 0) + 1 
    };
    if (item.stock !== -1) {
      updates.stock = item.stock - 1;
    }
    await db.collection('shop_items').updateOne(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { $set: updates }
    );

    const remainingPoints = currentPoints - item.cost;
    console.log(`✅ Purchase successful: ${userEmail} bought ${item.name} for ${item.cost} points. Remaining: ${remainingPoints}`);

    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      pointsRemaining: remainingPoints,
      purchase
    });
  } catch (error) {
    console.error("❌ Purchase error:", error);
    res.status(500).json({ success: false, error: "Failed to complete purchase" });
  }
});

// Get student's purchases
router.get("/shop/purchases", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userEmail = req.user.email;

    const purchases = await db.collection('student_purchases')
      .find({ student_email: userEmail })
      .sort({ purchased_at: -1 })
      .toArray();

    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error("❌ Get purchases error:", error);
    res.status(500).json({ success: false, error: "Failed to load purchases" });
  }
});

// ==================== BADGE ENDPOINTS ====================

// Get all badges with earned status
router.get("/badges", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userEmail = req.user.email;

    // Get all active badges
    const badges = await db.collection('badges')
      .find({ isActive: true })
      .sort({ rarity: 1, criteriaValue: 1 })
      .toArray();

    // Get student's earned badges
    const earnedBadges = await db.collection('student_badges')
      .find({ student_email: userEmail })
      .toArray();

    res.json({
      success: true,
      badges,
      earnedBadges
    });
  } catch (error) {
    console.error("❌ Get badges error:", error);
    res.status(500).json({ success: false, error: "Failed to load badges" });
  }
});

// Get badge progress for current student
router.get("/badges/progress", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const userEmail = req.user.email;

    // Get math profile data
    const mathProfile = await MathProfile.findOne({ student_id: studentId });

    console.log(`📊 Math Profile for ${userEmail}:`, mathProfile);

    // ✅ FIX: Use Quiz model with SAME logic as Dashboard/Progress
    const allQuizzes = await Quiz.find({ 
      student_id: studentId,
      quiz_type: "regular" 
    });

    // Filter: Only count quizzes that have been submitted (have student answers)
    const completedQuizzes = allQuizzes.filter(isQuizCompleted);

    console.log(`📝 Found ${completedQuizzes.length} completed quizzes for ${userEmail}`);
    
    // Log quiz scores for debugging
    if (completedQuizzes.length > 0) {
      console.log(`Quiz scores:`, completedQuizzes.map(q => ({
        score: q.score,
        percentage: q.percentage,
        date: q.completed_at
      })));
    }

    // Calculate progress for different criteria
    const progress = {
      quizzes_completed: completedQuizzes.length,
      login_streak: mathProfile?.streak || 0,
      perfect_scores: completedQuizzes.filter(q => q.score === 15).length, // 15/15 = 100%
      high_scores: completedQuizzes.filter(q => q.percentage >= 90).length,
      points_earned: mathProfile?.total_points || 0
    };

    console.log(`📊 Badge progress for ${userEmail}:`, progress);

    // Check and auto-award badges
    const db = mongoose.connection.db;
    const badges = await db.collection('badges').find({ isActive: true }).toArray();
    const earnedBadges = await db.collection('student_badges')
      .find({ student_email: userEmail })
      .toArray();
    const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id.toString()));

    for (const badge of badges) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge._id.toString())) continue;

      // Check if criteria met
      const currentValue = progress[badge.criteriaType] || 0;
      if (currentValue >= badge.criteriaValue) {
        // Award badge
        const newBadge = {
          student_id: studentId,
          student_email: userEmail,
          badge_id: badge._id,
          badge_name: badge.name,
          badge_icon: badge.icon,
          rarity: badge.rarity,
          earned_at: new Date(),
          criteria_met: {
            type: badge.criteriaType,
            value: currentValue,
            required: badge.criteriaValue
          }
        };
        await db.collection('student_badges').insertOne(newBadge);

        // Update badge earned count
        await db.collection('badges').updateOne(
          { _id: badge._id },
          { $inc: { earnedCount: 1 } }
        );

        console.log(`🏆 Badge awarded: ${badge.name} to ${userEmail}`);
        earnedBadgeIds.add(badge._id.toString());
      }
    }

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error("❌ Get badge progress error:", error);
    res.status(500).json({ success: false, error: "Failed to load badge progress" });
  }
});

module.exports = router;
module.exports = router;
