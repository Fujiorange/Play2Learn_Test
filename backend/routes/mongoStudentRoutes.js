// backend/routes/mongoStudentRoutes.js - FIXED with Skill Update Debugging
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==================== MODELS ====================
const User = mongoose.model('User');

// Define schemas if not already defined
if (!mongoose.models.MathProfile) {
  const mathProfileSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    current_profile: { type: Number, default: 1, min: 1, max: 10 },
    total_points: { type: Number, default: 0 },
    consecutive_passes: { type: Number, default: 0 },
    consecutive_fails: { type: Number, default: 0 },
    placement_completed: { type: Boolean, default: false },
    last_quiz_date: { type: Date },
    quizzes_today: { type: Number, default: 0 },
    last_reset_date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  mongoose.model('MathProfile', mathProfileSchema);
}

if (!mongoose.models.Quiz) {
  const quizSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz_type: { type: String, enum: ['placement', 'regular'], required: true },
    profile_level: { type: Number, required: true },
    questions: [{
      question_text: String,
      operation: String,
      correct_answer: Number,
      student_answer: Number,
      is_correct: Boolean
    }],
    score: { type: Number, required: true },
    total_questions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    points_earned: { type: Number, default: 0 },
    completed_at: { type: Date, default: Date.now }
  });
  mongoose.model('Quiz', quizSchema);
}

if (!mongoose.models.MathSkill) {
  const mathSkillSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill_name: { type: String, required: true },
    current_level: { type: Number, default: 0, min: 0, max: 5 },
    xp: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
  });
  // Add compound index to prevent duplicates
  mathSkillSchema.index({ student_id: 1, skill_name: 1 }, { unique: true });
  mongoose.model('MathSkill', mathSkillSchema);
}

const MathProfile = mongoose.model('MathProfile');
const Quiz = mongoose.model('Quiz');
const MathSkill = mongoose.model('MathSkill');

// ==================== HELPER FUNCTIONS ====================

function getSingaporeTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
}

function getMidnightSGT(date = new Date()) {
  const sgtDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  sgtDate.setHours(0, 0, 0, 0);
  return sgtDate;
}

