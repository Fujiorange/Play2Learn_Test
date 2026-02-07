const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  choices: [{ type: String }],
  answer: { type: String, required: true },
  difficulty: { 
    type: Number, 
    min: 1,
    max: 10,
    default: 3,
    required: true 
  },
  quiz_level: {
    type: Number,
    min: 0,
    max: 20,
    default: 0
  },
  subject: { type: String, default: 'Mathematics' },
  topic: { type: String, default: '' },
  grade: { type: String, default: 'Primary 1' },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

questionSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Add indexes for performance on frequently queried fields
questionSchema.index({ is_active: 1, difficulty: 1 });
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ grade: 1 });
questionSchema.index({ quiz_level: 1, subject: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
