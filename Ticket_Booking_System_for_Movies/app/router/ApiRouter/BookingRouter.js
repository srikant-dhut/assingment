const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middlewere/checkAuthentication");
const checkRole = require("../../middlewere/rbacMiddleware");
const BookingController = require("../../controller/ApiController/bookingController");


router.get('/:movieId/theaters', authenticateToken, checkRole(["admin"]), BookingController.listTheatersForMovie);
router.post('/bookings', authenticateToken, BookingController.bookTickets);
router.delete('/bookings/cancel/:bookingId', authenticateToken, BookingController.cancelBooking);
router.get('/bookings/history/:userId', authenticateToken, BookingController.getBookingHistory);


module.exports = router