const AssignedMovie = require('../../moduals/ScreeningModel');
const Theater = require('../../moduals/TheaterModel');
const Movie = require('../../moduals/MovieModel');
const Booking = require('../../moduals/BookingModel');
const mongoose = require('mongoose');

class BookingController {


  async listTheatersForMovie(req, res) {
    try {
      const { movieId } = req.params;
      const assignedTheaters = await AssignedMovie.aggregate([
        {
          $match: {
            movieId: new mongoose.Types.ObjectId(movieId)
          }
        },
        {
          $lookup: {
            from: 'theaters',
            localField: 'theaterId',
            foreignField: '_id',
            as: 'theaterInfo'
          }
        },
        { $unwind: '$theaterInfo' },
        {
          $project: {
            _id: 0,
            theaterId: '$theaterInfo._id',
            theaterName: '$theaterInfo.name',
            location: '$theaterInfo.location',
            screenNumber: 1,
            showTimings: 1
          }
        }
      ]);

      if (!assignedTheaters.length) {
        return res.status(404).json({ message: 'No theaters found for this movie.' });
      }

      res.status(200).json({
        movieId,
        totalTheaters: assignedTheaters.length,
        theaters: assignedTheaters
      });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  };

  async bookTickets(req, res) {
    try {
      const { movieId, theaterId, showTiming, numberOfTickets } = req.body;
      const userId = req.user.userId;

      // Validate required fields
      if (!movieId || !theaterId || !showTiming || !numberOfTickets) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: movieId, theaterId, showTiming, numberOfTickets'
        });
      }

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      // Check if theater exists
      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return res.status(404).json({ success: false, message: 'Theater not found' });
      }

      // Check if screening exists
      const screening = await AssignedMovie.findOne({
        movieId: movieId,
        theaterId: theaterId,
        showTimings: showTiming
      });

      if (!screening) {
        return res.status(404).json({
          success: false,
          message: 'No screening found for this movie, theater, and timing'
        });
      }

      // Check seat availability (assuming 100 seats per screen as default)
      const totalSeats = 100;
      const bookedSeats = await Booking.aggregate([
        {
          $match: {
            movieId: new mongoose.Types.ObjectId(movieId),
            theaterId: new mongoose.Types.ObjectId(theaterId),
            showTiming: showTiming,
            status: 'booked'
          }
        },
        {
          $group: {
            _id: null,
            totalBooked: { $sum: '$numberOfTickets' }
          }
        }
      ]);

      const currentlyBooked = bookedSeats.length > 0 ? bookedSeats[0].totalBooked : 0;
      const availableSeats = totalSeats - currentlyBooked;

      if (availableSeats < numberOfTickets) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableSeats} seats available. Requested: ${numberOfTickets}`
        });
      }

      // Create booking
      const booking = await Booking.create({
        userId,
        movieId,
        theaterId,
        showTiming,
        numberOfTickets
      });

      res.status(201).json({
        success: true,
        message: 'Booking successful',
        bookingId: booking._id,
        availableSeats: availableSeats - numberOfTickets
      });
    } catch (err) {
      console.error('Booking error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  };

  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.userId; // Get from authenticated user

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Check if user owns this booking
      if (booking.userId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You can only cancel your own bookings' });
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
      }

      // Update booking status to cancelled
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });

      res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
    } catch (err) {
      console.error('Cancel booking error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  };

  async getBookingHistory(req, res) {
    try {
      const { userId } = req.params;
      const authenticatedUserId = req.user.userId;

      // Check if user is requesting their own history or is admin
      if (userId !== authenticatedUserId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const bookings = await Booking.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'movies',
            localField: 'movieId',
            foreignField: '_id',
            as: 'movieDetails'
          }
        },
        {
          $lookup: {
            from: 'theaters',
            localField: 'theaterId',
            foreignField: '_id',
            as: 'theaterDetails'
          }
        },
        {
          $unwind: '$movieDetails'
        },
        {
          $unwind: '$theaterDetails'
        },
        {
          $project: {
            _id: 1,
            showTiming: 1,
            numberOfTickets: 1,
            bookingTime: 1,
            status: 1,
            movieName: '$movieDetails.name',
            theaterName: '$theaterDetails.name',
            theaterLocation: '$theaterDetails.location'
          }
        },
        { $sort: { bookingTime: -1 } }
      ]);

      res.status(200).json({ success: true, bookings });
    } catch (err) {
      console.error('Get booking history error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  };


}
module.exports = new BookingController();