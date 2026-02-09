const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentLevel: { type: Number, default: 1 },
  totalPoints: { type: Number, default: 0 },
  badges: [{ type: String }],
  loginStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studentProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
