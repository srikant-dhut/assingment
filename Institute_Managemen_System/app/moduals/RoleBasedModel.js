const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['student', 'teacher', 'admin']
  },
  permissions: {
    type: [String],
    required: true,
    enum: [
      // User Management
      'create_user', 'read_user', 'update_user', 'delete_user', 'list_users',
      // Course Management
      'create_course', 'read_course', 'update_course', 'delete_course', 'list_courses',
      // Batch Management
      'create_batch', 'read_batch', 'update_batch', 'delete_batch', 'list_batches',
      // Enrollment Management
      'create_enrollment', 'read_enrollment', 'update_enrollment', 'delete_enrollment', 'list_enrollments',
      // Attendance Management
      'mark_attendance', 'read_attendance', 'update_attendance', 'list_attendance',
      // Exam Management
      'create_exam', 'read_exam', 'update_exam', 'delete_exam', 'assign_marks', 'list_exams',
      // Reports
      'generate_reports', 'view_reports', 'export_reports',
      // System
      'system_admin', 'user_management', 'role_management'
    ]
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index for better query performance
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

module.exports = mongoose.model("Role", roleSchema);

