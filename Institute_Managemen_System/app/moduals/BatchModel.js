const mongoose = require("mongoose");
const Joi = require("joi");

const batchSchemaValidation = Joi.object({
  name: Joi.string().required(),
  courseId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  assignedTeacher: Joi.string().required(),
  maxStudents: Joi.number().positive(),
  schedule: Joi.object({
    days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    startTime: Joi.string(),
    endTime: Joi.string(),
    room: Joi.string()
  }),
  isActive: Joi.boolean()
});

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxStudents: {
      type: Number,
      default: 30,
    },
    currentStudents: {
      type: Number,
      default: 0,
    },
    schedule: {
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      }],
      startTime: String,
      endTime: String,
      room: String,
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
    }
  },
  { timestamps: true }
);

// Index for better query performance
batchSchema.index({ courseId: 1 });
batchSchema.index({ assignedTeacher: 1 });
batchSchema.index({ isActive: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ startDate: 1 });

const Batch = mongoose.model("Batch", batchSchema);
module.exports = { Batch, batchSchemaValidation };
