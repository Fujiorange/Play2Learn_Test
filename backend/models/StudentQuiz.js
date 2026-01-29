const mongoose = require('mongoose');

const studentQuizSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_type: { type: String, enum: ['placement', 'regular'], required: true },
  profile_level: { type: Number, required: true },
  questions: [
    {
      question_text: String,
      operation: String,
      correct_answer: Number,
      student_answer: Number,
      is_correct: Boolean
    }
  ],
  score: { type: Number, default: 0 },
  total_questions: { type: Number, default: 15 },
  percentage: { type: Number, default: 0 },
  points_earned: { type: Number, default: 0 },
  completed_at: { type: Date, default: Date.now }
});

// Add indexes for performance optimization
studentQuizSchema.index({ student_id: 1, quiz_type: 1, completed_at: -1 }); // Compound index for common query pattern

module.exports = mongoose.model('StudentQuiz', studentQuizSchema);
