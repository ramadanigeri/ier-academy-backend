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
import pool from "./database/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware (except for webhooks)
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

// API routes
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// CMS API routes
app.use("/api/cms", cmsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/supporting", supportingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/event-sections", eventSectionsRoutes);

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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 Received SIGTERM, shutting down gracefully...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 Received SIGINT, shutting down gracefully...");
  await pool.end();
  process.exit(0);
});
