import { SweetService } from "../../services/SweetService";

// Types for repository mocks
type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

const mockSweetRepoFindById = jest.fn<Promise<SweetRecord | null>, [string]>();
const mockSweetRepoUpdateQuantity = jest.fn<Promise<SweetRecord | null>, [string, number]>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    findById: (id: string) => mockSweetRepoFindById(id),
    updateQuantity: (id: string, quantity: number) => mockSweetRepoUpdateQuantity(id, quantity),
  },
}));

describe("SweetService.purchase", () => {
  const existingSweet: SweetRecord = {
    id: "sweet-123",
    name: "Gulab Jamun",
    category: "Indian",
    price: 25,
    quantity: 100,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockSweetRepoFindById.mockResolvedValue(existingSweet);
    mockSweetRepoUpdateQuantity.mockImplementation((id, newQuantity) =>
      Promise.resolve({ ...existingSweet, quantity: newQuantity })
    );
  });

  describe("successful purchase", () => {
    it("purchases a sweet and decreases quantity", async () => {
      const result = await SweetService.purchase("sweet-123", { quantity: 10 });

      expect(result.sweet.quantity).toBe(90);
      expect(mockSweetRepoUpdateQuantity).toHaveBeenCalledWith("sweet-123", 90);
    });

    it("returns updated sweet info after purchase", async () => {
      const result = await SweetService.purchase("sweet-123", { quantity: 5 });

      expect(result.sweet).toMatchObject({
        id: "sweet-123",
        name: "Gulab Jamun",
        quantity: 95,
      });
    });

    it("allows purchasing entire stock", async () => {
      const result = await SweetService.purchase("sweet-123", { quantity: 100 });

      expect(result.sweet.quantity).toBe(0);
      expect(mockSweetRepoUpdateQuantity).toHaveBeenCalledWith("sweet-123", 0);
    });

    it("returns purchase summary with quantity purchased", async () => {
      const result = await SweetService.purchase("sweet-123", { quantity: 15 });

      expect(result.purchased).toBe(15);
      expect(result.remaining).toBe(85);
    });
  });

  describe("insufficient stock", () => {
    it("rejects purchase when quantity exceeds stock", async () => {
      await expect(
        SweetService.purchase("sweet-123", { quantity: 150 })
      ).rejects.toThrow(/insufficient|stock|available/i);
    });

    it("provides helpful error message with available quantity", async () => {
      try {
        await SweetService.purchase("sweet-123", { quantity: 150 });
        fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toMatch(/100|available/i);
      }
    });

    it("does not update quantity when stock is insufficient", async () => {
      try {
        await SweetService.purchase("sweet-123", { quantity: 150 });
      } catch {
        // Expected error
      }

      expect(mockSweetRepoUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  describe("validation errors", () => {
    it("rejects zero quantity purchase", async () => {
      await expect(
        SweetService.purchase("sweet-123", { quantity: 0 })
      ).rejects.toThrow(/quantity|positive|greater/i);
    });

    it("rejects negative quantity purchase", async () => {
      await expect(
        SweetService.purchase("sweet-123", { quantity: -5 })
      ).rejects.toThrow(/quantity|positive|negative/i);
    });

    it("rejects non-integer quantity", async () => {
      await expect(
        SweetService.purchase("sweet-123", { quantity: 2.5 })
      ).rejects.toThrow(/quantity|integer|whole/i);
    });

    it("rejects NaN quantity", async () => {
      await expect(
        SweetService.purchase("sweet-123", { quantity: NaN })
      ).rejects.toThrow(/quantity|valid|number/i);
    });
  });

  describe("not found errors", () => {
    it("rejects purchase for non-existent sweet", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.purchase("non-existent-id", { quantity: 5 })
      ).rejects.toThrow(/not found/i);
    });

    it("does not update quantity when sweet not found", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      try {
        await SweetService.purchase("non-existent-id", { quantity: 5 });
      } catch {
        // Expected error
      }

      expect(mockSweetRepoUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles sweet with zero stock", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce({ ...existingSweet, quantity: 0 });

      await expect(
        SweetService.purchase("sweet-123", { quantity: 1 })
      ).rejects.toThrow(/insufficient|stock|out of stock/i);
    });

    it("handles purchasing exactly 1 item", async () => {
      const result = await SweetService.purchase("sweet-123", { quantity: 1 });

      expect(result.sweet.quantity).toBe(99);
      expect(result.purchased).toBe(1);
    });

    it("validates quantity before checking stock", async () => {
      // Even with valid stock, negative quantity should fail first
      await expect(
        SweetService.purchase("sweet-123", { quantity: -1 })
      ).rejects.toThrow(/quantity|positive|negative/i);

      expect(mockSweetRepoFindById).not.toHaveBeenCalled();
    });
  });
});
