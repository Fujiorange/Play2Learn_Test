const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentLevel: { type: Number, default: 1, min: 1, max: 10 }, // Current quiz level (1-10)
  gameboard_position: { type: Number, default: 1, min: 1, max: 10 }, // Visual gameboard position (1-10)
  character_type: { type: String, default: 'neutral' }, // Avatar type based on gender
  totalPoints: { type: Number, default: 0 },
  badges: [{ type: String }],
  loginStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  lastQuizTaken: { type: Date }, // Last quiz completion timestamp
  performanceHistory: [{ // History of performance scores
    quizLevel: { type: Number },
    performanceScore: { type: Number },
    completedAt: { type: Date }
  }],
  quiz_history: [{ // Detailed quiz attempt history for gameboard
    level_attempted: { type: Number, required: true },
    P_score: { type: Number, required: true },
    next_level: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studentProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
