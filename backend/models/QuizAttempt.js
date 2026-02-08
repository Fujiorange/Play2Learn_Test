const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quiz_level: { type: Number, min: 1, max: 10, default: 1 },
  score: { type: Number, default: 0 },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    question_text: { type: String },
    difficulty: { type: Number },
    answer: { type: String },
    correct_answer: { type: String },
    isCorrect: { type: Boolean },
    answeredAt: { type: Date, default: Date.now }
  }],
  // Track all question IDs used in this attempt for uniqueness
  question_ids_used: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  current_difficulty: { type: Number, default: 1 },
  correct_count: { type: Number, default: 0 },
  total_answered: { type: Number, default: 0 },
  is_completed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeSpent: { type: Number } // in seconds
});

// Add compound index for efficient querying of user's attempts
quizAttemptSchema.index({ userId: 1, is_completed: 1 });
quizAttemptSchema.index({ userId: 1, startedAt: -1 });
quizAttemptSchema.index({ userId: 1, quiz_level: 1, startedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
