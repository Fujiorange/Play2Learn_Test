const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true  // Only name is unique - multiple licenses can have the same type
  },
  type: {
    type: String,
    required: true,
    enum: ['free', 'paid']  // Multiple licenses can share the same type (e.g., multiple "paid" licenses)
  },
  priceMonthly: {
    type: Number,
    required: true,
    default: 0
  },
  priceYearly: {
    type: Number,
    required: true,
    default: 0
  },
  maxTeachers: {
    type: Number,
    required: true,
    default: 1
  },
  maxStudents: {
    type: Number,
    required: true,
    default: 5
  },
  maxClasses: {
    type: Number,
    required: true,
    default: 1
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeletable: {
    type: Boolean,
    default: true
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

licenseSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('License', licenseSchema);
