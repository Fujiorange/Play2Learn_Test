const mongoose = require('mongoose');

const marketSurveySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['registration_referral', 'auto_renewal_disable', 'subscription_cancel'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  otherReason: {
    type: String,
    default: null
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null
  },
  schoolName: {
    type: String,
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
marketSurveySchema.index({ type: 1, createdAt: -1 });
marketSurveySchema.index({ schoolId: 1 });

module.exports = mongoose.model('MarketSurvey', marketSurveySchema);
