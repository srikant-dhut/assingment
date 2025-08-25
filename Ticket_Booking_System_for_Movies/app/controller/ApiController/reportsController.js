const AssignedMovie = require('../../moduals/ScreeningModel');
const Theater = require('../../moduals/TheaterModel');
const Movie = require('../../moduals/MovieModel');
const Booking = require('../../moduals/BookingModel');
const User = require('../../moduals/UserModel');
const mongoose = require('mongoose');
const sendEmailVerificationOTP = require("../../helper/smsValidation");

class ReportController {
    async getTotalBookingsPerMovie(req, res) {
        try {
            const result = await Booking.aggregate([
                {
                    $group: {
                        _id: '$movie',
                        totalTickets: { $sum: '$numberOfTickets' }
                    }
                },
                {
                    $lookup: {
                        from: 'movies',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'movieDetails'
                    }
                },
                { $unwind: '$movieDetails' },
                {
                    $project: {
                        movieId: '$_id',
                        movieName: '$movieDetails.name',
                        totalTickets: 1,
                        _id: 0
                    }
                }
            ]);

            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    async getBookingsByTheater(req, res) {
        try {
            const result = await Booking.aggregate([
                {
                    $group: {
                        _id: {
                            theater: '$theater',
                            movie: '$movie',
                            showTiming: '$showTiming'
                        },
                        totalTickets: { $sum: '$numberOfTickets' }
                    }
                },
                {
                    $lookup: {
                        from: 'theaters',
                        localField: '_id.theater',
                        foreignField: '_id',
                        as: 'theaterDetails'
                    }
                },
                { $unwind: '$theaterDetails' },
                {
                    $lookup: {
                        from: 'movies',
                        localField: '_id.movie',
                        foreignField: '_id',
                        as: 'movieDetails'
                    }
                },
                { $unwind: '$movieDetails' },
                {
                    $project: {
                        theaterId: '$_id.theater',
                        theaterName: '$theaterDetails.name',
                        movieName: '$movieDetails.name',
                        showTiming: '$_id.showTiming',
                        totalTickets: 1,
                        _id: 0
                    }
                },
                {
                    $sort: {
                        theaterName: 1,
                        movieName: 1,
                        showTiming: 1
                    }
                }
            ]);

            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    };

    async sendBookingSummaryToUserEmail(req, res) {
        try {
            const { userId } = req.params;

            // Get user details
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Get user's booking history with details
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
                { $unwind: '$movieDetails' },
                { $unwind: '$theaterDetails' },
                {
                    $project: {
                        _id: 1,
                        movieName: '$movieDetails.name',
                        theaterName: '$theaterDetails.name',
                        theaterLocation: '$theaterDetails.location',
                        showTiming: '$showTiming',
                        numberOfTickets: 1,
                        bookingTime: 1,
                        status: 1
                    }
                },
                { $sort: { bookingTime: -1 } }
            ]);

            if (bookings.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No bookings found for this user'
                });
            }

            // Generate HTML table for email
            const tableRows = bookings.map(booking => `
                <tr>
                    <td>${booking.movieName}</td>
                    <td>${booking.theaterName}</td>
                    <td>${booking.theaterLocation}</td>
                    <td>${booking.showTiming}</td>
                    <td>${booking.numberOfTickets}</td>
                    <td>${new Date(booking.bookingTime).toLocaleDateString()}</td>
                    <td>${booking.status}</td>
                </tr>
            `).join('');

            const htmlContent = `
                <html>
                <head>
                    <style>
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>🎬 Your Movie Booking Summary</h2>
                    </div>
                    <p>Dear ${user.name},</p>
                    <p>Here's a summary of all your movie bookings:</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Movie</th>
                                <th>Theater</th>
                                <th>Location</th>
                                <th>Show Time</th>
                                <th>Tickets</th>
                                <th>Booking Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <p>Total Bookings: ${bookings.length}</p>
                    <p>Thank you for choosing our movie booking service!</p>
                </body>
                </html>
            `;

            // Send email using existing email helper
            const emailData = {
                to: user.email,
                subject: '🎬 Your Movie Booking Summary',
                html: htmlContent
            };

            // Use the existing email helper to send the email
            await sendEmailVerificationOTP(req, user, emailData);

            res.status(200).json({
                success: true,
                message: 'Booking summary sent to your email successfully',
                totalBookings: bookings.length
            });

        } catch (err) {
            console.error('Error sending booking summary:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    };

}

module.exports = new ReportController();