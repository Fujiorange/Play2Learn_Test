const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  questions: [{
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    text: { type: String },
    choices: [{ type: String }],
    answer: { type: String },
    difficulty: { type: Number, enum: [1, 2, 3], default: 2 }
  }],
  is_adaptive: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quizSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Quiz', quizSchema);
