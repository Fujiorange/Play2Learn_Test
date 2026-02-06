const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    trial_user_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    score_percent: Number,
    correct: Number,
    total: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrialAttempt', schema);
