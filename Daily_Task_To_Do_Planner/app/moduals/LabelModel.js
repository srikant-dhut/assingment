const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Label', labelSchema);

