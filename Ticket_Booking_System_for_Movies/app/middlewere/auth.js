const statusCode = require("../helper/httpsStatusCode");
const jwt = require("jsonwebtoken");
const {
  validateAccessToken,
  validateRefreshToken,
  generateAccessToken,
} = require("../helper/tokenGenerate");

const userCheckauthenticationToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (accessToken) {
      const user = await validateAccessToken(
        process.env.ACCESS_TOKEN_SECRET,
        accessToken
      );
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Access token missing or invalid, fallback to refresh token
    if (refreshToken) {
      const user = await validateRefreshToken(
        process.env.REFRESH_TOKEN_SECRET,
        refreshToken
      );
      if (user) {
        const newAccessToken = generateAccessToken(
          user,
          process.env.ACCESS_TOKEN_SECRET
        );

        // Set new access token in HTTP-only cookie
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
        });

        req.user = user;
        return next();
      }
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    //res.redirect("/signin");
    return res.status(statusCode.unauthorized).json({
  success: false,
  message: "Authentication failed. Please sign in again.",
});

  } catch (error) {
    //res.redirect("/sigin");
    return res.status(statusCode.internalServerError).json({
  success: false,
  message: "Something went wrong during authentication.",
  error: error.message,
});
  }
};

module.exports = userCheckauthenticationToken;
