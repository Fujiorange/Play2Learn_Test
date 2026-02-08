const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  quiz_type: { type: String, enum: ['placement', 'adaptive'], default: 'adaptive' },
  quiz_level: { type: Number, min: 1, max: 10, default: 1 },
  questions: [{
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    text: { type: String },
    choices: [{ type: String }],
    answer: { type: String },
    difficulty: { type: Number, enum: [1, 2, 3, 4, 5], default: 3 },
    position: { type: Number },
    starting_difficulty: { type: Number }
  }],
  is_adaptive: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  adaptive_config: {
    target_correct_answers: { type: Number, default: 10 },
    difficulty_progression: { type: String, enum: ['gradual', 'immediate', 'ml-based'], default: 'gradual' },
    starting_difficulty: { type: Number, enum: [1, 2, 3, 4, 5], default: 1 }
  },
  // Quiz launch system - Teachers/School Admin can launch quizzes
  is_launched: { type: Boolean, default: false },
  launched_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  launched_at: { type: Date, default: null },
  launched_for_classes: [{ type: String }], // Array of class names
  launched_for_school: { type: String, default: null }, // School ID for placement quizzes
  launch_start_date: { type: Date, default: null },
  launch_end_date: { type: Date, default: null },
  
  // Auto-generation tracking
  is_auto_generated: { type: Boolean, default: false },
  generation_trigger: { 
    type: String, 
    enum: ['manual', 'new_enrollment', 'completion', 'time_based', 'question_pool_refresh', 'admin_trigger'],
    default: 'manual'
  },
  generation_criteria: { type: String, default: '' },
  unique_hash: { type: String, default: '' },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  freshness_score: { type: Number, default: 0 },
  
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
quizSchema.index({ quiz_level: 1, is_active: 1 });
quizSchema.index({ is_auto_generated: 1 });
quizSchema.index({ student_id: 1, quiz_level: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