// ✅ NEW: Ensure skills exist for a student
async function ensureSkillsExist(studentId, currentProfile = 1) {
  try {
    console.log(`🔍 Checking skills for student ${studentId}...`);
    
    const existingSkills = await MathSkill.find({ student_id: studentId });
    console.log(`   Found ${existingSkills.length} existing skills`);
    
    if (existingSkills.length === 0) {
      console.log(`   📝 Creating initial skills...`);
      
      const defaultSkills = [
        { student_id: studentId, skill_name: 'Addition', current_level: 0, xp: 0, unlocked: true },
        { student_id: studentId, skill_name: 'Subtraction', current_level: 0, xp: 0, unlocked: true },
        { student_id: studentId, skill_name: 'Multiplication', current_level: 0, xp: 0, unlocked: currentProfile >= 6 },
        { student_id: studentId, skill_name: 'Division', current_level: 0, xp: 0, unlocked: currentProfile >= 6 }
      ];
      
      await MathSkill.insertMany(defaultSkills);
      console.log(`   ✅ Created 4 default skills`);
      return true;
    }
    
    // Update unlock status if profile changed
    const shouldUnlockAdvanced = currentProfile >= 6;
    for (let skill of existingSkills) {
      if (['Multiplication', 'Division'].includes(skill.skill_name)) {
        if (skill.unlocked !== shouldUnlockAdvanced) {
          skill.unlocked = shouldUnlockAdvanced;
          await skill.save();
          console.log(`   🔓 Updated ${skill.skill_name} unlock status: ${shouldUnlockAdvanced}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error ensuring skills exist:`, error);
    return false;
  }
}

// ==================== DASHBOARD ENDPOINT ====================
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.user.userId;

    console.log('📊 Loading dashboard for student:', studentId);

    // Get or create math profile
    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        total_points: 0,
        placement_completed: false
      });
    }

    // Ensure skills exist
    await ensureSkillsExist(studentId, mathProfile.current_profile);

    // Get ONLY regular quizzes (exclude placement)
    const regularQuizzes = await Quiz.find({
      student_id: studentId,
      quiz_type: 'regular'
    }).sort({ completed_at: -1 });

    // Calculate real total points from regular quizzes
    const totalPoints = regularQuizzes.reduce((sum, quiz) => sum + (quiz.points_earned || 0), 0);

    // Update profile with real points if different
    if (mathProfile.total_points !== totalPoints) {
      mathProfile.total_points = totalPoints;
      await mathProfile.save();
    }

    // Get all quizzes for history
    const allQuizzes = await Quiz.find({ student_id: studentId })
      .sort({ completed_at: -1 })
      .limit(5);

    // Calculate stats from REGULAR quizzes only
    const completedQuizzes = regularQuizzes.length;
    const averageScore = regularQuizzes.length > 0
      ? Math.round(regularQuizzes.reduce((sum, q) => sum + q.percentage, 0) / regularQuizzes.length)
      : 0;

    // Get recent quiz data
    const recentQuizzes = regularQuizzes.slice(0, 5).map(quiz => ({
      id: quiz._id,
      date: quiz.completed_at.toLocaleDateString(),
      time: quiz.completed_at.toLocaleTimeString(),
      profile: quiz.profile_level,
      score: quiz.score,
      total: quiz.total_questions,
      percentage: quiz.percentage,
      points: quiz.points_earned
    }));

    // Check if needs placement
    const needsPlacement = !mathProfile.placement_completed;

    // Get math skills
    const skills = await MathSkill.find({ student_id: studentId });
    
    // Sort skills in correct order: Addition, Subtraction, Multiplication, Division
    const skillOrder = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
    skills.sort((a, b) => skillOrder.indexOf(a.skill_name) - skillOrder.indexOf(b.skill_name));

    res.json({
      success: true,
      dashboard: {
        currentProfile: mathProfile.current_profile,
        totalPoints: totalPoints,
        completedQuizzes: completedQuizzes,
        averageScore: averageScore,
        needsPlacement: needsPlacement,
        placementCompleted: mathProfile.placement_completed,
        recentQuizzes: recentQuizzes,
        skillsOverview: skills.map(skill => ({
          name: skill.skill_name,
          level: skill.current_level,
          xp: skill.xp,
          unlocked: skill.unlocked
        })),
        stats: {
          quizzesToday: mathProfile.quizzes_today || 0,
          attemptsRemaining: Math.max(0, 2 - (mathProfile.quizzes_today || 0)),
          lastQuizDate: mathProfile.last_quiz_date,
          consecutivePasses: mathProfile.consecutive_passes || 0,
          consecutiveFails: mathProfile.consecutive_fails || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
});

// ==================== MATH PROFILE ====================
router.get('/math-profile', async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 1,
        total_points: 0,
        placement_completed: false
      });
    }

    // Ensure skills exist
    await ensureSkillsExist(studentId, mathProfile.current_profile);

    if (!mathProfile.placement_completed) {
      return res.json({
        success: true,
        requiresPlacement: true,
        message: 'Please complete placement quiz first'
      });
    }

    // Reset daily attempts if new day
    const now = getSingaporeTime();
    const lastReset = mathProfile.last_reset_date ? new Date(mathProfile.last_reset_date) : new Date(0);
    const midnightToday = getMidnightSGT(now);
    const lastResetMidnight = getMidnightSGT(lastReset);

    if (midnightToday > lastResetMidnight) {
      mathProfile.quizzes_today = 0;
      mathProfile.last_reset_date = now;
      await mathProfile.save();
    }

    const profileConfig = getProfileConfig(mathProfile.current_profile);

    const lastQuiz = await Quiz.findOne({
      student_id: studentId,
      quiz_type: 'regular'
    }).sort({ completed_at: -1 });

    const quizHistory = await Quiz.find({
      student_id: studentId,
      quiz_type: 'regular',
      profile_level: mathProfile.current_profile
    }).sort({ completed_at: -1 }).limit(10);

    const history = quizHistory.map(quiz => ({
      date: quiz.completed_at.toLocaleDateString(),
      profile_level: quiz.profile_level,
      score: quiz.score,
      total: quiz.total_questions,
      percentage: quiz.percentage
    }));

    const totalQuizzes = await Quiz.countDocuments({
      student_id: studentId,
      quiz_type: 'regular'
    });

    const allQuizzes = await Quiz.find({
      student_id: studentId,
      quiz_type: 'regular'
    });

    const averageScore = allQuizzes.length > 0
      ? Math.round(allQuizzes.reduce((sum, q) => sum + q.percentage, 0) / allQuizzes.length)
      : 0;

    res.json({
      success: true,
      profile: {
        current_profile: mathProfile.current_profile,
        profile_name: `Profile ${mathProfile.current_profile}`,
        number_range_min: profileConfig.range[0],
        number_range_max: profileConfig.range[1],
        operations: profileConfig.operations,
        pass_threshold: 70,
        fail_threshold: 50,
        attemptsToday: mathProfile.quizzes_today || 0,
        attemptsRemaining: Math.max(0, 2 - (mathProfile.quizzes_today || 0)),
        totalQuizzes: totalQuizzes,
        averageScore: averageScore,
        lastScore: lastQuiz ? {
          score: lastQuiz.score,
          total_questions: lastQuiz.total_questions,
          percentage: lastQuiz.percentage
        } : null
      },
      quizHistory: history
    });

  } catch (error) {
    console.error('❌ Math profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load math profile'
    });
  }
});

