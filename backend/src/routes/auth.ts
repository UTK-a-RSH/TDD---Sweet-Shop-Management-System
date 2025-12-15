import { Router } from "express";
import { AuthController } from "../controllers";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", asyncHandler(AuthController.register));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post("/login", asyncHandler(AuthController.login));

export default router;
