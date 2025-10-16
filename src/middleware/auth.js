import jwt from "jsonwebtoken";
import pool from "../database/connection.js";

// JWT secret from environment variable
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
      iat: Math.floor(Date.now() / 1000), // Issued at
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "ier-academy",
      audience: "ier-academy-admin",
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "ier-academy",
      audience: "ier-academy-admin",
    });
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
        code: "MISSING_TOKEN",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const userQuery = await pool.query(
      "SELECT id, username, email, is_active, last_login FROM admin_users WHERE id = $1",
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const user = userQuery.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: "Account deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      lastLogin: user.last_login,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(401).json({
      error: "Authentication failed",
      code: "AUTH_FAILED",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = verifyToken(token);
      const userQuery = await pool.query(
        "SELECT id, username, email, is_active FROM admin_users WHERE id = $1",
        [decoded.userId]
      );

      if (userQuery.rows.length > 0 && userQuery.rows[0].is_active) {
        req.user = {
          id: userQuery.rows[0].id,
          username: userQuery.rows[0].username,
          email: userQuery.rows[0].email,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based access control (for future expansion)
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    // For now, all authenticated users are admins
    // In the future, you can add role checking here
    next();
  };
};

// Rate limiting for authenticated endpoints
import rateLimit from "express-rate-limit";

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each authenticated user to 1000 requests per windowMs
  keyGenerator: (req) => {
    // Use the built-in ipKeyGenerator for IPv6 compatibility
    return req.user ? req.user.id.toString() : req.ip;
  },
  message: {
    error: "Too many requests from this user, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "No active session",
        code: "NO_SESSION",
      });
    }

    // Check if user session is still valid
    const sessionQuery = await pool.query(
      "SELECT last_login FROM admin_users WHERE id = $1",
      [req.user.id]
    );

    if (sessionQuery.rows.length === 0) {
      return res.status(401).json({
        error: "Session expired",
        code: "SESSION_EXPIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(401).json({
      error: "Session validation failed",
      code: "SESSION_VALIDATION_FAILED",
    });
  }
};

export {
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  requireRole,
  authRateLimit,
  validateSession,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
