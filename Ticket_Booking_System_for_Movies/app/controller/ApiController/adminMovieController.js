const Movie = require("../../moduals/MovieModel");
const Theater = require('../../moduals/TheaterModel');
const Screening = require("../../moduals/ScreeningModel");

class movieController {
  async addMovie(req, res) {
    try {
      const { name, genre, language, duration, cast, director, releaseDate } = req.body;

      if (!name || !genre || !language) {
        return res.status(400).json({ message: "Name, genre, and language are required" });
      }

      const newMovie = new Movie({
        name,
        genre,
        language,
        duration,
        cast,
        director,
        releaseDate,
      });

      await newMovie.save();
      res.status(201).json({ message: "Movie added successfully", data: newMovie });
    } catch (error) {
      res.status(500).json({ message: "Error adding movie", error: error.message });
    }
  };

  async addTheater(req, res) {
    try {
      const { name, location, numberOfScreens } = req.body;

      const newTheater = new Theater({ name, location, numberOfScreens });
      await newTheater.save();

      res.status(201).json({
        success: true,
        message: 'Theater added successfully',
        data: newTheater
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add theater',
        error: error.message
      });
    }
  };

  async getAllMovies(req, res) {
    try {
      const movies = await Movie.find();
      res.status(200).json({ movies });
    } catch (error) {
      res.status(500).json({ message: "Error fetching movies", error: error.message });
    }
  };

  async assignMovieToTheater(req, res) {
    try {
      const { theaterId, movieId, screenNumber, showTimings } = req.body;

      const screening = await Screening.create({
        theaterId,
        movieId,
        screenNumber,
        showTimings
      });

      res.status(201).json({
        success: true,
        message: 'Movie assigned to theater successfully',
        data: screening
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  async getAllMoviesWithTheater(req, res) {
    try {
      const movies = await Movie.aggregate([
        {
          $lookup: {
            from: 'screenings',
            localField: '_id',
            foreignField: 'movieId',
            as: 'theaterInfo'
          }
        },
        {
          $addFields: {
            totalTheaters: { $size: '$theaterInfo' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: movies
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  async editMovie(req, res) {
    try {
      const { movieId } = req.params;

      const updated = await Movie.findByIdAndUpdate(movieId, req.body, { new: true });

      if (!updated) {
        return res.status(404).json({ success: false, message: "Movie not found" });
      }

      res.status(200).json({
        success: true,
        message: "Movie updated successfully",
        data: updated
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  async deleteMovie(req, res) {
    try {
      const { movieId } = req.params;

      const deleted = await Movie.findByIdAndDelete(movieId);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Movie not found" });
      }

      res.status(200).json({
        success: true,
        message: "Movie deleted successfully"
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

};

module.exports = new movieController;

