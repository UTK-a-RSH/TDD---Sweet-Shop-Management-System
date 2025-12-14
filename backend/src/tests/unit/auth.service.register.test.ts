import { AuthService } from "../../services/AuthService";
import { CreateUserDto, UserResponse } from "../../types/user.types";

type CreateUserInput = CreateUserDto;
type UserRecord = Pick<UserResponse, "name" | "email" | "role"> & { id: string };

const mockUserRepoFindByEmail = jest.fn<Promise<UserRecord | null>, [string]>();
const mockUserRepoCreate = jest.fn<Promise<UserRecord>, [CreateUserInput]>();

jest.mock("../../repositories/UserRepository", () => ({
  UserRepository: {
    findByEmail: (email: string) => mockUserRepoFindByEmail(email),
    create: (data: CreateUserInput) => mockUserRepoCreate(data),
  },
}));

describe("AuthService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepoFindByEmail.mockResolvedValue(null);
    mockUserRepoCreate.mockImplementation((data: CreateUserInput) =>
      Promise.resolve({ id: "generated-id", role: "user" as const, name: data.name, email: data.email })
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
    mockUserRepoFindByEmail.mockResolvedValueOnce({
      id: "existing-id",
      name: "Existing User",
      email: "duplicate@example.com",
      role: "user" as const,
    });

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
