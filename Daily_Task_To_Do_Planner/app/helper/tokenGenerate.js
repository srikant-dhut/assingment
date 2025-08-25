const statusCode = require("./httpsStatusCode");
const RefreshToken = require("../moduals/refreshTokenModel");
const jwt = require("jsonwebtoken");

async function validateAccessToken(tokenSecret, accessToken) {
  try {
    const decode = jwt.verify(accessToken, tokenSecret);
    return decode;
  } catch (error) {
    return false;
  }
}

async function validateRefreshToken(tokenSecret, refreshToken) {
  try {
    const decode = jwt.verify(refreshToken, tokenSecret);
    return decode;
  } catch (error) {
    return false;
  }
}

async function generateAccessToken(payload, access_token_secret) {
  return jwt.sign(
    {
      user_name: payload.user_name,
      user_id: payload.user_id,
      user_email: payload.user_email,
    },
    access_token_secret,
    {
      expiresIn: "10m",
    }
  );
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw { status: 401, message: "Refresh token not provided" };
  }

  try {
    const existingToken = await RefreshToken.findOne({ token: refreshToken });
    if (!existingToken) {
      throw { status: 403, message: "Refresh token not valid" };
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        name: decoded.name,
        role: decoded.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    return { accessToken: newAccessToken, user: decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw { status: 403, message: "Refresh token expired" };
    }
    throw { status: 403, message: "Invalid refresh token" };
  }
}

module.exports = {
  refreshAccessToken,
  generateAccessToken,
  validateAccessToken,
  validateRefreshToken,
};
