/**
 * backend/routes/trialRoutes.js
 * Trial-mode API used by the TrialDashboard.
 *
 * In server.js it is mounted as:
 *   app.use('/api/trial', authenticateToken, trialRoutes);
 * So all routes here require a valid JWT.
 */

const express = require('express');
const router = express.Router();

const TrialClass = require('../models/TrialClass');
const TrialStudent = require('../models/TrialStudent');
const { ensureTrialSeedData } = require('../services/trialSeedService');
const QuizAttempt = require('../models/QuizAttempt');

// Optional: if your DB has a Question bank we can use it; otherwise we generate.
let QuestionModel;
try {
  QuestionModel = require('../models/Question');
} catch (e) {
  QuestionModel = null;
}

let QuizQuestionModel;
try {
  QuizQuestionModel = require('../models/QuizQuestion');
} catch (e) {
  QuizQuestionModel = null;
}

function getUserId(req) {
  return req.user?.userId || req.user?.id || req.user?._id || req.userId;
}


function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function calcNewProfile(currentProfile, score) {
  const cur = Number(currentProfile || 1);
  if (score >= 70) return clamp(cur + 1, 1, 5);
  if (score < 50) return clamp(cur - 1, 1, 5);
  return clamp(cur, 1, 5);
}

function bandFromScore(score) {
  return score >= 70 ? 'PASS' : 'FAIL';
}

function opKey(op) {
  const v = String(op || '').toLowerCase();
  if (v.includes('add')) return 'add';
  if (v.includes('sub')) return 'sub';
  if (v.includes('mul')) return 'mul';
  if (v.includes('div')) return 'div';
  return 'add';
}

