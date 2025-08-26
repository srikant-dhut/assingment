const mongoose = require("mongoose");
const Joi = require("joi");

const examSchemaValidation = Joi.object({
  name: Joi.string().required(),
  batchId: Joi.string().required(),
  examDate: Joi.date().required(),
  duration: Joi.number().positive().required(),
  totalMarks: Joi.number().positive().required(),
  passingMarks: Joi.number().positive().required(),
  examType: Joi.string().valid('midterm', 'final', 'quiz', 'assignment', 'project'),
  instructions: Joi.string(),
  isActive: Joi.boolean()
});

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingMarks: {
      type: Number,
      required: true,
    },
    examType: {
      type: String,
      enum: ['midterm', 'final', 'quiz', 'assignment', 'project'],
      default: 'midterm',
    },
    instructions: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    results: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      marksObtained: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
      grade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
      },
      remarks: String,
      submittedAt: {
        type: Date,
        default: Date.now,
      }
    }],
    averageScore: {
      type: Number,
      default: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    lowestScore: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Index for better query performance
examSchema.index({ batchId: 1 });
examSchema.index({ examDate: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1 });
examSchema.index({ examType: 1 });

const Exam = mongoose.model("Exam", examSchema);
module.exports = { Exam, examSchemaValidation };
