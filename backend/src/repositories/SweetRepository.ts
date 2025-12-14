import Sweet, { ISweet, ISweetDocument } from "../db/schemas/sweet.model";
import { SearchSweetsQuery } from "../types/sweet.types";

type CreateSweetInput = Pick<ISweet, "name" | "category" | "price" | "quantity">;
type UpdateSweetInput = Partial<CreateSweetInput>;
type SweetRecord = Pick<ISweetDocument, "name" | "category" | "price" | "quantity"> & { id: string };

export const SweetRepository = {
  async findByName(name: string): Promise<SweetRecord | null> {
    const sweet = await Sweet.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (!sweet) return null;
    return {
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    };
  },

  async findById(id: string): Promise<SweetRecord | null> {
    const sweet = await Sweet.findById(id);
    if (!sweet) return null;
    return {
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    };
  },

  async findAll(): Promise<SweetRecord[]> {
    const sweets = await Sweet.find();
    return sweets.map((sweet) => ({
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    }));
  },

  async search(query: SearchSweetsQuery): Promise<SweetRecord[]> {
    const filter: Record<string, unknown> = {};

    if (query.name) {
      filter.name = { $regex: new RegExp(query.name, "i") };
    }
    if (query.category) {
      filter.category = { $regex: new RegExp(`^${query.category}$`, "i") };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) {
        (filter.price as Record<string, number>).$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        (filter.price as Record<string, number>).$lte = query.maxPrice;
      }
    }

    const sweets = await Sweet.find(filter);
    return sweets.map((sweet) => ({
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    }));
  },

  async create(data: CreateSweetInput): Promise<SweetRecord> {
    const sweet = await Sweet.create(data);
    return {
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    };
  },

  async update(id: string, data: UpdateSweetInput): Promise<SweetRecord | null> {
    const sweet = await Sweet.findByIdAndUpdate(id, data, { new: true });
    if (!sweet) return null;
    return {
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    };
  },

  async delete(id: string): Promise<boolean> {
    const result = await Sweet.findByIdAndDelete(id);
    return result !== null;
  },

  async updateQuantity(id: string, quantity: number): Promise<SweetRecord | null> {
    const sweet = await Sweet.findByIdAndUpdate(id, { quantity }, { new: true });
    if (!sweet) return null;
    return {
      id: sweet._id.toString(),
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    };
  },
};