// ---------------- demo student helpers ----------------
function hashToUnitInterval(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function randIntFromSeed(seedStr, min, max) {
  const u = hashToUnitInterval(seedStr);
  return Math.floor(u * (max - min + 1)) + min;
}

function demoizeStudent(s, seed = 1) {
  const key = String(s?._id || s?.id || s?.name || seed);

  const score = randIntFromSeed(key + ':score', 35, 95);
  const profile = randIntFromSeed(key + ':profile', 1, 5);

  let add = randIntFromSeed(key + ':add', 0, 5);
  let sub = randIntFromSeed(key + ':sub', 0, 5);
  let mul = randIntFromSeed(key + ':mul', 0, 5);
  let div = randIntFromSeed(key + ':div', 0, 5);
  if (add + sub + mul + div === 0) add = 1;

  const out = { ...s };

  if (out.profile == null) out.profile = profile;
  if (out.last_score == null || Number(out.last_score) === 0) out.last_score = score;

  const existing = out.last_operation_breakdown;
  const existingIsObject = existing && typeof existing === 'object';
  const existingSum = existingIsObject
    ? Number(existing.add || 0) + Number(existing.sub || 0) + Number(existing.mul || 0) + Number(existing.div || 0)
    : 0;

  if (!existingIsObject || existingSum === 0) {
    out.last_operation_breakdown = { add, sub, mul, div };
  }

  return out;
}

function computeAttemptsLeft(student) {
  const today = new Date().toISOString().slice(0, 10);
  const attemptsToday = student?.last_attempt_date === today ? student?.attempts_today ?? 0 : 0;
  return Math.max(0, 2 - attemptsToday);
}

// ---------------- quiz helpers ----------------
function opSymbol(op) {
  return op === 'add' ? '+' : op === 'sub' ? '-' : op === 'mul' ? '×' : '÷';
}

function genArithmeticQuestion(seed, profile = 1) {
  // profile 1-5 -> number size
  const maxByProfile = [10, 20, 50, 100, 200];
  const max = maxByProfile[Math.max(0, Math.min(4, profile - 1))];

  const ops = ['add', 'sub', 'mul', 'div'];
  const op = ops[randIntFromSeed(seed + ':op', 0, ops.length - 1)];

  let a = randIntFromSeed(seed + ':a', 1, max);
  let b = randIntFromSeed(seed + ':b', 1, max);

  if (op === 'sub' && b > a) [a, b] = [b, a];
  if (op === 'div') {
    // make divisible
    b = randIntFromSeed(seed + ':b2', 1, Math.max(2, Math.floor(Math.sqrt(max))));
    const q = randIntFromSeed(seed + ':q', 1, Math.max(2, Math.floor(max / b)));
    a = b * q;
  }

  let ans;
  if (op === 'add') ans = a + b;
  if (op === 'sub') ans = a - b;
  if (op === 'mul') ans = a * b;
  if (op === 'div') ans = a / b;

  // build 4 choices with some distractors
  const choices = new Set([String(ans)]);
  while (choices.size < 4) {
    const delta = randIntFromSeed(seed + ':d' + choices.size, 1, Math.max(2, Math.floor(max / 4)));
    const sign = randIntFromSeed(seed + ':s' + choices.size, 0, 1) ? 1 : -1;
    const candidate = String(Math.max(0, ans + sign * delta));
    choices.add(candidate);
  }

  const choiceArr = Array.from(choices);
  // shuffle deterministically
  choiceArr.sort((x, y) => (hashToUnitInterval(seed + ':' + x) - hashToUnitInterval(seed + ':' + y)));
  const correctIndex = choiceArr.indexOf(String(ans));

  return {
    id: seed,
    operation: op,
    prompt: `${a} ${opSymbol(op)} ${b} = ?`,
    choices: choiceArr,
    _correctIndex: correctIndex,
  };
}

async function fetchQuestionsFromBank(profile, count) {
  // Prefer quizquestions (if present), then fallback to questions.
  const PrimaryModel = QuizQuestionModel || null;
  const FallbackModel = QuestionModel || null;
  if (!PrimaryModel && !FallbackModel) return null;

  const pickModel = async (Model) => {
    if (!Model) return [];
    // Be permissive: some datasets do not set subject/topic consistently.
    // Prefer active questions, but include docs without an `is_active` field.
    // Keep this query lightweight + bounded.
    // Some datasets have many questions; avoid heavy sorts when not necessary.
    return Model.find({ $or: [{ is_active: true }, { is_active: { $exists: false } }] }, { text: 1, prompt: 1, questionText: 1, question: 1, title: 1, choices: 1, options: 1, answers: 1, answer: 1, correctIndex: 1, difficulty: 1, subject: 1, topic: 1 })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(Math.max(count * 5, 50))
      .maxTimeMS(5000)
      .lean();
  };

  const primary = await pickModel(PrimaryModel);
  const fallback = primary && primary.length ? [] : await pickModel(FallbackModel);
  const q = (primary && primary.length ? primary : fallback) || [];

  if (!q || q.length === 0) return null;

  const parseCorrectIndex = (answer, choices) => {
    if (!Array.isArray(choices) || choices.length === 0) return 0;
    if (answer == null) return 0;

    // If answer is a number or numeric string (e.g. "2"), treat as index.
    if (typeof answer === 'number' && Number.isFinite(answer)) {
      const idx = Math.floor(answer);
      return idx >= 0 && idx < choices.length ? idx : 0;
    }

    const ansStr = String(answer).trim();
    // Some data uses "0:00" format; parse leading integer.
    const m = ansStr.match(/^\s*(\d+)\s*[:]/);
    if (m) {
      const idx = Number(m[1]);
      return idx >= 0 && idx < choices.length ? idx : 0;
    }

    if (/^\d+$/.test(ansStr)) {
      const idx = Number(ansStr);
      return idx >= 0 && idx < choices.length ? idx : 0;
    }

    // Otherwise match by string equality.
    const idx = choices.findIndex((c) => String(c).trim() === ansStr);
    return idx >= 0 ? idx : 0;
  };

  // Normalize to {prompt, choices, _correctIndex}
  const normalized = q
    .map((x) => {
      const prompt = x.text || x.prompt || x.questionText || x.question || x.title || '';
      const rawChoices = Array.isArray(x.choices)
        ? x.choices
        : Array.isArray(x.options)
          ? x.options
          : Array.isArray(x.answers)
            ? x.answers
            : [];
      const choices = (rawChoices || []).map((c) => (c == null ? '' : String(c)));
      const answer = x.correctIndex != null ? x.correctIndex : x.answer;
      const idx = parseCorrectIndex(answer, choices);
      return {
        id: String(x._id),
        prompt,
        choices,
        _correctIndex: idx,
        difficulty: x.difficulty ?? 3,
      };
    })
    .filter((x) => x.prompt && x.choices && x.choices.length >= 2);

  if (normalized.length === 0) return null;

  // Pick a slice based on profile
  const start = (profile - 1) * Math.max(1, Math.floor(normalized.length / 5));
  const picked = normalized.slice(start, start + count);
  while (picked.length < count && normalized.length > picked.length) {
    picked.push(normalized[picked.length % normalized.length]);
  }

  return picked.slice(0, count);
}

// ---------------- routes ----------------

// GET /api/trial/students

router.post('/bootstrap', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await ensureTrialSeedData(trialUserId);
    const classes = await TrialClass.find({ trial_user_id: trialUserId }).sort({ class_name: 1 }).lean();
    const students = await TrialStudent.find({ trial_user_id: trialUserId }).sort({ created_at: 1 }).lean();

    return res.json({ success: true, classes, students });
  } catch (err) {
    console.error('POST /api/trial/bootstrap error:', err);
    return res.status(500).json({ success: false, error: 'Failed to bootstrap trial data' });
  }
});


