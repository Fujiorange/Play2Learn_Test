const mongoose = require('mongoose');

const TrialClassSchema = new mongoose.Schema(
  {
    trial_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    class_name: {
      type: String,
      default: 'Trial Class',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrialClass', TrialClassSchema);
