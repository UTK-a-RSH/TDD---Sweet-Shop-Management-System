import { SweetService } from "../../services/SweetService";

// Types for repository mocks
type SweetRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

const mockSweetRepoFindAll = jest.fn<Promise<SweetRecord[]>, []>();

jest.mock("../../repositories/SweetRepository", () => ({
  SweetRepository: {
    findAll: () => mockSweetRepoFindAll(),
  },
}));

describe("SweetService.listAll", () => {
  const sampleSweets: SweetRecord[] = [
    { id: "sweet-1", name: "Gulab Jamun", category: "Indian", price: 25, quantity: 100 },
    { id: "sweet-2", name: "Rasgulla", category: "Bengali", price: 20, quantity: 50 },
    { id: "sweet-3", name: "Kaju Katli", category: "Indian", price: 50, quantity: 30 },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    mockSweetRepoFindAll.mockResolvedValue(sampleSweets);
  });

  describe("successful retrieval", () => {
    it("returns all sweets", async () => {
      const result = await SweetService.listAll();

      expect(result.sweets).toHaveLength(3);
      expect(result.sweets).toEqual(sampleSweets);
      expect(mockSweetRepoFindAll).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no sweets exist", async () => {
      mockSweetRepoFindAll.mockResolvedValueOnce([]);

      const result = await SweetService.listAll();

      expect(result.sweets).toEqual([]);
      expect(result.sweets).toHaveLength(0);
    });

    it("returns sweets with correct structure", async () => {
      const result = await SweetService.listAll();

      result.sweets.forEach((sweet) => {
        expect(sweet).toHaveProperty("id");
        expect(sweet).toHaveProperty("name");
        expect(sweet).toHaveProperty("category");
        expect(sweet).toHaveProperty("price");
        expect(sweet).toHaveProperty("quantity");
      });
    });

    it("returns total count of sweets", async () => {
      const result = await SweetService.listAll();

      expect(result.total).toBe(3);
    });

    it("returns zero total when no sweets exist", async () => {
      mockSweetRepoFindAll.mockResolvedValueOnce([]);

      const result = await SweetService.listAll();

      expect(result.total).toBe(0);
    });
  });
});
