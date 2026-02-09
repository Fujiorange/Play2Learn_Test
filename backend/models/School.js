const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  organization_name: { type: String, required: true },
  organization_type: { type: String, default: 'school' },
  // Reference to License model
  licenseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'License',
    required: true
  },
  licenseExpiresAt: { 
    type: Date, 
    default: null 
  },
  contact: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  current_teachers: { type: Number, default: 0 },
  current_students: { type: Number, default: 0 },
  current_classes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

schoolSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('School', schoolSchema);
