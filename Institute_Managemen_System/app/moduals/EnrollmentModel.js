const mongoose = require("mongoose");
const Joi = require("joi");

const enrollmentSchemaValidation = Joi.object({
  studentId: Joi.string().required(),
  courseId: Joi.string().required(),
  batchId: Joi.string().required(),
  enrollmentDate: Joi.date(),
  status: Joi.string().valid('active', 'completed', 'dropped', 'suspended'),
  paymentStatus: Joi.string().valid('pending', 'partial', 'completed', 'failed'),
  amountPaid: Joi.number().min(0),
  totalAmount: Joi.number().positive()
});

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'suspended'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'failed'],
      default: 'pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    completionDate: {
      type: Date,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    },
    remarks: {
      type: String,
    },
    certificates: [{
      name: String,
      issuedDate: Date,
      certificateUrl: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

// Index for better query performance
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ batchId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });

// Compound index for unique enrollment
enrollmentSchema.index({ studentId: 1, courseId: 1, batchId: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
module.exports = { Enrollment, enrollmentSchemaValidation };
