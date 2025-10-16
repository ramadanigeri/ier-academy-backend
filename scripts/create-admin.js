import bcrypt from "bcryptjs";
import pool from "../src/database/connection.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdminUser() {
  try {
    const username = process.env.ADMIN_USERNAME;
    const email = "admin@ier-academy.com";
    const password = process.env.ADMIN_PASSWORD;

    // Validate required environment variables
    if (!username) {
      throw new Error("ADMIN_USERNAME is required");
    }
    if (!password) {
      throw new Error("ADMIN_PASSWORD is required");
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if admin user already exists (by username OR email)
    const existingUser = await pool.query(
      "SELECT id FROM admin_users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Admin user already exists. Updating password...");

      await pool.query(
        "UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2 OR email = $3",
        [passwordHash, username, email]
      );

      console.log("✅ Admin password updated successfully!");
    } else {
      await pool.query(
        "INSERT INTO admin_users (username, email, password_hash, is_active) VALUES ($1, $2, $3, true)",
        [username, email, passwordHash]
      );

      console.log("✅ Admin user created successfully!");
    }

    console.log("\n✅ Admin user setup completed successfully!");
    console.log("🔐 Credentials are stored securely in the database.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser();

export { createAdminUser };
