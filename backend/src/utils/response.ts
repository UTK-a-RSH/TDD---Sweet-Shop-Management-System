import { Response } from "express";

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * HTTP status codes enum for consistency
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

/**
 * Sends a success response with consistent format
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
}

/**
 * Sends a created (201) response
 */
export function sendCreated<T>(res: Response, message: string, data?: T): void {
  sendSuccess(res, HttpStatus.CREATED, message, data);
}

/**
 * Sends an OK (200) response
 */
export function sendOk<T>(res: Response, message: string, data?: T): void {
  sendSuccess(res, HttpStatus.OK, message, data);
}

/**
 * Sends a no content (204) response
 */
export function sendNoContent(res: Response): void {
  res.status(HttpStatus.NO_CONTENT).send();
}
