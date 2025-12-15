import { Router } from "express";
import { SweetController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All routes are protected
router.use(authMiddleware);

/**
 * @route   POST /api/sweets
 * @desc    Add a new sweet
 * @access  Protected
 */
router.post("/", asyncHandler(SweetController.addSweet));

/**
 * @route   GET /api/sweets
 * @desc    List all sweets
 * @access  Protected
 */
router.get("/", asyncHandler(SweetController.listAll));

/**
 * @route   GET /api/sweets/search
 * @desc    Search sweets by query parameters
 * @access  Protected
 */
router.get("/search", asyncHandler(SweetController.search));

/**
 * @route   PUT /api/sweets/:id
 * @desc    Update a sweet's details
 * @access  Protected
 */
router.put("/:id", asyncHandler(SweetController.updateSweet));

/**
 * @route   DELETE /api/sweets/:id
 * @desc    Delete a sweet (admin only)
 * @access  Protected (Admin)
 */
router.delete("/:id", asyncHandler(SweetController.deleteSweet));

/**
 * @route   POST /api/sweets/:id/purchase
 * @desc    Purchase a sweet
 * @access  Protected
 */
router.post("/:id/purchase", asyncHandler(SweetController.purchase));

/**
 * @route   POST /api/sweets/:id/restock
 * @desc    Restock a sweet (admin only)
 * @access  Protected (Admin)
 */
router.post("/:id/restock", asyncHandler(SweetController.restock));

export default router;
