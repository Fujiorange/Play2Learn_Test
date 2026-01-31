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
    questions: [{ question_text: String, operation: String, correct_answer: Number, student_answer: Number, is_correct: Boolean }],
    score: { type: Number, default: 0 },
    total_questions: { type: Number, default: 15 },
    percentage: { type: Number, default: 0 },
    points_earned: { type: Number, default: 0 },
    completed_at: { type: Date, default: Date.now },
  }));
}
if (!mongoose.models.MathSkill) {
  mongoose.model("MathSkill", new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill_name: { type: String, required: true },
    current_level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: true },
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
    // Return as mathProfile to match frontend expectation
    res.json({ success: true, mathProfile: { current_profile: mp.current_profile, placement_completed: mp.placement_completed, total_points: mp.total_points, streak: effective, quizzes_today: mp.quizzes_today } });
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
    const sid = req.user.userId;
    const oid = toObjectId(sid);
    const quizzes = await Quiz.find({ $or: [{ student_id: oid }, { student_id: sid }], quiz_type: "regular" }).sort({ completed_at: -1 });
    res.json({ success: true, results: quizzes.map(q => ({ id: q._id, profile: q.profile_level, score: q.score, total: q.total_questions || 15, percentage: q.percentage, points: q.points_earned, date: q.completed_at })) });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const students = await db.collection('students').find({}).sort({ points: -1 }).limit(10).toArray();
    res.json({ success: true, leaderboard: students.map((s, i) => ({ rank: i + 1, name: s.name || 'Unknown', points: s.points || 0, level: s.level || 1, class: s.class || '-' })) });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Badges
router.get("/badges", async (req, res) => {
  try {
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
    const oid = toObjectId(req.user.userId);
    const mp = await MathProfile.findOne({ student_id: oid }) || await MathProfile.findOne({ student_id: req.user.userId });
    res.json({ success: true, points: mp?.total_points || 0, level: mp?.current_profile || 1 });
  } catch (e) { res.status(500).json({ success: false, error: "Failed" }); }
});

// Shop
router.get("/shop", async (req, res) => {
  try {
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

module.exports = router;
