const mongoose = require('mongoose');

const trialStudentSchema = new mongoose.Schema({
  trial_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrialClass',
    default: null,
  },
  name: { type: String, required: true },

  // Seeded demo data:
  // - is_sample=true: pre-filled student with random score/matrix
  // - is_sample=false: usable student slot for the trial user to take quizzes
  is_sample: { type: Boolean, default: false },

  // placement + progression
  profile: { type: Number, default: 1 }, // 1–10
  attempts_today: { type: Number, default: 0 },
  last_attempt_date: { type: String, default: null }, // "YYYY-MM-DD"
  consecutive_fails_under_50: { type: Number, default: 0 },

  // for teacher dashboard demo
  last_score: { type: Number, default: null }, // percent
  last_operation_breakdown: {
    add: { type: Number, default: 0 },
    sub: { type: Number, default: 0 },
    mul: { type: Number, default: 0 },
    div: { type: Number, default: 0 },
  },

  assigned_adaptive_topics: { type: [String], default: [] },

  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TrialStudent', trialStudentSchema);
