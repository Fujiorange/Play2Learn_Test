// backend/models/QuizQuestion.js
// Compatibility model for an existing MongoDB collection named "quizquestions".
// This allows trial mode to pull questions from either `quizquestions` or `questions`.

const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema(
  {
    text: { type: String },
    prompt: { type: String },
    questionText: { type: String },
    choices: { type: [String], default: [] },
    options: { type: [String], default: [] },
    answer: { type: mongoose.Schema.Types.Mixed },
    correctIndex: { type: Number },
    difficulty: { type: Number },
    subject: { type: String },
    topic: { type: String },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

// IMPORTANT: bind to the existing collection name.
module.exports = mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', QuizQuestionSchema, 'quizquestions');