function getProfileConfig(profile) {
  const configs = {
    1: { range: [1, 10], operations: ['addition', 'subtraction'] },
    2: { range: [1, 20], operations: ['addition', 'subtraction'] },
    3: { range: [1, 30], operations: ['addition', 'subtraction'] },
    4: { range: [1, 40], operations: ['addition', 'subtraction'] },
    5: { range: [1, 50], operations: ['addition', 'subtraction'] },
    6: { range: [1, 60], operations: ['addition', 'subtraction', 'multiplication', 'division'] },
    7: { range: [1, 70], operations: ['addition', 'subtraction', 'multiplication', 'division'] },
    8: { range: [1, 80], operations: ['addition', 'subtraction', 'multiplication', 'division'] },
    9: { range: [1, 90], operations: ['addition', 'subtraction', 'multiplication', 'division'] },
    10: { range: [1, 100], operations: ['addition', 'subtraction', 'multiplication', 'division'] }
  };
  return configs[profile] || configs[1];
}

// ==================== MATH SKILLS ====================
router.get('/math-skills', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const currentProfile = mathProfile ? mathProfile.current_profile : 1;

    // Ensure skills exist
    await ensureSkillsExist(studentId, currentProfile);

    // Get skills
    const skills = await MathSkill.find({ student_id: studentId });
    
    // Define the correct order
    const skillOrder = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
    
    // Sort skills based on the defined order
    skills.sort((a, b) => {
      return skillOrder.indexOf(a.skill_name) - skillOrder.indexOf(b.skill_name);
    });

    console.log(`📊 Loaded ${skills.length} skills for student ${studentId}`);
    skills.forEach(skill => {
      console.log(`   ${skill.skill_name}: Level ${skill.current_level}, XP ${skill.xp}, Unlocked: ${skill.unlocked}`);
    });

    res.json({
      success: true,
      skills: skills.map(skill => ({
        skill_name: skill.skill_name,
        current_level: skill.current_level,
        xp: skill.xp,
        max_level: 5,
        unlocked: skill.unlocked,
        percentage: calculateSkillPercentage(skill.current_level, skill.xp)
      })),
      currentProfile: currentProfile
    });

  } catch (error) {
    console.error('❌ Math skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load math skills'
    });
  }
});

function calculateSkillPercentage(level, xp) {
  const levelThresholds = [0, 50, 100, 150, 200, 250];
  if (level >= 5) return 100;
  
  const currentThreshold = levelThresholds[level];
  const nextThreshold = levelThresholds[level + 1];
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  
  return Math.round((xpInLevel / xpNeeded) * 100);
}

