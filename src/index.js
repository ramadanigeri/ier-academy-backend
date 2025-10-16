import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import enrollmentRoutes from "./routes/enrollment.js";
import contactRoutes from "./routes/contact.js";
import webhookRoutes from "./routes/webhooks.js";
import adminRoutes from "./routes/admin.js";
import eventsRoutes from "./routes/events.js";
import dashboardRoutes from "./routes/dashboard.js";
import cmsRoutes from "./routes/cms.js";
import coursesRoutes from "./routes/courses.js";
import contentRoutes from "./routes/content.js";
import supportingRoutes from "./routes/supporting.js";
import uploadRoutes from "./routes/upload.js";
import venuesRoutes from "./routes/venues.js";
import eventSectionsRoutes from "./routes/eventSections.js";
import authRoutes from "./routes/auth.js";
import pool from "./database/connection.js";

// Import security middleware
import {
  securityHeaders,
  corsOptions,
  generalLimiter,
  authLimiter,
  publicApiLimiter,
  sanitizeData,
  validateInput,
  securityLogger,
  mongoSanitize,
  hpp,
} from "./middleware/security.js";

// Import authentication middleware
import { authenticateToken, authRateLimit } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(securityLogger);

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware (except for webhooks)
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization and validation
app.use(mongoSanitize());
app.use(hpp());
app.use(sanitizeData);
app.use(validateInput);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Public API routes (no authentication required, but rate limited)
app.use("/api/contact", publicApiLimiter, contactRoutes);
app.use("/api/webhooks", publicApiLimiter, webhookRoutes);
app.use("/api/events", publicApiLimiter, eventsRoutes);
app.use("/api/courses", publicApiLimiter, coursesRoutes);
app.use("/api/content", publicApiLimiter, contentRoutes);
app.use("/api/supporting", publicApiLimiter, supportingRoutes);
app.use("/api/venues", publicApiLimiter, venuesRoutes);
app.use("/api/event-sections", publicApiLimiter, eventSectionsRoutes);
app.use("/api/enrollment", publicApiLimiter, enrollmentRoutes);

// Authentication routes (with strict rate limiting)
app.use("/api/auth", authLimiter, authRoutes);

// Protected API routes (authentication required)
app.use("/api/admin", authRateLimit, authenticateToken, adminRoutes);
app.use("/api/dashboard", authRateLimit, authenticateToken, dashboardRoutes);
app.use("/api/cms", authRateLimit, authenticateToken, cmsRoutes);
app.use("/api/upload", authRateLimit, authenticateToken, uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  } else {
    console.log(`Server started on port ${PORT}`);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (process.env.NODE_ENV === "development") {
    console.log("🔄 Received SIGTERM, shutting down gracefully...");
  }
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  if (process.env.NODE_ENV === "development") {
    console.log("🔄 Received SIGINT, shutting down gracefully...");
  }
  await pool.end();
  process.exit(0);
});
