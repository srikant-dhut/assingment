require('dotenv').config();
const mongoose = require("mongoose");
const Role = require("../moduals/RoleBasedModel");

const roles = [
  {
    name: 'student',
    permissions: [
      'read_user',
      'read_course',
      'read_batch',
      'read_enrollment',
      'read_attendance',
      'read_exam',
      'view_reports'
    ],
    description: 'Student role with limited access to view their own data and course information'
  },
  {
    name: 'teacher',
    permissions: [
      'read_user',
      'read_course',
      'read_batch',
      'create_batch',
      'update_batch',
      'read_enrollment',
      'mark_attendance',
      'read_attendance',
      'update_attendance',
      'create_exam',
      'read_exam',
      'update_exam',
      'delete_exam',
      'assign_marks',
      'view_reports',
      'generate_reports'
    ],
    description: 'Teacher role with access to manage batches, attendance, exams, and view reports'
  },
  {
    name: 'admin',
    permissions: [
      'create_user',
      'read_user',
      'update_user',
      'delete_user',
      'list_users',
      'create_course',
      'read_course',
      'update_course',
      'delete_course',
      'list_courses',
      'create_batch',
      'read_batch',
      'update_batch',
      'delete_batch',
      'list_batches',
      'create_enrollment',
      'read_enrollment',
      'update_enrollment',
      'delete_enrollment',
      'list_enrollments',
      'mark_attendance',
      'read_attendance',
      'update_attendance',
      'list_attendance',
      'create_exam',
      'read_exam',
      'update_exam',
      'delete_exam',
      'assign_marks',
      'list_exams',
      'generate_reports',
      'view_reports',
      'export_reports',
      'system_admin',
      'user_management',
      'role_management'
    ],
    description: 'Administrator role with full system access and management capabilities'
  }
];

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing roles
    await Role.deleteMany({});
    console.log('Cleared existing roles');

    // Insert new roles
    const createdRoles = await Role.insertMany(roles);
    console.log('Roles seeded successfully:', createdRoles.map(role => role.name));

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

// Run the seed function
seedRoles();
