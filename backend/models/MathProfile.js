const mongoose = require('mongoose');

const mathProfileSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  current_profile: { type: Number, default: 1, min: 1, max: 10 },
  placement_completed: { type: Boolean, default: false },
  total_points: { type: Number, default: 0 },
  consecutive_fails: { type: Number, default: 0 },
  quizzes_today: { type: Number, default: 0 },
  last_reset_date: { type: Date, default: Date.now },
  streak: { type: Number, default: 0 },
  last_quiz_date: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MathProfile', mathProfileSchema);
