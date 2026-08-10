const jwt = require("jsonwebtoken");

// =========================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =========================================================

const adminMiddleware = (req, res, next) => {
  try {
    let token =
      req.cookies?.snict_admin_token;

    // =====================================================
    // ALSO SUPPORT BEARER TOKEN
    // =====================================================

    if (
      !token &&
      req.headers.authorization
    ) {
      const authHeader =
        req.headers.authorization;

      if (
        authHeader.startsWith("Bearer ")
      ) {
        token = authHeader
          .substring(7)
          .trim();
      }
    }

    // =====================================================
    // TOKEN REQUIRED
    // =====================================================

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Admin authentication required",
      });
    }

    // =====================================================
    // JWT SECRET
    // =====================================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing"
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error",
      });
    }

    // =====================================================
    // VERIFY TOKEN
    // =====================================================

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    // Debug
    console.log(
      "Decoded admin token:",
      decoded
    );

    // =====================================================
    // CHECK ADMIN ID
    // =====================================================

    if (
      !decoded ||
      !decoded.adminId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin authentication token",
      });
    }

    // =====================================================
    // ATTACH ADMIN ID
    // =====================================================

    req.adminId =
      decoded.adminId;

    next();

  } catch (error) {

    console.error(
      "Admin middleware error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired admin authentication token",
    });
  }
};

module.exports =
  adminMiddleware;