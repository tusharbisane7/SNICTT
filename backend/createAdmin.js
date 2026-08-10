const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const createAdmin = async () => {
  try {
    const username = "admin";
    const password = "Admin@123";
    const name = "SNICT Administrator";
    const role = "admin";

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const existing = await pool.query(
      `
      SELECT id
      FROM admins
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );

    if (existing.rows.length > 0) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const result = await pool.query(
      `
      INSERT INTO admins
      (
        username,
        password_hash,
        name,
        role
      )
      VALUES
      ($1, $2, $3, $4)
      RETURNING id, username, name, role
      `,
      [
        username,
        passwordHash,
        name,
        role,
      ]
    );

    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log(result.rows[0]);
    console.log("");
    console.log("Username : admin");
    console.log("Password : Admin@123");
    console.log("=================================");

    process.exit(0);

  } catch (error) {
    console.error(
      "Error creating admin:",
      error
    );

    process.exit(1);
  }
};

createAdmin();