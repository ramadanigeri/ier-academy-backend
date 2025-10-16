import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL_ENABLED === "true"
      ? { rejectUnauthorized: false }
      : false,
});

// Database error handling
pool.on("error", (err) => {
  console.error("Database connection error:", err);
  process.exit(-1);
});

export default pool;
