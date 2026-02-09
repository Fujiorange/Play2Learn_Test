const mongoose = require('mongoose');

const quizGenerationTrackingSchema = new mongoose.Schema({
  grade: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  quizLevel: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10
  },
  questionCount: { 
    type: Number, 
    default: 0 
  },
  lastChecked: { 
    type: Date, 
    default: Date.now 
  },
  lastGenerated: { 
    type: Date, 
    default: null 
  },
  generatedQuizzes: [{
    quizId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Quiz' 
    },
    generatedAt: { 
      type: Date, 
      default: Date.now 
    },
    questionCount: { 
      type: Number, 
      default: 20 
    }
  }],
  autoGenerationEnabled: { 
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
quizGenerationTrackingSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Add compound index for quick lookups
quizGenerationTrackingSchema.index({ grade: 1, subject: 1, quizLevel: 1 }, { unique: true });
quizGenerationTrackingSchema.index({ questionCount: 1, autoGenerationEnabled: 1 });

module.exports = mongoose.model('QuizGenerationTracking', quizGenerationTrackingSchema);