// ==================== MATH PROGRESS ====================
router.get('/math-progress', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    const quizzes = await Quiz.find({
      student_id: studentId,
      quiz_type: 'regular'
    }).sort({ completed_at: -1 });

    const totalQuizzes = quizzes.length;
    const averageScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length)
      : 0;

    const totalPoints = quizzes.reduce((sum, q) => sum + (q.points_earned || 0), 0);

    const recentQuizzes = quizzes.slice(0, 10).map(quiz => ({
      date: quiz.completed_at.toLocaleDateString(),
      time: quiz.completed_at.toLocaleTimeString(),
      profile: quiz.profile_level,
      score: quiz.score,
      total: quiz.total_questions,
      percentage: quiz.percentage
    }));

    res.json({
      success: true,
      progressData: {
        currentProfile: mathProfile ? mathProfile.current_profile : 1,
        totalQuizzes: totalQuizzes,
        averageScore: averageScore,
        totalPoints: totalPoints,
        streak: 0,
        recentQuizzes: recentQuizzes
      }
    });

  } catch (error) {
    console.error('❌ Math progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load progress data'
    });
  }
});

// ==================== QUIZ RESULTS ====================
router.get('/quiz-results', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const quizzes = await Quiz.find({
      student_id: studentId,
      quiz_type: 'regular'
    }).sort({ completed_at: -1 });

    const results = quizzes.map(quiz => ({
      id: quiz._id,
      profile: quiz.profile_level,
      date: quiz.completed_at.toLocaleDateString(),
      time: quiz.completed_at.toLocaleTimeString(),
      score: quiz.score,
      maxScore: quiz.total_questions,
      questions: quiz.total_questions,
      percentage: quiz.percentage,
      points: quiz.points_earned
    }));

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('❌ Quiz results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz results'
    });
  }
});

// ==================== QUIZ HISTORY ====================
router.get('/quiz-history', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const quizzes = await Quiz.find({
      student_id: studentId,
      quiz_type: 'regular'
    }).sort({ completed_at: -1 });

    const history = quizzes.map(quiz => ({
      id: quiz._id,
      date: quiz.completed_at.toLocaleDateString(),
      time: quiz.completed_at.toLocaleTimeString(),
      profile: quiz.profile_level,
      totalQuestions: quiz.total_questions,
      score: quiz.score,
      maxScore: quiz.total_questions,
      percentage: quiz.percentage
    }));

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    console.error('❌ Quiz history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz history'
    });
  }
});

// ==================== PLACEMENT QUIZ - GENERATE ====================
router.post('/placement-quiz/generate', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (mathProfile && mathProfile.placement_completed) {
      return res.status(400).json({
        success: false,
        error: 'Placement quiz already completed'
      });
    }

    // Generate 15 placement questions with all 4 operations
    const questions = [];
    
    // 3-4 questions per operation to cover basic arithmetic
    for (let i = 0; i < 4; i++) {
      questions.push(generateQuestion([1, 10], ['addition']));
    }
    
    for (let i = 0; i < 4; i++) {
      questions.push(generateQuestion([1, 10], ['subtraction']));
    }
    
    for (let i = 0; i < 4; i++) {
      questions.push(generateQuestion([1, 12], ['multiplication']));
    }
    
    for (let i = 0; i < 3; i++) {
      questions.push(generateQuestion([1, 12], ['division']));
    }

    questions.sort(() => Math.random() - 0.5);

    const quiz = await Quiz.create({
      student_id: studentId,
      quiz_type: 'placement',
      profile_level: 0,
      questions: questions,
      score: 0,
      total_questions: 15,
      percentage: 0
    });

    res.json({
      success: true,
      quiz_id: quiz._id,
      questions: questions.map(q => ({
        question_text: q.question_text,
        operation: q.operation
      })),
      total_questions: 15
    });

  } catch (error) {
    console.error('❌ Generate placement quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate placement quiz'
    });
  }
});

