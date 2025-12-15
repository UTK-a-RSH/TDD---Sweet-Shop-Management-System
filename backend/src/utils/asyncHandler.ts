import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler to catch errors and forward them to Express error middleware.
 * This is necessary because Express doesn't automatically catch errors from async functions.
 * 
 * @param fn - Async route handler function
 * @returns Wrapped handler that catches errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
