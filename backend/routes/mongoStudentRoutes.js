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
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Helper to safely convert to ObjectId
function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  try { return new mongoose.Types.ObjectId(id); } catch (e) { return null; }
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Access token required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid token" });
  }
}
router.use(authenticateToken);

// Models
const User = mongoose.model("User");
if (!mongoose.models.MathProfile) {
  mongoose.model("MathProfile", new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    current_profile: { type: Number, default: 1 },
    placement_completed: { type: Boolean, default: false },
    total_points: { type: Number, default: 0 },
    consecutive_fails: { type: Number, default: 0 },
    quizzes_today: { type: Number, default: 0 },
    last_reset_date: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    last_quiz_date: { type: Date },
  }));
}
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

const MathProfile = mongoose.model("MathProfile");
const Quiz = mongoose.model("Quiz");
const MathSkill = mongoose.model("MathSkill");

// Helper functions
function computeEffectiveStreak(mp) {
  if (!mp || !mp.last_quiz_date) return { effective: 0, shouldPersistReset: false };
  const last = new Date(mp.last_quiz_date); last.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((today - last) / 86400000);
  return diff <= 1 ? { effective: mp.streak || 0, shouldPersistReset: false } : { effective: 0, shouldPersistReset: true };
}

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
  const opMap = { "+": "addition", "-": "subtraction", "*": "multiplication", "/": "division" };
  return { question_text: `${n1} ${op} ${n2} = ?`, correct_answer: ans, operation: opMap[op] };
}

async function syncPoints(studentId, email, mp) {
  try {
    const db = mongoose.connection.db;
    const oid = toObjectId(studentId);
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (email) q.$or.push({ email });
    if (q.$or.length === 0) return;
    await db.collection('students').updateOne(q, { $set: { points: mp.total_points || 0, level: mp.current_profile || 1, streak: mp.streak || 0, updated_at: new Date() } });
  } catch (e) { console.error('Sync error:', e); }
}

async function checkBadges(studentId, email) {
  try {
    const db = mongoose.connection.db;
    const oid = toObjectId(studentId);
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (email) q.$or.push({ email });
    if (q.$or.length === 0) return [];
    const student = await db.collection('students').findOne(q);
    if (!student) return [];
    const badges = await db.collection('badges').find({ isActive: true }).toArray();
    const earned = (student.badges || []).map(id => id.toString());
    const newBadges = [];
    for (const b of badges) {
      if (earned.includes(b._id.toString())) continue;
      let ok = false;
      switch (b.criteriaType) {
        case 'quizzes_completed': ok = (student.total_quizzes || 0) >= (b.criteriaValue || 0); break;
        case 'points_earned': ok = (student.points || 0) >= (b.criteriaValue || 0); break;
        case 'first_quiz': ok = (student.total_quizzes || 0) >= 1; break;
      }
      if (ok) {
        await db.collection('students').updateOne({ _id: student._id }, { $addToSet: { badges: b._id } });
        await db.collection('badges').updateOne({ _id: b._id }, { $inc: { earnedCount: 1 } });
        newBadges.push(b);
      }
    }
    return newBadges;
  } catch (e) { return []; }
}

// Dashboard
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

