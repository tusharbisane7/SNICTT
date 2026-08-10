const crypto = require("crypto");

// =========================================================
// GENERATE 6-DIGIT OTP
// =========================================================

const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

// =========================================================
// HASH OTP
// =========================================================

const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
  generateOtp,
  hashOtp,
};