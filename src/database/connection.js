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

// Database error handling - log but don't crash the server
pool.on("error", (err, client) => {
  console.error("Unexpected database pool error:", err);
});

export default pool;
