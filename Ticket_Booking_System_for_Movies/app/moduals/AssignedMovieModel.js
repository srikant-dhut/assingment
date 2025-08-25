const mongoose = require('mongoose');

const assignedMovieSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  screenNumber: {
    type: Number,
    required: true
  },
  showTimings: [{
    type: String,
    required: true
  }],
});


module.exports = mongoose.model('AssignedMovie', assignedMovieSchema);
