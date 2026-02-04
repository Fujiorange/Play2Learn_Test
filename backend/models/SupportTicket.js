const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student_name: { type: String, required: true },
  student_email: { type: String, required: true },
  subject: { type: String, required: true },
  category: { type: String, default: 'general' },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  resolved_at: { type: Date },
  admin_response: { type: String }
});

// Add indexes for performance on frequently queried fields
supportTicketSchema.index({ student_id: 1, created_at: -1 });
supportTicketSchema.index({ status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
