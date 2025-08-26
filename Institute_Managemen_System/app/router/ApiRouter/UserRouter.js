const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  userSignup,
  userLogin,
  getUserProfile,
  editUserProfile,
  listUsers,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../../controller/ApiController/userController");
const { checkAuthentication } = require("../../middlewere/checkAuthentication");
const { rbacMiddleware } = require("../../middlewere/rbacMiddleware");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Public routes (no authentication required)
router.post("/signup", userSignup);
router.post("/login", userLogin);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes (authentication required)
router.get("/profile", checkAuthentication, getUserProfile);
router.put("/profile", checkAuthentication, upload.single("profileImage"), editUserProfile);

// Admin only routes
router.get("/users", checkAuthentication, rbacMiddleware(["admin"]), listUsers);

module.exports = router;