router.get('/classes', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await ensureTrialSeedData(trialUserId);

    const classes = await TrialClass.find({ trial_user_id: trialUserId }).sort({ class_name: 1 }).lean();
    return res.json({ success: true, classes });
  } catch (err) {
    console.error('GET /api/trial/classes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Return ONLY usable student slots for the Student view.
    // Also return seeded samples (for optional display / teacher view).
    let studentsRaw = await TrialStudent.find({ trial_user_id: trialUserId }).sort({ created_at: 1 }).lean();

    if (!studentsRaw || studentsRaw.length === 0) {
      await ensureTrialSeedData(trialUserId);
      studentsRaw = await TrialStudent.find({ trial_user_id: trialUserId }).sort({ created_at: 1 }).lean();
    }

    const playable = studentsRaw
      .filter((s) => !s.is_sample)
      .map((s) => ({
      ...s,
      profile: s.profile ?? 1,
      last_score: s.last_score ?? 0,
        profile: s.profile ?? 1,
      attemptsLeft: computeAttemptsLeft(s),
    }));

    const samples = studentsRaw
      .filter((s) => !!s.is_sample)
      .map((s) => ({
        ...s,
        profile: s.profile ?? 1,
        last_score: s.last_score ?? 0,
        profile: s.profile ?? 1,
      }));

    return res.json({ success: true, playable, samples, total: studentsRaw.length });
  } catch (err) {
    console.error('GET /api/trial/students error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

// POST /api/trial/quiz/start
// body: { studentId, count? }

router.post('/quiz/start', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    const { studentId, count } = req.body || {};
    const n = Number(count || 15);

    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });

    await ensureTrialSeedData(trialUserId);

    const student = await TrialStudent.findOne({ _id: studentId, trial_user_id: trialUserId });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // Limit placement quiz attempts: 2 per day per student
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const attemptsToday = await QuizAttempt.countDocuments({
      trial_user_id: trialUserId,
      student_id: studentId,
      type: 'placement',
      created_at: { $gte: startOfDay },
    });
    if (attemptsToday >= 2) {
      return res.status(429).json({ success: false, error: 'Daily placement quiz attempt limit reached (2). Try again tomorrow.' });
    }


    // Fetch 15 random questions from "quizquestions"
    let questions = [];
    if (QuizQuestionModel) {
      const docs = await QuizQuestionModel.aggregate([
        { $match: { is_active: { $ne: false } } },
        { $sample: { size: Math.max(1, Math.min(50, n)) } },
      ]);

      questions = (docs || [])
        .map((q) => {
          const prompt = q.prompt || q.text || q.questionText || q.question || '';
          const choices = Array.isArray(q.choices) ? q.choices : [];
          const correctIndex = Number(q.correctIndex ?? q.correct_index ?? 0);
          const operation = q.operation || q.topic || '';
          return {
            question_id: q._id,
            prompt,
            operation,
            choices,
            correctIndex,
            difficulty: q.difficulty ?? null,
            topic: q.topic ?? null,
            subject: q.subject ?? null,
          };
        })
        .filter((q) => q.prompt && q.choices.length >= 2);
    }

    // If DB empty, fallback to generated arithmetic questions
    if (!questions.length) {
      const ops = ['add', 'sub', 'mul', 'div'];
      const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const makeQ = (op) => {
        const a = randInt(1, 20);
        const b = randInt(1, 20);
        let ans = a + b;
        let symbol = '+';
        if (op === 'sub') { ans = a - b; symbol = '-'; }
        if (op === 'mul') { ans = a * b; symbol = '×'; }
        if (op === 'div') { ans = Math.floor(a / (b || 1)); symbol = '÷'; }
        const correct = String(ans);
        const set = new Set([correct]);
        while (set.size < 4) set.add(String(ans + randInt(-5, 5)));
        const choices = Array.from(set);
        // shuffle
        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        return {
          question_id: null,
          prompt: `${a} ${symbol} ${b} = ?`,
          operation: op,
          choices,
          correctIndex: choices.indexOf(correct),
          difficulty: 1,
          topic: 'Placement',
          subject: 'Math',
        };
      };
      questions = Array.from({ length: n }, (_, i) => makeQ(ops[i % ops.length]));
    }


    const attempt = await QuizAttempt.create({
      trial_user_id: trialUserId,
      student_id: studentId,
      type: 'placement',
      total_questions: questions.length,
      correct_count: 0,
      score: 0,
      result_band: '',
      new_profile: student.profile || 1,
      questions: questions.map((q) => ({
        question_id: q.question_id,
        prompt: q.prompt,
        operation: q.operation,
        choices: q.choices,
        correctIndex: q.correctIndex,
        selectedIndex: null,
        isCorrect: false,
        difficulty: q.difficulty ?? null,
        topic: q.topic ?? null,
        subject: q.subject ?? null,
      })),
    });

    const safeQuestions = attempt.questions.map((q) => ({
      prompt: q.prompt,
      operation: q.operation,
      choices: q.choices,
    }));

    return res.json({ success: true, attemptId: attempt._id, questions: safeQuestions, total: safeQuestions.length });
  } catch (err) {
    console.error('POST /api/trial/quiz/start error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start quiz' });
  }
});

