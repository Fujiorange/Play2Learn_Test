
const mongoose = require('mongoose');

const QuestionSnapSchema = new mongoose.Schema(
  {
    question_id: { type: mongoose.Schema.Types.ObjectId, required: false },
    prompt: { type: String },
    text: { type: String },
    operation: { type: String },
    choices: { type: [String], default: [] },
    correctIndex: { type: Number, default: 0 },
    selectedIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    difficulty: { type: Number, default: null },
    topic: { type: String, default: null },
    subject: { type: String, default: null },
  },
  { _id: false }
);

const QuizAttemptSchema = new mongoose.Schema(
  {
    trial_user_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    type: { type: String, default: 'placement' },

    total_questions: { type: Number, default: 15 },
    correct_count: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    result_band: { type: String, default: '' },
    new_profile: { type: Number, default: 1 },

    questions: { type: [QuestionSnapSchema], default: [] },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'quizattempts' }
);

QuizAttemptSchema.pre('save', function () {
  this.updated_at = new Date();
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
