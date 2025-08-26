const { StatusCodes } = require("../helper/httpsStatusCode");

const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        });
      }

      next();
    } catch (error) {
      console.error("RBAC middleware error:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error during authorization check",
      });
    }
  };
};

module.exports = { rbacMiddleware };

