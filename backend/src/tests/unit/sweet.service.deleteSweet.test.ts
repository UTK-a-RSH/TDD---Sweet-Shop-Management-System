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
const mockSweetRepoDelete = jest.fn<Promise<boolean>, [string]>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    findById: (id: string) => mockSweetRepoFindById(id),
    delete: (id: string) => mockSweetRepoDelete(id),
  },
}));

describe("SweetService.deleteSweet", () => {
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
    mockSweetRepoDelete.mockResolvedValue(true);
  });

  describe("admin role - successful deletion", () => {
    it("allows admin to delete a sweet", async () => {
      const result = await SweetService.deleteSweet("sweet-123", "admin");

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/deleted/i);
      expect(mockSweetRepoDelete).toHaveBeenCalledWith("sweet-123");
    });

    it("returns deleted sweet info on successful deletion", async () => {
      const result = await SweetService.deleteSweet("sweet-123", "admin");

      expect(result.deleted).toMatchObject({
        id: "sweet-123",
        name: "Gulab Jamun",
      });
    });

    it("admin role is case-sensitive (lowercase required)", async () => {
      const result = await SweetService.deleteSweet("sweet-123", "admin");

      expect(result.success).toBe(true);
    });
  });

  describe("authorization errors", () => {
    it("rejects deletion for non-admin user", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", "user")
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects deletion for undefined role", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", undefined as unknown as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects deletion for empty role string", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", "" as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects deletion for uppercase ADMIN", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", "ADMIN" as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects deletion for mixed case Admin", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", "Admin" as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects deletion for role with extra whitespace", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", " admin " as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });

    it("rejects deletion for null role", async () => {
      await expect(
        SweetService.deleteSweet("sweet-123", null as unknown as UserRole)
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);
    });
  });

  describe("not found errors", () => {
    it("rejects deletion for non-existent sweet (admin)", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.deleteSweet("non-existent-id", "admin")
      ).rejects.toThrow(/not found/i);
    });

    it("checks authorization before checking existence", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      // Non-admin should get auth error, not not-found error
      await expect(
        SweetService.deleteSweet("non-existent-id", "user")
      ).rejects.toThrow(/admin|authorized|permission|forbidden/i);

      // Repository should not be called for unauthorized user
      expect(mockSweetRepoFindById).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty sweet id", async () => {
      await expect(
        SweetService.deleteSweet("", "admin")
      ).rejects.toThrow(/id|not found|invalid/i);
    });

    it("handles whitespace-only sweet id", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.deleteSweet("   ", "admin")
      ).rejects.toThrow(/id|not found|invalid/i);
    });

    it("does not call delete if sweet not found", async () => {
      mockSweetRepoFindById.mockResolvedValueOnce(null);

      await expect(
        SweetService.deleteSweet("non-existent-id", "admin")
      ).rejects.toThrow(/not found/i);

      expect(mockSweetRepoDelete).not.toHaveBeenCalled();
    });

    it("handles repository delete failure gracefully", async () => {
      mockSweetRepoDelete.mockResolvedValueOnce(false);

      await expect(
        SweetService.deleteSweet("sweet-123", "admin")
      ).rejects.toThrow(/failed|error|could not/i);
    });
  });
});
