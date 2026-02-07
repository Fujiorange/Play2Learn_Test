const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  quiz_type: { type: String, enum: ['placement', 'adaptive'], default: 'adaptive' },
  quiz_level: { 
    type: Number, 
    min: 0, 
    max: 20, 
    default: 0 
  },
  auto_generated: { 
    type: Boolean, 
    default: false 
  },
  generation_date: { 
    type: Date 
  },
  questions: [{
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    text: { type: String },
    choices: [{ type: String }],
    answer: { type: String },
    difficulty: { type: Number, min: 1, max: 10, default: 3 },
    topic: { type: String }
  }],
  is_adaptive: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  adaptive_config: {
    target_correct_answers: { type: Number, default: 20 },
    difficulty_progression: { type: String, enum: ['gradual', 'immediate', 'ml-based'], default: 'immediate' },
    starting_difficulty: { type: Number, min: 1, max: 10, default: 1 },
    max_difficulty: { type: Number, min: 1, max: 10, default: 10 }
  },
  // Quiz launch system - Teachers/School Admin can launch quizzes
  is_launched: { type: Boolean, default: false },
  launched_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  launched_at: { type: Date, default: null },
  launched_for_classes: [{ type: String }], // Array of class names
  launched_for_school: { type: String, default: null }, // School ID for placement quizzes
  launch_start_date: { type: Date, default: null },
  launch_end_date: { type: Date, default: null },
  
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quizSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Add indexes for performance on frequently queried fields
quizSchema.index({ quiz_type: 1, is_active: 1 });
quizSchema.index({ is_launched: 1, is_active: 1 });
quizSchema.index({ quiz_level: 1, auto_generated: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
