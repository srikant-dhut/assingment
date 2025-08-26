const express = require("express");
const router = express.Router();
const {
  createExam,
  assignMarks,
  fetchExamResults,
  updateExam,
  deleteExam,
  getExamById,
  listExams,
} = require("../../controller/ApiController/examController");
const { checkAuthentication } = require("../../middlewere/checkAuthentication");
const { rbacMiddleware } = require("../../middlewere/rbacMiddleware");

// Public routes (no authentication required)
router.get("/", listExams);
router.get("/:examId", getExamById);

// Admin/Teacher routes
router.post("/", checkAuthentication, rbacMiddleware(["admin", "teacher"]), createExam);
router.put("/:examId", checkAuthentication, rbacMiddleware(["admin", "teacher"]), updateExam);
router.delete("/:examId", checkAuthentication, rbacMiddleware(["admin", "teacher"]), deleteExam);

// Teacher routes
router.post("/:examId/assign-marks", checkAuthentication, rbacMiddleware(["teacher", "admin"]), assignMarks);

// Student/Teacher routes
router.get("/results", checkAuthentication, rbacMiddleware(["student", "teacher", "admin"]), fetchExamResults);

module.exports = router;
