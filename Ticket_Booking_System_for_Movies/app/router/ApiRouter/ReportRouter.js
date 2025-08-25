const express = require('express');
const router = express.Router();
const authenticateToken = require("../../middlewere/checkAuthentication");
const checkRole = require("../../middlewere/rbacMiddleware");
const ReportController = require('../../controller/ApiController/reportsController');

router.get('/movies/bookings/per/total/movie', authenticateToken, checkRole(["admin"]), ReportController.getTotalBookingsPerMovie);
router.get('/theaters/bookings/by/theater', authenticateToken, checkRole(["admin"]), ReportController.getBookingsByTheater);
router.post('/send-booking-summary/:userId', authenticateToken, ReportController.sendBookingSummaryToUserEmail);

module.exports = router;
