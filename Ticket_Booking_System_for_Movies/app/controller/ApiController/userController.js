const jwt = require('jsonwebtoken')
const statusCode = require("../../helper/httpsStatusCode")
const { hashGenerate, verifyPassword } = require("../../helper/passwordHash")
const RefreshToken = require("../../moduals/refreshTokenModel")
const { User, userSchemaValidation } = require("../../moduals/UserModel")
const sendEmailVerificationOTP = require("../../helper/smsValidation")
const EmailVerifyModel = require("../../moduals/otpModel")
const { equal } = require("joi")
const { default: mongoose } = require("mongoose");
const fs = require("fs");
const path = require("path");


class UserApiController {
  async register(req, res) {
    try {
      const data = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
      };
      // 1. Check if file is uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Profile image is required",
        });
      }

      const profileImage = `/uploads/${req.file.filename}`;

      const { error, value } = userSchemaValidation.validate(data);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const { name, email, phone, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "User already exists" });
      }

      const hashPassword = hashGenerate(password);

      const user = new User({
        name,
        email,
        phone,
        password: hashPassword,
        role,
        profileImage,
      });

      const userData = await user.save();

      // Send OTP email
      await sendEmailVerificationOTP(req, user);

      return res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email using the OTP sent.",
        user: {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
        },
      });

    } catch (error) {
      console.error("Register Error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }
      const existingUser = await User.findOne({ email });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Email doesn't exist",
        });
      }

      if (existingUser.is_verified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const emailVerification = await EmailVerifyModel.findOne({
        userId: existingUser._id,
        otp,
      });
      if (!emailVerification) {
        if (!existingUser.is_verified) {
          await sendEmailVerificationOTP(req, existingUser);
          return res.status(400).json({
            success: false,
            message: "Invalid OTP. A new OTP has been sent to your email.",
          });
        }
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. A new OTP has been sent to your email.",
        });
      }

      const currentTime = new Date();

      const expirationTime = new Date(
        emailVerification.createdAt.getTime() + 15 * 60 * 1000
      );
      if (currentTime > expirationTime) {
        await sendEmailVerificationOTP(req, existingUser);
        return res.status(statusCode.badRequest).json({
          status: "failed",
          message: "OTP expired, new OTP sent to your email",
        });
      }

      existingUser.is_verified = true;
      await existingUser.save();

      await EmailVerifyModel.deleteMany({ userId: existingUser._id });
      return res
        .status(statusCode.success)
        .json({ status: true, message: "Email verified successfully" });

    } catch (error) {
      console.error(error);
      res.status(statusCode.internalServerError).json({
        status: false,
        message: "Unable to verify email, please try again later",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req?.body;
      if (!email || !password) {
        // req.flash("error_msg", "All fields are reuired");
        // return res.redirect("/signin");
        return res.status(statusCode.internalServerError).json({
          message: "All fields are reuired",
        });
      }
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        // req.flash("error_msg", "User not found");
        // return res.redirect("/signin");
        return res.status(statusCode.badRequest).json({
          message: "User not found",
        });
      }
      if (!existingUser.is_verified) {
        await sendEmailVerificationOTP(req, existingUser);
        // req.flash("error_msg", "User not verified");
        // return res.redirect("/verifyOtp");
        return res.status(statusCode.badRequest).json({
          message: "User not verified",
        });
      }
      const isMatchingPassword = await verifyPassword(
        password,
        existingUser.password
      );
      if (!isMatchingPassword) {
        // req.flash("error_msg", "Invalid credentials");
        // return res.redirect("/signin");
        return res.status(statusCode.badRequest).json({
          message: "Invalid credentials",
        });
      }

      const accessToken = jwt.sign(
        {
          userId: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5m" }
      );
      const refreshToken = jwt.sign(
        {
          userId: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "10m" }
      );

      const userToken = await RefreshToken.findOne({ user: existingUser._id });
      if (userToken) {
        await RefreshToken.deleteOne({ user: existingUser._id });
      }
      await RefreshToken.create({
        token: refreshToken,
        user: existingUser._id,
      });

      res.cookie("accessToken", accessToken, { httpOnly: true });
      res.cookie("refreshToken", refreshToken, { httpOnly: true });

      // req.flash("success_msg", "Login successfull");
      // res.redirect("/");
      return res.status(statusCode.success).json({
        message: "Login successfull",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user ? req.user.userId : "null";
      const user = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $project: { password: 0, __v: 0 } }
      ]);
      return res.status(statusCode.success).json({
        message: "User profile fetched successfully",
        user,
      });
    } catch (error) {
      console.error("Profile Error:", error);
      return res.status(statusCode.internalServerError).json({
        message: "Server error while fetching profile",
      });
    }
  };

  async editUser(req, res) {
    try {
      const userId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Profile image is required",
        });
      }

      const profileImage = `/uploads/${req.file.filename}`;

      const data = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        profileImage,
      };

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (existingUser.profileImage) {
        const oldImagePath = path.join(__dirname, "../../public", existingUser.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      await User.findByIdAndUpdate(userId, data, { new: true });

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        updatedData: data,
      });

    } catch (error) {
      console.error("Edit User Error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

}

module.exports = new UserApiController();
