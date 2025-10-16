import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import pool from "../database/connection.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";
const router = express.Router();

// Strict rate limiting for authentication endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error:
      "Too many login attempts from this IP, please try again after 15 minutes.",
    code: "LOGIN_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error:
        "Too many login attempts from this IP, please try again after 15 minutes.",
      code: "LOGIN_RATE_LIMIT_EXCEEDED",
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

// Input validation rules
const loginValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

// POST /api/auth/login
router.post("/login", loginLimiter, loginValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
        code: "VALIDATION_ERROR",
      });
    }

    const { username, password } = req.body;

    // Find user by username
    const userQuery = await pool.query(
      "SELECT id, username, email, password_hash, is_active, failed_login_attempts, last_failed_login FROM admin_users WHERE username = $1",
      [username]
    );

    if (userQuery.rows.length === 0) {
      // Log failed login attempt
      console.warn(
        `🚨 Failed login attempt for username: ${username} from IP: ${req.ip}`
      );
      return res.status(401).json({
        error: "Invalid username or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const user = userQuery.rows[0];

    // Check if account is locked due to too many failed attempts
    if (user.failed_login_attempts >= 5) {
      const lastFailedLogin = new Date(user.last_failed_login);
      const lockoutTime = 30 * 60 * 1000; // 30 minutes

      if (Date.now() - lastFailedLogin.getTime() < lockoutTime) {
        const remainingTime = Math.ceil(
          (lockoutTime - (Date.now() - lastFailedLogin.getTime())) / 1000 / 60
        );
        return res.status(423).json({
          error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
          code: "ACCOUNT_LOCKED",
          retryAfter: remainingTime,
        });
      } else {
        // Reset failed attempts after lockout period
        await pool.query(
          "UPDATE admin_users SET failed_login_attempts = 0, last_failed_login = NULL WHERE id = $1",
          [user.id]
        );
      }
    }

    // Check if account is active
    if (!user.is_active) {
      console.warn(
        `🚨 Login attempt on deactivated account: ${username} from IP: ${req.ip}`
      );
      return res.status(401).json({
        error: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed login attempts
      await pool.query(
        "UPDATE admin_users SET failed_login_attempts = failed_login_attempts + 1, last_failed_login = CURRENT_TIMESTAMP WHERE id = $1",
        [user.id]
      );

      console.warn(
        `🚨 Failed login attempt for username: ${username} from IP: ${req.ip}`
      );
      return res.status(401).json({
        error: "Invalid username or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      "UPDATE admin_users SET failed_login_attempts = 0, last_failed_login = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(user.id);

    // Log successful login

    // Return token and user info (excluding password)
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        lastLogin: user.last_login,
      },
      expiresIn: "24h",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// POST /api/auth/verify
router.post("/verify", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      valid: true,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated system, you might want to blacklist the token
    // For now, we'll just return success since JWT tokens are stateless


    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get user info error:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticateToken,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
          code: "VALIDATION_ERROR",
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get current user's password hash
      const userQuery = await pool.query(
        "SELECT password_hash FROM admin_users WHERE id = $1",
        [req.user.id]
      );

      if (userQuery.rows.length === 0) {
        return res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userQuery.rows[0].password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await pool.query(
        "UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newPasswordHash, req.user.id]
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }
);

export default router;
