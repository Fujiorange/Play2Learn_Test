const mongoose = require('mongoose');

// Schema for difficulty points configuration
// This allows P2L Admin to modify the points awarded/deducted per difficulty level
const skillPointsConfigSchema = new mongoose.Schema({
  // Unique identifier - should always be 'default' for the single config
  configId: { 
    type: String, 
    default: 'default', 
    unique: true 
  },
  
  // Points configuration for each difficulty level (1-5)
  difficultyPoints: {
    1: { 
      correct: { type: Number, default: 1 },
      wrong: { type: Number, default: -2.5 }
    },
    2: { 
      correct: { type: Number, default: 2 },
      wrong: { type: Number, default: -2.0 }
    },
    3: { 
      correct: { type: Number, default: 3 },
      wrong: { type: Number, default: -1.5 }
    },
    4: { 
      correct: { type: Number, default: 4 },
      wrong: { type: Number, default: -1.0 }
    },
    5: { 
      correct: { type: Number, default: 5 },
      wrong: { type: Number, default: -0.5 }
    }
  },
  
  // Metadata
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Ensure only one config document exists
skillPointsConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne({ configId: 'default' });
  if (!config) {
    config = await this.create({ configId: 'default' });
  }
  return config;
};

module.exports = mongoose.model('SkillPointsConfig', skillPointsConfigSchema);
