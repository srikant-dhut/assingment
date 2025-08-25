const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema({
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  screenNumber: String,
  showTimings: [String]
});

module.exports = mongoose.model('Screening', screeningSchema);

