const { StatusCodes } = require("../helper/httpsStatusCode");
const jwt = require("jsonwebtoken");
const { User } = require("../moduals/UserModel");

const userCheckauthenticationToken = async (req, res, next) => {
  try {
    // Check for token in headers (Bearer token) or cookies
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    } else {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Access token is required",
      });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Add user info to request
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Token has expired. Please login again.",
        });
      }
      
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token",
      });
    }

  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong during authentication.",
      error: error.message,
    });
  }
};

module.exports = userCheckauthenticationToken;
