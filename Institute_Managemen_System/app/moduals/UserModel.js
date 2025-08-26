const mongoose = require("mongoose");
const Joi = require("joi");

const userSchemaValidation = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),
  phone: Joi.string()
    .length(10)
    .pattern(/[6-9]{1}[0-9]{9}/)
    .required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9@]{3,30}$")),
  role: Joi.string().valid("student", "teacher", "admin").required(),
  studentId: Joi.string().when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  teacherId: Joi.string().when('role', {
    is: 'teacher',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    studentId: {
      type: String,
      sparse: true,
    },
    teacherId: {
      type: String,
      sparse: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    }
  },
  { timestamps: true }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ teacherId: 1 });

const User = mongoose.model("User", userSchema);
module.exports = { User, userSchemaValidation };
