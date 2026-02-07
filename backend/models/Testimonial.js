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

// Add pre-save hook to automatically set display_on_landing based on criteria
testimonialSchema.pre('save', function(next) {
  // Auto-launch testimonials with >4 stars (rating of 5) and positive sentiment
  // This only applies to:
  // 1. New testimonials
  // 2. Existing testimonials where rating or sentiment changes TO meet criteria
  // Manual admin overrides (setting display_on_landing = false) are preserved
  
  if (this.isNew) {
    // For new testimonials, set display_on_landing based on criteria
    if (this.rating > 4 && this.sentiment_label === 'positive') {
      this.display_on_landing = true;
    } else {
      this.display_on_landing = false;
    }
  } else if (this.isModified('rating') || this.isModified('sentiment_label')) {
    // For existing testimonials, only auto-launch if criteria NOW met
    // Don't auto-remove if criteria no longer met (manual removal only)
    if (this.rating > 4 && this.sentiment_label === 'positive') {
      this.display_on_landing = true;
    }
  }
  // If display_on_landing is explicitly set (e.g., by admin), it's preserved
  
  next();
});

// Add indexes for performance on frequently queried fields
testimonialSchema.index({ approved: 1, created_at: -1 });
testimonialSchema.index({ display_on_landing: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
