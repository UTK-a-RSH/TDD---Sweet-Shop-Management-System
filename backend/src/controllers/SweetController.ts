import { Request, Response } from "express";
import { SweetService } from "../services/SweetService";
import { sendCreated, sendOk } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * SweetController handles HTTP requests for sweet management endpoints.
 * Translates HTTP requests to service calls and formats responses.
 */
export const SweetController = {
  /**
   * POST /api/sweets
   * Add a new sweet
   */
  async addSweet(req: Request, res: Response): Promise<void> {
    const result = await SweetService.addSweet(req.body);
    sendCreated(res, "Sweet added successfully", result);
  },

  /**
   * GET /api/sweets
   * List all sweets
   */
  async listAll(_req: Request, res: Response): Promise<void> {
    const result = await SweetService.listAll();
    sendOk(res, "Sweets retrieved successfully", result);
  },

  /**
   * GET /api/sweets/search
   * Search sweets by query parameters
   */
  async search(req: Request, res: Response): Promise<void> {
    const { name, category, minPrice, maxPrice } = req.query;
    const result = await SweetService.search({
      name: name as string | undefined,
      category: category as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    sendOk(res, "Search completed successfully", result);
  },

  /**
   * PUT /api/sweets/:id
   * Update a sweet's details
   */
  async updateSweet(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await SweetService.updateSweet(id, req.body);
    sendOk(res, "Sweet updated successfully", result);
  },

  /**
   * DELETE /api/sweets/:id
   * Delete a sweet (admin only)
   */
  async deleteSweet(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const role = req.user?.role || "user";
    const result = await SweetService.deleteSweet(id, role);
    sendOk(res, result.message, result);
  },

  /**
   * POST /api/sweets/:id/purchase
   * Purchase a sweet (decreases quantity)
   */
  async purchase(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await SweetService.purchase(id, req.body);
    sendOk(res, "Purchase successful", result);
  },

  /**
   * POST /api/sweets/:id/restock
   * Restock a sweet (admin only)
   */
  async restock(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const role = req.user?.role || "user";
    const result = await SweetService.restock(id, req.body, role);
    sendOk(res, "Restock successful", result);
  },
};
