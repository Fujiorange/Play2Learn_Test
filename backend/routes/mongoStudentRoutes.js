// backend/routes/mongoStudentRoutes.js - COMPLETE FIXED VERSION
// ✅ All endpoints match frontend expectations
// ✅ Field names corrected for compatibility
// ✅ Daily limit set to 2 quizzes (matching frontend)

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
      student_id: studentId,
      quiz_type: "regular" 
    });

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