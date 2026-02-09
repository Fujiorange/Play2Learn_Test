const mongoose = require('mongoose');

const bulkUploadSessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  csvType: { 
    type: String, 
    enum: ['class', 'teacher', 'student'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed', 'partial'], 
    default: 'processing' 
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: true
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  fileName: { 
    type: String, 
    default: null 
  },
  totalRows: { 
    type: Number, 
    default: 0 
  },
  successfulRows: { 
    type: Number, 
    default: 0 
  },
  failedRows: { 
    type: Number, 
    default: 0 
  },
  createdEntities: [{
    entityType: { 
      type: String, 
      enum: ['class', 'teacher', 'student', 'parent'] 
    },
    entityId: { 
      type: mongoose.Schema.Types.ObjectId 
    },
    name: String,
    email: String,
    className: String
  }],
  uploadErrors: [{
    row: Number,
    field: String,
    message: String,
    data: mongoose.Schema.Types.Mixed
  }],
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date, 
    default: null 
  }
}, { suppressReservedKeysWarning: true });

// Add indexes for performance
bulkUploadSessionSchema.index({ schoolId: 1, timestamp: -1 });
// sessionId already indexed via unique: true
bulkUploadSessionSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('BulkUploadSession', bulkUploadSessionSchema);
