const mongoose = require('mongoose');

const mathSkillSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill_name: { type: String, required: true },
  current_level: { type: Number, default: 0, min: 0, max: 5 },
  xp: { type: Number, default: 0 },
  // New points field for difficulty-based scoring (minimum 0)
  points: { type: Number, default: 0, min: 0 },
  unlocked: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

mathSkillSchema.index({ student_id: 1, skill_name: 1 }, { unique: true });

module.exports = mongoose.model('MathSkill', mathSkillSchema);
