const jwt = require("jsonwebtoken");

const generateAdminToken = (adminId) => {
  return jwt.sign(
    {
      adminId: adminId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = generateAdminToken;