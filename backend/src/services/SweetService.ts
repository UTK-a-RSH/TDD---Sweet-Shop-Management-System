import { SweetRepository } from "../repositories/SweetRepository";
import { CreateSweetDto } from "../types/sweet.types";
import { ConflictError } from "../utils/errors";
import { validateSweetInput } from "../utils/validators";

type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
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
};
