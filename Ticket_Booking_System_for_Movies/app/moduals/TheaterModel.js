const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  screenNumber: {
    type: Number,
    required: true
  },
  timing: {
    type: String,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  }
});

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  numberOfScreens: {
    type: Number,
    required: true
  },
  shows: [showSchema]
});

module.exports = mongoose.model('Theater', theaterSchema);

