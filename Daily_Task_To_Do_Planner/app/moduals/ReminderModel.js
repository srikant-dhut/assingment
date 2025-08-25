const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  type: { type: String, enum: ['OneTime', 'Repeating'], required: true },
  notifyAt: { type: Date, required: true },
  repeatFrequency: { type: String, enum: ['Daily', 'Weekly', 'None'], default: 'None' },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
