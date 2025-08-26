const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Upload single image
const uploadImage = (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Return the file path relative to the uploads directory
  return `/uploads/${file.filename}`;
};

// Delete image file
const deleteImage = (imagePath) => {
  try {
    if (imagePath && imagePath.startsWith("/uploads/")) {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
};

// Validate image file
const validateImage = (file) => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File size too large. Maximum size is 5MB." };
  }

  // Check file type
  if (!file.mimetype.startsWith("image/")) {
    return { valid: false, error: "Only image files are allowed" };
  }

  // Check file extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: "Invalid file extension. Allowed: " + allowedExtensions.join(", ") };
  }

  return { valid: true };
};

// Generate thumbnail (placeholder function)
const generateThumbnail = async (imagePath, width = 150, height = 150) => {
  // This is a placeholder function
  // In a real implementation, you would use a library like sharp or jimp to generate thumbnails
  console.log(`Generating thumbnail for ${imagePath} with dimensions ${width}x${height}`);
  return imagePath; // Return original path for now
};

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  validateImage,
  generateThumbnail,
};