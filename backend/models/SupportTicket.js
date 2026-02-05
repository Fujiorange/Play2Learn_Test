const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // User information - generic for student, teacher, or parent
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  user_role: { type: String, enum: ['Student', 'Teacher', 'Parent'], default: 'Student' },
  
  // School information
  school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  school_name: { type: String },
  
  // Ticket details
  subject: { type: String, required: true },
  category: { type: String, enum: ['website', 'school', 'general'], default: 'general' },
  message: { type: String, required: true },
  
  // Status: open (new), pending (admin has read), closed (resolved)
  status: { type: String, enum: ['open', 'pending', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  closed_at: { type: Date },
  
  // Admin response
  admin_response: { type: String },
  responded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responded_at: { type: Date },
  
  // Legacy field aliases for backward compatibility
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student_name: { type: String },
  student_email: { type: String }
});

// Pre-save hook to sync legacy fields
supportTicketSchema.pre('save', function(next) {
  // Sync user fields to legacy student fields for backward compatibility
  if (this.user_id && !this.student_id) {
    this.student_id = this.user_id;
  }
  if (this.user_name && !this.student_name) {
    this.student_name = this.user_name;
  }
  if (this.user_email && !this.student_email) {
    this.student_email = this.user_email;
  }
  // Also sync the other way if needed
  if (this.student_id && !this.user_id) {
    this.user_id = this.student_id;
  }
  if (this.student_name && !this.user_name) {
    this.user_name = this.student_name;
  }
  if (this.student_email && !this.user_email) {
    this.user_email = this.student_email;
  }
  next();
});

// Add indexes for performance on frequently queried fields
supportTicketSchema.index({ user_id: 1, created_at: -1 });
supportTicketSchema.index({ student_id: 1, created_at: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
