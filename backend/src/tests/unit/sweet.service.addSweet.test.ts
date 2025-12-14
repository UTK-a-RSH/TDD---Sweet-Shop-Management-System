import { SweetService } from "../../services/SweetService";
import { CreateSweetDto, SweetResponse } from "../../types/sweet.types";

// Types for repository mocks
type SweetRecord = Pick<SweetResponse, "name" | "category" | "price" | "quantity"> & {
  id: string;
};

const mockSweetRepoCreate = jest.fn<Promise<SweetRecord>, [CreateSweetDto]>();
const mockSweetRepoFindByName = jest.fn<Promise<SweetRecord | null>, [string]>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    create: (data: CreateSweetDto) => mockSweetRepoCreate(data),
    findByName: (name: string) => mockSweetRepoFindByName(name),
  },
}));

describe("SweetService.addSweet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSweetRepoFindByName.mockResolvedValue(null);
    mockSweetRepoCreate.mockImplementation((data: CreateSweetDto) =>
      Promise.resolve({
        id: "sweet-123",
        name: data.name,
        category: data.category,
        price: data.price,
        quantity: data.quantity,
      })
    );
  });

  describe("successful creation", () => {
    it("creates a sweet with valid input", async () => {
      const result = await SweetService.addSweet({
        name: "Gulab Jamun",
        category: "Indian",
        price: 25.5,
        quantity: 100,
      });

      expect(result.sweet).toMatchObject({
        id: expect.any(String),
        name: "Gulab Jamun",
        category: "Indian",
        price: 25.5,
        quantity: 100,
      });
      expect(mockSweetRepoCreate).toHaveBeenCalledWith({
        name: "Gulab Jamun",
        category: "Indian",
        price: 25.5,
        quantity: 100,
      });
    });

    it("trims name and category before saving", async () => {
      await SweetService.addSweet({
        name: "  Rasgulla  ",
        category: "  Bengali  ",
        price: 20,
        quantity: 50,
      });

      expect(mockSweetRepoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Rasgulla",
          category: "Bengali",
        })
      );
    });

    it("allows zero quantity for new sweets", async () => {
      const result = await SweetService.addSweet({
        name: "Kaju Katli",
        category: "Indian",
        price: 50,
        quantity: 0,
      });

      expect(result.sweet.quantity).toBe(0);
    });
  });

  describe("validation errors", () => {
    it("rejects missing name", async () => {
      await expect(
        SweetService.addSweet({
          name: "",
          category: "Indian",
          price: 25,
          quantity: 100,
        })
      ).rejects.toThrow(/name/i);
    });

    it("rejects name that is too short", async () => {
      await expect(
        SweetService.addSweet({
          name: "A",
          category: "Indian",
          price: 25,
          quantity: 100,
        })
      ).rejects.toThrow(/name/i);
    });

    it("rejects name that is too long", async () => {
      const longName = "A".repeat(101);
      await expect(
        SweetService.addSweet({
          name: longName,
          category: "Indian",
          price: 25,
          quantity: 100,
        })
      ).rejects.toThrow(/name/i);
    });

    it("rejects missing category", async () => {
      await expect(
        SweetService.addSweet({
          name: "Gulab Jamun",
          category: "",
          price: 25,
          quantity: 100,
        })
      ).rejects.toThrow(/category/i);
    });

    it("rejects negative price", async () => {
      await expect(
        SweetService.addSweet({
          name: "Gulab Jamun",
          category: "Indian",
          price: -10,
          quantity: 100,
        })
      ).rejects.toThrow(/price/i);
    });

    it("rejects negative quantity", async () => {
      await expect(
        SweetService.addSweet({
          name: "Gulab Jamun",
          category: "Indian",
          price: 25,
          quantity: -5,
        })
      ).rejects.toThrow(/quantity/i);
    });

    it("rejects non-numeric price", async () => {
      await expect(
        SweetService.addSweet({
          name: "Gulab Jamun",
          category: "Indian",
          price: NaN,
          quantity: 100,
        })
      ).rejects.toThrow(/price/i);
    });

    it("rejects non-integer quantity", async () => {
      await expect(
        SweetService.addSweet({
          name: "Gulab Jamun",
          category: "Indian",
          price: 25,
          quantity: 10.5,
        })
      ).rejects.toThrow(/quantity/i);
    });
  });

  describe("duplicate handling", () => {
    it("rejects duplicate sweet name", async () => {
      mockSweetRepoFindByName.mockResolvedValueOnce({
        id: "existing-sweet",
        name: "Gulab Jamun",
        category: "Indian",
        price: 25,
        quantity: 50,
      });

      await expect(
        SweetService.addSweet({
          name: "Gulab Jamun",
          category: "Indian",
          price: 30,
          quantity: 100,
        })
      ).rejects.toThrow(/already exists/i);
    });

    it("performs case-insensitive duplicate check", async () => {
      mockSweetRepoFindByName.mockResolvedValueOnce({
        id: "existing-sweet",
        name: "Gulab Jamun",
        category: "Indian",
        price: 25,
        quantity: 50,
      });

      await expect(
        SweetService.addSweet({
          name: "GULAB JAMUN",
          category: "Indian",
          price: 30,
          quantity: 100,
        })
      ).rejects.toThrow(/already exists/i);
    });
  });
});
