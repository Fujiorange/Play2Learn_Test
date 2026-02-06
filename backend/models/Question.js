const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  choices: [{ type: String }],
  answer: { type: String, required: true },
  difficulty: { 
    type: Number, 
    enum: [1, 2, 3, 4, 5], 
    default: 3,
    required: true 
  },
  subject: { type: String, default: 'General' },
  topic: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

questionSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Question', questionSchema);
