const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // =====================================================
    // GET TOKEN FROM COOKIE
    // =====================================================

    let token = req.cookies?.snict_token;

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
        message: "Authentication required",
      });
    }

    // =====================================================
    // JWT SECRET CHECK
    // =====================================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ JWT_SECRET is missing in .env"
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

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =====================================================
    // CHECK USER ID
    // =====================================================

    if (
      !decoded ||
      !decoded.userId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    // =====================================================
    // ATTACH USER ID
    // =====================================================

    req.userId =
      decoded.userId;

    next();

  } catch (error) {
    console.error(
      "❌ Auth middleware error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token",
    });
  }
};

module.exports =
  authMiddleware;