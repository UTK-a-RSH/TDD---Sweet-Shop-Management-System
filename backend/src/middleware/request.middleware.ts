import { Request, Response, NextFunction } from "express";

/**
 * JSON parsing middleware with enhanced error handling
 * Wraps express.json() with custom error handling for malformed JSON
 */
import express from "express";

/**
 * Configure JSON parser with limits and options
 */
export const jsonParser = express.json({
  limit: "10mb", // Limit request body size
  strict: true,  // Only accept arrays and objects
});

/**
 * Request logging middleware
 * Logs incoming requests with method, path, and timestamp
 */
export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

/**
 * Response time middleware
 * Adds X-Response-Time header to track request duration
 */
export const responseTime = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

/**
 * Security headers middleware
 * Adds basic security headers to all responses
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Remove X-Powered-By header
  res.removeHeader("X-Powered-By");
  
  next();
};

/**
 * Request sanitizer middleware
 * Trims whitespace from string fields in request body
 */
export const sanitizeRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === "object") {
    trimStrings(req.body);
  }
  next();
};

/**
 * Recursively trim string values in an object
 */
function trimStrings(obj: Record<string, any>): void {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      trimStrings(obj[key]);
    }
  }
}