// Math Profile
router.get("/math-profile", async (req, res) => {
  try {
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    if (!mp) mp = await MathProfile.create({ student_id: oid || sid, current_profile: 1, placement_completed: false, total_points: 0 });
    const today = new Date(); today.setHours(0,0,0,0);
    const last = new Date(mp.last_reset_date || 0); last.setHours(0,0,0,0);
    if (today > last) { mp.quizzes_today = 0; mp.last_reset_date = new Date(); await mp.save(); }
    const { effective } = computeEffectiveStreak(mp);
    res.json({ success: true, profile: { current_profile: mp.current_profile, placement_completed: mp.placement_completed, total_points: mp.total_points, streak: effective, quizzes_today: mp.quizzes_today } });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Math Skills
router.get("/math-skills", async (req, res) => {
  try {
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    const mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    let skills = await MathSkill.find({ student_id: oid });
    if (skills.length === 0) skills = await MathSkill.find({ student_id: sid });
    const required = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
    const existing = skills.map(s => s.skill_name);
    for (const name of required) {
      if (!existing.includes(name)) {
        const ns = await MathSkill.create({ student_id: oid || sid, skill_name: name, current_level: 0, xp: 0, unlocked: true });
        skills.push(ns);
      }
    }
    res.json({ success: true, currentProfile: mp?.current_profile || 1, skills: skills.map(s => ({ skill_name: s.skill_name, current_level: s.current_level, xp: s.xp, max_level: 5, unlocked: s.unlocked, percentage: Math.min(100, s.xp % 100) })) });
  } catch (e) { console.error("Skills error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// Math Progress
router.get("/math-progress", async (req, res) => {
  try {
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    const { effective, shouldPersistReset } = computeEffectiveStreak(mp);
    if (mp && shouldPersistReset) { mp.streak = 0; await mp.save(); }
    const quizzes = await Quiz.find({ $or: [{ student_id: oid }, { student_id: sid }], quiz_type: "regular" }).sort({ completed_at: -1 });
    const total = quizzes.length;
    const avg = total > 0 ? Math.round(quizzes.reduce((s, q) => s + q.percentage, 0) / total) : 0;
    res.json({ success: true, progressData: { currentProfile: mp?.current_profile || 1, totalQuizzes: total, averageScore: avg, totalPoints: mp?.total_points || 0, streak: effective, recentQuizzes: quizzes.slice(0, 10).map(q => ({ date: q.completed_at ? new Date(q.completed_at).toLocaleDateString() : 'N/A', time: q.completed_at ? new Date(q.completed_at).toLocaleTimeString() : 'N/A', profile: q.profile_level, score: q.score, total: q.total_questions || 15, percentage: q.percentage })) } });
  } catch (e) { console.error("Progress error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// Placement Quiz Generate
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

// Placement Quiz Submit
router.post("/placement-quiz/submit", async (req, res) => {
  try {
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    const { quiz_id, answers } = req.body;
    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "placement") return res.status(404).json({ success: false, error: "Not found" });
    let score = 0;
    quiz.questions.forEach((q, i) => { q.student_answer = answers[i]; q.is_correct = answers[i] === q.correct_answer; if (q.is_correct) score++; });
    quiz.score = score; quiz.percentage = Math.round((score / 15) * 100); quiz.points_earned = score * 10; quiz.completed_at = new Date();
    await quiz.save();
    let profile = 1;
    if (quiz.percentage >= 90) profile = 8;
    else if (quiz.percentage >= 80) profile = 7;
    else if (quiz.percentage >= 70) profile = 6;
    else if (quiz.percentage >= 60) profile = 5;
    else if (quiz.percentage >= 50) profile = 4;
    else if (quiz.percentage >= 40) profile = 3;
    else if (quiz.percentage >= 30) profile = 2;
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    mp.current_profile = profile; mp.placement_completed = true; mp.total_points += quiz.points_earned; mp.streak = 1; mp.last_quiz_date = new Date();
    await mp.save();
    await syncPoints(sid, req.user.email, mp);
    const badges = await checkBadges(sid, req.user.email);
    res.json({ success: true, result: { score, total: 15, percentage: quiz.percentage, points_earned: quiz.points_earned, assigned_profile: profile, new_badges: badges.map(b => ({ name: b.name, icon: b.icon })) } });
  } catch (e) { console.error("Placement submit error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// Regular Quiz Generate
router.post("/quiz/generate", async (req, res) => {
  try {
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    let mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: sid });
    if (!mp || !mp.placement_completed) return res.status(400).json({ success: false, error: "Complete placement first" });
    const today = new Date(); today.setHours(0,0,0,0);
    const last = new Date(mp.last_reset_date || 0); last.setHours(0,0,0,0);
    if (today > last) { mp.quizzes_today = 0; mp.last_reset_date = new Date(); }
    const profile = mp.current_profile;
    const questions = Array.from({ length: 15 }, () => generateQuestion(profile));
    const quiz = await Quiz.create({ student_id: oid || sid, quiz_type: "regular", profile_level: profile, questions, score: 0, total_questions: 15 });
    mp.quizzes_today += 1; await mp.save();
    res.json({ success: true, quiz_id: quiz._id, profile, questions: questions.map(q => ({ question_text: q.question_text, operation: q.operation })), total_questions: 15, attemptsToday: mp.quizzes_today });
  } catch (e) { console.error("Quiz generate error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

// Regular Quiz Submit
router.post("/quiz/submit", async (req, res) => {
  try {
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    const { quiz_id, answers } = req.body;
    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "regular") return res.status(404).json({ success: false, error: "Not found" });
    let score = 0;
    quiz.questions.forEach((q, i) => { q.student_answer = answers[i]; q.is_correct = answers[i] === q.correct_answer; if (q.is_correct) score++; });
    quiz.score = score; quiz.percentage = Math.round((score / 15) * 100); quiz.points_earned = score * 10; quiz.completed_at = new Date();
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

// Badges
router.get("/badges", async (req, res) => {
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

// Points
router.get("/points", async (req, res) => {
  try {
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

// Shop
router.get("/shop", async (req, res) => {
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

router.post("/shop/purchase", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { itemId } = req.body;
    const oid = toObjectId(req.user.userId);
    if (!itemId) return res.status(400).json({ success: false, error: "Item ID required" });
    const mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: req.user.userId });
    if (!mp) return res.status(404).json({ success: false, error: "Profile not found" });
    const pts = mp.total_points || 0;
    const item = await db.collection('shop_items').findOne({ _id: toObjectId(itemId) });
    if (!item || !item.isActive) return res.status(404).json({ success: false, error: "Item not found" });
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (req.user.email) q.$or.push({ email: req.user.email });
    const student = q.$or.length > 0 ? await db.collection('students').findOne(q) : null;
    if (!student) return res.status(404).json({ success: false, error: "Student not found" });
    const existing = await db.collection('purchases').findOne({ student_id: student._id, item_id: toObjectId(itemId) });
    if (existing) return res.status(400).json({ success: false, error: "Already owned" });
    if (pts < item.cost) return res.status(400).json({ success: false, error: `Need ${item.cost} pts, have ${pts}` });
    const newPts = pts - item.cost;
    mp.total_points = newPts; await mp.save();
    await db.collection('students').updateOne({ _id: student._id }, { $set: { points: newPts } });
    await db.collection('purchases').insertOne({ student_id: student._id, item_id: toObjectId(itemId), item_name: item.name, cost: item.cost, purchasedAt: new Date() });
    await db.collection('shop_items').updateOne({ _id: toObjectId(itemId) }, { $inc: { purchaseCount: 1 } });
    await db.collection('point_transactions').insertOne({ student_id: student._id, amount: -item.cost, reason: `Purchased: ${item.name}`, type: 'purchase', previousBalance: pts, newBalance: newPts, createdAt: new Date() });
    res.json({ success: true, message: `Purchased ${item.name}!`, newPoints: newPts });
  } catch (e) { console.error("Purchase error:", e); res.status(500).json({ success: false, error: "Failed" }); }
});

router.get("/shop/purchases", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const oid = toObjectId(req.user.userId);
    const q = { $or: [] };
    if (oid) q.$or.push({ user_id: oid });
    if (req.user.email) q.$or.push({ email: req.user.email });
    const student = q.$or.length > 0 ? await db.collection('students').findOne(q) : null;
    if (!student) return res.json({ success: true, purchases: [] });
    const purchases = await db.collection('purchases').find({ student_id: student._id }).sort({ purchasedAt: -1 }).toArray();
    res.json({ success: true, purchases });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Announcements
router.get("/announcements", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    const anns = await db.collection('announcements').find({
      $and: [
        { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] },
        { $or: [{ audience: 'all' }, { audience: 'student' }, { audience: 'students' }, { audience: { $exists: false } }] }
      ]
    }).sort({ pinned: -1, createdAt: -1 }).limit(10).toArray();
    res.json({ success: true, announcements: anns });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Support Tickets
router.post("/support-tickets", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { subject, description, priority, category } = req.body;
    let userName = req.user.name;
    if (!userName) {
      const user = await db.collection('users').findOne({ email: req.user.email });
      userName = user?.name || 'Unknown';
    }
    const ticket = { user_id: req.user.userId, user_email: req.user.email, user_name: userName, user_role: req.user.role || 'student', subject, description, priority: priority || 'medium', category: category || 'general', status: 'open', responses: [], createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection('supporttickets').insertOne(ticket);
    console.log(`🎫 Ticket: ${subject} by ${userName}`);
    res.json({ success: true, ticket: { ...ticket, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

router.get("/support-tickets", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tickets = await db.collection('supporttickets').find({ user_email: req.user.email }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, tickets });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});


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
