import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Custom error interface for enhanced error details
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  stack?: string;
}

/**
 * Not Found middleware - handles 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler middleware
 * Centralizes all error responses with consistent format
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging (in production, use proper logging service)
  console.error(`[Error] ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Handle known AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      code: err.code,
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle JSON syntax errors (malformed JSON in request body)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
      code: "INVALID_JSON",
    });
    return;
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
      code: "INVALID_ID",
    });
    return;
  }

  // Handle MongoDB duplicate key error
  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    res.status(409).json({
      success: false,
      message: "Duplicate entry",
      code: "DUPLICATE_ENTRY",
    });
    return;
  }

  // Handle MongoDB validation error
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: err.message,
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Default to 500 Internal Server Error for unknown errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
    code: "INTERNAL_ERROR",
  });
};
