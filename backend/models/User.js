const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true, lowercase: true },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['Platform Admin', 'School Admin', 'Teacher', 'Student', 'Parent', 'Trial Student', 'Trial Teacher'],
    required: true,
  },

  schoolId: { type: String, default: null },

  // ✅ dynamic profile fields
  contact: { type: String, default: null },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'], default: null },
  date_of_birth: { type: Date, default: null },

  // ✅ profile picture persisted in DB (URL or dataURL)
  profile_picture: { type: String, default: null },

  // Student-specific
  class: { type: String, default: null },
  gradeLevel: { type: String, default: null },
  username: { type: String, default: null },

  // Teacher-specific
  subject: { type: String, default: null },

  // Parent-specific
  linkedStudents: [
    {
      studentId: mongoose.Schema.Types.ObjectId,
      relationship: String,
    },
  ],

  emailVerified: { type: Boolean, default: false },
  accountActive: { type: Boolean, default: true },
  verificationToken: { type: String, default: null },

  createdBy: { type: String, default: null },
  isTrialUser: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
