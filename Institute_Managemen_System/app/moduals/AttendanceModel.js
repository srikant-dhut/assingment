const mongoose = require("mongoose");
const Joi = require("joi");

const attendanceSchemaValidation = Joi.object({
  batchId: Joi.string().required(),
  date: Joi.date().required(),
  students: Joi.array().items(Joi.object({
    studentId: Joi.string().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    remarks: Joi.string()
  })).required(),
  markedBy: Joi.string().required()
});

const attendanceSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    students: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        required: true,
      },
      remarks: {
        type: String,
      },
      markedAt: {
        type: Date,
        default: Date.now,
      }
    }],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    lateCount: {
      type: Number,
      default: 0,
    },
    excusedCount: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
    }
  },
  { timestamps: true }
);

// Index for better query performance
attendanceSchema.index({ batchId: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ markedBy: 1 });
attendanceSchema.index({ batchId: 1, date: 1 }, { unique: true });

// Compound index for unique attendance per batch per date
attendanceSchema.index({ batchId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = { Attendance, attendanceSchemaValidation };