// ==================== PLACEMENT QUIZ - SUBMIT ====================
router.post('/placement-quiz/submit', async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { quiz_id, answers } = req.body;

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== 'placement') {
      return res.status(404).json({
        success: false,
        error: 'Placement quiz not found'
      });
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
      const studentAnswer = answers[index];
      question.student_answer = studentAnswer;
      question.is_correct = studentAnswer === question.correct_answer;
      if (question.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / 15) * 100);
    quiz.completed_at = new Date();
    await quiz.save();

    let assignedProfile = 1;
    if (score >= 13) assignedProfile = 6;
    else if (score >= 11) assignedProfile = 5;
    else if (score >= 9) assignedProfile = 4;
    else if (score >= 7) assignedProfile = 3;
    else if (score >= 5) assignedProfile = 2;
    else assignedProfile = 1;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      mathProfile = new MathProfile({
        student_id: studentId,
        current_profile: assignedProfile,
        placement_completed: true,
        total_points: 0
      });
    } else {
      mathProfile.current_profile = assignedProfile;
      mathProfile.placement_completed = true;
    }
    await mathProfile.save();

    console.log(`✅ Placement complete: Profile ${assignedProfile} assigned`);

    // Initialize skills (use ensureSkillsExist to avoid duplicates)
    await ensureSkillsExist(studentId, assignedProfile);

    res.json({
      success: true,
      result: {
        score: score,
        total: 15,
        percentage: quiz.percentage,
        assigned_profile: assignedProfile
      }
    });

  } catch (error) {
    console.error('❌ Submit placement quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit placement quiz'
    });
  }
});

// ==================== REGULAR QUIZ - GENERATE ====================
router.post('/quiz/generate', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile || !mathProfile.placement_completed) {
      return res.status(400).json({
        success: false,
        requiresPlacement: true,
        error: 'Please complete placement quiz first'
      });
    }

    // Ensure skills exist
    await ensureSkillsExist(studentId, mathProfile.current_profile);

    const now = getSingaporeTime();
    const lastReset = mathProfile.last_reset_date ? new Date(mathProfile.last_reset_date) : new Date(0);
    const midnightToday = getMidnightSGT(now);
    const lastResetMidnight = getMidnightSGT(lastReset);

    if (midnightToday > lastResetMidnight) {
      mathProfile.quizzes_today = 0;
      mathProfile.last_reset_date = now;
      await mathProfile.save();
    }

    if (mathProfile.quizzes_today >= 2) {
      return res.status(400).json({
        success: false,
        error: 'Daily quiz limit reached. Come back tomorrow at 12:00 AM SGT!'
      });
    }

    const profileConfig = getProfileConfig(mathProfile.current_profile);

    const questions = [];
    for (let i = 0; i < 15; i++) {
      questions.push(generateQuestion(profileConfig.range, profileConfig.operations));
    }

    const quiz = await Quiz.create({
      student_id: studentId,
      quiz_type: 'regular',
      profile_level: mathProfile.current_profile,
      questions: questions,
      score: 0,
      total_questions: 15,
      percentage: 0
    });

    mathProfile.quizzes_today += 1;
    await mathProfile.save();

    res.json({
      success: true,
      quiz_id: quiz._id,
      profile: mathProfile.current_profile,
      questions: questions.map(q => ({
        question_text: q.question_text,
        operation: q.operation
      })),
      total_questions: 15,
      attemptsToday: mathProfile.quizzes_today
    });

  } catch (error) {
    console.error('❌ Generate quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz'
    });
  }
});

