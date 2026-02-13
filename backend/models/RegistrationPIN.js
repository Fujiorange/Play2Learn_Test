// backend/models/RegistrationPIN.js
const mongoose = require('mongoose');

const registrationPINSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    length: 6
  },
  registrationData: {
    institutionName: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    referralSource: {
      type: String,
      default: null
    }
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for automatic deletion of expired records
registrationPINSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if PIN is expired
registrationPINSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

const RegistrationPIN = mongoose.model('RegistrationPIN', registrationPINSchema);

module.exports = RegistrationPIN;
