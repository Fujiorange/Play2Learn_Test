const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  
  message: { 
    type: String, 
    required: true 
  },
  
  type: {
    type: String,
    enum: ['info', 'warning', 'critical', 'maintenance'],
    default: 'info'
  },
  
  is_active: { 
    type: Boolean, 
    default: true 
  },
  
  start_date: { 
    type: Date, 
    default: Date.now 
  },
  
  end_date: { 
    type: Date,
    default: null // null means no end date (broadcast until manually deactivated)
  },
  
  target_roles: [{
    type: String,
    enum: ['Student', 'Teacher', 'Parent', 'Trial Student', 'Trial Teacher', 'School Admin', 'all'],
    default: 'all'
  }],
  
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
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

maintenanceSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
