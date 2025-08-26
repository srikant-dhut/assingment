const jwt = require("jsonwebtoken");

// Generate JWT token for user authentication
const generateToken = (userId, role) => {
  try {
    const payload = {
      userId,
      role,
      type: 'access'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    return token;
  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error("Failed to generate token");
  }
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  try {
    const payload = {
      userId,
      type: 'refresh'
    };

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    return token;
  } catch (error) {
    console.error("Refresh token generation error:", error);
    throw new Error("Failed to generate refresh token");
  }
};

// Verify JWT token
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
  try {
    const payload = {
      userId,
      email,
      type: 'email_verification'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    return token;
  } catch (error) {
    console.error("Email verification token generation error:", error);
    throw new Error("Failed to generate email verification token");
  }
};

// Generate password reset token
const generatePasswordResetToken = (userId, email) => {
  try {
    const payload = {
      userId,
      email,
      type: 'password_reset'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    return token;
  } catch (error) {
    console.error("Password reset token generation error:", error);
    throw new Error("Failed to generate password reset token");
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
};
