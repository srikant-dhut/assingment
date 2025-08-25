const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  genre: {
    String
  },
  language: {
    String
  },
  duration: {
    String
  },
  cast: [String],
  director: {
    String
  },
  releaseDate: Date,
}, {
  timestamps: true
});

module.exports = mongoose.model("Movie", movieSchema);