// POST /api/trial/quiz/submit
// body supports either:
//   { attemptId, studentId, answers: [0,1,2...] }  (ordered indices)
// OR
//   { attemptId, studentId, answers: [{ questionId, selectedIndex }, ...] }

router.post('/quiz/submit', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    const { attemptId, studentId, answers } = req.body || {};

    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!attemptId || !studentId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'attemptId, studentId and answers[] are required' });
    }

    const attempt = await QuizAttempt.findOne({ _id: attemptId, trial_user_id: trialUserId, student_id: studentId });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });

    const student = await TrialStudent.findOne({ _id: studentId, trial_user_id: trialUserId });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // Limit placement quiz attempts: 2 per day per student
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const attemptsToday = await QuizAttempt.countDocuments({
      trial_user_id: trialUserId,
      student_id: studentId,
      type: 'placement',
      created_at: { $gte: startOfDay },
    });
    if (attemptsToday >= 2) {
      return res.status(429).json({ success: false, error: 'Daily placement quiz attempt limit reached (2). Try again tomorrow.' });
    }


    const qs = attempt.questions || [];
    // answers[] can contain null/undefined for unanswered questions.
    // IMPORTANT: Number(null) === 0, so we must treat null as "unanswered" (not correct).
    for (let i = 0; i < qs.length; i++) {
      const raw = Array.isArray(answers) ? answers[i] : null;

      // Support both numeric indices and string indices.
      const hasAnswer = raw !== null && raw !== undefined && raw !== '' && raw !== -1;

      const selected = hasAnswer ? Number(raw) : null;
      const correct = Number(qs[i].correctIndex);

      const selectedIndex = Number.isFinite(selected) ? selected : null;
      qs[i].selectedIndex = selectedIndex;

      qs[i].isCorrect = Number.isFinite(selectedIndex) && selectedIndex === correct;
    }

    const total = qs.length;
    const correctCount = qs.filter((q) => q.isCorrect).length;
    const score = total ? Math.round((correctCount / total) * 100) : 0;

    const breakdown = { add: 0, sub: 0, mul: 0, div: 0 };
    for (const q of qs) {
      const k = opKey(q.operation);
      if (q.isCorrect) breakdown[k] += 1;
    }

    const newProfile = calcNewProfile(student.profile || 1, score);

    attempt.correct_count = correctCount;
    attempt.score = score;
    attempt.result_band = bandFromScore(score);
    attempt.new_profile = newProfile;
    attempt.questions = qs;
    await attempt.save();

    student.last_score = score;
    student.last_operation_breakdown = breakdown;
    student.profile = newProfile;

    const today = new Date().toISOString().slice(0, 10);
    if (student.last_attempt_date !== today) {
      student.last_attempt_date = today;
      student.attempts_today = 0;
    }
    student.attempts_today = Number(student.attempts_today || 0) + 1;

    const weakest = Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0]?.[0] || 'add';
    student.assigned_adaptive_topics = [weakest];

    await student.save();

    return res.json({
      success: true,
      score,
      correct: correctCount,
      total,
      result_band: attempt.result_band,
      new_profile: newProfile,
      operation_breakdown: breakdown,
      questions: qs.map((q) => ({
        prompt: q.prompt,
        operation: q.operation,
        choices: q.choices,
        selectedIndex: q.selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect: q.isCorrect,
      })),
    });
  } catch (err) {
    console.error('POST /api/trial/quiz/submit error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit quiz' });
  }
});

