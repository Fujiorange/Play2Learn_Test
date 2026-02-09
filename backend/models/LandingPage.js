const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
  blocks: [{
    type: { 
      type: String, 
      enum: ['hero', 'features', 'about', 'roadmap', 'testimonials', 'pricing', 'contact', 'footer'],
      required: true 
    },
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    image_url: { type: String, default: '' },
    order: { type: Number, default: 0 },
    is_visible: { type: Boolean, default: true },
    custom_data: { type: mongoose.Schema.Types.Mixed, default: {} }
  }],
  is_active: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

landingPageSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('LandingPage', landingPageSchema);
