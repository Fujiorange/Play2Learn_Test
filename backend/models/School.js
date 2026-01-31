const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  organization_name: { type: String, required: true },
  organization_type: { type: String, default: 'school' },
  plan: { 
    type: String, 
    enum: ['starter', 'professional', 'enterprise'], 
    required: true 
  },
  plan_info: {
    teacher_limit: { type: Number, required: true },
    student_limit: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  contact: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  current_teachers: { type: Number, default: 0 },
  current_students: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

schoolSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('School', schoolSchema);
