const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  class_name: { 
    type: String, 
    required: true,
    trim: true
  },
  grade: { 
    type: String, 
    required: true,
    enum: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    default: 'Primary 1'
  },
  teachers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  subjects: [{
    type: String,
    enum: ['Mathematics', 'Science', 'English'],
    default: 'Mathematics'
  }],
  school_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: true
  },
  is_active: { 
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

// Pre-save middleware to update the updatedAt field
classSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Virtual for student count
classSchema.virtual('studentCount').get(function() {
  return this.students ? this.students.length : 0;
});

// Virtual for teacher count
classSchema.virtual('teacherCount').get(function() {
  return this.teachers ? this.teachers.length : 0;
});

// Ensure virtuals are included when converting to JSON
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
