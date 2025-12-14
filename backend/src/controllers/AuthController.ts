import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { sendCreated, sendOk } from "../utils/response";

/**
 * AuthController handles HTTP requests for authentication endpoints.
 * Translates HTTP requests to service calls and formats responses.
 */
export const AuthController = {
  /**
   * POST /api/auth/register
   * Registers a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const result = await AuthService.register(req.body);
    sendCreated(res, "User registered successfully", result);
  },

  /**
   * POST /api/auth/login
   * Authenticates a user and returns a JWT token
   */
  async login(req: Request, res: Response): Promise<void> {
    const result = await AuthService.login(req.body);
    sendOk(res, "Login successful", result);
  },
};
