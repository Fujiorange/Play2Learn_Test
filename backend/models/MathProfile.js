const mongoose = require('mongoose');

const mathProfileSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
  // Legacy field: Used by old quiz system (kept for backward compatibility)
  current_profile: { 
    type: Number, 
    default: 1, 
    min: 1, 
    max: 10 
  },
  
  placement_completed: { 
    type: Boolean, 
    default: false 
  },
  
  total_points: { 
    type: Number, 
    default: 0 
  },
  
  consecutive_fails: { 
    type: Number, 
    default: 0 
  },
  
  quizzes_today: { 
    type: Number, 
    default: 0 
  },
  
  last_reset_date: { 
    type: Date, 
    default: Date.now 
  },
  
  streak: { 
    type: Number, 
    default: 0 
  },
  
  last_quiz_date: { 
    type: Date 
  },
  
  // ✅ CRITICAL FIX: Adaptive Quiz Level field
  // This field is set by the placement quiz and determines which levels are unlocked in Quiz Journey
  // When placement quiz is completed, this field is set to the assigned level (1-10)
  // When an adaptive quiz is completed, this field is updated to unlock the next level
  adaptive_quiz_level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add indexes for performance on frequently queried fields
mathProfileSchema.index({ student_id: 1 }, { unique: true });
mathProfileSchema.index({ total_points: -1 }); // For leaderboard sorting
mathProfileSchema.index({ adaptive_quiz_level: 1 }); // For adaptive quiz filtering
mathProfileSchema.index({ current_profile: 1 }); // For legacy quiz system

// ✅ FIXED: Pre-save hook without next() callback
// Mongoose 6+ doesn't use callbacks in pre/post hooks
mathProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// ✅ ADDED: Virtual field to always sync adaptive_quiz_level with current_profile
// This ensures that if only current_profile is set, adaptive_quiz_level gets the same value
mathProfileSchema.pre('save', function() {
  // If adaptive_quiz_level is not set but current_profile is, sync them
  if (!this.adaptive_quiz_level && this.current_profile) {
    this.adaptive_quiz_level = this.current_profile;
  }
  
  // If both are set and different, use the higher value (student benefit)
  if (this.adaptive_quiz_level && this.current_profile) {
    const maxLevel = Math.max(this.adaptive_quiz_level, this.current_profile);
    this.adaptive_quiz_level = maxLevel;
    this.current_profile = maxLevel;
  }
});

module.exports = mongoose.model('MathProfile', mathProfileSchema);