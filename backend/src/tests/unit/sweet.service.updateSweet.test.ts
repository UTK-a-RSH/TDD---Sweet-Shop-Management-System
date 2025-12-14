import { SweetService } from "../../services/SweetService";
import { UpdateSweetDto } from "../../types/sweet.types";

// Types for repository mocks
type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

const mockSweetRepoFindById = jest.fn<Promise<SweetRecord | null>, [string]>();
const mockSweetRepoFindByName = jest.fn<Promise<SweetRecord | null>, [string]>();
const mockSweetRepoUpdate = jest.fn<Promise<SweetRecord | null>, [string, UpdateSweetDto]>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    findById: (id: string) => mockSweetRepoFindById(id),
    findByName: (name: string) => mockSweetRepoFindByName(name),
    update: (id: string, data: UpdateSweetDto) => mockSweetRepoUpdate(id, data),
  },
}));

describe("SweetService.updateSweet", () => {
  const existingSweet: SweetRecord = {
    id: "sweet-123",
    name: "Gulab Jamun",
    category: "Indian",
    price: 25,
    quantity: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSweetRepoFindById.mockResolvedValue(existingSweet);
    mockSweetRepoFindByName.mockResolvedValue(null);
    mockSweetRepoUpdate.mockImplementation((id, data) =>
      Promise.resolve({
        ...existingSweet,
        ...data,
        name: data.name?.trim() ?? existingSweet.name,
        category: data.category?.trim() ?? existingSweet.category,
      })
    );
  });

  describe("successful updates", () => {
    it("updates a sweet with valid input", async () => {
      const result = await SweetService.updateSweet("sweet-123", {
        name: "Rasgulla",
        price: 30,
      });

      expect(result.sweet).toMatchObject({
        id: "sweet-123",
        name: "Rasgulla",
        price: 30,
      });
      expect(mockSweetRepoUpdate).toHaveBeenCalledWith("sweet-123", {
        name: "Rasgulla",
        price: 30,
      });
    });

    it("allows partial update with only name", async () => {
      const result = await SweetService.updateSweet("sweet-123", {
        name: "Kaju Katli",
      });

      expect(result.sweet.name).toBe("Kaju Katli");
      expect(mockSweetRepoUpdate).toHaveBeenCalledWith("sweet-123", {
        name: "Kaju Katli",
      });
    });

    it("allows partial update with only price", async () => {
      const result = await SweetService.updateSweet("sweet-123", {
        price: 50,
      });

      expect(result.sweet.price).toBe(50);
    });

    it("allows partial update with only category", async () => {
      const result = await SweetService.updateSweet("sweet-123", {
        category: "Bengali",
      });

      expect(result.sweet.category).toBe("Bengali");
    });

    it("allows partial update with only quantity", async () => {
      const result = await SweetService.updateSweet("sweet-123", {
        quantity: 200,
      });

      expect(result.sweet.quantity).toBe(200);
    });

    it("trims name and category before saving", async () => {
      await SweetService.updateSweet("sweet-123", {
        name: "  Sandesh  ",
        category: "  Bengali  ",
      });

      expect(mockSweetRepoUpdate).toHaveBeenCalledWith(
        "sweet-123",
        expect.objectContaining({
          name: "Sandesh",
          category: "Bengali",
        })
      );
    });

    it("allows updating quantity to zero", async () => {
      const result = await SweetService.updateSweet("sweet-123", {
        quantity: 0,
      });

      expect(result.sweet.quantity).toBe(0);
    });
  });

  describe("not found errors", () => {
    it("rejects update for non-existent sweet", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.updateSweet("non-existent-id", { name: "New Name" })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("validation errors", () => {
    it("rejects empty name", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { name: "" })
      ).rejects.toThrow(/name/i);
    });

    it("rejects name that is too short", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { name: "A" })
      ).rejects.toThrow(/name/i);
    });

    it("rejects name that is too long", async () => {
      const longName = "A".repeat(101);
      await expect(
        SweetService.updateSweet("sweet-123", { name: longName })
      ).rejects.toThrow(/name/i);
    });

    it("rejects empty category", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { category: "" })
      ).rejects.toThrow(/category/i);
    });

    it("rejects negative price", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { price: -10 })
      ).rejects.toThrow(/price/i);
    });

    it("rejects non-numeric price", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { price: NaN })
      ).rejects.toThrow(/price/i);
    });

    it("rejects negative quantity", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { quantity: -5 })
      ).rejects.toThrow(/quantity/i);
    });

    it("rejects non-integer quantity", async () => {
      await expect(
        SweetService.updateSweet("sweet-123", { quantity: 10.5 })
      ).rejects.toThrow(/quantity/i);
    });

    it("allows empty update object (no changes)", async () => {
      const result = await SweetService.updateSweet("sweet-123", {});

      expect(result.sweet).toMatchObject(existingSweet);
    });
  });

  describe("duplicate handling", () => {
    it("rejects update if new name already exists", async () => {
      mockSweetRepoFindByName.mockResolvedValueOnce({
        id: "other-sweet",
        name: "Rasgulla",
        category: "Bengali",
        price: 20,
        quantity: 50,
      });

      await expect(
        SweetService.updateSweet("sweet-123", { name: "Rasgulla" })
      ).rejects.toThrow(/already exists/i);
    });

    it("allows keeping the same name (case-insensitive)", async () => {
      mockSweetRepoFindByName.mockResolvedValueOnce(existingSweet);

      const result = await SweetService.updateSweet("sweet-123", {
        name: "GULAB JAMUN",
      });

      expect(result.sweet.name).toBe("GULAB JAMUN");
    });

    it("performs case-insensitive duplicate check for different sweets", async () => {
      mockSweetRepoFindByName.mockResolvedValueOnce({
        id: "other-sweet",
        name: "Rasgulla",
        category: "Bengali",
        price: 20,
        quantity: 50,
      });

      await expect(
        SweetService.updateSweet("sweet-123", { name: "RASGULLA" })
      ).rejects.toThrow(/already exists/i);
    });
  });
});
