const mongoose = require("mongoose");
const Joi = require("joi");

const courseSchemaValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  duration: Joi.string().required(),
  fees: Joi.number().positive().required(),
  category: Joi.string().required(),
  maxStudents: Joi.number().positive(),
  prerequisites: Joi.array().items(Joi.string()),
  syllabus: Joi.array().items(Joi.string()),
  isActive: Joi.boolean()
});

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    fees: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    maxStudents: {
      type: Number,
      default: 50,
    },
    prerequisites: [{
      type: String,
    }],
    syllabus: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalBatches: {
      type: Number,
      default: 0,
    },
    totalEnrollments: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Index for better query performance
courseSchema.index({ name: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ createdBy: 1 });

const Course = mongoose.model("Course", courseSchema);
module.exports = { Course, courseSchemaValidation };
