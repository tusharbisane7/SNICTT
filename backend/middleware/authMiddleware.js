const jwt = require("jsonwebtoken");

// =========================================================
// AUTHENTICATION MIDDLEWARE
// =========================================================
//
// Supports:
// 1. HTTP-only cookie:
//    snict_token
//
// 2. Authorization header:
//    Bearer <token>
//
// On success:
//    req.userId = decoded.userId
//
// =========================================================

const authMiddleware = (
  req,
  res,
  next
) => {
  try {

    // =====================================================
    // CHECK JWT SECRET
    // =====================================================

    if (!process.env.JWT_SECRET) {

      console.error(
        "❌ JWT_SECRET is missing in environment variables"
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error",
      });
    }


    // =====================================================
    // GET TOKEN FROM COOKIE
    // =====================================================

    let token =
      req.cookies?.snict_token;


    // =====================================================
    // FALLBACK: BEARER TOKEN
    // =====================================================

    if (
      !token &&
      req.headers.authorization
    ) {

      const authHeader =
        req.headers.authorization;

      if (
        authHeader.startsWith(
          "Bearer "
        )
      ) {

        token =
          authHeader
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
          "Authentication required",
      });

    }


    // =====================================================
    // VERIFY TOKEN
    // =====================================================

    let decoded;

    try {

      decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

    } catch (jwtError) {

      console.error(
        "❌ JWT verification failed:",
        jwtError.message
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired authentication token",
      });

    }


    // =====================================================
    // CHECK DECODED TOKEN
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


    // =====================================================
    // CONTINUE
    // =====================================================

    return next();

  } catch (error) {

    console.error(
      "❌ Auth middleware error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed",
    });

  }
};


// =========================================================
// EXPORT
// =========================================================

module.exports =
  authMiddleware;