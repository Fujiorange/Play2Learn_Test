const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['starter', 'professional', 'enterprise'], 
    required: true 
  },
  organization_name: { type: String, required: true },
  teacher_limit: { type: Number, required: true },
  student_limit: { type: Number, required: true },
  price: { type: Number, required: true },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
  is_active: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// NOTE: Deliberately NOT adding a unique index on 'type' field
// Multiple licenses can have the same type (e.g., multiple "paid" licenses)

licenseSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('License', licenseSchema);
