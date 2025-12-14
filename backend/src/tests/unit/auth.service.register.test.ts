import { AuthService } from "../../services/AuthService";

const mockUserRepoFindByEmail = jest.fn();
const mockUserRepoCreate = jest.fn();

jest.mock("../../repositories/UserRepository", () => ({
  UserRepository: {
    findByEmail: (...args: unknown[]) => mockUserRepoFindByEmail(...args),
    create: (...args: unknown[]) => mockUserRepoCreate(...args),
  },
}));

describe("AuthService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepoFindByEmail.mockResolvedValue(null);
    mockUserRepoCreate.mockImplementation((data) =>
      Promise.resolve({ id: "generated-id", ...data })
    );
  });

  it("creates a user with valid input", async () => {
    const result = await AuthService.register({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123",
    });

    expect(result.user).toMatchObject({
      id: expect.any(String),
      email: "john@example.com",
    });
  });

  it("rejects duplicate email", async () => {
    mockUserRepoFindByEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-id" });

    await expect(
      AuthService.register({
        name: "Jane Doe",
        email: "duplicate@example.com",
        password: "secret123",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects weak passwords", async () => {
    await expect(
      AuthService.register({
        name: "John Doe",
        email: "weak@example.com",
        password: "123",
      })
    ).rejects.toThrow(/password must/i);
  });

  it("rejects invalid email format", async () => {
    await expect(
      AuthService.register({
        name: "John Doe",
        email: "invalid-email",
        password: "secret123",
      })
    ).rejects.toThrow(/email/i);
  });
});
