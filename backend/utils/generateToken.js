const jwt = require("jsonwebtoken");

// =========================================================
// GENERATE JWT TOKEN
// =========================================================

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing in .env"
    );
  }

  if (!userId) {
    throw new Error(
      "User ID is required to generate token"
    );
  }

  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = generateToken;