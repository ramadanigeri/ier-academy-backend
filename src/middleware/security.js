import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss";

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL,
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });

// Different rate limits for different endpoints
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 requests per windowMs (increased from 100)
  "Too many requests from this IP, please try again later."
);

const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 login attempts per windowMs
  "Too many login attempts from this IP, please try again after 15 minutes."
);

const publicApiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes (industry standard)
  2000, // limit each IP to 2000 requests per 15 minutes (~2 req/sec with bursting)
  "Too many requests from this IP, please try again later."
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 API requests per windowMs
  "Too many API requests from this IP, please try again later."
);

// Data sanitization middleware
const sanitizeData = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Helper function to recursively sanitize objects
const sanitizeObject = (obj) => {
  if (typeof obj === "string") {
    return xss(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

// Input validation middleware
const validateInput = (req, res, next) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /location\./gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi,
  ];

  const checkSuspiciousContent = (input) => {
    if (typeof input === "string") {
      return suspiciousPatterns.some((pattern) => pattern.test(input));
    }

    if (Array.isArray(input)) {
      return input.some(checkSuspiciousContent);
    }

    if (input && typeof input === "object") {
      return Object.values(input).some(checkSuspiciousContent);
    }

    return false;
  };

  // Check all request data
  const allData = {
    ...req.body,
    ...req.query,
    ...req.params,
  };

  if (checkSuspiciousContent(allData)) {
    return res.status(400).json({
      error: "Invalid input detected. Request blocked for security reasons.",
    });
  }

  next();
};

// Request logging middleware for security monitoring
const securityLogger = (req, res, next) => {
  const start = Date.now();

  // Log suspicious requests
  const logSuspiciousRequest = (reason) => {
    console.warn(`🚨 Security Alert: ${reason}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      headers: req.headers,
    });
  };

  // Check for suspicious user agents
  const userAgent = req.get("User-Agent") || "";
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /wget/i,
    /curl/i,
    /python-requests/i,
    /bot/i,
    /crawler/i,
    /scanner/i,
  ];

  if (suspiciousUserAgents.some((pattern) => pattern.test(userAgent))) {
    logSuspiciousRequest("Suspicious User-Agent detected");
  }

  // Check for suspicious headers
  const suspiciousHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "x-cluster-client-ip",
    "x-forwarded",
    "forwarded-for",
    "forwarded",
  ];

  const hasSuspiciousHeaders = suspiciousHeaders.some(
    (header) => req.get(header) && req.get(header).includes(",")
  );

  if (hasSuspiciousHeaders) {
    logSuspiciousRequest("Suspicious headers detected");
  }

  // Log response time and status
  res.on("finish", () => {
    const duration = Date.now() - start;

    if (res.statusCode >= 400) {
      console.warn(`⚠️  Error Response: ${res.statusCode}`, {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

export {
  securityHeaders,
  corsOptions,
  generalLimiter,
  authLimiter,
  publicApiLimiter,
  apiLimiter,
  sanitizeData,
  validateInput,
  securityLogger,
  mongoSanitize,
  hpp,
};
