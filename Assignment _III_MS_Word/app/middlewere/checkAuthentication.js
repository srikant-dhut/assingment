const {
  validateAccessToken,
  refreshAccessToken,
} = require("../helper/tokenGenerate");

const checkAuthentication = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      req.isAuthenticated = false;
      return next();
    }

    let user = await validateAccessToken(
      process.env.ACCESS_TOKEN_SECRET,
      accessToken
    );

    if (!user && refreshToken) {
      // 🛠 Access token expired or invalid → try to refresh it
      try {
        const data = await refreshAccessToken(refreshToken);
        res.cookie("accessToken", data.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        user = data.user;
      } catch (refreshError) {
        console.log("Refresh failed:", refreshError.message);
        req.isAuthenticated = false;
        return next();
      }
    }

    if (user) {
      req.user = user;
      req.isAuthenticated = true;
    } else {
      req.isAuthenticated = false;
    }

    next();
  } catch (error) {
    console.log("Auth middleware error:", error);
    req.isAuthenticated = false;
    next();
  }
};

module.exports = checkAuthentication;
