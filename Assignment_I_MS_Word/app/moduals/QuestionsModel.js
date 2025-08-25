const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }], // MCQ options
  correctAnswer: { type: String, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  answers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      answer: { type: String, required: true },
      submittedAt: { type: Date, default: Date.now },
      timezone: { type: String, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
