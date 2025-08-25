const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true
  },
  theaterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theater",
    required: true
  },
  showTiming: {
    type: String,
    required: true
  },
  numberOfTickets: {
    type: Number,
    required: true
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  }
});

module.exports = mongoose.model("Booking", bookingSchema);



