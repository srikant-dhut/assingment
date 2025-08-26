const express = require("express");
const router = express.Router();
const {
  addCourse,
  editCourse,
  deleteCourse,
  listCourses,
  getCourseById,
  getCourseStats,
  getCourseCategories,
} = require("../../controller/ApiController/courseController");
const { checkAuthentication } = require("../../middlewere/checkAuthentication");
const { rbacMiddleware } = require("../../middlewere/rbacMiddleware");

// Public routes (no authentication required)
router.get("/", listCourses);
router.get("/categories", getCourseCategories);
router.get("/:courseId", getCourseById);
router.get("/:courseId/stats", getCourseStats);

// Admin only routes
router.post("/", checkAuthentication, rbacMiddleware(["admin"]), addCourse);
router.put("/:courseId", checkAuthentication, rbacMiddleware(["admin"]), editCourse);
router.delete("/:courseId", checkAuthentication, rbacMiddleware(["admin"]), deleteCourse);

module.exports = router;
