import { SweetRepository } from "../repositories/SweetRepository";
import { CreateSweetDto } from "../types/sweet.types";
import { ValidationError, ConflictError } from "../utils/errors";

type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

export const SweetService = {
  async addSweet(data: CreateSweetDto): Promise<{ sweet: SweetRecord }> {
    const name = data.name?.trim() || "";
    const category = data.category?.trim() || "";
    const { price, quantity } = data;

    // Validate name
    if (!name) {
      throw new ValidationError("Name is required");
    }
    if (name.length < 2) {
      throw new ValidationError("Name must be at least 2 characters");
    }
    if (name.length > 100) {
      throw new ValidationError("Name must be at most 100 characters");
    }

    // Validate category
    if (!category) {
      throw new ValidationError("Category is required");
    }

    // Validate price
    if (typeof price !== "number" || isNaN(price)) {
      throw new ValidationError("Price must be a valid number");
    }
    if (price < 0) {
      throw new ValidationError("Price cannot be negative");
    }

    // Validate quantity
    if (quantity < 0) {
      throw new ValidationError("Quantity cannot be negative");
    }
    if (!Number.isInteger(quantity)) {
      throw new ValidationError("Quantity must be an integer");
    }

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
};
