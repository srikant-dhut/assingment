const express = require("express");
const router = express.Router();
const {
  markAttendance,
  viewAttendance,
  updateAttendance,
  getAttendanceSummary,
  toggleAttendanceLock,
} = require("../../controller/ApiController/attendanceController");
const { checkAuthentication } = require("../../middlewere/checkAuthentication");
const { rbacMiddleware } = require("../../middlewere/rbacMiddleware");

// Teacher routes
router.post("/", checkAuthentication, rbacMiddleware(["teacher", "admin"]), markAttendance);
router.put("/:attendanceId", checkAuthentication, rbacMiddleware(["teacher", "admin"]), updateAttendance);
router.put("/:attendanceId/lock", checkAuthentication, rbacMiddleware(["teacher", "admin"]), toggleAttendanceLock);

// Student/Teacher routes
router.get("/", checkAuthentication, rbacMiddleware(["student", "teacher", "admin"]), viewAttendance);
router.get("/summary", checkAuthentication, rbacMiddleware(["student", "teacher", "admin"]), getAttendanceSummary);

module.exports = router;
