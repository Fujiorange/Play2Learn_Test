const mongoose = require('mongoose');

/**
 * Unified Support Ticket Schema
 * Supports tickets from students, teachers, and parents
 * 
 * Migration Note: The legacy fields (student_id, student_name, student_email) are maintained
 * for backward compatibility with existing code that references these fields.
 * 
 * DEPRECATION TIMELINE:
 * - v1.0: Legacy fields added for backward compatibility
 * - v2.0 (planned): Remove legacy fields after migration of all existing tickets
 *                   and update of all consuming code to use user_* fields
 * 
 * To migrate existing tickets, run a database update script to copy:
 * - student_id → user_id
 * - student_name → user_name
 * - student_email → user_email
 * And set user_role to 'Student' for existing records
 */
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
  
  // DEPRECATED: Legacy field aliases for backward compatibility
  // TODO: Remove these fields in v2.0 after migration is complete
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student_name: { type: String },
  student_email: { type: String }
});

// Pre-save hook to sync legacy fields for backward compatibility
// This ensures data consistency while both field sets are in use
// TODO: Remove this hook when legacy fields are deprecated
// Note: Using async function means we don't need to call next() - Mongoose handles it automatically
supportTicketSchema.pre('save', async function() {
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
  // Also sync the other way for legacy code paths
  if (this.student_id && !this.user_id) {
    this.user_id = this.student_id;
  }
  if (this.student_name && !this.user_name) {
    this.user_name = this.student_name;
  }
  if (this.student_email && !this.user_email) {
    this.user_email = this.student_email;
  }
  // Async pre-save hooks in Mongoose 5+ don't need to call next()
  // The hook completes when the async function returns/resolves
});

// Add indexes for performance on frequently queried fields
supportTicketSchema.index({ user_id: 1, created_at: -1 });
supportTicketSchema.index({ student_id: 1, created_at: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
