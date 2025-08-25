const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  dueDate: { type: Date },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  labelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Label' }],
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  order: { type: Number, default: 0 }, // For task ordering
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);


