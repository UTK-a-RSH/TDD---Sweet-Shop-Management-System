import { SweetRepository } from "../repositories/SweetRepository";
import { CreateSweetDto, UpdateSweetDto, SearchSweetsQuery } from "../types/sweet.types";
import { ConflictError, NotFoundError, ForbiddenError } from "../utils/errors";
import { validateSweetInput, validateSweetUpdateInput, validateSearchQuery } from "../utils/validators";

type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type DeleteResult = {
  success: boolean;
  message: string;
  deleted: { id: string; name: string };
};

type ListResult = {
  sweets: SweetRecord[];
  total: number;
};

export const SweetService = {
  async addSweet(data: CreateSweetDto): Promise<{ sweet: SweetRecord }> {
    const { name, category, price, quantity } = validateSweetInput(data);

    // Check for duplicate
    const existing = await SweetRepository.findByName(name);
    if (existing) {
      throw new ConflictError("Sweet with this name already exists");
    }

    const sweet = await SweetRepository.create({
      name,
      category,
      price,
      quantity,
    });

    return { sweet };
  },

  async updateSweet(id: string, data: UpdateSweetDto): Promise<{ sweet: SweetRecord }> {
    // Check if sweet exists
    const existing = await SweetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Sweet not found");
    }

    // Validate update input
    const validated = validateSweetUpdateInput(data);

    // Check for duplicate name if name is being changed
    if (validated.name) {
      const duplicate = await SweetRepository.findByName(validated.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError("Sweet with this name already exists");
      }
    }

    // If no fields to update, return existing
    if (Object.keys(validated).length === 0) {
      return { sweet: existing };
    }

    const sweet = await SweetRepository.update(id, validated);
    if (!sweet) {
      throw new NotFoundError("Sweet not found");
    }

    return { sweet };
  },

  async deleteSweet(id: string, role: string): Promise<DeleteResult> {
    // Check authorization first
    if (role !== "admin") {
      throw new ForbiddenError("Only admin can delete sweets");
    }

    // Validate id
    if (!id || !id.trim()) {
      throw new NotFoundError("Sweet not found");
    }

    // Check if sweet exists
    const existing = await SweetRepository.findById(id.trim());
    if (!existing) {
      throw new NotFoundError("Sweet not found");
    }

    // Delete the sweet
    const deleted = await SweetRepository.delete(id.trim());
    if (!deleted) {
      throw new Error("Failed to delete sweet");
    }

    return {
      success: true,
      message: "Sweet deleted successfully",
      deleted: { id: existing.id, name: existing.name },
    };
  },

  async listAll(): Promise<ListResult> {
    const sweets = await SweetRepository.findAll();
    return {
      sweets,
      total: sweets.length,
    };
  },

  async search(query: SearchSweetsQuery): Promise<ListResult> {
    const sanitizedQuery = validateSearchQuery(query);
    const sweets = await SweetRepository.search(sanitizedQuery);
    return {
      sweets,
      total: sweets.length,
    };
  },
};
