// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Platform Admin', 'School Admin', 'Teacher', 'Student', 'Parent', 'Trial Student', 'Trial Teacher'],
    required: true
  },
  schoolId: {
    type: String,
    default: null
  },
  // Student-specific fields
  class: {
    type: String,
    default: null
  },
  gradeLevel: {
    type: String,
    default: null
  },
  // Teacher-specific fields
  subject: {
    type: String,
    default: null
  },
  // Parent-specific fields
  linkedStudents: [{
    studentId: mongoose.Schema.Types.ObjectId,
    relationship: String
  }],
  // Account status
  emailVerified: {
    type: Boolean,
    default: false
  },
  accountActive: {
    type: Boolean,
    default: true
  },
  verificationToken: {
    type: String,
    default: null
  },
  // Metadata
  createdBy: {
    type: String,
    default: null
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

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