// GET /api/trial/teacher/overview
router.get('/teacher/overview', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const classId = String(req.query.classId || '');
    // Ensure seed exists
    await ensureTrialSeedData(trialUserId);

    const filter = { trial_user_id: trialUserId };
    if (classId) filter.class_id = classId;

    const studentsRaw = await TrialStudent.find(filter).sort({ created_at: 1 }).lean();
    const students = (studentsRaw || []).map((s) => ({
      ...s,
      profile: s.profile ?? 1,
      last_score: s.last_score ?? 0,
      last_operation_breakdown: s.last_operation_breakdown || { add: 0, sub: 0, mul: 0, div: 0 },
      assigned_adaptive_topics: s.assigned_adaptive_topics || [],
    }));

    const ranked = [...students].sort((a, b) => Number(b.last_score || 0) - Number(a.last_score || 0));

    return res.json({
      success: true,
      classId,
      students,
      leaderboard: ranked.map((s) => ({
        student_id: s._id,
        name: s.name,
        score: s.last_score ?? 0,
        profile: s.profile ?? 1,
      })),
    });
  } catch (err) {
    console.error('GET /api/trial/teacher/overview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load overview' });
  }
});

// GET /api/trial/teacher/student/:studentId
// Returns a single student's latest score + breakdown + recent attempts.
router.get('/teacher/student/:studentId', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    const { studentId } = req.params;
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });

    const student = await TrialStudent.findOne({ _id: studentId, trial_user_id: trialUserId }).lean();
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // Limit placement quiz attempts: 2 per day per student
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const attemptsToday = await QuizAttempt.countDocuments({
      trial_user_id: trialUserId,
      student_id: studentId,
      type: 'placement',
      created_at: { $gte: startOfDay },
    });
    if (attemptsToday >= 2) {
      return res.status(429).json({ success: false, error: 'Daily placement quiz attempt limit reached (2). Try again tomorrow.' });
    }


    const attempts = await QuizAttempt.find({ trial_user_id: trialUserId, student_id: studentId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      student: {
        ...student,
        profile: student.profile ?? 1,
        last_score: student.last_score ?? 0,
        last_operation_breakdown: student.last_operation_breakdown || { add: 0, sub: 0, mul: 0, div: 0 },
      },
      attempts: attempts.map((a) => ({
        _id: a._id,
        score_percent: a.score_percent ?? 0,
        correct: a.correct ?? 0,
        total: a.total ?? 0,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error('GET /api/trial/teacher/student/:studentId error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load student details' });
  }
});

module.exports = router;
