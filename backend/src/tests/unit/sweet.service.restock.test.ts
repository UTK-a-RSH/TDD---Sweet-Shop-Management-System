import { SweetService } from "../../services/SweetService";

// Types for repository mocks
type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type UserRole = "admin" | "user";

const mockSweetRepoFindById = jest.fn<Promise<SweetRecord | null>, [string]>();
const mockSweetRepoUpdateQuantity = jest.fn<Promise<SweetRecord | null>, [string, number]>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    findById: (id: string) => mockSweetRepoFindById(id),
    updateQuantity: (id: string, quantity: number) => mockSweetRepoUpdateQuantity(id, quantity),
  },
}));

describe("SweetService.restock", () => {
  const existingSweet: SweetRecord = {
    id: "sweet-123",
    name: "Gulab Jamun",
    category: "Indian",
    price: 25,
    quantity: 50,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockSweetRepoFindById.mockResolvedValue(existingSweet);
    mockSweetRepoUpdateQuantity.mockImplementation((id, newQuantity) =>
      Promise.resolve({ ...existingSweet, quantity: newQuantity })
    );
  });

  describe("admin role - successful restock", () => {
    it("restocks a sweet and increases quantity", async () => {
      const result = await SweetService.restock("sweet-123", { quantity: 100 }, "admin");

      expect(result.sweet.quantity).toBe(150);
      expect(mockSweetRepoUpdateQuantity).toHaveBeenCalledWith("sweet-123", 150);
    });

    it("returns updated sweet info after restock", async () => {
      const result = await SweetService.restock("sweet-123", { quantity: 50 }, "admin");

      expect(result.sweet).toMatchObject({
        id: "sweet-123",
        name: "Gulab Jamun",
        quantity: 100,
      });
    });

    it("returns restock summary with quantity added", async () => {
      const result = await SweetService.restock("sweet-123", { quantity: 25 }, "admin");

      expect(result.added).toBe(25);
      expect(result.previousQuantity).toBe(50);
      expect(result.newQuantity).toBe(75);
    });

    it("allows restocking a sweet with zero stock", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce({ ...existingSweet, quantity: 0 });

      const result = await SweetService.restock("sweet-123", { quantity: 100 }, "admin");

      expect(result.sweet.quantity).toBe(100);
      expect(result.previousQuantity).toBe(0);
    });
  });

  describe("authorization errors", () => {
    it("rejects restock for non-admin user", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: 50 }, "user")
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects restock for undefined role", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: 50 }, undefined as unknown as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects restock for empty role string", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: 50 }, "" as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects restock for uppercase ADMIN", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: 50 }, "ADMIN" as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("checks authorization before checking existence", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.restock("non-existent-id", { quantity: 50 }, "user")
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);

      expect(mockSweetRepoFindById).not.toHaveBeenCalled();
    });

    it("does not update quantity for unauthorized user", async () => {
      try {
        await SweetService.restock("sweet-123", { quantity: 50 }, "user");
      } catch {
        // Expected error
      }

      expect(mockSweetRepoUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  describe("validation errors", () => {
    it("rejects zero quantity restock", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: 0 }, "admin")
      ).rejects.toThrow(/quantity|positive|greater/i);
    });

    it("rejects negative quantity restock", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: -10 }, "admin")
      ).rejects.toThrow(/quantity|positive|negative/i);
    });

    it("rejects non-integer quantity", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: 5.5 }, "admin")
      ).rejects.toThrow(/quantity|integer|whole/i);
    });

    it("rejects NaN quantity", async () => {
      await expect(
        SweetService.restock("sweet-123", { quantity: NaN }, "admin")
      ).rejects.toThrow(/quantity|valid|number/i);
    });

    it("validates authorization before quantity", async () => {
      // Even with invalid quantity, non-admin should get auth error first
      await expect(
        SweetService.restock("sweet-123", { quantity: -10 }, "user")
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });
  });

  describe("not found errors", () => {
    it("rejects restock for non-existent sweet (admin)", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.restock("non-existent-id", { quantity: 50 }, "admin")
      ).rejects.toThrow(/not found/i);
    });

    it("does not update quantity when sweet not found", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      try {
        await SweetService.restock("non-existent-id", { quantity: 50 }, "admin");
      } catch {
        // Expected error
      }

      expect(mockSweetRepoUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles restocking exactly 1 item", async () => {
      const result = await SweetService.restock("sweet-123", { quantity: 1 }, "admin");

      expect(result.sweet.quantity).toBe(51);
      expect(result.added).toBe(1);
    });

    it("handles large restock quantities", async () => {
      const result = await SweetService.restock("sweet-123", { quantity: 10000 }, "admin");

      expect(result.sweet.quantity).toBe(10050);
    });

    it("validates quantity before checking sweet existence", async () => {
      // After auth check, validation should happen before DB call
      await expect(
        SweetService.restock("sweet-123", { quantity: 0 }, "admin")
      ).rejects.toThrow(/quantity|positive|greater/i);

      expect(mockSweetRepoFindById).not.toHaveBeenCalled();
    });
  });
});