// ==================== REGULAR QUIZ - SUBMIT (FIXED) ====================
router.post('/quiz/submit', async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { quiz_id, answers } = req.body;

    console.log(`\n🎯 ===== QUIZ SUBMISSION START =====`);
    console.log(`Student ID: ${studentId}`);
    console.log(`Quiz ID: ${quiz_id}`);

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== 'regular') {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Grade quiz
    let score = 0;
    quiz.questions.forEach((question, index) => {
      const studentAnswer = answers[index];
      question.student_answer = studentAnswer;
      question.is_correct = studentAnswer === question.correct_answer;
      if (question.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / 15) * 100);
    quiz.points_earned = score * 10;
    quiz.completed_at = new Date();
    await quiz.save();

    console.log(`📝 Quiz graded: ${score}/15 (${quiz.percentage}%) - ${quiz.points_earned} points`);

    // Update math profile
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const oldProfile = mathProfile.current_profile;
    let newProfile = oldProfile;
    let profileChanged = false;
    let changeType = null;

    if (quiz.percentage >= 70) {
      mathProfile.consecutive_passes += 1;
      mathProfile.consecutive_fails = 0;
      
      if (mathProfile.consecutive_passes >= 2 && mathProfile.current_profile < 10) {
        newProfile = mathProfile.current_profile + 1;
        mathProfile.current_profile = newProfile;
        mathProfile.consecutive_passes = 0;
        profileChanged = true;
        changeType = 'advance';
        console.log(`📈 PROFILE ADVANCED: ${oldProfile} → ${newProfile}`);
      }
    } else if (quiz.percentage < 50) {
      mathProfile.consecutive_fails += 1;
      mathProfile.consecutive_passes = 0;
      
      if (mathProfile.consecutive_fails >= 6 && mathProfile.current_profile > 1) {
        newProfile = mathProfile.current_profile - 1;
        mathProfile.current_profile = newProfile;
        mathProfile.consecutive_fails = 0;
        profileChanged = true;
        changeType = 'demote';
        console.log(`📉 PROFILE DEMOTED: ${oldProfile} → ${newProfile}`);
      }
    } else {
      mathProfile.consecutive_passes = 0;
      mathProfile.consecutive_fails = 0;
    }

    mathProfile.total_points += quiz.points_earned;
    mathProfile.last_quiz_date = new Date();
    await mathProfile.save();

    console.log(`💰 Total points updated: ${mathProfile.total_points}`);

    // ✅ FIXED: Update skills with detailed logging
    console.log(`\n🎨 ===== UPDATING SKILLS =====`);
    await updateSkillsFromQuiz(studentId, quiz.questions, quiz.percentage, mathProfile.current_profile);
    console.log(`✅ Skills update complete\n`);

    res.json({
      success: true,
      result: {
        score: score,
        total: 15,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        old_profile: oldProfile,
        new_profile: newProfile,
        profile_changed: profileChanged,
        change_type: changeType,
        consecutive_passes: mathProfile.consecutive_passes,
        consecutive_fails: mathProfile.consecutive_fails
      }
    });

  } catch (error) {
    console.error('❌ Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
});

// ✅ FIXED: Update skills with proper error handling and initialization
async function updateSkillsFromQuiz(studentId, questions, percentage, currentProfile) {
  try {
    console.log(`📊 Updating skills for student ${studentId}...`);
    
    // Ensure skills exist first
    await ensureSkillsExist(studentId, currentProfile);
    
    const skillMap = {
      'addition': 'Addition',
      'subtraction': 'Subtraction',
      'multiplication': 'Multiplication',
      'division': 'Division'
    };

    // Calculate stats per operation
    const operationStats = {};
    questions.forEach(q => {
      const op = q.operation;
      if (!operationStats[op]) {
        operationStats[op] = { correct: 0, total: 0 };
      }
      operationStats[op].total += 1;
      if (q.is_correct) operationStats[op].correct += 1;
    });

    console.log(`   Operation breakdown:`, operationStats);

    // Update each skill
    for (const [operation, stats] of Object.entries(operationStats)) {
      const skillName = skillMap[operation];
      if (!skillName) {
        console.log(`   ⚠️  Unknown operation: ${operation}`);
        continue;
      }

      const skill = await MathSkill.findOne({
        student_id: studentId,
        skill_name: skillName
      });

      if (!skill) {
        console.log(`   ❌ Skill not found: ${skillName}`);
        continue;
      }

      const oldLevel = skill.current_level;
      const oldXP = skill.xp;

      // Award 5 XP per correct answer
      const xpGain = stats.correct * 5;
      skill.xp += xpGain;

      // Level up logic
      const levelThresholds = [0, 50, 100, 150, 200, 250];
      let leveledUp = false;
      
      while (skill.current_level < 5 && skill.xp >= levelThresholds[skill.current_level + 1]) {
        skill.current_level += 1;
        leveledUp = true;
      }

      skill.updatedAt = new Date();
      await skill.save();

      console.log(`   ${leveledUp ? '🎉' : '✅'} ${skillName}: Level ${oldLevel}→${skill.current_level}, XP ${oldXP}→${skill.xp} (+${xpGain}) [${stats.correct}/${stats.total} correct]`);
    }
    
    console.log(`✅ All skills updated successfully`);
    
  } catch (error) {
    console.error(`❌ ERROR updating skills:`, error);
    console.error(`   Stack:`, error.stack);
  }
}

// Helper: Generate question
function generateQuestion(range, operations) {
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const [min, max] = range;
  
  let num1, num2, answer, questionText;
  
  switch (operation) {
    case 'addition':
      num1 = Math.floor(Math.random() * (max - min + 1)) + min;
      num2 = Math.floor(Math.random() * (max - min + 1)) + min;
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
      break;
      
    case 'subtraction':
      num1 = Math.floor(Math.random() * (max - min + 1)) + min;
      num2 = Math.floor(Math.random() * (num1 - min + 1)) + min;
      answer = num1 - num2;
      questionText = `${num1} - ${num2} = ?`;
      break;
      
    case 'multiplication':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      questionText = `${num1} × ${num2} = ?`;
      break;
      
    case 'division':
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      num1 = num2 * answer;
      questionText = `${num1} ÷ ${num2} = ?`;
      break;
      
    default:
      num1 = Math.floor(Math.random() * (max - min + 1)) + min;
      num2 = Math.floor(Math.random() * (max - min + 1)) + min;
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
  }
  
  return {
    question_text: questionText,
    operation: operation,
    correct_answer: answer,
    student_answer: null,
    is_correct: false
  };
}

// ==================== LEADERBOARD ====================
// ==================== LEADERBOARD ====================
router.get('/leaderboard', async (req, res) => {
  try {
    const studentId = req.user.userId;

    console.log('🏆 Loading leaderboard...');

    const profiles = await MathProfile.find({})
      .populate('student_id', 'name email')
      .sort({ total_points: -1 })
      .limit(50);

    console.log(`   Found ${profiles.length} math profiles`);

    // ✅ FIXED: Filter out profiles where populate failed (orphaned records)
    const validProfiles = profiles.filter(profile => profile.student_id && profile.student_id.name);
    
    console.log(`   Valid profiles: ${validProfiles.length}`);

    const leaderboard = validProfiles.map((profile, index) => ({
      rank: index + 1,
      name: profile.student_id.name,
      points: profile.total_points,
      level: profile.current_profile,
      achievements: 0,
      isCurrentUser: profile.student_id._id.toString() === studentId
    }));

    console.log(`✅ Returning ${leaderboard.length} leaderboard entries`);

    res.json({
      success: true,
      leaderboard: leaderboard
    });

  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to load leaderboard'
    });
  }
});

