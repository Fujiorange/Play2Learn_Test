const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student_name: { type: String, required: true },
  student_email: { type: String },
  title: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  message: { type: String, required: true },
  approved: { type: Boolean, default: false },
  display_on_landing: { type: Boolean, default: false },
  user_role: { type: String, enum: ['Student', 'Parent', 'Teacher'], default: 'Student' },
  sentiment_score: { type: Number, default: 0 },
  sentiment_label: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
  created_at: { type: Date, default: Date.now }
});

// Add indexes for performance on frequently queried fields
testimonialSchema.index({ approved: 1, created_at: -1 });
testimonialSchema.index({ display_on_landing: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
