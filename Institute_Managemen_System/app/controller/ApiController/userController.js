const { User, userSchemaValidation } = require("../../moduals/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../../config/emailConfig");
const { generateToken, generateRefreshToken } = require("../../helper/tokenGenerate");
const { uploadImage } = require("../../helper/Image");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// User Signup with Email Verification
const userSignup = async (req, res) => {
  try {
    const { error, value } = userSchemaValidation.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { name, email, phone, password, role, studentId, teacherId } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Validate role-specific IDs
    if (role === 'student' && !studentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required for student role",
      });
    }

    if (role === 'teacher' && !teacherId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Teacher ID is required for teacher role",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      studentId: role === 'student' ? studentId : undefined,
      teacherId: role === 'teacher' ? teacherId : undefined,
    });

    await user.save();

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(email, name, verificationLink);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully. Please check your email for verification.",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("User signup error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// User Login
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("User login error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Edit User Profile
const editUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated
    delete updateData.password;
    delete updateData.role;
    delete updateData.is_verified;
    delete updateData.is_active;

    // Handle profile image upload
    if (req.file) {
      const imageUrl = await uploadImage(req.file);
      updateData.profileImage = imageUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Edit profile error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// List of Users (Admin Only)
const listUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { is_active: true };
    
    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page * limit < totalUsers,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Email Verification
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Update user verification status
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { is_verified: true },
      { new: true }
    );

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Email verified successfully",
      data: {
        userId: user._id,
        email: user.email,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendVerificationEmail(email, user.name, resetLink);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  userSignup,
  userLogin,
  getUserProfile,
  editUserProfile,
  listUsers,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
