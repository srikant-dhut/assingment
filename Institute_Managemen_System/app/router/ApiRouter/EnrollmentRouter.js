const express = require("express");
const router = express.Router();
const {
  enrollStudent,
  getStudentEnrollments,
  getCourseEnrollments,
  updateEnrollmentStatus,
  cancelEnrollment,
  getEnrollmentStats,
} = require("../../controller/ApiController/enrollmentController");
const { checkAuthentication } = require("../../middlewere/checkAuthentication");
const { rbacMiddleware } = require("../../middlewere/rbacMiddleware");

// Student routes
router.post("/", checkAuthentication, rbacMiddleware(["student", "admin"]), enrollStudent);
router.get("/student/:studentId", checkAuthentication, rbacMiddleware(["student", "teacher", "admin"]), getStudentEnrollments);
router.put("/:enrollmentId/cancel", checkAuthentication, rbacMiddleware(["student", "admin"]), cancelEnrollment);

// Admin/Teacher routes
router.get("/course/:courseId", checkAuthentication, rbacMiddleware(["teacher", "admin"]), getCourseEnrollments);
router.put("/:enrollmentId", checkAuthentication, rbacMiddleware(["admin", "teacher"]), updateEnrollmentStatus);
router.get("/stats", checkAuthentication, rbacMiddleware(["admin", "teacher"]), getEnrollmentStats);

module.exports = router;