// ==================== QUIZ RESULTS ====================
router.get('/results', async (req, res) => {
  try {
    const studentId = req.user.userId;

    console.log('📊 Loading quiz results for student:', studentId);

    // Get all quizzes for this student
    const allQuizzes = await Quiz.find({ student_id: studentId })
      .sort({ completed_at: -1 });

    console.log(`   Found ${allQuizzes.length} total quizzes`);

    // Separate placement and regular quizzes
    const placementQuizzes = allQuizzes.filter(q => q.quiz_type === 'placement');
    const regularQuizzes = allQuizzes.filter(q => q.quiz_type === 'regular');

    console.log(`   - Placement quizzes: ${placementQuizzes.length}`);
    console.log(`   - Regular quizzes: ${regularQuizzes.length}`);

    // ✅ FIXED: Only return REGULAR quizzes (exclude placement)
    const results = regularQuizzes.map(quiz => ({
      id: quiz._id,
      type: quiz.quiz_type,
      profile: quiz.profile_level,
      score: quiz.score,
      total: quiz.total_questions,
      percentage: quiz.percentage,
      points: quiz.points_earned || 0,
      date: quiz.completed_at.toLocaleDateString('en-SG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: quiz.completed_at.toLocaleTimeString('en-SG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: quiz.completed_at
    }));

    // Calculate statistics from REGULAR quizzes only
    const stats = {
      totalQuizzes: regularQuizzes.length,
      averageScore: regularQuizzes.length > 0 
        ? Math.round(regularQuizzes.reduce((sum, q) => sum + q.percentage, 0) / regularQuizzes.length)
        : 0,
      totalPoints: regularQuizzes.reduce((sum, q) => sum + (q.points_earned || 0), 0),
      highestScore: regularQuizzes.length > 0 
        ? Math.max(...regularQuizzes.map(q => q.percentage))
        : 0,
      lowestScore: regularQuizzes.length > 0 
        ? Math.min(...regularQuizzes.map(q => q.percentage))
        : 0
    };

    console.log(`✅ Returning ${results.length} regular quiz results`);

    res.json({
      success: true,
      results: results,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz results'
    });
  }
});

// ==================== MATH QUIZ RESULTS (Frontend-compatible endpoint) ====================
router.get('/math-quiz-results', async (req, res) => {
  try {
    const studentId = req.user.userId;

    console.log('📊 Loading math quiz results for student:', studentId);

    // Get all quizzes for this student
    const allQuizzes = await Quiz.find({ student_id: studentId })
      .sort({ completed_at: -1 });

    console.log(`   Found ${allQuizzes.length} total quizzes`);

    // Separate placement and regular quizzes
    const placementQuizzes = allQuizzes.filter(q => q.quiz_type === 'placement');
    const regularQuizzes = allQuizzes.filter(q => q.quiz_type === 'regular');

    console.log(`   - Placement quizzes: ${placementQuizzes.length}`);
    console.log(`   - Regular quizzes: ${regularQuizzes.length}`);

    // ✅ FIXED: Only return REGULAR quizzes (exclude placement)
    const results = regularQuizzes.map(quiz => ({
      id: quiz._id,
      type: quiz.quiz_type,
      profile: quiz.profile_level,
      score: quiz.score,
      total: quiz.total_questions,
      percentage: quiz.percentage,
      points: quiz.points_earned || 0,
      date: quiz.completed_at.toLocaleDateString('en-SG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: quiz.completed_at.toLocaleTimeString('en-SG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: quiz.completed_at
    }));

    // Calculate statistics from REGULAR quizzes only
    const stats = {
      totalQuizzes: regularQuizzes.length,
      averageScore: regularQuizzes.length > 0 
        ? Math.round(regularQuizzes.reduce((sum, q) => sum + q.percentage, 0) / regularQuizzes.length)
        : 0,
      totalPoints: regularQuizzes.reduce((sum, q) => sum + (q.points_earned || 0), 0),
      highestScore: regularQuizzes.length > 0 
        ? Math.max(...regularQuizzes.map(q => q.percentage))
        : 0,
      lowestScore: regularQuizzes.length > 0 
        ? Math.min(...regularQuizzes.map(q => q.percentage))
        : 0
    };

    console.log(`✅ Returning ${results.length} regular quiz results`);

    res.json({
      success: true,
      results: results,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Math quiz results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load quiz results'
    });
  }
});

// ==================== SUPPORT & TESTIMONIALS ====================
router.post('/support-ticket', async (req, res) => {
  try {
    res.json({
      success: true,
      ticketId: 'TKT-' + Date.now(),
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

router.get('/support-tickets', async (req, res) => {
  try {
    res.json({ success: true, tickets: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load tickets' });
  }
});

router.post('/testimonial', async (req, res) => {
  try {
    res.json({ success: true, message: 'Testimonial submitted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit testimonial' });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    res.json({ success: true, assignments: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load assignments' });
  }
});

module.exports = router;