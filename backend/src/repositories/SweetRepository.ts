import Sweet, { ISweet, ISweetDocument } from "../db/schemas/sweet.model";

type CreateSweetInput = Pick<ISweet, "name" | "category" | "price" | "quantity">;
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
};
