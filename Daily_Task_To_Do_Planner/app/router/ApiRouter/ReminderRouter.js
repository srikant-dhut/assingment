const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const ReminderController = require("../../controller/ApiController/ReminderController");



router.post('/addReminder', authMiddleware, ReminderController.addReminder);
router.put('/editReminder/:id', authMiddleware, ReminderController.editReminder);
router.delete('/deleteReminder/:id', authMiddleware, ReminderController.deleteReminder);

module.exports = router;