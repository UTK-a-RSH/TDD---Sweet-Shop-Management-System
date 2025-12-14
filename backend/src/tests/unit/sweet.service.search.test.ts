import { SweetService } from "../../services/SweetService";
import { SearchSweetsQuery } from "../../types/sweet.types";

// Types for repository mocks
type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

const mockSweetRepoSearch = jest.fn<Promise<SweetRecord[]>, [SearchSweetsQuery]>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    search: (query: SearchSweetsQuery) => mockSweetRepoSearch(query),
  },
}));

describe("SweetService.search", () => {
  const allSweets: SweetRecord[] = [
    { id: "sweet-1", name: "Gulab Jamun", category: "Indian", price: 25, quantity: 100 },
    { id: "sweet-2", name: "Rasgulla", category: "Bengali", price: 20, quantity: 50 },
    { id: "sweet-3", name: "Kaju Katli", category: "Indian", price: 50, quantity: 30 },
    { id: "sweet-4", name: "Sandesh", category: "Bengali", price: 30, quantity: 40 },
    { id: "sweet-5", name: "Jalebi", category: "Indian", price: 15, quantity: 80 },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("search by name", () => {
    it("finds sweets by partial name match (case-insensitive)", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[0]]); // Gulab Jamun

      const result = await SweetService.search({ name: "gulab" });

      expect(result.sweets).toHaveLength(1);
      expect(result.sweets[0].name).toBe("Gulab Jamun");
      expect(mockSweetRepoSearch).toHaveBeenCalledWith(
        expect.objectContaining({ name: "gulab" })
      );
    });

    it("finds multiple sweets matching name pattern", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[0], allSweets[4]]); // Both have 'a'

      const result = await SweetService.search({ name: "ja" });

      expect(result.sweets).toHaveLength(2);
    });

    it("returns empty when no name matches", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([]);

      const result = await SweetService.search({ name: "chocolate" });

      expect(result.sweets).toHaveLength(0);
    });

    it("trims name before searching", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[0]]);

      await SweetService.search({ name: "  gulab  " });

      expect(mockSweetRepoSearch).toHaveBeenCalledWith(
        expect.objectContaining({ name: "gulab" })
      );
    });
  });

  describe("search by category", () => {
    it("finds all sweets in a category", async () => {
      const indianSweets = allSweets.filter((s) => s.category === "Indian");
      mockSweetRepoSearch.mockResolvedValueOnce(indianSweets);

      const result = await SweetService.search({ category: "Indian" });

      expect(result.sweets).toHaveLength(3);
      result.sweets.forEach((sweet) => {
        expect(sweet.category).toBe("Indian");
      });
    });

    it("performs case-insensitive category search", async () => {
      const bengaliSweets = allSweets.filter((s) => s.category === "Bengali");
      mockSweetRepoSearch.mockResolvedValueOnce(bengaliSweets);

      const result = await SweetService.search({ category: "bengali" });

      expect(result.sweets).toHaveLength(2);
    });

    it("returns empty when category not found", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([]);

      const result = await SweetService.search({ category: "Western" });

      expect(result.sweets).toHaveLength(0);
    });

    it("trims category before searching", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([]);

      await SweetService.search({ category: "  Indian  " });

      expect(mockSweetRepoSearch).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Indian" })
      );
    });
  });

  describe("search by price range", () => {
    it("finds sweets with minimum price", async () => {
      const expensiveSweets = allSweets.filter((s) => s.price >= 30);
      mockSweetRepoSearch.mockResolvedValueOnce(expensiveSweets);

      const result = await SweetService.search({ minPrice: 30 });

      expect(result.sweets).toHaveLength(2);
      result.sweets.forEach((sweet) => {
        expect(sweet.price).toBeGreaterThanOrEqual(30);
      });
    });

    it("finds sweets with maximum price", async () => {
      const cheapSweets = allSweets.filter((s) => s.price <= 25);
      mockSweetRepoSearch.mockResolvedValueOnce(cheapSweets);

      const result = await SweetService.search({ maxPrice: 25 });

      expect(result.sweets).toHaveLength(3);
      result.sweets.forEach((sweet) => {
        expect(sweet.price).toBeLessThanOrEqual(25);
      });
    });

    it("finds sweets within price range", async () => {
      const midRangeSweets = allSweets.filter((s) => s.price >= 20 && s.price <= 30);
      mockSweetRepoSearch.mockResolvedValueOnce(midRangeSweets);

      const result = await SweetService.search({ minPrice: 20, maxPrice: 30 });

      expect(result.sweets).toHaveLength(3);
      result.sweets.forEach((sweet) => {
        expect(sweet.price).toBeGreaterThanOrEqual(20);
        expect(sweet.price).toBeLessThanOrEqual(30);
      });
    });

    it("returns empty when no sweets in price range", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([]);

      const result = await SweetService.search({ minPrice: 100, maxPrice: 200 });

      expect(result.sweets).toHaveLength(0);
    });
  });

  describe("combined filters", () => {
    it("searches by name and category", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[0]]); // Gulab Jamun, Indian

      const result = await SweetService.search({ name: "gulab", category: "Indian" });

      expect(result.sweets).toHaveLength(1);
      expect(mockSweetRepoSearch).toHaveBeenCalledWith({
        name: "gulab",
        category: "Indian",
      });
    });

    it("searches by category and price range", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[2]]); // Kaju Katli, Indian, 50

      const result = await SweetService.search({
        category: "Indian",
        minPrice: 40,
      });

      expect(result.sweets).toHaveLength(1);
    });

    it("searches by all filters", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[0]]); // Gulab Jamun

      const result = await SweetService.search({
        name: "gulab",
        category: "Indian",
        minPrice: 20,
        maxPrice: 30,
      });

      expect(result.sweets).toHaveLength(1);
    });
  });

  describe("validation", () => {
    it("rejects negative minPrice", async () => {
      await expect(SweetService.search({ minPrice: -10 })).rejects.toThrow(/price/i);
    });

    it("rejects negative maxPrice", async () => {
      await expect(SweetService.search({ maxPrice: -5 })).rejects.toThrow(/price/i);
    });

    it("rejects when minPrice is greater than maxPrice", async () => {
      await expect(
        SweetService.search({ minPrice: 50, maxPrice: 20 })
      ).rejects.toThrow(/price|range|invalid/i);
    });

    it("allows zero minPrice", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce(allSweets);

      const result = await SweetService.search({ minPrice: 0 });

      expect(result.sweets).toHaveLength(5);
    });
  });

  describe("edge cases", () => {
    it("returns all sweets when no filters provided", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce(allSweets);

      const result = await SweetService.search({});

      expect(result.sweets).toHaveLength(5);
      expect(mockSweetRepoSearch).toHaveBeenCalledWith({});
    });

    it("ignores empty string name", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce(allSweets);

      await SweetService.search({ name: "" });

      expect(mockSweetRepoSearch).toHaveBeenCalledWith({});
    });

    it("ignores empty string category", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce(allSweets);

      await SweetService.search({ category: "" });

      expect(mockSweetRepoSearch).toHaveBeenCalledWith({});
    });

    it("ignores whitespace-only name", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce(allSweets);

      await SweetService.search({ name: "   " });

      expect(mockSweetRepoSearch).toHaveBeenCalledWith({});
    });

    it("returns total count with search results", async () => {
      mockSweetRepoSearch.mockResolvedValueOnce([allSweets[0], allSweets[2]]);

      const result = await SweetService.search({ category: "Indian" });

      expect(result.total).toBe(2);
    });
  });
});
