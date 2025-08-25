const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewere/checkAuthentication");
const ReportController = require('../../controller/ApiController/ReportController');

router.get('/getTaskSummary', authMiddleware, ReportController.getTaskSummary);
router.get('/getTaskStatistics', authMiddleware, ReportController.getTaskStatistics);
router.post('/send-Task-Summary-Email', authMiddleware, ReportController.sendTaskSummaryEmail);

module.exports = router;
