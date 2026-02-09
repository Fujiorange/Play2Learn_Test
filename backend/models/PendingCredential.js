const mongoose = require('mongoose');

const pendingCredentialSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  email: { 
    type: String, 
    required: true 
  },
  tempPassword: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: true
  },
  classAssigned: { 
    type: String, 
    default: null 
  },
  linkedParentEmail: { 
    type: String, 
    default: null 
  },
  sent: { 
    type: Boolean, 
    default: false 
  },
  sentAt: { 
    type: Date, 
    default: null 
  },
  sentBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    // Credentials expire after 30 days if not sent
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});

// Add indexes for performance
pendingCredentialSchema.index({ schoolId: 1, sent: 1 });
// userId already indexed via unique: true
pendingCredentialSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('PendingCredential', pendingCredentialSchema);
