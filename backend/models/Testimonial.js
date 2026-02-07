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
  created_at: { type: Date, default: Date.now },
  // New fields for automated publishing
  published_to_landing: { type: Boolean, default: false },
  auto_published: { type: Boolean, default: false },
  published_date: { type: Date, default: null },
  last_updated: { type: Date, default: Date.now },
  featured_order: { type: Number, default: null }
});

// Add indexes for performance on frequently queried fields
testimonialSchema.index({ approved: 1, created_at: -1 });
testimonialSchema.index({ display_on_landing: 1 });
testimonialSchema.index({ published_to_landing: 1, published_date: -1 });
testimonialSchema.index({ rating: 1, sentiment_label: 1, published_date: -1 });

// Update last_updated timestamp on save
testimonialSchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
