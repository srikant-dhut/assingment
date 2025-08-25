const path = require("path");
const fs = require("fs");
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(".");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName[0]}-${Date.now()}.${extension}`);
  },
});

const ImageUpload = multer({ storage: storage });

module.exports = ImageUpload;