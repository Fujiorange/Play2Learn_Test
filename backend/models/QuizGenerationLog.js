const mongoose = require('mongoose');

const quizGenerationLogSchema = new mongoose.Schema({
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quiz_level: { type: Number, min: 1, max: 10, required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  trigger_type: { 
    type: String, 
    enum: ['new_enrollment', 'completion', 'time_based', 'question_pool_refresh', 'admin_trigger'],
    required: true
  },
  trigger_details: { type: String, default: '' },
  questions_selected: { type: Number, default: 0 },
  freshness_score: { type: Number, default: 0 },
  difficulty_distribution: { type: mongoose.Schema.Types.Mixed, default: {} },
  success: { type: Boolean, default: true },
  error_message: { type: String, default: '' },
  generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for efficient querying
quizGenerationLogSchema.index({ quiz_level: 1, createdAt: -1 });
quizGenerationLogSchema.index({ trigger_type: 1 });
quizGenerationLogSchema.index({ student_id: 1, createdAt: -1 });

module.exports = mongoose.model('QuizGenerationLog', quizGenerationLogSchema);
