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
      //req.userId = user._id;
      req.userId = user.userId || user._id;
      req.isAuthenticated = true;

      //console.log("Decoded user in middleware:", user);
      //console.log("req.userId:", req.userId);
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
