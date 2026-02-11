const mongoose = require('mongoose');

const mathProfileSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
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
  
  // 🆕 ADAPTIVE QUIZ LEVEL - This was missing!
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

// 🔧 FIXED: Pre-save hook without next() callback
// Mongoose 6+ doesn't use callbacks in pre/post hooks
mathProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('MathProfile', mathProfileSchema);