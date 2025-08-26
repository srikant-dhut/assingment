const express = require("express");
const router = express.Router();
const {
  addBatch,
  assignStudentsToBatch,
  listBatches,
  updateBatch,
  deleteBatch,
  getBatchById,
  getBatchStats,
} = require("../../controller/ApiController/batchController");
const { checkAuthentication } = require("../../middlewere/checkAuthentication");
const { rbacMiddleware } = require("../../middlewere/rbacMiddleware");

// Public routes (no authentication required)
router.get("/", listBatches);
router.get("/:batchId", getBatchById);
router.get("/:batchId/stats", getBatchStats);

// Admin/Teacher routes
router.post("/", checkAuthentication, rbacMiddleware(["admin", "teacher"]), addBatch);
router.put("/:batchId", checkAuthentication, rbacMiddleware(["admin", "teacher"]), updateBatch);

// Admin only routes
router.post("/:batchId/assign-students", checkAuthentication, rbacMiddleware(["admin"]), assignStudentsToBatch);
router.delete("/:batchId", checkAuthentication, rbacMiddleware(["admin"]), deleteBatch);

module.exports = router;
