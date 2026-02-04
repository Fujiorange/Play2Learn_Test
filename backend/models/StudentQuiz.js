const mongoose = require('mongoose');

const studentQuizSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }, // Reference to P2L Admin created quiz
  quiz_type: { type: String, enum: ['placement', 'regular'], required: true },
  profile_level: { type: Number, required: true },
  questions: [
    {
      question_text: String,
      operation: String,
      correct_answer: mongoose.Schema.Types.Mixed, // Can be String or Number
      student_answer: mongoose.Schema.Types.Mixed,
      is_correct: Boolean
    }
  ],
  score: { type: Number, default: 0 },
  total_questions: { type: Number, default: 15 },
  percentage: { type: Number, default: 0 },
  points_earned: { type: Number, default: 0 },
  completed_at: { type: Date, default: Date.now }
});

// Add indexes for performance on frequently queried fields
studentQuizSchema.index({ student_id: 1, quiz_type: 1 });
studentQuizSchema.index({ student_id: 1, completed_at: -1 });

module.exports = mongoose.model('StudentQuiz', studentQuizSchema);
