const express = require("express");
const router = express.Router();
const userApiController = require("../../controller/ApiController/userController");
const userCheckauthenticationToken = require("../../middlewere/auth");
const ImageUpload = require('../../helper/Image')


router.post("/register", ImageUpload.single("profileImage"), userApiController.register);
router.post("/verifyOtp", userApiController.verifyOtp);
router.post("/login", userApiController.login);
router.get("/getProfile/", userCheckauthenticationToken,  userApiController.getProfile);
router.put("/editUser/:id",userCheckauthenticationToken, ImageUpload.single("profileImage"), userApiController.editUser);

module.exports = router;